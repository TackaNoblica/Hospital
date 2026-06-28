package com.careafter.controller;

import com.careafter.model.ChatMessage;
import com.careafter.model.Conversation;
import com.careafter.model.Notification;
import com.careafter.model.User;
import com.careafter.repository.ChatMessageRepository;
import com.careafter.repository.ConversationRepository;
import com.careafter.repository.NotificationRepository;
import com.careafter.repository.UserRepository;
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

    public ChatController(ConversationRepository conversationRepo,
                          ChatMessageRepository messageRepo,
                          UserRepository userRepo,
                          NotificationRepository notifRepo) {
        this.conversationRepo = conversationRepo;
        this.messageRepo = messageRepo;
        this.userRepo = userRepo;
        this.notifRepo = notifRepo;
    }

    /** List all conversations for the logged-in user */
    @GetMapping
    public ResponseEntity<List<Conversation>> getMyConversations(Principal principal) {
        User user = userRepo.findByEmail(principal.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return ResponseEntity.ok(conversationRepo.findByParticipant(user));
    }

    /** Get messages in a conversation */
    @GetMapping("/{id}/messages")
    public ResponseEntity<List<ChatMessage>> getMessages(@PathVariable Long id, Principal principal) {
        Conversation conv = conversationRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Conversation not found"));
        User user = userRepo.findByEmail(principal.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        // Mark all unread messages (not sent by me) as read
        List<ChatMessage> messages = messageRepo.findByConversationOrderBySentAtAsc(conv);
        messages.stream()
                .filter(m -> !m.isRead() && !m.getSender().getId().equals(user.getId()))
                .forEach(m -> { m.setRead(true); messageRepo.save(m); });

        return ResponseEntity.ok(messages);
    }

    /** Send a message */
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

        ChatMessage msg = new ChatMessage();
        msg.setConversation(conv);
        msg.setSender(sender);
        msg.setContent(content.trim());
        msg.setSentAt(LocalDateTime.now());
        msg.setRead(false);

        // Update conversation last message time
        conv.setLastMessageAt(LocalDateTime.now());
        conversationRepo.save(conv);

        return ResponseEntity.ok(messageRepo.save(msg));
    }

    /** Mark a message as urgent — creates notification for other participants */
    @PatchMapping("/messages/{msgId}/urgent")
    public ResponseEntity<ChatMessage> markUrgent(@PathVariable Long msgId, Principal principal) {
        ChatMessage msg = messageRepo.findById(msgId)
                .orElseThrow(() -> new IllegalArgumentException("Message not found"));
        User sender = userRepo.findByEmail(principal.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        msg.setUrgent(true);
        messageRepo.save(msg);

        // Notify all other participants in the conversation
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

    /** Count unread messages for current user */
    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(Principal principal) {
        User user = userRepo.findByEmail(principal.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        List<Conversation> convs = conversationRepo.findByParticipant(user);
        long count = convs.isEmpty() ? 0 :
                messageRepo.countByConversationInAndIsReadFalseAndSenderNot(convs, user);
        return ResponseEntity.ok(Map.of("unread", count));
    }

    /** Create a group conversation (patient + multiple doctors) */
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
