package com.careafter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.scheduling.annotation.EnableScheduling;

import com.careafter.model.*;
import com.careafter.repository.*;
import com.careafter.service.MedicationReminderScheduler;

@SpringBootApplication
@EnableJpaRepositories
@EnableScheduling
public class CareAfterApplication {

    public static void main(String[] args) {
        SpringApplication.run(CareAfterApplication.class, args);
    }

    @Bean
    public CommandLineRunner seedDatabase(
            UserRepository userRepo,
            PatientRepository patientRepo,
            SymptomCheckinRepository checkinRepo,
            AlertRepository alertRepo,
            DischargePlanRepository planRepo,
            MedicationRepository medRepo,
            AppointmentRepository apptRepo,
            NotificationRepository notifRepo,
            AuditLogRepository auditRepo,
            FamilyConnectionRepository familyRepo,
            DoctorPatientRequestRepository requestRepo,
            ConversationRepository conversationRepo,
            ChatMessageRepository chatMessageRepo,
            MedicalDocumentRepository medDocRepo,
            MedicationLogRepository logRepo,
            InstitutionDoctorRequestRepository instDocRepo,
            DoctorRatingRepository ratingRepo,
            ReportRepository reportRepo,
            org.springframework.security.crypto.password.PasswordEncoder enc,
            MedicationReminderScheduler reminderScheduler) {

        return args -> {

            // ─── Users ───────────────────────────────────────────────────────────
            User admin = save(userRepo, "admin@careafter.local",
                    new User(null, "Admin", "Sistem", "admin@careafter.local",
                            enc.encode("admin123"), Role.ADMIN, true));

            // Lekari internisti — specijalizacija pulmologija
            User doctor = save(userRepo, "doctor@careafter.local",
                    new User(null, "Dr. Aleksandar", "Petrovic", "doctor@careafter.local",
                            enc.encode("doctor123"), Role.DOCTOR, true));

            User doctor2 = save(userRepo, "doctor2@careafter.local",
                    new User(null, "Dr. Marija", "Stojanovic", "doctor2@careafter.local",
                            enc.encode("doctor123"), Role.DOCTOR, true));

            User doctor3 = save(userRepo, "doctor3@careafter.local",
                    new User(null, "Dr. Ivan", "Djordjevic", "doctor3@careafter.local",
                            enc.encode("doctor123"), Role.DOCTOR, true));

            // Postavljamo specialty/hospital za pulmologe
            if (doctor.getSpecialty() == null) {
                doctor.setSpecialty("Internista — Specijalista pulmologije"); doctor.setHospital("Klinika za pulmologiju, KBC Bezanijska kosa"); userRepo.save(doctor);
            }
            if (doctor2.getSpecialty() == null) {
                doctor2.setSpecialty("Internista — Specijalista pulmologije"); doctor2.setHospital("Klinika za pulmologiju, KBC Bezanijska kosa"); userRepo.save(doctor2);
            }
            if (doctor3.getSpecialty() == null) {
                doctor3.setSpecialty("Internista — Specijalista pulmologije"); doctor3.setHospital("Klinika za pulmologiju, KBC Bezanijska kosa"); userRepo.save(doctor3);
            }

            // Pulmolozi — razne klinike (privatne i drzavne)
            User doctor4 = save(userRepo, "doctor4@careafter.local",
                    new User(null, "Dr. Jelena", "Ristic", "doctor4@careafter.local",
                            enc.encode("doctor123"), Role.DOCTOR, true));
            doctor4.setSpecialty("Internista — Specijalista pulmologije");
            doctor4.setHospital("Institut za plucne bolesti, Sremska Kamenica");
            userRepo.save(doctor4);

            User doctor5 = save(userRepo, "doctor5@careafter.local",
                    new User(null, "Dr. Stefan", "Obradovic", "doctor5@careafter.local",
                            enc.encode("doctor123"), Role.DOCTOR, true));
            doctor5.setSpecialty("Internista — Specijalista pulmologije");
            doctor5.setHospital("BelMedic — Pulmologija i alergologija");
            userRepo.save(doctor5);

            User doctor6 = save(userRepo, "doctor6@careafter.local",
                    new User(null, "Dr. Vesna", "Nikolic", "doctor6@careafter.local",
                            enc.encode("doctor123"), Role.DOCTOR, true));
            doctor6.setSpecialty("Internista — Specijalista pulmologije");
            doctor6.setHospital("KBC Zemun — Pulmolaska ambulanta");
            userRepo.save(doctor6);

            User doctor7 = save(userRepo, "doctor7@careafter.local",
                    new User(null, "Dr. Milos", "Jankovic", "doctor7@careafter.local",
                            enc.encode("doctor123"), Role.DOCTOR, true));
            doctor7.setSpecialty("Internista — Specijalista pulmologije");
            doctor7.setHospital("Pulmomed — Privatna pulmolaska klinika");
            userRepo.save(doctor7);

            User doctor8 = save(userRepo, "doctor8@careafter.local",
                    new User(null, "Dr. Ana", "Davidovic", "doctor8@careafter.local",
                            enc.encode("doctor123"), Role.DOCTOR, true));
            doctor8.setSpecialty("Internista — Specijalista pulmologije");
            doctor8.setHospital("Institut za plucne bolesti i TBC, Beograd");
            userRepo.save(doctor8);

            User doctor9 = save(userRepo, "doctor9@careafter.local",
                    new User(null, "Dr. Bojan", "Lazarevic", "doctor9@careafter.local",
                            enc.encode("doctor123"), Role.DOCTOR, true));
            doctor9.setSpecialty("Internista — Specijalista pulmologije");
            doctor9.setHospital("Medigroup — Pulmolaska dijagnostika");
            userRepo.save(doctor9);

            // Pacijenti — plucna patologija
            User milicaU = save(userRepo, "patient@careafter.local",
                    new User(null, "Milica", "Jovanovic", "patient@careafter.local",
                            enc.encode("patient123"), Role.PATIENT, true));
            User nikolaU = save(userRepo, "patient2@careafter.local",
                    new User(null, "Nikola", "Markovic", "patient2@careafter.local",
                            enc.encode("patient123"), Role.PATIENT, true));
            User draganaU = save(userRepo, "patient3@careafter.local",
                    new User(null, "Dragana", "Ilic", "patient3@careafter.local",
                            enc.encode("patient123"), Role.PATIENT, true));
            User zoranU = save(userRepo, "patient4@careafter.local",
                    new User(null, "Zoran", "Filipovic", "patient4@careafter.local",
                            enc.encode("patient123"), Role.PATIENT, true));
            User majaU = save(userRepo, "patient5@careafter.local",
                    new User(null, "Maja", "Nikolic", "patient5@careafter.local",
                            enc.encode("patient123"), Role.PATIENT, true));
            User stefan = save(userRepo, "patient6@careafter.local",
                    new User(null, "Stefan", "Lazovic", "patient6@careafter.local",
                            enc.encode("patient123"), Role.PATIENT, true));

            // Clanovi porodice
            User jelenaU   = save(userRepo, "family@careafter.local",
                    new User(null, "Jelena",   "Jovanovic", "family@careafter.local",   enc.encode("family123"), Role.FAMILY_MEMBER, true));
            User anaU      = save(userRepo, "family2@careafter.local",
                    new User(null, "Ana",      "Markovic",  "family2@careafter.local",  enc.encode("family123"), Role.FAMILY_MEMBER, true));
            User petarU    = save(userRepo, "family3@careafter.local",
                    new User(null, "Petar",    "Ilic",      "family3@careafter.local",  enc.encode("family123"), Role.FAMILY_MEMBER, true));
            User katarinaU = save(userRepo, "family4@careafter.local",
                    new User(null, "Katarina", "Filipovic", "family4@careafter.local",  enc.encode("family123"), Role.FAMILY_MEMBER, true));
            User marinaU   = save(userRepo, "family5@careafter.local",
                    new User(null, "Marina",   "Nikolic",   "family5@careafter.local",  enc.encode("family123"), Role.FAMILY_MEMBER, true));

            // ─── Pacijenti — dijagnoze iz plucne patologije ──────────────────────
            Patient milica = patientRepo.findByUser(milicaU).orElseGet(() -> {
                Patient p = new Patient();
                p.setUser(milicaU);
                p.setDateOfBirth(LocalDate.of(1989, 12, 5));
                p.setGender("Female");
                p.setDiagnosis("Bilateralna bakterijska pneumonija — teski klinicki tok, IV antibiotska terapija");
                p.setHospitalDepartment("Pulmologija");
                p.setDiagnosedAt(LocalDate.now().minusDays(7));
                p.setDiagnosisStatus("ACTIVE");
                p.setAssignedDoctor(doctor);
                return patientRepo.save(p);
            });

            Patient nikola = patientRepo.findByUser(nikolaU).orElseGet(() -> {
                Patient p = new Patient();
                p.setUser(nikolaU);
                p.setDateOfBirth(LocalDate.of(1962, 3, 22));
                p.setGender("Male");
                p.setDiagnosis("KOPB egzacerbacija — stadijum III (teski), poceta NIV terapija");
                p.setHospitalDepartment("Pulmologija");
                p.setDiagnosedAt(LocalDate.of(2015, 4, 10));
                p.setDiagnosisStatus("ACTIVE");
                p.setAssignedDoctor(doctor);
                return patientRepo.save(p);
            });

            Patient dragana = patientRepo.findByUser(draganaU).orElseGet(() -> {
                Patient p = new Patient();
                p.setUser(draganaU);
                p.setDateOfBirth(LocalDate.of(1975, 7, 18));
                p.setGender("Female");
                p.setDiagnosis("Pleuritis exudativus — drenaza pleuralnog izliva, terapija u toku");
                p.setHospitalDepartment("Pulmologija");
                p.setDiagnosedAt(LocalDate.now().minusDays(12));
                p.setDiagnosisStatus("ACTIVE");
                p.setAssignedDoctor(doctor2);
                return patientRepo.save(p);
            });

            Patient zoran = patientRepo.findByUser(zoranU).orElseGet(() -> {
                Patient p = new Patient();
                p.setUser(zoranU);
                p.setDateOfBirth(LocalDate.of(1958, 11, 3));
                p.setGender("Male");
                p.setDiagnosis("Akutna plucna embolija — antikoagulantna terapija, stabilno stanje");
                p.setHospitalDepartment("Pulmologija");
                p.setDiagnosedAt(LocalDate.now().minusDays(5));
                p.setDiagnosisStatus("ACTIVE");
                p.setAssignedDoctor(doctor2);
                return patientRepo.save(p);
            });

            Patient maja = patientRepo.findByUser(majaU).orElseGet(() -> {
                Patient p = new Patient();
                p.setUser(majaU);
                p.setDateOfBirth(LocalDate.of(1993, 4, 29));
                p.setGender("Female");
                p.setDiagnosis("Bronhijalna astma — status asthmaticus, intenzivno lecenje");
                p.setHospitalDepartment("Pulmologija");
                p.setDiagnosedAt(LocalDate.of(2008, 9, 3));
                p.setDiagnosisStatus("ACTIVE");
                p.setAssignedDoctor(doctor);
                return patientRepo.save(p);
            });

            Patient stefanP = patientRepo.findByUser(stefan).orElseGet(() -> {
                Patient p = new Patient();
                p.setUser(stefan);
                p.setDateOfBirth(LocalDate.of(1949, 8, 15));
                p.setGender("Male");
                p.setDiagnosis("Idiopatska plucna fibroza (IPF) — pracenje napredovanja bolesti");
                p.setHospitalDepartment("Pulmologija");
                p.setDiagnosedAt(LocalDate.of(2019, 3, 15));
                p.setDiagnosisStatus("ACTIVE");
                p.setAssignedDoctor(doctor2);
                return patientRepo.save(p);
            });

            // ─── Doctor-Patient Requests (APPROVED) ──────────────────────────────
            // Milica vodi: dr. Petrovic (APPROVED), dr. Stojanovic (APPROVED)
            DoctorPatientRequest req1 = approvedRequest(requestRepo, doctor, milica, LocalDateTime.now().minusDays(10));
            DoctorPatientRequest req2 = approvedRequest(requestRepo, doctor2, milica, LocalDateTime.now().minusDays(9));
            // Nikola vodi: dr. Petrovic (APPROVED)
            DoctorPatientRequest req3 = approvedRequest(requestRepo, doctor, nikola, LocalDateTime.now().minusDays(8));
            // Dragana vodi: dr. Stojanovic (APPROVED)
            DoctorPatientRequest req4 = approvedRequest(requestRepo, doctor2, dragana, LocalDateTime.now().minusDays(12));
            // Zoran vodi: dr. Djordjevic (APPROVED)
            DoctorPatientRequest req5 = approvedRequest(requestRepo, doctor3, zoran, LocalDateTime.now().minusDays(7));
            // Maja vodi: dr. Djordjevic (APPROVED), dr. Petrovic (APPROVED)
            DoctorPatientRequest req6 = approvedRequest(requestRepo, doctor3, maja, LocalDateTime.now().minusDays(5));
            DoctorPatientRequest req7 = approvedRequest(requestRepo, doctor, maja, LocalDateTime.now().minusDays(4));
            // Stefan vodi: dr. Stojanovic (APPROVED)
            DoctorPatientRequest req8 = approvedRequest(requestRepo, doctor2, stefanP, LocalDateTime.now().minusDays(15));
            // PENDING requests — za prikaz feature-a
            pendingRequest(requestRepo, doctor3, nikola, LocalDateTime.now().minusDays(1));
            pendingRequest(requestRepo, doctor2, maja,   LocalDateTime.now().minusHours(3));

            // ─── Conversations + Chat poruke ─────────────────────────────────────
            // Milica <-> dr. Petrovic
            Conversation c1 = createConversation(conversationRepo,
                    milica, "Dr. Petrovic — Milica Jovanovic",
                    List.of(milicaU, doctor), LocalDateTime.now().minusDays(10));
            addMsg(chatMessageRepo, conversationRepo, c1, doctor, "Dobar dan, Milice. Kako se osecate danas? Pratim Vase nalaze.", LocalDateTime.now().minusDays(9).minusHours(3), true);
            addMsg(chatMessageRepo, conversationRepo, c1, milicaU, "Dobar dan, doktore. Temperatura je jutros bila 38.2, malo me boli grudi.", LocalDateTime.now().minusDays(9).minusHours(2), true);
            addMsg(chatMessageRepo, conversationRepo, c1, doctor, "Razumem. Nastavite sa terapijom koju smo dogovorili. Ako temperatura predje 39, odmah me kontaktirajte.", LocalDateTime.now().minusDays(9).minusHours(1), true);
            addMsg(chatMessageRepo, conversationRepo, c1, milicaU, "Hvala. Dali su mi i dodatni nebulizator, pomaze.", LocalDateTime.now().minusDays(8), true);
            addMsg(chatMessageRepo, conversationRepo, c1, doctor, "Dobro. Vidimo se na kontroli sutra u 10h. Brinite o sebi.", LocalDateTime.now().minusDays(7), true);
            addMsg(chatMessageRepo, conversationRepo, c1, milicaU, "Bice. Jedno pitanje — mogu li da jedem normalno ili treba posebna dijeta?", LocalDateTime.now().minusDays(2), true);
            addMsg(chatMessageRepo, conversationRepo, c1, doctor, "Nema posebnih ogranicenja. Dosta tecnosti, laganija hrana, izbegavati fizicki napor.", LocalDateTime.now().minusDays(1), false);

            // Milica <-> dr. Stojanovic
            Conversation c2 = createConversation(conversationRepo,
                    milica, "Dr. Stojanovic — Milica Jovanovic",
                    List.of(milicaU, doctor2), LocalDateTime.now().minusDays(9));
            addMsg(chatMessageRepo, conversationRepo, c2, doctor2, "Zdravo Milice, ja sam dr. Stojanovic, praticu Vas zajedno sa dr. Petrovicem.", LocalDateTime.now().minusDays(9), true);
            addMsg(chatMessageRepo, conversationRepo, c2, milicaU, "Hvala doktorke. Drago mi je da imam dvojicu lekara.", LocalDateTime.now().minusDays(8).minusHours(5), true);
            addMsg(chatMessageRepo, conversationRepo, c2, doctor2, "Pogledala sam RTG nalaz od jutros — levi rezanj se polako cisti. Dobar trend.", LocalDateTime.now().minusHours(4), false);

            // Nikola <-> dr. Petrovic
            Conversation c3 = createConversation(conversationRepo,
                    nikola, "Dr. Petrovic — Nikola Markovic",
                    List.of(nikolaU, doctor), LocalDateTime.now().minusDays(8));
            addMsg(chatMessageRepo, conversationRepo, c3, doctor, "Gospodine Markovic, pratim Vase vrijednosti. FEV1 od jutros je 38% — nastavicemo NIV terapiju.", LocalDateTime.now().minusDays(7), true);
            addMsg(chatMessageRepo, conversationRepo, c3, nikolaU, "Doktore, tesko mi je da disem bez maske. Da li je to normalno?", LocalDateTime.now().minusDays(6), true);
            addMsg(chatMessageRepo, conversationRepo, c3, doctor, "Da, to je ocekivano u ovoj fazi. Maska pomazete plucima da rade. Budite strpljivi.", LocalDateTime.now().minusDays(6).plusHours(1), true);
            addMsg(chatMessageRepo, conversationRepo, c3, nikolaU, "Razumem. Hvala na objasnjenju.", LocalDateTime.now().minusDays(5), true);
            addMsg(chatMessageRepo, conversationRepo, c3, doctor, "Veceras ce Vam medicinsko osoblje prilagoditi pritisak na NIV uredjaju. Javite se ako osecate nelagodnost.", LocalDateTime.now().minusHours(2), false);

            // Dragana <-> dr. Stojanovic
            Conversation c4 = createConversation(conversationRepo,
                    dragana, "Dr. Stojanovic — Dragana Ilic",
                    List.of(draganaU, doctor2), LocalDateTime.now().minusDays(12));
            addMsg(chatMessageRepo, conversationRepo, c4, doctor2, "Dragana, video sam da ste jutros imali bolove pri disanju. Kako je sada?", LocalDateTime.now().minusDays(11), true);
            addMsg(chatMessageRepo, conversationRepo, c4, draganaU, "Malo je bolje ali desna strana jos uvek boli. Drenaza je prosla jutros.", LocalDateTime.now().minusDays(11).plusHours(2), true);
            addMsg(chatMessageRepo, conversationRepo, c4, doctor2, "Normalno je. Izvukli smo 800ml izliva. Sutra cemo raditi kontrolni ultrazvuk.", LocalDateTime.now().minusDays(10), true);
            addMsg(chatMessageRepo, conversationRepo, c4, draganaU, "Hvala doktorke. Kada mogu da idem kuci?", LocalDateTime.now().minusDays(3), true);
            addMsg(chatMessageRepo, conversationRepo, c4, doctor2, "Ako sutra ultrazvuk bude uredan, planiram otpust prekosutra. Pratite uputstvo koje cemo Vam dati.", LocalDateTime.now().minusDays(2), false);

            // Zoran <-> dr. Djordjevic
            Conversation c5 = createConversation(conversationRepo,
                    zoran, "Dr. Djordjevic — Zoran Filipovic",
                    List.of(zoranU, doctor3), LocalDateTime.now().minusDays(7));
            addMsg(chatMessageRepo, conversationRepo, c5, doctor3, "Gospodine Filipovic, D-dimer je i dalje povisen ali stanje je stabilno. Nastavljamo antikoagulante.", LocalDateTime.now().minusDays(6), true);
            addMsg(chatMessageRepo, conversationRepo, c5, zoranU, "Imam pitanje — mogu li malo sesti ili stajati ili treba da lezim?", LocalDateTime.now().minusDays(5), true);
            addMsg(chatMessageRepo, conversationRepo, c5, doctor3, "Strogi odmor u krevetu jos 48h. Nakon toga postepeno ustajanje uz nadzor osoblja.", LocalDateTime.now().minusDays(5).plusHours(1), true);
            addMsg(chatMessageRepo, conversationRepo, c5, zoranU, "Ok razumem. Hvala.", LocalDateTime.now().minusDays(4), true);
            addMsg(chatMessageRepo, conversationRepo, c5, doctor3, "Upravo sam pregledao Vase INR vrednosti. U terapeutskom opsegu — odlicno.", LocalDateTime.now().minusHours(5), false);

            // Maja <-> dr. Djordjevic
            Conversation c6 = createConversation(conversationRepo,
                    maja, "Dr. Djordjevic — Maja Nikolic",
                    List.of(majaU, doctor3), LocalDateTime.now().minusDays(5));
            addMsg(chatMessageRepo, conversationRepo, c6, doctor3, "Maja, kriza je prosla. Saturaija je sada 97%. Smanjujemo dozu sistemskog kortikosteroida.", LocalDateTime.now().minusDays(4), true);
            addMsg(chatMessageRepo, conversationRepo, c6, majaU, "Hvala Bogu. Misla sam da nece proci. Hvala Vam.", LocalDateTime.now().minusDays(4).plusHours(1), true);
            addMsg(chatMessageRepo, conversationRepo, c6, doctor3, "Reagovali ste dobro na terapiju. Vazno je da otklonimo okidace — da li imate kucne ljubimce ili pusiace u okruzenju?", LocalDateTime.now().minusDays(3), true);
            addMsg(chatMessageRepo, conversationRepo, c6, majaU, "Imam macku i otac pusi. Kako da to resim?", LocalDateTime.now().minusDays(2), true);
            addMsg(chatMessageRepo, conversationRepo, c6, doctor3, "Macku treba drzati van spavace sobe. Otac treba apsolutno ne pusiti u kuci. Ovo je medicinska preporuka.", LocalDateTime.now().minusDays(1), false);

            // Maja <-> dr. Petrovic
            Conversation c7 = createConversation(conversationRepo,
                    maja, "Dr. Petrovic — Maja Nikolic",
                    List.of(majaU, doctor), LocalDateTime.now().minusDays(4));
            addMsg(chatMessageRepo, conversationRepo, c7, doctor, "Maja, dr. Djordjevic me upoznao sa slucajem. Pregledam Vas konsultativno.", LocalDateTime.now().minusDays(3), true);
            addMsg(chatMessageRepo, conversationRepo, c7, majaU, "Hvala doktore. Sada se osecam puno bolje.", LocalDateTime.now().minusDays(3).plusHours(2), true);
            addMsg(chatMessageRepo, conversationRepo, c7, doctor, "Vidim u sistemu. Nastavljamo terapiju kako je planirano. Javite se u slucaju pogoršanja.", LocalDateTime.now().minusDays(2), false);

            // Stefan <-> dr. Stojanovic
            Conversation c8 = createConversation(conversationRepo,
                    stefanP, "Dr. Stojanovic — Stefan Lazovic",
                    List.of(stefan, doctor2), LocalDateTime.now().minusDays(15));
            addMsg(chatMessageRepo, conversationRepo, c8, doctor2, "Stefan, pregledala sam poslednji HRCT. Fibroza je stabilna — nema znacajnog napredovanja.", LocalDateTime.now().minusDays(14), true);
            addMsg(chatMessageRepo, conversationRepo, c8, stefan, "To je dobra vest. Da li sto mi je ponekad kratko dah pri hodu?", LocalDateTime.now().minusDays(13), true);
            addMsg(chatMessageRepo, conversationRepo, c8, doctor2, "To je ocekivano kod IPF. Trudite se da ne ulazite u situacije gde morate ubrzano da hodite.", LocalDateTime.now().minusDays(12), true);
            addMsg(chatMessageRepo, conversationRepo, c8, stefan, "Razumem. Poceo sam da nosim pulsni oksimetar kako ste rekli.", LocalDateTime.now().minusDays(5), true);
            addMsg(chatMessageRepo, conversationRepo, c8, doctor2, "Odlicno! Ako saturacija padne ispod 92% pri naporu — odmah se odmorite i javite mi.", LocalDateTime.now().minusDays(3), false);

            // ─── Checkins — Milica (bilateralna pneumonija, trend poboljsanja) ────
            SymptomCheckin mc1 = checkin(checkinRepo, milica, 39.5, 7, false, false, true, false, true,
                    "Visoka temperatura, jak bol u grudima pri disanju, kasalj.", RiskLevel.RED, LocalDateTime.now().minusDays(7));
            SymptomCheckin mc2 = checkin(checkinRepo, milica, 39.1, 6, false, false, true, false, false,
                    "Temperatura i dalje visoka. Primam IV antibiotike. Kasalj produktivan.", RiskLevel.RED, LocalDateTime.now().minusDays(6));
            SymptomCheckin mc3 = checkin(checkinRepo, milica, 38.6, 5, false, false, true, false, false,
                    "Malo bolje. Temperatura opada. Satura kiseonika 93%.", RiskLevel.YELLOW, LocalDateTime.now().minusDays(5));
            SymptomCheckin mc4 = checkin(checkinRepo, milica, 38.1, 4, false, false, false, false, false,
                    "Vidljiv napredak. Disanje lakse. Satura 95%.", RiskLevel.YELLOW, LocalDateTime.now().minusDays(4));
            SymptomCheckin mc5 = checkin(checkinRepo, milica, 37.6, 3, false, false, false, false, false,
                    "Temperatura pada. Osecam se bolje. Kasalj jos uvek ali slabiji.", RiskLevel.YELLOW, LocalDateTime.now().minusDays(3));
            SymptomCheckin mc6 = checkin(checkinRepo, milica, 37.2, 2, false, false, false, false, false,
                    "Dobar dan. Temperatura gotovo normalna. Satura 97%.", RiskLevel.GREEN, LocalDateTime.now().minusDays(2));
            SymptomCheckin mc7 = checkin(checkinRepo, milica, 36.9, 1, false, false, false, false, false,
                    "Odlicno se osecam. Jedva cekam otpust.", RiskLevel.GREEN, LocalDateTime.now().minusHours(5));

            // ─── Checkins — Nikola (KOPB egzacerbacija) ──────────────────────────
            SymptomCheckin nc1 = checkin(checkinRepo, nikola, 37.8, 7, false, false, true, false, true,
                    "Jako otezano disanje, ne mogu da priceam celu recenicu. Kasalj sa gustim sekretom.", RiskLevel.RED, LocalDateTime.now().minusDays(6));
            SymptomCheckin nc2 = checkin(checkinRepo, nikola, 38.1, 8, false, false, true, false, true,
                    "Gore nego juce. Ukljucena NIV maska. Teski dani.", RiskLevel.RED, LocalDateTime.now().minusDays(5));
            SymptomCheckin nc3 = checkin(checkinRepo, nikola, 37.9, 7, false, false, true, false, false,
                    "Malo stabilizovano sa maskom. Disanje i dalje tesko.", RiskLevel.RED, LocalDateTime.now().minusDays(4));
            checkin(checkinRepo, nikola, 37.5, 6, false, false, true, false, false,
                    "FEV1 se poboljsao neznatno. Nastavljamo terapiju.", RiskLevel.YELLOW, LocalDateTime.now().minusDays(3));
            checkin(checkinRepo, nikola, 37.2, 5, false, false, true, false, false,
                    "Postepeno poboljsanje. Kratak hod do kupatila vec moguc.", RiskLevel.YELLOW, LocalDateTime.now().minusDays(2));
            checkin(checkinRepo, nikola, 36.9, 4, false, false, false, false, false,
                    "Bolje. Satura 93% bez kiseonika. Masku nosim samo noci.", RiskLevel.YELLOW, LocalDateTime.now().minusHours(6));

            // ─── Checkins — Dragana (pleuritis, drenaza) ─────────────────────────
            SymptomCheckin dc1 = checkin(checkinRepo, dragana, 38.4, 6, false, false, true, false, false,
                    "Bol pri dubokom udahu desno. Tezina u grudima.", RiskLevel.YELLOW, LocalDateTime.now().minusDays(10));
            SymptomCheckin dc2 = checkin(checkinRepo, dragana, 38.9, 7, false, false, true, false, true,
                    "Bol se pojacao, otezano disanje. Ultrazvuk pokazao izliv.", RiskLevel.RED, LocalDateTime.now().minusDays(9));
            checkin(checkinRepo, dragana, 38.2, 5, false, false, true, false, false,
                    "Drenaza uradjena. Lakse disem. Bol i dalje prisutan.", RiskLevel.YELLOW, LocalDateTime.now().minusDays(8));
            checkin(checkinRepo, dragana, 37.8, 4, false, false, false, false, false,
                    "Poboljsanje posle drenaze. Temperatura opada.", RiskLevel.YELLOW, LocalDateTime.now().minusDays(7));
            checkin(checkinRepo, dragana, 37.3, 3, false, false, false, false, false,
                    "Disanje skoro normalno. Bol pri dubinom udahu ostaje.", RiskLevel.GREEN, LocalDateTime.now().minusDays(5));
            checkin(checkinRepo, dragana, 36.8, 2, false, false, false, false, false,
                    "Osecam se dobro. Temperatura normalna.", RiskLevel.GREEN, LocalDateTime.now().minusDays(2));

            // ─── Checkins — Zoran (plucna embolija) ──────────────────────────────
            SymptomCheckin zc1 = checkin(checkinRepo, zoran, 37.2, 6, false, false, true, false, false,
                    "Iznenadni bol u grudima i otezano disanje. Odmah dosao u bolnicu.", RiskLevel.RED, LocalDateTime.now().minusDays(5));
            checkin(checkinRepo, zoran, 37.0, 5, false, false, true, false, false,
                    "Antikoagulantna terapija zapoceta. Malo bolje.", RiskLevel.YELLOW, LocalDateTime.now().minusDays(4));
            checkin(checkinRepo, zoran, 36.9, 4, false, false, false, false, false,
                    "Postepeno poboljsanje. Manji strah.", RiskLevel.YELLOW, LocalDateTime.now().minusDays(3));
            checkin(checkinRepo, zoran, 36.7, 3, false, false, false, false, false,
                    "Disanje lakse. Odmarao sam ceo dan.", RiskLevel.GREEN, LocalDateTime.now().minusDays(2));
            checkin(checkinRepo, zoran, 36.6, 2, false, false, false, false, false,
                    "Dobro stanje. Jutros sam ustao i hodao do prozora.", RiskLevel.GREEN, LocalDateTime.now().minusHours(8));

            // ─── Checkins — Maja (bronhijalna astma, status asthmaticus) ─────────
            SymptomCheckin maj1 = checkin(checkinRepo, maja, 37.5, 8, false, false, true, false, true,
                    "Teski napad gusenja. Bronhospazam. Nisam mogla da izgovorim recenicu.", RiskLevel.RED, LocalDateTime.now().minusDays(4));
            SymptomCheckin maj2 = checkin(checkinRepo, maja, 37.3, 7, false, false, true, false, false,
                    "IV kortikosteroidi pomazu. Stanje se stabilizuje.", RiskLevel.RED, LocalDateTime.now().minusDays(3));
            checkin(checkinRepo, maja, 36.9, 5, false, false, true, false, false,
                    "Satura 96%. Sibilansi smanjeni. Mogu normalno da govorim.", RiskLevel.YELLOW, LocalDateTime.now().minusDays(2));
            checkin(checkinRepo, maja, 36.7, 3, false, false, false, false, false,
                    "Disanje skoro normalno. Inhalaciona terapija 4x dnevno.", RiskLevel.GREEN, LocalDateTime.now().minusDays(1));
            checkin(checkinRepo, maja, 36.6, 2, false, false, false, false, false,
                    "Odlicno. Peak flow 78% predvidjene vrednosti.", RiskLevel.GREEN, LocalDateTime.now().minusHours(3));

            // ─── Checkins — Stefan (IPF) ──────────────────────────────────────────
            checkin(checkinRepo, stefanP, 36.7, 3, false, false, true, false, false,
                    "Kratak hod do kupatila izaziva zaduhu. Satura 91% pri naporu.", RiskLevel.YELLOW, LocalDateTime.now().minusDays(5));
            checkin(checkinRepo, stefanP, 36.6, 2, false, false, false, false, false,
                    "Mirovanje — satura 95%. Kasalj suv, hronicni.", RiskLevel.GREEN, LocalDateTime.now().minusDays(4));
            checkin(checkinRepo, stefanP, 36.8, 3, false, false, true, false, false,
                    "Malo vise zaduhe danas. Mozda zbog promene vremena.", RiskLevel.YELLOW, LocalDateTime.now().minusDays(2));
            checkin(checkinRepo, stefanP, 36.5, 2, false, false, false, false, false,
                    "Normalan dan za moje stanje. Vrtjim oksimetar.", RiskLevel.GREEN, LocalDateTime.now().minusHours(10));

            // ─── Enrich checkins with pulmonary SpO2 + respiratory data ──────────
            mc1.setSpO2(88.0);  mc1.setRespiratoryRate(28); mc1.setHasCough(true);
            mc1.setCoughType("PRODUCTIVE"); mc1.setSputumColor("YELLOW_GREEN"); mc1.setCoughIntensity(7); mc1.setDyspneaLevel(3); checkinRepo.save(mc1);
            mc2.setSpO2(89.5);  mc2.setRespiratoryRate(26); mc2.setHasCough(true);
            mc2.setCoughType("PRODUCTIVE"); mc2.setSputumColor("YELLOW_GREEN"); mc2.setCoughIntensity(6); mc2.setDyspneaLevel(3); checkinRepo.save(mc2);
            mc3.setSpO2(93.0);  mc3.setRespiratoryRate(22); mc3.setHasCough(true);
            mc3.setCoughType("PRODUCTIVE"); mc3.setSputumColor("WHITE"); mc3.setCoughIntensity(4); mc3.setDyspneaLevel(2); checkinRepo.save(mc3);
            mc4.setSpO2(95.0);  mc4.setRespiratoryRate(20); mc4.setHasCough(true);
            mc4.setCoughType("DRY"); mc4.setCoughIntensity(2); mc4.setDyspneaLevel(1); checkinRepo.save(mc4);
            mc5.setSpO2(96.5);  mc5.setRespiratoryRate(18); mc5.setHasCough(true);
            mc5.setCoughType("DRY"); mc5.setCoughIntensity(1); mc5.setDyspneaLevel(1); checkinRepo.save(mc5);
            mc6.setSpO2(97.5);  mc6.setRespiratoryRate(16); checkinRepo.save(mc6);
            mc7.setSpO2(98.0);  mc7.setRespiratoryRate(15); checkinRepo.save(mc7);

            nc1.setSpO2(82.0);  nc1.setRespiratoryRate(30); nc1.setHasCough(true);
            nc1.setCoughType("PRODUCTIVE"); nc1.setSputumColor("YELLOW_GREEN"); nc1.setCoughIntensity(8); nc1.setDyspneaLevel(4); nc1.setHasWheezing(true); checkinRepo.save(nc1);
            nc2.setSpO2(80.5);  nc2.setRespiratoryRate(32); nc2.setHasCough(true);
            nc2.setCoughType("PRODUCTIVE"); nc2.setSputumColor("YELLOW_GREEN"); nc2.setCoughIntensity(8); nc2.setDyspneaLevel(4); nc2.setHasWheezing(true); checkinRepo.save(nc2);
            nc3.setSpO2(84.0);  nc3.setRespiratoryRate(28); nc3.setHasCough(true);
            nc3.setCoughType("PRODUCTIVE"); nc3.setSputumColor("YELLOW_GREEN"); nc3.setCoughIntensity(7); nc3.setDyspneaLevel(3); checkinRepo.save(nc3);

            dc1.setSpO2(94.0);  dc1.setRespiratoryRate(20); dc1.setChestPainPresent(true); dc1.setChestPainSide("RIGHT"); dc1.setDyspneaLevel(2); checkinRepo.save(dc1);
            dc2.setSpO2(91.0);  dc2.setRespiratoryRate(24); dc2.setChestPainPresent(true); dc2.setChestPainSide("RIGHT"); dc2.setDyspneaLevel(3); checkinRepo.save(dc2);

            zc1.setSpO2(89.0);  zc1.setRespiratoryRate(28); zc1.setChestPainPresent(true); zc1.setChestPainSide("RIGHT"); zc1.setDyspneaLevel(3); checkinRepo.save(zc1);

            maj1.setSpO2(87.0); maj1.setRespiratoryRate(32); maj1.setDyspneaLevel(4); maj1.setHasWheezing(true); checkinRepo.save(maj1);
            maj2.setSpO2(91.5); maj2.setRespiratoryRate(26); maj2.setDyspneaLevel(3); maj2.setHasWheezing(true); checkinRepo.save(maj2);

            // ─── Alerts ───────────────────────────────────────────────────────────
            alert(alertRepo, milica, mc1, "Milica Jovanovic: CRVENO — temperatura 39.5°C, otezano disanje (bilateralna pneumonija)", AlertStatus.RESOLVED, LocalDateTime.now().minusDays(7));
            alert(alertRepo, milica, mc2, "Milica Jovanovic: CRVENO — temperatura 39.1°C, stanje kritijno", AlertStatus.RESOLVED, LocalDateTime.now().minusDays(6));
            alert(alertRepo, milica, mc3, "Milica Jovanovic: YELLOW — temperatura 38.6°C, postepeno poboljsanje", AlertStatus.RESOLVED, LocalDateTime.now().minusDays(5));
            alert(alertRepo, nikola, nc1, "HITNO — Nikola Markovic: CRVENO — KOPB kriza, FEV1 38%, NIV zapoceta!", AlertStatus.RESOLVED, LocalDateTime.now().minusDays(6));
            alert(alertRepo, nikola, nc2, "Nikola Markovic: CRVENO — pogoršanje stanja, temperatura 38.1°C", AlertStatus.RESOLVED, LocalDateTime.now().minusDays(5));
            alert(alertRepo, nikola, nc3, "Nikola Markovic: YELLOW — stanje se stabilizuje na NIV terapiji", AlertStatus.NEW, LocalDateTime.now().minusDays(4));
            alert(alertRepo, dragana, dc2, "HITNO — Dragana Ilic: CRVENO — pleuralni izliv, hitna drenaza!", AlertStatus.RESOLVED, LocalDateTime.now().minusDays(9));
            alert(alertRepo, zoran, zc1, "HITNO — Zoran Filipovic: CRVENO — sumnja na plucnu emboliju, hitni prijem!", AlertStatus.RESOLVED, LocalDateTime.now().minusDays(5));
            alert(alertRepo, maja, maj1, "HITNO — Maja Nikolic: CRVENO — status asthmaticus, bronhospazam!", AlertStatus.RESOLVED, LocalDateTime.now().minusDays(4));
            alert(alertRepo, maja, maj2, "Maja Nikolic: CRVENO — napad se nastavlja, intenzivna terapija", AlertStatus.NEW, LocalDateTime.now().minusDays(3));

            // ─── Discharge plans ─────────────────────────────────────────────────
            DischargePlan milicaPlan = plan(planRepo, milica, doctor,
                    LocalDate.now().minusDays(2),
                    "Bilateralna bakterijska pneumonija — dominantno zahvaceni donji reznjevi oba pluca. " +
                    "Uzrocnik: Streptococcus pneumoniae (potvrdjen kulturom iskasljaja). " +
                    "Primala IV antibiotike 7 dana, satura kiseonika stabilna na 97%, CRP u normalizaciji.",
                    "Odmor minimalno 2 nedelje. Izbegavati hladne i zadimljene prostore. " +
                    "Nastaviti inhalacionu bronhodilatatornu terapiju jos 10 dana. " +
                    "Dosta tecnosti (2-3L dnevno). Postepeno vracanje aktivnostima. " +
                    "Kontrolni RTG pluca za 4 nedelje obavezan.",
                    "• Temperatura > 38.5°C ponovo\n• Satura kiseonika < 92% (meriti oksimetrom)\n" +
                    "• Bol u grudima pri disanju\n• Pogorsan kasalj ili krvave izmokrine\n" +
                    "• Brzo disanje > 25/min",
                    PlanStatus.ACTIVE);
            meds(medRepo, milicaPlan,
                    med("Amoksicilin/Klavulanska kiselina", "875/125 mg", "3x dnevno uz obrok", LocalDate.now().minusDays(7), LocalDate.now().plusDays(3), "Zavrsiti kompletan kurs — ne prekidati ni ako se osecate bolje."),
                    med("Azitromicin", "500 mg", "1x dnevno", LocalDate.now().minusDays(7), LocalDate.now().plusDays(1), "Atipicna pokrivenost. Uzimati sat pre jela."),
                    med("Salbutamol inhaler", "2 udisaja", "4x dnevno i po potrebi", LocalDate.now().minusDays(7), LocalDate.now().plusDays(14), "Bronhodilatator. Pranje usta posle upotrebe."),
                    med("Acetilcistein (ACC 600)", "600 mg", "1x dnevno uveče", LocalDate.now().minusDays(7), LocalDate.now().plusDays(14), "Razredjivanje sekreta. Uzimati sa dosta vode."),
                    med("Paracetamol", "1000 mg", "Po potrebi max 4x dnevno", LocalDate.now().minusDays(7), LocalDate.now().plusDays(7), "Za temperaturu i bol. Ne prelaziti 4g dnevno."));

            DischargePlan nikolaPlan = plan(planRepo, nikola, doctor,
                    LocalDate.now().plusDays(7),
                    "KOPB egzacerbacija srednje-tezkog stepena (FEV1 38% pred. vred.) — precipitirajuci faktor infekcija. " +
                    "Primenjena NIV terapija tokom 4 dana. Vitalni parametri stabilizovani. " +
                    "Gasne analize: pH 7.38, PaCO2 52 mmHg, PaO2 68 mmHg na 2L O2.",
                    "Strogi odmor. Nastavak NIV terapije noci jos 2 nedelje. " +
                    "Bronhodilatatori dugog dejstva obavezni. Fizikalna terapija pluca 2x nedeljno. " +
                    "Nikako pusenje — apsolutna zabrana. Redovan kiseonik ako satura < 88%.",
                    "• FEV1 pad za > 20% od zadnje vrednosti\n• Satura < 88% u miru\n" +
                    "• Pojacana zaduha koja remeti svakodnevni zivot\n" +
                    "• Promena boje iskasljaja (zuckaston ili krvav)\n• Groznica > 38°C",
                    PlanStatus.ACTIVE);
            meds(medRepo, nikolaPlan,
                    med("Tiotropijum (Spiriva)", "18 mcg", "1x dnevno ujutru (inhaler)", LocalDate.now().minusDays(6), LocalDate.now().plusDays(365), "Dugodelovajuci bronhodilatator. Koristiti svaki dan u isto vreme."),
                    med("Salmeterol/Flutikazon (Seretide)", "50/500 mcg", "2x dnevno (inhaler)", LocalDate.now().minusDays(6), LocalDate.now().plusDays(180), "Kombinovana terapija. Pranje usta posle svake upotrebe."),
                    med("Prednizon", "40 mg", "1x dnevno ujutru, postepeno smanjivati", LocalDate.now().minusDays(6), LocalDate.now().plusDays(14), "Sistemski kortikosteroid. NE prekidati naglo — smanjivati po uputstvu."),
                    med("Doksiciklin", "100 mg", "2x dnevno", LocalDate.now().minusDays(6), LocalDate.now().plusDays(4), "Antibiotik za bakterijsku egzacerbaciju. Uzimati uz obrok."),
                    med("Salbutamol inhaler", "2-4 udisaja", "Po potrebi, max 8x dnevno", LocalDate.now().minusDays(6), LocalDate.now().plusDays(30), "Kratkodelujuci bronhodilatator za olaksanje. Ako koristite > 4x/dan — javite lekaru."));

            DischargePlan draganaPlan = plan(planRepo, dragana, doctor2,
                    LocalDate.now().plusDays(2),
                    "Pleuritis exudativus desno — etiologija parapneumonska. Ultrazvukom verifikovan izliv 900ml. " +
                    "Izvedena terapijska torakocenteza — evakuisano 800ml seroznog eksudata. " +
                    "Citoloski i bakterioloski nalaz izliva: negativan na malignitet, negativan na M. tuberculosis.",
                    "Odmor 2 nedelje. Nema teskih fizickih aktivnosti 4 nedelje. " +
                    "Duboke veze i disanje 4x dnevno (spirometrija podsticajna). " +
                    "Kontrolni ultrazvuk pluca za 2 nedelje.",
                    "• Ponovan bol u grudima pri disanju\n• Naglo otezano disanje\n" +
                    "• Temperatura > 38°C ponovo\n• Znaci zapaljenja na mestu torakocenteze",
                    PlanStatus.ACTIVE);
            meds(medRepo, draganaPlan,
                    med("Amoksicilin", "500 mg", "3x dnevno", LocalDate.now().minusDays(8), LocalDate.now().plusDays(6), "Antibiotik. Uzimati u jednakim vremenskim razmacima."),
                    med("Ibuprofen", "400 mg", "3x dnevno uz obrok", LocalDate.now().minusDays(8), LocalDate.now().plusDays(7), "Antiinflamatorno i analgeticko. Uzimati uz obrok zbog zeludca."),
                    med("Omeprazol", "20 mg", "1x dnevno ujutru", LocalDate.now().minusDays(8), LocalDate.now().plusDays(14), "Zastita zeludca tokom terapije ibuprofenom."));

            DischargePlan zoranPlan = plan(planRepo, zoran, doctor3,
                    LocalDate.now().plusDays(5),
                    "Akutna plucna embolija (submisivna) — CT angiografija pluca potvrdila tromboze u desnoj i levoj plucnoj arteriji. " +
                    "Hemodinamski stabilan na prijemu. Zapoèta antikoagulantna terapija. " +
                    "Ehokardiogram: blaga dilatacija desne komore, bez znakova tezeg srcanog pritiska.",
                    "Strogi mirovanje 5 dana. Antikoagulantna terapija minimum 3 meseca. " +
                    "Kompresivne carape obavezno. Izbegavati duga sedenja i letove. " +
                    "Redovne kontrole INR vrednosti sedmicno.",
                    "• Bol u grudima ili nagla zaduha\n• Hemoptizija (krv u iskasljaju)\n" +
                    "• Sinkopa (gubitak svesti)\n• Jak bol ili otok u nozi\n• Znaci krvarenja (hematomi, krv u urinu)",
                    PlanStatus.ACTIVE);
            meds(medRepo, zoranPlan,
                    med("Rivaroksaban (Xarelto)", "15 mg", "2x dnevno uz obrok (prvih 21 dan), potom 20mg 1x", LocalDate.now().minusDays(4), LocalDate.now().plusDays(90), "Antikoagulant. NE preskakati doze — rizik od recidiva embolije."),
                    med("Enoksaparin (Clexane)", "80 mg", "2x dnevno (injekcija pod kozu stomaka)", LocalDate.now().minusDays(4), LocalDate.now().plusDays(5), "Prelazna antikoagulantna terapija. Menjati strane stomaka."),
                    med("Pantoprazol", "40 mg", "1x dnevno ujutru", LocalDate.now().minusDays(4), LocalDate.now().plusDays(30), "Zastita zeludca."));

            DischargePlan majaPlan = plan(planRepo, maja, doctor3,
                    LocalDate.now().plusDays(4),
                    "Status asthmaticus — teski bronhospazam koji nije reagovao na pocetnu ambulantnu terapiju. " +
                    "Primljena hitno, primila IV metilprednizolon i salbutamol nebulizacijom. " +
                    "Peak flow na otpustu 78% predvidjene vrednosti. IgE povisen — alergijska komponenta potvrdjena.",
                    "Nastaviti inhalacionu terapiju striktno. Identifikovati i izbegavati okidace. " +
                    "Macku drzati izvan spavace sobe. U kuci zabranjeno pusenje. " +
                    "Peak flow meriti 2x dnevno i beležiti vrednosti.",
                    "• Napad koji ne popusta na 2-4 udisaja salbutamola\n• Satura < 92%\n" +
                    "• Peak flow < 50% predvidjene vrednosti\n• Modra boja usana ili noktiju\n" +
                    "• Nesposobnost izgovoriti celu recenicu",
                    PlanStatus.ACTIVE);
            meds(medRepo, majaPlan,
                    med("Budesonid/Formoterol (Symbicort)", "160/4.5 mcg", "2x dnevno (inhaler)", LocalDate.now().minusDays(4), LocalDate.now().plusDays(180), "Osnovna terapija astme. Koristiti SVAKI DAN bez obzira na simptome."),
                    med("Salbutamol (Ventolin) inhaler", "2 udisaja", "Po potrebi pri napadu", LocalDate.now().minusDays(4), LocalDate.now().plusDays(30), "Lekove za hitnu pomoc. Ako koristite > 3x nedeljno — javite lekaru."),
                    med("Prednizon", "25 mg", "1x dnevno, smanjivati po 5mg na 2 dana", LocalDate.now().minusDays(4), LocalDate.now().plusDays(10), "Sistemski kortikosteroid — postepeno smanjivati, NE nagle."),
                    med("Montellukast (Singulair)", "10 mg", "1x dnevno uveče", LocalDate.now().minusDays(4), LocalDate.now().plusDays(180), "Antileukotrien. Uzimati svako vece u isto vreme."),
                    med("Cetrizin", "10 mg", "1x dnevno uveče", LocalDate.now().minusDays(4), LocalDate.now().plusDays(90), "Antihistaminik za alergijsku komponentu."));

            DischargePlan stefanPlan = plan(planRepo, stefanP, doctor2,
                    LocalDate.now().plusDays(1),
                    "Idiopatska plucna fibroza (IPF) — dijagnoza potvrdjerna HRCT-om (obostrani prstenasti " +
                    "infiltrati i sataste promene u bazalnim segmentima). FVC 58% pred. vrednosti. DLCO 52%. " +
                    "Bolest stabilna u poslednjih 12 meseci — bez znacajnog napredovanja.",
                    "Redovna primena antifibrotika obavezna. Uzimati kiseonik pri naporu ako satura pada ispod 92%. " +
                    "Godisnja vakcinacija protiv gripa i pneumokoka obavezna. " +
                    "Pulmoloski kurs rehabilitacije — prijaviti se odmah.",
                    "• Satura < 90% u miru\n• Naglo pogoršanje zaduhe\n" +
                    "• Akutna egzacerbacija IPF (potrebna hitna hospitalizacija)\n" +
                    "• Visoka temperatura ili infektivni simptomi",
                    PlanStatus.ACTIVE);
            meds(medRepo, stefanPlan,
                    med("Nintedanib (Ofev)", "150 mg", "2x dnevno uz obrok", LocalDate.now().minusDays(15), LocalDate.now().plusDays(365), "Antifibrotik. Uzimati uz obrok — smanjuje GI nuspojave. Redovna kontrola jetre mesecno."),
                    med("N-acetilcistein", "600 mg", "3x dnevno", LocalDate.now().minusDays(15), LocalDate.now().plusDays(365), "Antioksidativna podrska. Rastvoriti u casi vode."),
                    med("Omeprazol", "20 mg", "1x dnevno ujutru", LocalDate.now().minusDays(15), LocalDate.now().plusDays(90), "Gastoroezofagealni refluks cest kod IPF — zastita jednjaka i pluca."));

            // ─── Medication adherence logs (30 days) ─────────────────────────────
            seedMedLogs(logRepo, milica,  milicaPlan,  0.88);
            overrideMilicaToday(logRepo, milica, milicaPlan); // 2/5 taken today — demo partial adherence
            seedMedLogs(logRepo, nikola,  nikolaPlan,  0.62);
            seedMedLogs(logRepo, dragana, draganaPlan, 0.90);
            seedMedLogs(logRepo, zoran,   zoranPlan,   0.75);
            seedMedLogs(logRepo, maja,    majaPlan,    0.55);
            seedMedLogs(logRepo, stefanP, stefanPlan,  0.93);

            // ─── Appointments ─────────────────────────────────────────────────────
            appt(apptRepo, milica, milicaPlan, LocalDateTime.now().plusDays(1).withHour(10).withMinute(0),
                    "Kontrolni pulmoloski pregled", "Pulmologija, Ambulanta 3, II sprat",
                    "Procena saturacije i auskultacija pluca. Doneti prethodne RTG nalaze.");
            appt(apptRepo, milica, milicaPlan, LocalDateTime.now().plusDays(3).withHour(9).withMinute(30),
                    "RTG pluca — kontrola", "Radiologija, prizemlje",
                    "Kontrolni RTG 10. dana lecenja. Procena rezolucije infiltrata.");
            appt(apptRepo, milica, milicaPlan, LocalDateTime.now().plusDays(28).withHour(11).withMinute(0),
                    "Spirometrija + kontrola", "Pulmologija, Ambulanta 3",
                    "Procena funkcije pluca nakon oporavka. Spirometrija obavezna.");

            appt(apptRepo, nikola, nikolaPlan, LocalDateTime.now().plusDays(1).withHour(8).withMinute(0),
                    "Gasne analize arterijske krvi", "Lab Urgentni centar",
                    "Kontrola PaO2, PaCO2, pH. Doneti raniji nalaz gasova.");
            appt(apptRepo, nikola, nikolaPlan, LocalDateTime.now().plusDays(3).withHour(10).withMinute(0),
                    "Spirometrija i brokhodilatatoni test", "Pulmologija, Dijagnostika",
                    "Procena FEV1 i FVC. Reverzibilnost bronhospazma.");
            appt(apptRepo, nikola, nikolaPlan, LocalDateTime.now().plusDays(7).withHour(11).withMinute(0),
                    "Kontrolni pregled pred otpust", "Pulmologija, Ambulanta 3",
                    "Finalna procena. Edukacija o NIV upotrebi kod kuce.");

            appt(apptRepo, dragana, draganaPlan, LocalDateTime.now().plusDays(1).withHour(9).withMinute(0),
                    "Kontrolni ultrazvuk pluca", "Dijagnostika, Ultrazvuk",
                    "Provera reakumulacije pleuralnog izliva.");
            appt(apptRepo, dragana, draganaPlan, LocalDateTime.now().plusDays(14).withHour(10).withMinute(0),
                    "Kontrolni pregled i spirometrija", "Pulmologija, Ambulanta 5",
                    "2 nedelje od drenaze — procena stanja.");

            appt(apptRepo, zoran, zoranPlan, LocalDateTime.now().plusDays(2).withHour(10).withMinute(0),
                    "CT angiografija pluca — kontrola", "Radiologija, CT, I sprat",
                    "Procena regresije tromboza. Doneti prethodni CT CD.");
            appt(apptRepo, zoran, zoranPlan, LocalDateTime.now().plusDays(5).withHour(11).withMinute(0),
                    "Kontrolni pregled pred otpust", "Pulmologija, Ambulanta 3",
                    "INR, D-dimer, ehokardiogram. Edukacija o antikoagulantnoj terapiji.");

            appt(apptRepo, maja, majaPlan, LocalDateTime.now().plusDays(1).withHour(9).withMinute(30),
                    "Peak flow mjerenje + kontrola", "Pulmologija, Ambulanta 3",
                    "Pracenje odgovora na terapiju. Doneti dnevnik peak flow vrednosti.");
            appt(apptRepo, maja, majaPlan, LocalDateTime.now().plusDays(4).withHour(11).withMinute(0),
                    "Alergoloski test + IgE panel", "Alergologija, Ambulanta 1",
                    "Identifikacija specificnih alergena. Potencijalna imunoterapija.");

            appt(apptRepo, stefanP, stefanPlan, LocalDateTime.now().plusDays(1).withHour(10).withMinute(0),
                    "Pregled pred otpust + HRCT interpretacija", "Pulmologija, Ambulanta 3",
                    "Diskusija HRCT nalaza i plana lecenja.");
            appt(apptRepo, stefanP, stefanPlan, LocalDateTime.now().plusDays(90).withHour(10).withMinute(0),
                    "Tromesecna kontrola IPF", "Pulmologija, Ambulanta 3",
                    "Spirometrija, DLCO, 6-minutni test hodanja. Procena efikasnosti nintedaniba.");

            // ─── Notifications ────────────────────────────────────────────────────
            notif(notifRepo, doctor, milica, "HITNO — Milica Jovanovic: CRVENO",
                    "Bilateralna pneumonija — temperatura 39.5°C, satura 88%. Primljenena hitno.", "ALERT", false, LocalDateTime.now().minusDays(7));
            notif(notifRepo, doctor, milica, "Napredak — Milica Jovanovic",
                    "Temperatura opada na 37.2°C. Satura 97%. Antibiotici deluju odlicno.", "INFO", true, LocalDateTime.now().minusDays(2));
            // APPOINTMENT notifs for Milica
            notif(notifRepo, milicaU, milica, "Pregled sutra u 10:00",
                    "Kontrolni pulmoloski pregled sutra u 10:00, Ambulanta 3, II sprat. Prinesite prethodne RTG nalaze.", "APPOINTMENT", false, LocalDateTime.now().minusHours(3));
            notif(notifRepo, milicaU, milica, "Zakazan RTG pluca",
                    "RTG pluca — kontrola zakazana za " + LocalDate.now().plusDays(3) + " u 09:30, Radiologija, prizemlje.", "APPOINTMENT", false, LocalDateTime.now().minusDays(1));
            notif(notifRepo, jelenaU, milica, "Pregled brat/sestra — podsetnik",
                    "Milica ima kontrolni pregled sutra u 10h. Ako je potrebna pratnja, slobodna sam.", "APPOINTMENT", true, LocalDateTime.now().minusHours(5));
            // REMINDER notifs for Milica
            notif(notifRepo, milicaU, milica, "Podsetnik: lekovi",
                    "Vreme je za vecernju dozu — Acetilcistein 600mg i Salbutamol inhaler. Ne zaboravite!", "REMINDER", false, LocalDateTime.now().minusHours(1));
            notif(notifRepo, milicaU, milica, "Podsetnik: antibiotik",
                    "Treća doza Amoksicilina danas — uz veceru. Zavrsiti kompletan kurs antibiotika!", "REMINDER", false, LocalDateTime.now().minusHours(2));
            notif(notifRepo, jelenaU, milica, "Kontrola za 28 dana",
                    "Spirometrija i kontrolni pregled Milice zakazana za 28 dana. Pratice se oporavak pluca.", "REMINDER", true, LocalDateTime.now().minusDays(3));
            notif(notifRepo, doctor, nikola, "HITNO — Nikola Markovic: KOPB kriza",
                    "FEV1 38%, teski bronhospazam. Ukljucena NIV terapija.", "ALERT", false, LocalDateTime.now().minusDays(6));
            notif(notifRepo, doctor2, dragana, "Pleuralni izliv — Dragana Ilic",
                    "Ultrazvukom potvrdjeno 900ml izliva desno. Zakazana torakocenteza.", "ALERT", true, LocalDateTime.now().minusDays(9));
            notif(notifRepo, doctor2, dragana, "Drenaza uspesna — Dragana Ilic",
                    "Evakuisano 800ml izliva. Pacijentkinja dobro podnela proceduru.", "INFO", false, LocalDateTime.now().minusDays(8));
            notif(notifRepo, doctor3, zoran, "HITNO — Zoran Filipovic: plucna embolija",
                    "CT angiografija: tromboze u obe plucne arterije. Zapoceta antikoagulantna terapija.", "ALERT", false, LocalDateTime.now().minusDays(5));
            notif(notifRepo, doctor3, maja, "HITNO — Maja Nikolic: status asthmaticus",
                    "Teski bronhospazam. IV kortikosteroidi i salbutamol nebulizacijom zapoceti.", "ALERT", false, LocalDateTime.now().minusDays(4));
            notif(notifRepo, doctor3, maja, "Maja Nikolic: stabilizacija",
                    "Peak flow 78%. Satura 97%. Kriza prosla. Nastavljamo postepeno smanjenje kortikosteroida.", "INFO", false, LocalDateTime.now().minusDays(2));
            notif(notifRepo, doctor2, stefanP, "IPF pracenje — Stefan Lazovic",
                    "HRCT stabilan. Nema napredovanja fibroze u poslednjih 12 meseci. Nastaviti nintedanib.", "INFO", false, LocalDateTime.now().minusDays(3));

            // Porodica
            notif(notifRepo, jelenaU, milica, "Milica hospitalizovana hitno",
                    "Milica je primljena zbog teske pneumonije. Lekar je odmah reagovao. Pracenje u toku.", "ALERT", false, LocalDateTime.now().minusDays(7));
            notif(notifRepo, jelenaU, milica, "Stanje Milice se popravlja!",
                    "Temperatura pada, satura kiseonika 97%. Antibiotici deluju odlicno. Otpust za 3 dana.", "INFO", false, LocalDateTime.now().minusDays(2));
            notif(notifRepo, anaU, nikola, "Nikola u KOPB krizi",
                    "Nikola je na NIV terapiji. Lekar prati stanje. Posto on prihvati dolazak koristite aplikaciju.", "ALERT", false, LocalDateTime.now().minusDays(6));
            notif(notifRepo, petarU, dragana, "Dragana — pleuralni izliv",
                    "Uradi torakocenteza uspesno. Dragana se oseca bolje. Otpust za 2 dana.", "INFO", false, LocalDateTime.now().minusDays(7));
            notif(notifRepo, katarinaU, zoran, "Zoran — plucna embolija",
                    "Zoran je stabilizovan. Prima antikoagulante. Otpust se ocekuje za 5 dana.", "INFO", false, LocalDateTime.now().minusDays(4));
            notif(notifRepo, marinaU, maja, "Maja — kriza astme prosla",
                    "Peak flow se normalizovao. Satura 97%. Lekar je optimistican za brz oporavak.", "INFO", false, LocalDateTime.now().minusDays(2));

            // ─── Family connections ───────────────────────────────────────────────
            familyConn(familyRepo, milica,  jelenaU,   "Sestra");
            familyConn(familyRepo, nikola,  anaU,      "Majka");
            familyConn(familyRepo, dragana, petarU,    "Suprug");
            familyConn(familyRepo, zoran,   katarinaU, "Supruga");
            familyConn(familyRepo, maja,    marinaU,   "Sestra");

            // ─── Audit ────────────────────────────────────────────────────────────
            audit(auditRepo, admin,   "CREATE", "User", doctor.getId(),   LocalDateTime.now().minusDays(30));
            audit(auditRepo, doctor,  "CREATE", "DischargePlan", milicaPlan.getId(), LocalDateTime.now().minusDays(7));
            audit(auditRepo, doctor2, "CREATE", "DischargePlan", draganaPlan.getId(), LocalDateTime.now().minusDays(12));
            audit(auditRepo, doctor3, "APPROVE","DoctorPatientRequest", req5.getId(), LocalDateTime.now().minusDays(7));

            // ─── Medical Documents ────────────────────────────────────────────────
            // Milica Jovanovic — bilateralna pneumonija (recent, 2026)
            medDoc(medDocRepo, milica, doctor, "Internisticki pregled — prijem", "ANAMNEZA",
                LocalDate.now().minusDays(7), true,
                "GLAVNE TEGOBE:\nVisoka temperatura, jak kasalj, otezano disanje, bolovi u grudima\n\n" +
                "SADASNJA BOLEST:\nBolesnica navodi da se razboljela pre 7 dana naglim pojavljivanjem " +
                "visoke temperature (39.5°C) uz produktivni kasalj i progresivnu dispneju. " +
                "Leci se ambulantno bez poboljsanja. Upucena hitno na bolnicko lecenje.\n\n" +
                "ANAMNEZA PO SISTEMIMA:\n" +
                "Respiratorni: Kasalj produktivan, zuckazelen sekret, dispneja u miru i pri naporu, bolovi u grudima obostrano\n" +
                "KVS: Negira lupanje srca, negira otoke\n" +
                "GIT: Apetit oslabljen, negira mučninu i povracanje\n" +
                "Urinarni: Uredna mikcija\n\n" +
                "LICNA ANAMNEZA:\n" +
                "Alergije: Negira alergije na lekove i hranu\n" +
                "Pusenje: Negira upotrebu cigareta\n" +
                "Alkohol: Negira upotrebu alkohola\n" +
                "Lekovi pre hospitalizacije: Ibuprofen 400mg po potrebi za temperaturu\n\n" +
                "PORODICNA ANAMNEZA:\nOtac leci od hipertenzije. Negira hereditarne plucne bolesti.\n\n" +
                "SOCIJALNO-EPIDEMIOLOSKI PODACI:\nZaposlena, udata, stanuje u gradskom stanu, snabdeva se vodom iz gradskog vodovoda.\n\n" +
                "ANAMNEZNI ZAKLJUCAK:\nRadi se o akutnoj inflamatornoj bolesti pluca — bilateralnoj bakterijskoj pneumoniji teškog kliničkog toka.");

            medDoc(medDocRepo, milica, doctor, "Fizikalni pregled — prijem", "FIZIKALNI",
                LocalDate.now().minusDays(7), true,
                "OPSTA INSPEKCIJA:\nBolesnica svesna, orijentisana, komunikativna. Temperatura 39.5°C. " +
                "Koža bleda, znojava. Dispnoicna u miru (RR 26/min).\n\n" +
                "GRUDNI KOS:\nGrudni kos simetričan, respiratorno pokretan. Auskultatorno nad plucima obostrano " +
                "crepitacije i bronhijalno disanje — akcentovano u donjim reznjcima bilateralno.\n" +
                "Perkutorno submativnost donji reznjevi obostrano. Saturacija O2: 88% (u sobi vazduha).\n" +
                "Srčana radnja ritmicna, tonovi jasni. TA 100/65 mmHg, puls 112/min.\n\n" +
                "ABDOMEN:\nBez patoloških promena. Jetra i slezina se ne palpiraju.\n\n" +
                "EKSTREMITETI:\nBez edema. TV 168cm, TM 62kg, BMI 22.0 kg/m2");

            medDoc(medDocRepo, milica, doctor2, "RTG pluca — kontrolni nalaz", "NALAZ_RTG",
                LocalDate.now().minusDays(4), true,
                "RTG PLUCA PA/LL:\nPovecana homogena zasenčenost oba donja plucna polja uz perihilarne infiltrate. " +
                "U poređenju sa prethodnim snimkom od dana prijema — delimicna regresija infiltrata posebno desno.\n" +
                "Dijafragme pravilnog oblika. Sinusi slobodni.\n" +
                "Srce normalne velicine i oblika.\n\n" +
                "ZAKLJUCAK:\nBilateralni pneumonijski infiltrati u fazi parcijalne regresije.");

            medDoc(medDocRepo, milica, doctor, "Kontrolni pregled — 7. dan lecenja", "KONTROLNI_PREGLED",
                LocalDate.now().minusDays(1), true,
                "Bolesnica u vidnom poboljsanju. Temperatura jutros 36.9°C. Kasalj slab, sekret redukovan.\n" +
                "Saturacija O2 97% bez kiseonika. Auskultatorni nalaz pluca — perzistentni krepitusi basalno desno.\n" +
                "CRP: 24 mg/L (snizenje od pocetnih 285 mg/L). Leukociti: 9.2 x10^9/L.\n\n" +
                "PLAN:\nNastavak antibiotske terapije jos 3 dana. Planiran otpust za 3 dana uz kontrolni RTG za 4 nedelje.");

            // Milica Jovanovic — ranija istorija (pre pneumonije 2026)
            medDoc(medDocRepo, milica, doctor2, "Sistematski pregled — 2019", "KONTROLNI_PREGLED",
                LocalDate.of(2019, 3, 10), false,
                "SISTEMATSKI PREGLED — radni nalog poslodavca.\n\n" +
                "Pacijentkinja 30 god. Bez tegoba. Negira hronične bolesti.\n" +
                "RTG pluca: uredan nalaz. Spirometrija: FVC 102% pred., FEV1 98% pred. — normalno.\n" +
                "EKG: Sinusni ritam, uredan nalaz. TA 110/70 mmHg.\n\n" +
                "ZAKLJUCAK: Radno sposobna. Bez kontraindikacija.");
            medDoc(medDocRepo, milica, doctor, "Lab nalaz — prehlada 2022", "NALAZ_LAB",
                LocalDate.of(2022, 1, 18), false,
                "LABORATORIJSKI NALAZ:\nLeukociti: 11.2 x10^9/L (blago povišeni)\n" +
                "CRP: 32 mg/L (blago povišen)\nSedimentacija: 28 mm/h\n\n" +
                "Nalaz u kontekstu akutne virusne respiratorne infekcije — prehlada.\n\n" +
                "ZAKLJUCAK: Virusna infekcija gornjeg disajnog trakta. Simptomatska terapija.");
            medDoc(medDocRepo, milica, doctor, "RTG pluca — kontrolni 2024", "NALAZ_RTG",
                LocalDate.of(2024, 9, 5), false,
                "RTG PLUCA PA:\nPluca bez infiltrativnih promena. Hilusi uredne velicine i oblika.\n" +
                "Dijafragme na uobicajenom nivou. Sinusi slobodni.\n" +
                "Srce normalne velicine (CTR 0.45).\n\n" +
                "ZAKLJUCAK: Uredan RTG nalaz pluca.");

            // Nikola Markovic — KOPB (dugogodisnja istorija, od 2015)
            medDoc(medDocRepo, nikola, doctor, "Internisticki pregled — prva dijagnoza KOPB", "ANAMNEZA",
                LocalDate.of(2015, 4, 10), false,
                "GLAVNE TEGOBE:\nOtezano disanje, hronicni kasalj, pojacana produkcija sekreta\n\n" +
                "SADASNJA BOLEST:\nBolesnik godinama pusi (40 pak-godina). Pojacana dispneja u poslednjih 6 meseci, " +
                "ne moze vise da hoda brzo ni na ravnom terenu. Jutarnji kasalj sa sekretom godinama prisutan.\n\n" +
                "ANAMNEZA PO SISTEMIMA:\n" +
                "Respiratorni: Hronični kasalj — jutarnji, beli sekret. Dispneja stadijum II-III po mMRC.\n" +
                "KVS: Blaga tahikardija pri naporu.\n\n" +
                "LICNA ANAMNEZA:\nPusac 40 pak-godina (2 kutije dnevno od 20. god.). " +
                "Negira alergije. Zaposlen kao vozac kamiona.\n\n" +
                "ANAMNEZNI ZAKLJUCAK:\nRadi se o hroničnoj opstruktivnoj bolesti pluca (KOPB) — stadijum III.");

            medDoc(medDocRepo, nikola, doctor, "Spirometrija + hospitalizacija 2018", "NALAZ_LAB",
                LocalDate.of(2018, 11, 22), false,
                "SPIROMETRIJA:\nFVC: 2.45L (62% pred.) | FEV1: 1.32L (44% pred.) | FEV1/FVC: 0.54\n" +
                "Nalaz ukazuje na umerenu do tešku opstrukciju.\n\n" +
                "Bronhodilatatorni test: FEV1 porast za 8% — negativan (ireverzibilna opstrukcija)\n\n" +
                "Gasne analize: pH 7.40, PaO2 68 mmHg, PaCO2 48 mmHg, SaO2 92%\n\n" +
                "ZAKLJUCAK:\nKOPB stadijum III. Potvrdjena hronicna respiratorna insuficijencija I tipa.");

            medDoc(medDocRepo, nikola, doctor, "Hospitalizacija — egzacerbacija 2020", "ANAMNEZA",
                LocalDate.of(2020, 2, 8), false,
                "GLAVNE TEGOBE:\nJako otezano disanje, pojacan kasalj, promena karaktera sekreta (zuckazelen)\n\n" +
                "SADASNJA BOLEST:\nAkutno pogorsanje hronicne bolesti. Temperatura 38.1°C. " +
                "Egzacerbacija precipitirana respiratornom infekcijom.\n\n" +
                "LICNA ANAMNEZA:\nPusac jos uvek aktivno. Koristio bronhodilatatore.\n\n" +
                "ZAKLJUCAK:\nAkutna egzacerbacija KOPB-a precipitirana bakterijskom infekcijom. 3. hospitalizacija.");

            medDoc(medDocRepo, nikola, doctor, "Spirometrija — pogoršanje 2022", "NALAZ_LAB",
                LocalDate.of(2022, 9, 14), false,
                "SPIROMETRIJA:\nFVC: 2.10L (53% pred.) | FEV1: 0.98L (33% pred.) | FEV1/FVC: 0.47\n\n" +
                "Pad FEV1 od poslednjeg merenja pre 4 godine: -34%\n\n" +
                "Gasne analize: pH 7.38, PaO2 62 mmHg, PaCO2 52 mmHg\n" +
                "Ehokardiogram: blaga dilatacija desne komore — cor pulmonale incipijens\n\n" +
                "ZAKLJUCAK:\nKOPB stadijum IV (veoma teski). Uvesti dugotrajnu terapiju kiseonikom.");

            medDoc(medDocRepo, nikola, doctor, "Rtg pluca — pracenje KOPB 2016", "NALAZ_RTG",
                LocalDate.of(2016, 7, 14), false,
                "RTG PLUCA PA:\nEmfizematozne promene obostrano — hiperinflacija pluca. " +
                "Dijafragme spustene i spljoštene. Rebra horizontalizovana.\n" +
                "Povecana retrosternalna providnost. Hilusi naglašeni.\n\n" +
                "Bez svezih infiltrativnih promena.\n\n" +
                "ZAKLJUCAK: RTG nalaz odgovara uznapredovalom KOPB-u (emfizem). Pracenje obavezno.");
            medDoc(medDocRepo, nikola, doctor, "Lab i gasne analize — 2017", "NALAZ_LAB",
                LocalDate.of(2017, 4, 3), false,
                "GASNE ANALIZE ARTERIJSKE KRVI:\npH: 7.41 | PaO2: 65 mmHg | PaCO2: 50 mmHg | SaO2: 91%\n\n" +
                "KOMPLETNA KRVNA SLIKA:\nEr: 5.8 x10^12/L (policitemija) | Hgb: 178 g/L | Htc: 0.54\n" +
                "Leukociti: 8.1 x10^9/L\n\n" +
                "ZAKLJUCAK: Hronicna respiratorna insuficijencija. Sekundarna policitemija. Uvesti LTOT (dugotrajna O2 terapija).");
            medDoc(medDocRepo, nikola, doctor2, "Kontrolni pulmoloski pregled — 2019", "KONTROLNI_PREGLED",
                LocalDate.of(2019, 10, 20), false,
                "Bolesnik 57 god. Na LTOT 16h/dan. Redovno koristi bronhodilatatore.\n\n" +
                "Spirometrija: FEV1 1.15L (38% pred.) — stagnacija od 2018.\n" +
                "Gasne analize: PaO2 70 mmHg na 2L O2 — zadovoljavajuce.\n" +
                "Ehokardiogram: Stabilna blaga plucna hipertenzija.\n\n" +
                "ZAKLJUCAK: KOPB stadijum IV stabilan. Nastaviti LTOT i aktuelnu terapiju.");
            medDoc(medDocRepo, nikola, doctor, "Godisnja kontrola KOPB — 2024", "KONTROLNI_PREGLED",
                LocalDate.of(2024, 2, 28), false,
                "Bolesnik 62 god. Od 2023. ne pusi. LTOT redovni korisnik.\n\n" +
                "Spirometrija: FEV1 0.92L (31% pred.) — blagi pad.\n" +
                "6MWT: 210m (pad od 240m pre 2 god.) SaO2 min 86%.\n" +
                "HRCT: Stabilni emfizematozni balonasi, bez novih promena.\n\n" +
                "ZAKLJUCAK: Sporo napredovanje KOPB-a. Razmotriti pulmoloski rehab. program.");
            medDoc(medDocRepo, nikola, doctor, "Internisticki pregled — akutni prijem 2026", "ANAMNEZA",
                LocalDate.now().minusDays(6), true,
                "GLAVNE TEGOBE:\nOtezano disanje u miru, nesposoban da izgovori punu recenicu, kasalj\n\n" +
                "SADASNJA BOLEST:\nAkutno pogorsanje KOPB-a — 6. hospitalizacija. Temperatura 38.1°C. " +
                "Precipitujuci faktor verovatno infekcija. FEV1 pri spirometriji na prijemu: 38% pred. vrednosti.\n\n" +
                "LICNA ANAMNEZA:\nNegira pusenje od 2023. godine. Koristi bronhodilatatore i inhalirane kortikosteroide.\n\n" +
                "ZAKLJUCAK:\nAkutna egzacerbacija KOPB-a teskog stepena. Ukljuciti NIV terapiju.");

            // Dragana Ilic — ranija istorija
            medDoc(medDocRepo, dragana, doctor2, "Sistematski pregled — 2011", "KONTROLNI_PREGLED",
                LocalDate.of(2011, 5, 22), false,
                "Bolesnica 36 god. Bez tegoba. Zdrava.\n" +
                "RTG pluca: uredan. Spirometrija: normalna. TA 120/75 mmHg.\n\n" +
                "ZAKLJUCAK: Radno sposobna. Bez patologije.");
            medDoc(medDocRepo, dragana, doctor2, "Akutni bronhitis — 2016", "ANAMNEZA",
                LocalDate.of(2016, 12, 3), false,
                "TEGOBE: Kasalj, blaga dispneja, subfebrilnost 10 dana.\n\n" +
                "Auskultacija: Produzeni ekspirij, blagi suvi hropci.\n" +
                "RTG pluca: Pojacana hilarna sena, bez infiltrata.\n" +
                "Lab: CRP 48 mg/L, leukociti 12.4 x10^9.\n\n" +
                "ZAKLJUCAK: Akutni bronhitis. Terapija: amoksicilin, mukolit.");
            medDoc(medDocRepo, dragana, doctor2, "Lab kontrola — 2020", "NALAZ_LAB",
                LocalDate.of(2020, 8, 17), false,
                "LABORATORIJSKI NALAZ — rutinska kontrola:\n" +
                "KKS: Leukociti 6.8, Er 4.6, Hgb 132 g/L — uredni.\n" +
                "Biohemija: Glikemija 5.1 mmol/L, kreatinin 72 umol/L — uredni.\n" +
                "CRP: <5 mg/L. Sedimentacija: 12 mm/h.\n\n" +
                "ZAKLJUCAK: Uredni laboratorijski parametri.");
            medDoc(medDocRepo, dragana, doctor2, "RTG pluca i spirometrija — 2023", "NALAZ_RTG",
                LocalDate.of(2023, 3, 9), false,
                "RTG PLUCA PA:\nPluca bez infiltrativnih promena. Hilusi uredni.\n" +
                "Dijafragme pravilnog oblika, sinusi slobodni.\n\n" +
                "SPIROMETRIJA:\nFVC: 3.12L (95% pred.) | FEV1: 2.68L (92% pred.) — normalna plucna funkcija.\n\n" +
                "ZAKLJUCAK: Uredan nalaz. Bez plucne bolesti.");

            // Dragana Ilic — pleuritis (2026)
            medDoc(medDocRepo, dragana, doctor2, "Internisticki pregled — prijem", "ANAMNEZA",
                LocalDate.now().minusDays(12), true,
                "GLAVNE TEGOBE:\nBol desno u grudima pri disanju, otezano duboko disanje, blaga temperatura\n\n" +
                "SADASNJA BOLEST:\nBolesnica navodi da su tegobe pocele pre 10 dana postepenim razvojem bola " +
                "u desnoj strani grudnog kosa, pojacavanog pri dubokom udahu i kasljanju.\n\n" +
                "ANAMNEZA PO SISTEMIMA:\n" +
                "Respiratorni: Blagi kasalj bez sekreta. Dispneja pri vecem naporu.\n" +
                "KVS: Negira tegobe.\n\n" +
                "LICNA ANAMNEZA:\nNepusac. Negira alergije. Lekovi: ranitidine za tegobe sa zelucem.\n\n" +
                "PORODICNA ANAMNEZA:\nMajka lecena od tuberkuloze 1998. (negativni kontakti verifikovani)\n\n" +
                "ANAMNEZNI ZAKLJUCAK:\nRadi se o pleuralnom bolu — suma za pleuritis ili pleuralni izliv.");

            medDoc(medDocRepo, dragana, doctor2, "Ultrazvuk pluca — dijagnosticki", "NALAZ_RTG",
                LocalDate.now().minusDays(11), true,
                "ULTRAZVUK PLUCA:\nDesno: pleuralni izliv visine 8cm — procena kolicine ~900ml. Ehotip: anehogen.\n" +
                "Levo: bez izliva.\n" +
                "Pluca: bazalnog desno atelektaza pritisne etiologije.\n\n" +
                "ZAKLJUCAK:\nZnacajan desnostrani pleuralni izliv — indikovana torakocenteza.");

            medDoc(medDocRepo, dragana, doctor2, "Izvestaj o torakocentezi", "IZVESTAJ",
                LocalDate.now().minusDays(9), true,
                "PROCEDURA: Dijagnosticko-terapijska torakocenteza pod ultrazvucnom kontrolom\n\n" +
                "Evakuisano: 800ml seroznog eksudata. Boja: zuticasto, bistro.\n\n" +
                "ANALIZA TEČNOSTI:\nProteini: 45g/L (eksudat po Light-ovim kriterijumima)\n" +
                "LDH: 380 U/L | Glukoze: 5.2 mmol/L\n" +
                "Citoloski: Limfocitna dominacija. Maligne celije nisu nadjene.\n" +
                "Bakterioloski: Sterilno. BK boja i kultura: negativno.\n\n" +
                "ZAKLJUCAK:\nParapneumonski eksudat bez znakova malignitet ili tuberkuloze.");

            // Zoran Filipovic — ranija istorija
            medDoc(medDocRepo, zoran, doctor3, "Internisticki pregled — hipertenzija 2010", "ANAMNEZA",
                LocalDate.of(2010, 6, 15), false,
                "TEGOBE: Povremeni glavobolji, osecaj pritiska u glavi.\n\n" +
                "TA merenje: 158/95 mmHg. Puls 78/min, ritmican.\n" +
                "EKG: Sinusni ritam, LVH (LV hipertrofija u nastajanju).\n\n" +
                "ZAKLJUCAK: Arterijska hipertenzija stadijum I. Uvesti antihipertenzivnu terapiju (amlodipin).");
            medDoc(medDocRepo, zoran, doctor3, "Lab kardiolog — 2014", "NALAZ_LAB",
                LocalDate.of(2014, 9, 22), false,
                "LABORATORIJSKI NALAZ:\nHolesterol ukupni: 6.2 mmol/L | LDL: 4.1 mmol/L | HDL: 1.0 mmol/L\n" +
                "Trigliceridi: 2.8 mmol/L | Glikemija naste: 6.1 mmol/L (granicna)\n" +
                "Kreatinin: 89 umol/L | GFR: 78 mL/min\n\n" +
                "ZAKLJUCAK: Dislipidemija. Granicna glikemija (predijabetes). Uvesti statin.");
            medDoc(medDocRepo, zoran, doctor3, "Ehokardiogram — 2018", "IZVESTAJ",
                LocalDate.of(2018, 3, 30), false,
                "EHOKARDIOGRAM:\nLeva komora: dijastolna disfunkcija grade I. EF 58%.\n" +
                "Desna komora: normalne velicine i funkcije.\n" +
                "Zalistci: blaga tricuspidalna insuficijencija.\n" +
                "Pericard: bez izliva.\n\n" +
                "ZAKLJUCAK: Hipertenzivna srčana bolest sa ocuvanom EF. Nastaviti terapiju.");
            medDoc(medDocRepo, zoran, doctor3, "Kontrolni internisticki — 2022", "KONTROLNI_PREGLED",
                LocalDate.of(2022, 11, 8), false,
                "Bolesnik 64 god. Na antihipertenzivnoj terapiji i statinu. TA kontrolisana (130/82 mmHg).\n\n" +
                "RTG pluca: bez promena. EKG: LVH — stacionarno.\n" +
                "Lab: LDL 2.4 mmol/L (ciljna vrednost postignuta). HbA1c 6.1%.\n\n" +
                "ZAKLJUCAK: Kardiometabolicki faktori rizika pod kontrolom. Nastaviti terapiju.");

            // Zoran Filipovic — plucna embolija (2026)
            medDoc(medDocRepo, zoran, doctor3, "Internisticki pregled — hitni prijem", "ANAMNEZA",
                LocalDate.now().minusDays(5), true,
                "GLAVNE TEGOBE:\nIznenadni bol u grudima, otezano disanje, ubrzan rad srca\n\n" +
                "SADASNJA BOLEST:\nBolesnik naglo pre 6h poceo da oseca jak bol u grudima i otezano " +
                "disanje bez prethodnih prodromalnih simptoma. Letelom putovao pre 10 dana (8h let).\n\n" +
                "ANAMNEZA PO SISTEMIMA:\n" +
                "KVS: Tahikardija, osecaj lupanja srca, bol iza grudne kosti.\n" +
                "Respiratorni: Dispneja u miru, hemoptoe (mali tragovi krvi u iskasljaju).\n" +
                "Urinarni: Bol i otok desne potkolenice 3 dana (DVT!).\n\n" +
                "LICNA ANAMNEZA:\nNepusac. Leci se od hipertenzije (Amlodipin 5mg). Negira maligne bolesti.\n\n" +
                "PORODICNA ANAMNEZA:\nBrat operisan zbog tromboze dubokih vena.\n\n" +
                "ANAMNEZNI ZAKLJUCAK:\nKlinicka suma za akutnu plucnu emboliju — WELLS score 7 (visok rizik).");

            medDoc(medDocRepo, zoran, doctor3, "CT angiografija pluca", "NALAZ_RTG",
                LocalDate.now().minusDays(5), true,
                "MSCT ANGIOGRAFIJA PLUCA:\nFiling defekti u desnoj plucnoj arteriji i njenim segmentalnim granama.\n" +
                "Filling defekti u levoj donjoj segmentalnoj grani.\n" +
                "Desna komora dilatirani (RV/LV odnos 1.2) — znaci preopterecenja desnog srca.\n" +
                "Pleuralni izliv: mali desnostrani.\n\n" +
                "ZAKLJUCAK:\nBilateralna akutna plucna embolija — submisivna forma. " +
                "Hemodinamski stabilan pacijent. Terapijska antikoagulacija indikovana.");

            // Maja Nikolic — bronhijalna astma (od 2008), bogata istorija
            medDoc(medDocRepo, maja, doctor3, "Prva dijagnoza astme — 2008", "ANAMNEZA",
                LocalDate.of(2008, 9, 3), false,
                "GLAVNE TEGOBE:\nNapadi gusenja, zvizdanje u grudnom kosu, kasalj noci i jutro\n\n" +
                "SADASNJA BOLEST:\nDevojcica 15 god. sa recidivantnim napadima disajnih tegoba od 13. godine, " +
                "akcentovano u kontaktu sa mackom i tokom fizickog napora. Atopijski dermatitis u anamnezi.\n\n" +
                "LICNA ANAMNEZA:\nAlergija na maceji epitel i polene. Atopijski dermatitis od detinjstva.\n" +
                "Rodjaci imaju astmu (majka). Nepusac.\n\n" +
                "SPIROMETRIJA:\nFEV1 78% pred. | FEV1/FVC 0.74\n" +
                "Bronhodilat. test: FEV1 porast 18% — POZITIVAN (ireverzibilna op. isključena)\n\n" +
                "ZAKLJUCAK:\nBronhijalna astma — alergijska forma, blagi intermitentni oblik. Uvesti ICS.");

            medDoc(medDocRepo, maja, doctor3, "Alergoloski pregled — 2009", "IZVESTAJ",
                LocalDate.of(2009, 4, 14), false,
                "ALERGOLOSKI PREGLED — prick test:\n" +
                "Pozitivni reaktanti: macji epitel (+++), grinje prasine (++), polenima trava (+++).\n" +
                "Ukupni IgE: 485 IU/mL (izrazito povisen).\n" +
                "Specifični IgE (RAST): Fel d1 (macka) class 4, Der p1 (grinja) class 3.\n\n" +
                "ZAKLJUCAK: Alergijska bronhijalna astma — polisenzitizacija. Preporuciti eliminaciju alergena i imunoterapiju.");
            medDoc(medDocRepo, maja, doctor3, "Egzacerbacija — napad 2011", "ANAMNEZA",
                LocalDate.of(2011, 10, 5), false,
                "TEGOBE: Teski napad gusenja, satura 90%, nije reagovala na salbutamol kod kuce.\n\n" +
                "Precipitirajuci faktor: boravak kod prijatelja koji ima macku.\n" +
                "Lecena u urgentnoj amb: IV metilprednizolon, salbutamol nebulizacija.\n" +
                "Satura posle terapije: 97%.\n\n" +
                "ZAKLJUCAK: Akutni napad alergijske astme. Preporuciti striktnu eliminaciju macjeg epitela.");
            medDoc(medDocRepo, maja, doctor3, "Spirometrija — 2013", "NALAZ_LAB",
                LocalDate.of(2013, 2, 20), false,
                "SPIROMETRIJA (van napada):\nFVC: 3.45L (98% pred.) | FEV1: 2.89L (93% pred.) | FEV1/FVC: 0.84\n\n" +
                "Bronhodilatatorni test: FEV1 porast 9% — granicno pozitivan.\n" +
                "Peak expiratory flow: 92% predvidjene vrednosti.\n\n" +
                "ZAKLJUCAK: Astma pod dobrom kontrolom. Nastaviti aktuelnu terapiju.");
            medDoc(medDocRepo, maja, doctor3, "Spirometrija + IgE — 2017", "NALAZ_LAB",
                LocalDate.of(2017, 8, 11), false,
                "SPIROMETRIJA:\nFEV1: 88% pred. | FVC: 96% pred.\n\n" +
                "Ukupni IgE: 620 IU/mL — porast.\n" +
                "Eozinofilija u KKS: 0.68 x10^9/L (povišeni).\n\n" +
                "ZAKLJUCAK: Astma delimicno kontrolisana. Eozinofilna komponenta naglasena. Razmotriti biologicku terapiju.");
            medDoc(medDocRepo, maja, doctor3, "Godisnja kontrola astme — 2022", "KONTROLNI_PREGLED",
                LocalDate.of(2022, 5, 30), false,
                "Pacijentkinja 29 god. Bez epizoda hospitalizacije od 2020.\n\n" +
                "Peak flow dnevnik: stabilno 75-82% predvidjenih vrednosti.\n" +
                "Alergeni u kući: macka uklonjena iz spavace sobe. Otac prestao da pusi.\n" +
                "Spirometrija: FEV1 85% pred. — stabilno.\n\n" +
                "ZAKLJUCAK: Delimicno kontrolisana astma. Nastaviti biologicku terapiju (dupilumab razmotriti).");
            medDoc(medDocRepo, maja, doctor3, "Kontrolni pregled — 2015", "KONTROLNI_PREGLED",
                LocalDate.of(2015, 6, 18), false,
                "Pacijentkinja 22 god. Astma pod dobrom kontrolom na inhalacionoj terapiji.\n" +
                "Negira nocne simptome. Retki napadi (~1x/mesec).\n" +
                "Peak flow: 88% predvidjene vrednosti.\n" +
                "Spirometrija: FEV1 91% pred. — dobra kontrola bolesti.\n\n" +
                "PLAN:\nNastaviti terapiju. Proslediti alergolosku procenu za desenzitizaciju.");

            medDoc(medDocRepo, maja, doctor3, "Egzacerbacija 2020 — hospitaliz.", "ANAMNEZA",
                LocalDate.of(2020, 3, 15), false,
                "GLAVNE TEGOBE:\nTeski bronhospazam, nemogucnost govora, satura 88%\n\n" +
                "SADASNJA BOLEST:\nPacijentkinja 27 god. Teski napad bronhijalne astme precipitiran virusnom " +
                "respiratornom infekcijom. Nije reagovala na salbutamol kod kuce.\n\n" +
                "ZAKLJUCAK:\nAkutna egzacerbacija bronhijalne astme — teski stepene. Status asthmaticus.");

            medDoc(medDocRepo, maja, doctor3, "Internisticki pregled — status asthmaticus 2026", "ANAMNEZA",
                LocalDate.now().minusDays(4), true,
                "GLAVNE TEGOBE:\nTeski bronhospazam, nije mogla da izgovori celu recenicu, satura 86%\n\n" +
                "SADASNJA BOLEST:\nPacijentkinja 33 god. sa poznatom astmom od 2008. Teski napad u stanu — " +
                "pokretac verovatno maceji dlaka i pasivno pusenje (otac pusi). " +
                "Salbutamol kod kuce nije pomogao. Pozvana Hitna pomoc.\n\n" +
                "LICNA ANAMNEZA:\nAlergija na maceji epitel, grinje, polenima trava. Koristila Seretide i Singulair.\n\n" +
                "ZAKLJUCAK:\nStatus asthmaticus — najtezi oblik. Intenzivna terapija IV kortikosteroidi + nebulizacija.");

            // Stefan Lazovic — IPF (od 2019), dugogodisnja istorija
            medDoc(medDocRepo, stefanP, doctor2, "Profesionalna anamneza — ekspozicija 2008", "ANAMNEZA",
                LocalDate.of(2008, 11, 10), false,
                "TEGOBE: Periodicni kasalj, blaga zaduha pri vecim naporima.\n\n" +
                "Bolesnik 59 god. Radio kao zidar i u cementari 30 godina — ekspozicija silikatnoj prašini.\n" +
                "Spirometrija: FVC 88% pred. | FEV1 86% pred. — blaga restrikcija.\n" +
                "RTG pluca: Retikularni infiltrati baza bilateralno — blagi.\n\n" +
                "ZAKLJUCAK: Pocetne plucne promene. Monitoring obavezan. Odstraniti od izlaganja prašini.");
            medDoc(medDocRepo, stefanP, doctor2, "RTG i HRCT — 2013", "NALAZ_RTG",
                LocalDate.of(2013, 6, 25), false,
                "HRCT TORAKS:\nBilateralni subpleuralni retikulacioni infiltrati baza — blagi.\n" +
                "Pocetno formiranje trakcionih bronhiektazija bazalno.\n" +
                "Bez konsolidacija, bez cvorova.\n\n" +
                "RTG pluca: Pojacani bazalni intersticijalni crtez.\n\n" +
                "ZAKLJUCAK: Intersticijalni plucni sindrom u razvoju. Diferencijalna dijagnoza IPF vs. pneumokonioza. Biopsy razmotriti.");
            medDoc(medDocRepo, stefanP, doctor2, "Difuzioni kapacitet i spirometrija — 2016", "NALAZ_LAB",
                LocalDate.of(2016, 2, 17), false,
                "SPIROMETRIJA:\nFVC: 2.85L (78% pred.) | FEV1: 2.44L (79% pred.) | FEV1/FVC: 0.86 (neopstruktivni tip)\n\n" +
                "DIFUZIONI KAPACITET (DLCO): 68% pred. — znacajno snizen.\n\n" +
                "6MWT: 380m, SaO2 min 91% — granicna desaturacija.\n\n" +
                "ZAKLJUCAK: Progresivna restriktivna plucna bolest sa snizenjem DLCO. Multidisciplinarni tim potreban.");
            medDoc(medDocRepo, stefanP, doctor2, "Multidisciplinarni zakljucak — 2020", "IZVESTAJ",
                LocalDate.of(2020, 9, 3), false,
                "MULTIDISCIPLINARNI SASTANAK — pulmolog, radiolog, patolog:\n\n" +
                "UIP pattern potvrdjen na HRCT iz 2019.\n" +
                "Bronhoalveolarna lavaza: limfociti 12%, bez atipicnih celija.\n" +
                "Biopsy nije radjena (visok operativni rizik za pacijenta 71 god.).\n\n" +
                "ZAKLJUCAK: IPF — pouzdana dijagnoza po ATS/ERS kriterijumima. Nintedanib 2 god. — povoljan odgovor.");
            medDoc(medDocRepo, stefanP, doctor2, "Plucna rehabilitacija — 2022", "KONTROLNI_PREGLED",
                LocalDate.of(2022, 7, 14), false,
                "Bolesnik 73 god. Zavrsio 8-nedjeljni program plucne rehabilitacije.\n\n" +
                "Pre rehabilitacije: 6MWT 280m, MRC zaduha 3.\n" +
                "Posle rehabilitacije: 6MWT 320m (+40m), MRC zaduha 2 — statisticki znacajno poboljsanje.\n\n" +
                "ZAKLJUCAK: Rehabilitacija dala znacajan efekat. Preporuciti ponovni ciklus za 12 meseci.");
            medDoc(medDocRepo, stefanP, doctor2, "Godisnja kontrola — 2025", "KONTROLNI_PREGLED",
                LocalDate.of(2025, 1, 20), false,
                "Bolesnik 75 god. Na nintedanibu 6 god. Kiseonik pri naporu redovno.\n\n" +
                "HRCT: Blaga progresija bazalnog retikuluma — stacionarna u odnosu na 2023.\n" +
                "Spirometrija: FVC 56% pred. | DLCO 45% pred.\n" +
                "6MWT: 265m, SaO2 min 88%.\n\n" +
                "ZAKLJUCAK: Sporo napredovanje IPF-a. Razmotriti transplantacionu listu.");

            // Stefan Lazovic — IPF (od 2019)
            medDoc(medDocRepo, stefanP, doctor2, "Dijagnoza IPF — 2019", "ANAMNEZA",
                LocalDate.of(2019, 3, 15), false,
                "GLAVNE TEGOBE:\nProgresivna dispneja, suvi kasalj, zaduha pri hodu na ravnom\n\n" +
                "SADASNJA BOLEST:\nBolesnik 70 god. sa progresivnom dispnejom 2 godine, suvi kasalj, " +
                "postepeno pogorsanje. Prethodno zdrav.\n\n" +
                "FIZIKALNI NALAZ:\nFine velcro krepitacije baza pluca obostrano.\n" +
                "Hipoksija na naporu: SaO2 88% pri 6MWT.\n\n" +
                "HRCT TORAKS:\nBilateralni subpleuralni retikulacioni infiltrati, sacastopljucni bronhiektazije " +
                "trakcione, bazalno. UIP pattern — karakteristican za IPF.\n\n" +
                "SPIROMETRIJA: FVC 72% pred. DLCO 58% pred.\n\n" +
                "ZAKLJUCAK:\nIdiopatska plucna fibroza (IPF) — potvrdjena UIP pattern na HRCT. Uvesti nintedanib.");

            medDoc(medDocRepo, stefanP, doctor2, "Godisnja kontrola IPF — 2021", "KONTROLNI_PREGLED",
                LocalDate.of(2021, 4, 8), false,
                "Bolesnik 72 god. Na nintedanibu 2 godine. Tolerancija leka prihvatljiva (GI tegobe blage).\n\n" +
                "SPIROMETRIJA: FVC 65% pred. (pad od 7% za 2 god. — blagi pad, povoljan odgovor na terapiju)\n" +
                "DLCO: 51% pred.\n" +
                "HRCT: Stabilna fibroza u odnosu na prethodni snimak iz 2020.\n\n" +
                "ZAKLJUCAK:\nIPF stabilan. Nastaviti nintedanib. Preporuciti pulmolosku rehabilitaciju.");

            medDoc(medDocRepo, stefanP, doctor2, "Godisnja kontrola IPF — 2023", "KONTROLNI_PREGLED",
                LocalDate.of(2023, 5, 22), false,
                "Bolesnik 74 god. Dispneja pojacanog intenziteta — ne moze da hoda ubrzano ni na ravnom.\n\n" +
                "SPIROMETRIJA: FVC 58% pred. | DLCO 48% pred.\n" +
                "6MWT: 280m (pad od 320m pre 2 god.). SaO2 min 87% pri naporu.\n" +
                "HRCT: Blaga progresija fibroze bazalno obostrano.\n\n" +
                "ZAKLJUCAK:\nSporo napredovanje IPF-a. Uvesti kiseonik pri naporu. Nastaviti terapiju.");

            medDoc(medDocRepo, stefanP, doctor2, "Kontrolni pregled — 2026", "KONTROLNI_PREGLED",
                LocalDate.now().minusDays(3), true,
                "Bolesnik 76 god. Stabilno stanje. Kiseonik pri naporu koristi redovno.\n\n" +
                "HRCT (aktuelni): Stabilna fibroza bez znakova akutne egzacerbacije.\n" +
                "SPIROMETRIJA: FVC 55% pred. — marginalni pad.\n" +
                "Pulsni oksimetar: pacijent redovno koristi, biljezi vrednosti.\n\n" +
                "ZAKLJUCAK:\nIPF bez znacajnog napredovanja u poslednjoj godini. Nastaviti nintedanib i kiseonik pri naporu.");

            // ─── Healthcare Institution ───────────────────────────────────────────
            User institution = save(userRepo, "hospital@careafter.local",
                    new User(null, "KBC Bezanijska Kosa", "Zdravstvena Ustanova", "hospital@careafter.local",
                            enc.encode("hospital123"), Role.HEALTH_INSTITUTION, true));

            instInstDoc(instDocRepo, institution, doctor,  LocalDateTime.now().minusDays(30));
            instInstDoc(instDocRepo, institution, doctor2, LocalDateTime.now().minusDays(28));
            instInstDoc(instDocRepo, institution, doctor3, LocalDateTime.now().minusDays(25));

            // ─── Doctor Ratings (demo) ────────────────────────────────────────────
            seedRating(ratingRepo, milicaU, doctor,  5, "Odlican lekar, veoma pazljiv i profesionalan.",    LocalDateTime.now().minusDays(3));
            seedRating(ratingRepo, nikolaU, doctor,  4, "Dobro objasnjava sve, strpljiv i pristupacan.",    LocalDateTime.now().minusDays(5));
            seedRating(ratingRepo, majaU,   doctor,  5, "Izvrsno, brzo reagovao na krizu! Hvala.",         LocalDateTime.now().minusDays(2));
            seedRating(ratingRepo, zoranU,  doctor3, 5, "Spasilac zivota, pravi profesionalac!",           LocalDateTime.now().minusDays(4));
            seedRating(ratingRepo, draganaU,doctor2, 4, "Lepa komunikacija, jasna i detaljno objasnjava.", LocalDateTime.now().minusDays(6));
            seedRating(ratingRepo, stefanP.getUser(), doctor2, 5, "Puna podrska i razumevanje za moj slucaj.", LocalDateTime.now().minusDays(8));

            // Daily medication reminders on first startup
            reminderScheduler.sendRemindersNow();
        };
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private void medDoc(MedicalDocumentRepository r, Patient patient, User author,
            String title, String type, java.time.LocalDate date,
            boolean currentIllness, String content) {
        MedicalDocument d = new MedicalDocument();
        d.setPatient(patient); d.setAuthor(author);
        d.setTitle(title); d.setDocumentType(type);
        d.setDocumentDate(date); d.setRelatedToCurrentIllness(currentIllness);
        d.setContent(content); d.setUploadedAt(java.time.LocalDateTime.now());
        r.save(d);
    }

    private User save(UserRepository r, String email, User t) {
        User u = r.findByEmail(email).orElse(null);
        if (u == null) return r.save(t);
        u.setPasswordHash(t.getPasswordHash());
        u.setFirstName(t.getFirstName()); u.setLastName(t.getLastName()); u.setActive(true);
        return r.save(u);
    }

    private DoctorPatientRequest approvedRequest(DoctorPatientRequestRepository r,
            User doctor, Patient patient, LocalDateTime at) {
        return r.findByDoctorAndPatient(doctor, patient).orElseGet(() -> {
            DoctorPatientRequest req = new DoctorPatientRequest();
            req.setDoctor(doctor); req.setPatient(patient);
            req.setStatus(RequestStatus.APPROVED);
            req.setRequestedAt(at); req.setRespondedAt(at.plusMinutes(30));
            return r.save(req);
        });
    }

    private void pendingRequest(DoctorPatientRequestRepository r,
            User doctor, Patient patient, LocalDateTime at) {
        r.findByDoctorAndPatient(doctor, patient).orElseGet(() -> {
            DoctorPatientRequest req = new DoctorPatientRequest();
            req.setDoctor(doctor); req.setPatient(patient);
            req.setStatus(RequestStatus.PENDING); req.setRequestedAt(at);
            return r.save(req);
        });
    }

    private Conversation createConversation(ConversationRepository r,
            Patient patient, String title, List<User> participants, LocalDateTime at) {
        // Use last participant (doctor) for uniqueness so each doctor-patient pair gets a distinct conversation
        User uniqueUser = participants.get(participants.size() - 1);
        return r.findByPatientAndParticipant(patient, uniqueUser)
            .orElseGet(() -> {
                Conversation c = new Conversation();
                c.setPatient(patient); c.setTitle(title);
                c.setParticipants(new java.util.ArrayList<>(participants));
                c.setCreatedAt(at); c.setLastMessageAt(at);
                return r.save(c);
            });
    }

    private void addMsg(ChatMessageRepository msgRepo, ConversationRepository convRepo,
            Conversation conv, User sender, String content, LocalDateTime at, boolean read) {
        ChatMessage m = new ChatMessage();
        m.setConversation(conv); m.setSender(sender);
        m.setContent(content); m.setSentAt(at); m.setRead(read);
        msgRepo.save(m);
        conv.setLastMessageAt(at);
        convRepo.save(conv);
    }

    private SymptomCheckin checkin(SymptomCheckinRepository r, Patient p,
            double temp, int pain, boolean nausea, boolean bleeding,
            boolean breathing, boolean wound, boolean worsening,
            String comment, RiskLevel risk, LocalDateTime at) {
        SymptomCheckin c = new SymptomCheckin();
        c.setPatient(p); c.setTemperature(temp); c.setPainLevel(pain);
        c.setNausea(nausea); c.setBleeding(bleeding); c.setBreathingProblem(breathing);
        c.setWoundRedness(wound); c.setGeneralWorsening(worsening);
        c.setComment(comment); c.setRiskLevel(risk); c.setCreatedAt(at);
        return r.save(c);
    }

    private void alert(AlertRepository r, Patient patient, SymptomCheckin checkin,
            String message, AlertStatus status, LocalDateTime at) {
        Alert a = new Alert();
        a.setPatient(patient); a.setSymptomCheckin(checkin);
        a.setAlertType("SYMPTOM_RISK"); a.setMessage(message);
        a.setStatus(status); a.setCreatedAt(at);
        if (status == AlertStatus.RESOLVED) a.setResolvedAt(at.plusHours(1));
        r.save(a);
    }

    private Medication med(String name, String dosage, String freq,
            LocalDate start, LocalDate end, String instr) {
        Medication m = new Medication();
        m.setMedicationName(name); m.setDosage(dosage); m.setFrequency(freq);
        m.setStartDate(start); m.setEndDate(end); m.setInstructions(instr);
        return m;
    }

    private DischargePlan plan(DischargePlanRepository r, Patient p, User doc,
            LocalDate discharge, String diag, String recovery, String warnings, PlanStatus status) {
        DischargePlan dp = new DischargePlan();
        dp.setPatient(p); dp.setDoctor(doc); dp.setDischargeDate(discharge);
        dp.setDiagnosisSummary(diag); dp.setRecoveryInstructions(recovery);
        dp.setWarningSigns(warnings); dp.setStatus(status);
        return r.save(dp);
    }

    private void seedMedLogs(MedicationLogRepository logRepo, Patient patient,
            DischargePlan plan, double baseAdherence) {
        if (plan == null || plan.getMedications() == null || plan.getMedications().isEmpty()) return;
        java.util.Random rand = new java.util.Random(patient.getId() * 37L + 7L);
        LocalDate today = LocalDate.now();
        for (int daysAgo = 29; daysAgo >= 0; daysAgo--) {
            LocalDate date = today.minusDays(daysAgo);
            // Weekends slightly worse adherence
            double dayFactor   = date.getDayOfWeek().getValue() >= 6 ? 0.82 : 1.0;
            // Older days slightly worse (trend of improvement)
            double trendFactor = daysAgo > 14 ? 0.88 : 1.0;
            double rate = Math.min(1.0, baseAdherence * dayFactor * trendFactor);
            for (Medication med : plan.getMedications()) {
                if (logRepo.findByPatientAndMedicationAndScheduledDate(patient, med, date).isPresent()) continue;
                if (rand.nextDouble() < rate) {
                    MedicationLog log = new MedicationLog();
                    log.setPatient(patient);
                    log.setMedication(med);
                    log.setScheduledDate(date);
                    log.setTaken(true);
                    log.setTakenAt(date.atTime(7 + rand.nextInt(16), rand.nextInt(60)));
                    logRepo.save(log);
                }
            }
        }
    }

    private void meds(MedicationRepository r, DischargePlan plan, Medication... meds) {
        for (Medication m : meds) { m.setDischargePlan(plan); r.save(m); }
        plan.setMedications(java.util.Arrays.asList(meds));
    }

    private void appt(AppointmentRepository r, Patient p, DischargePlan plan,
            LocalDateTime date, String type, String loc, String note) {
        Appointment a = new Appointment();
        a.setPatient(p); a.setDischargePlan(plan); a.setAppointmentDate(date);
        a.setAppointmentType(type); a.setLocation(loc); a.setNote(note);
        r.save(a);
    }

    private void notif(NotificationRepository r, User recipient, Patient patient,
            String title, String message, String type, boolean read, LocalDateTime at) {
        Notification n = new Notification();
        n.setRecipient(recipient); n.setPatient(patient);
        n.setTitle(title); n.setMessage(message);
        n.setType(type); n.setIsRead(read); n.setCreatedAt(at);
        r.save(n);
    }

    private void familyConn(FamilyConnectionRepository r, Patient p, User member, String rel) {
        FamilyConnection f = new FamilyConnection();
        f.setPatient(p); f.setFamilyMember(member); f.setRelation(rel);
        f.setConsentGiven(true); f.setCreatedAt(LocalDateTime.now().minusDays(7));
        r.save(f);
    }

    private void instInstDoc(InstitutionDoctorRequestRepository r, User institution, User doctor, LocalDateTime at) {
        r.findByInstitutionAndDoctor(institution, doctor).orElseGet(() -> {
            InstitutionDoctorRequest req = new InstitutionDoctorRequest();
            req.setInstitution(institution); req.setDoctor(doctor);
            req.setStatus("APPROVED");
            req.setRequestedAt(at); req.setRespondedAt(at.plusMinutes(30));
            return r.save(req);
        });
    }

    private void seedRating(DoctorRatingRepository r, User patient, User doctor,
            int stars, String comment, LocalDateTime at) {
        r.findByPatientAndDoctor(patient, doctor).orElseGet(() -> {
            DoctorRating rating = new DoctorRating();
            rating.setPatient(patient); rating.setDoctor(doctor);
            rating.setStars(stars); rating.setComment(comment);
            rating.setCreatedAt(at);
            return r.save(rating);
        });
    }

    private void audit(AuditLogRepository r, User user, String action, String entity,
            Long entityId, LocalDateTime at) {
        AuditLog l = new AuditLog();
        l.setUser(user); l.setAction(action); l.setEntityType(entity);
        l.setEntityId(entityId); l.setCreatedAt(at);
        r.save(l);
    }

    /** Today Milica takes only 2 of 5 meds (Amoksicilin + Azitromicin); 3 remain not taken. */
    private void overrideMilicaToday(MedicationLogRepository logRepo, Patient patient, DischargePlan plan) {
        if (plan == null || plan.getMedications() == null || plan.getMedications().isEmpty()) return;
        LocalDate today = LocalDate.now();
        // Remove whatever the random seed may have created for today
        java.util.List<MedicationLog> existing = logRepo.findByPatientAndScheduledDate(patient, today);
        logRepo.deleteAll(existing);
        // Mark only the first 2 meds as taken (morning dose: Amoksicilin at 08:00, Azitromicin at 08:30)
        java.util.List<Medication> meds = plan.getMedications();
        for (int i = 0; i < Math.min(2, meds.size()); i++) {
            MedicationLog log = new MedicationLog();
            log.setPatient(patient);
            log.setMedication(meds.get(i));
            log.setScheduledDate(today);
            log.setTaken(true);
            log.setTakenAt(today.atTime(8, i * 30));
            logRepo.save(log);
        }
    }
}
