package com.careafter.controller;

import com.careafter.model.*;
import com.careafter.repository.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/conversations")
public class ChatController {

    private final ConversationRepository conversationRepo;
    private final ChatMessageRepository messageRepo;
    private final UserRepository userRepo;
    private final NotificationRepository notifRepo;
    private final PatientRepository patientRepo;
    private final DoctorPatientRequestRepository requestRepo;

    public ChatController(ConversationRepository conversationRepo,
                          ChatMessageRepository messageRepo,
                          UserRepository userRepo,
                          NotificationRepository notifRepo,
                          PatientRepository patientRepo,
                          DoctorPatientRequestRepository requestRepo) {
        this.conversationRepo = conversationRepo;
        this.messageRepo = messageRepo;
        this.userRepo = userRepo;
        this.notifRepo = notifRepo;
        this.patientRepo = patientRepo;
        this.requestRepo = requestRepo;
    }

    @GetMapping
    public ResponseEntity<List<Conversation>> getMyConversations(Principal principal) {
        User user = userRepo.findByEmail(principal.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return ResponseEntity.ok(conversationRepo.findByParticipant(user));
    }

    @GetMapping("/{id}/messages")
    public ResponseEntity<List<ChatMessage>> getMessages(@PathVariable Long id, Principal principal) {
        Conversation conv = conversationRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Conversation not found"));
        User user = userRepo.findByEmail(principal.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        List<ChatMessage> messages = messageRepo.findByConversationOrderBySentAtAsc(conv);
        messages.stream()
                .filter(m -> !m.isRead() && !m.getSender().getId().equals(user.getId()))
                .forEach(m -> { m.setRead(true); messageRepo.save(m); });

        return ResponseEntity.ok(messages);
    }

    @PostMapping("/{id}/messages")
    public ResponseEntity<ChatMessage> sendMessage(@PathVariable Long id,
                                                    @RequestBody Map<String, String> body,
                                                    Principal principal) {
        Conversation conv = conversationRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Conversation not found"));
        User sender = userRepo.findByEmail(principal.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        String content = body.get("content");
        if (content == null || content.isBlank()) {
            return ResponseEntity.badRequest().build();
        }

        // Block send if patient is muted by a doctor in this conversation
        if (sender.getRole() == Role.PATIENT) {
            Patient senderPatient = patientRepo.findByUser(sender).orElse(null);
            if (senderPatient != null) {
                boolean isMuted = requestRepo.findByPatientAndStatus(senderPatient, RequestStatus.APPROVED)
                        .stream()
                        .anyMatch(r -> Boolean.TRUE.equals(r.getMutedPatient())
                                && conv.getParticipants().contains(r.getDoctor()));
                if (isMuted) {
                    return ResponseEntity.status(403).build();
                }
            }
        }

        ChatMessage msg = new ChatMessage();
        msg.setConversation(conv);
        msg.setSender(sender);
        msg.setContent(content.trim());
        msg.setSentAt(LocalDateTime.now());
        msg.setRead(false);

        conv.setLastMessageAt(LocalDateTime.now());
        conversationRepo.save(conv);

        return ResponseEntity.ok(messageRepo.save(msg));
    }

    @PatchMapping("/messages/{msgId}/urgent")
    public ResponseEntity<ChatMessage> markUrgent(@PathVariable Long msgId, Principal principal) {
        ChatMessage msg = messageRepo.findById(msgId)
                .orElseThrow(() -> new IllegalArgumentException("Message not found"));
        User sender = userRepo.findByEmail(principal.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        msg.setUrgent(true);
        messageRepo.save(msg);

        Conversation conv = msg.getConversation();
        conv.getParticipants().stream()
                .filter(p -> !p.getId().equals(sender.getId()))
                .forEach(recipient -> {
                    Notification n = new Notification();
                    n.setRecipient(recipient);
                    n.setPatient(conv.getPatient());
                    n.setTitle("Hitna poruka od " + sender.getFirstName() + " " + sender.getLastName());
                    n.setMessage("Pacijent je označio poruku kao hitnu: \"" +
                            msg.getContent().substring(0, Math.min(msg.getContent().length(), 100)) + "\"");
                    n.setType("URGENT_MESSAGE");
                    n.setIsRead(false);
                    n.setCreatedAt(LocalDateTime.now());
                    notifRepo.save(n);
                });

        return ResponseEntity.ok(msg);
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(Principal principal) {
        User user = userRepo.findByEmail(principal.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        List<Conversation> convs = conversationRepo.findByParticipant(user);
        long count = convs.isEmpty() ? 0 :
                messageRepo.countByConversationInAndIsReadFalseAndSenderNot(convs, user);
        return ResponseEntity.ok(Map.of("unread", count));
    }

    /** Doctor toggles mute on the patient in this conversation */
    @PatchMapping("/{convId}/mute-patient")
    public ResponseEntity<Map<String, Boolean>> mutePatient(@PathVariable Long convId, Principal principal) {
        Conversation conv = conversationRepo.findById(convId)
                .orElseThrow(() -> new IllegalArgumentException("Conversation not found"));
        User doctor = userRepo.findByEmail(principal.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        Patient patient = conv.getPatient();
        if (patient == null) return ResponseEntity.badRequest().build();

        DoctorPatientRequest req = requestRepo.findByDoctorAndPatient(doctor, patient)
                .orElse(null);
        if (req == null) return ResponseEntity.status(403).build();

        req.setMutedPatient(!Boolean.TRUE.equals(req.getMutedPatient()));
        requestRepo.save(req);
        return ResponseEntity.ok(Map.of("muted", Boolean.TRUE.equals(req.getMutedPatient())));
    }

    /** Returns mute status — from doctor or patient perspective */
    @GetMapping("/{convId}/mute-status")
    public ResponseEntity<Map<String, Boolean>> getMuteStatus(@PathVariable Long convId, Principal principal) {
        Conversation conv = conversationRepo.findById(convId)
                .orElseThrow(() -> new IllegalArgumentException("Conversation not found"));
        User user = userRepo.findByEmail(principal.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        Patient patient = conv.getPatient();

        if (patient == null) return ResponseEntity.ok(Map.of("muted", false));

        if (user.getRole() == Role.DOCTOR) {
            boolean muted = requestRepo.findByDoctorAndPatient(user, patient)
                    .map(r -> Boolean.TRUE.equals(r.getMutedPatient()))
                    .orElse(false);
            return ResponseEntity.ok(Map.of("muted", muted));
        }

        if (user.getRole() == Role.PATIENT && patient.getUser().getId().equals(user.getId())) {
            boolean muted = requestRepo.findByPatientAndStatus(patient, RequestStatus.APPROVED)
                    .stream()
                    .anyMatch(r -> Boolean.TRUE.equals(r.getMutedPatient())
                            && conv.getParticipants().contains(r.getDoctor()));
            return ResponseEntity.ok(Map.of("muted", muted));
        }

        return ResponseEntity.ok(Map.of("muted", false));
    }

    @PostMapping("/group")
    public ResponseEntity<Conversation> createGroupConversation(@RequestBody Map<String, Object> body,
                                                                 Principal principal) {
        User creator = userRepo.findByEmail(principal.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        @SuppressWarnings("unchecked")
        List<Integer> participantIds = (List<Integer>) body.get("participantIds");
        String title = (String) body.getOrDefault("title", "Grupni chat");

        List<User> participants = new ArrayList<>();
        participants.add(creator);
        if (participantIds != null) {
            for (Integer pid : participantIds) {
                userRepo.findById(pid.longValue()).ifPresent(participants::add);
            }
        }

        Conversation conv = new Conversation();
        conv.setTitle(title);
        conv.setGroup(true);
        conv.setParticipants(participants);
        conv.setCreatedAt(LocalDateTime.now());
        conv.setLastMessageAt(LocalDateTime.now());
        return ResponseEntity.ok(conversationRepo.save(conv));
    }
}
