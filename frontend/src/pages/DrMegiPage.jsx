import { useState, useRef } from 'react';
import Sidebar from '../components/Sidebar';

const BOT_NAME  = 'Dr. Megi';
const BOT_AVATAR = '👩‍⚕️';

const QUICK_REPLIES = {
  DOCTOR: [
    'Kako da vidim pacijente?',
    'Kako da vidim upozorenja?',
    'Kako radi chat?',
    'Gde vidim adherence terapiji?',
  ],
  PATIENT: [
    'Kad da pozovem lekara hitno?',
    'Sta je SpO₂ i zasto je vazna?',
    'Kako da pratim svoju terapiju?',
    'Gde vidim svoju terapiju?',
  ],
  FAMILY_MEMBER: [
    'Kako da vidim stanje?',
    'Kad da pozovem lekara?',
    'Sta znaci alarm?',
    'Gde su obavestenja?',
  ],
};
QUICK_REPLIES.FAMILY = QUICK_REPLIES.FAMILY_MEMBER;

const KB = [
  { role: 'DOCTOR', patterns: ['tabla', 'dashboard', 'pocetna', 'gde'],
    answer: '🏠 **Tabla lekara** (`/dashboard`) je vaša glavna stranica.\n\nTu se prikazuju:\n• Ukupan broj praćenih pacijenata\n• Nepročitana obaveštenja i alarmi\n• Predstojeći pregledi\n• Chronološki lista svih notifikacija' },
  { role: 'DOCTOR', patterns: ['pacijent', 'lista', 'pregled', 'profil', 'karton'],
    answer: '👥 **Pacijenti** (`/patients`) — lista svih praćenih pacijenata.\n\nKliknite na kartu pacijenta da otvorite profil.\n\nU profilu vidite:\n• Vitalni znaci i trendovi\n• Dekurzus (dnevne prijave)\n• Medicinska istorija i dokumenti\n• Plan oporavka i adherence terapiji\n• Zakazani pregledi' },
  { role: 'DOCTOR', patterns: ['notif', 'obavestenj', 'upozoren', 'alarm', 'zvonce'],
    answer: '🔔 **Obavestenja** (`/notifications`) — sve notifikacije.\n\nTip notifikacija:\n• 🚨 **ALARM** — kritičan dekurzus pacijenta\n• ⚠️ **Upozorenje** — povišene vrednosti\n• 📋 **Info** — normalan dekurzus\n• 💬 **Hitna poruka** — pacijent označio poruku sa !\n\nKliknite "Procitano" da označite kao pročitano.' },
  { role: 'DOCTOR', patterns: ['zahtev', 'pracenj', 'follow', 'novi pacijent', 'dodaj'],
    answer: '📋 **Zahtevi** (`/doctor-requests`) — pacijenti koji žele da ih pratite.\n\nKliknite **Prihvati** da počnete praćenje. Automatski se kreira razgovor u chatu.' },
  { role: 'DOCTOR', patterns: ['chat', 'poruk', 'razgovor', 'pisi'],
    answer: '💬 **Poruke** (`/chat`) — direktna komunikacija sa pacijentima.\n\nSvaki pacijent kojeg pratite ima poseban razgovor.\nMožete kreirati i **grupni chat** sa više pacijenata pritiskom na "+ Grupni chat".\n\nAko pacijent pošalje hitnu poruku (!) — stiže vam alarmno obaveštenje.' },
  { role: 'DOCTOR', patterns: ['adherenc', 'terapij', 'lek', 'pije'],
    answer: '💊 **Adherence terapiji** vidite u profilu pacijenta → tab **"💊 Adherence"**.\n\nPrikazuje se 30-dnevni kalendar uzimanja lekova i procenat adherence.\nPacijent sam čekira lekove u sekciji "Plan oporavka → Danas".' },
  { role: 'DOCTOR', patterns: ['dokument', 'medicinsk', 'upload', 'fajl', 'nalaz'],
    answer: '📄 **Medicinska istorija** vidljiva je u profilu pacijenta → tab **"Medicinska istorija"**.\n\nSvi dokumenti su na vremenskoj osi. Zelene markice = upload pacijenta.\nKliknite na markicu za detalje ili listu ispod ose.' },
  { role: 'DOCTOR', patterns: ['zakazi', 'pregled', 'termin', 'appoint'],
    answer: '📅 **Pregledi** vidljivi su u profilu pacijenta → tab **"Pregledi"**.\n\nKada je pregled danas — kartica je istaknuta u crvenoj boji.' },
  { role: 'PATIENT', patterns: ['terapij', 'lek', 'popio', 'uzeo', 'plan'],
    answer: '💊 Terapiju možete pratiti na stranici **Plan oporavka** (`/plan`).\n\nTamo vidite listu vaših lekova za danas sa opcijom da čekirate koji ste uzeli.\n\nRedovnost uzimanja lekova lekar može pratiti — budite redovni!' },
  { role: 'PATIENT', patterns: ['prijavim', 'prijava', 'simptom', 'checkin', 'dekurzus'],
    answer: '📋 Da prijavite dnevni dekurzus:\n1. Idite na **Prijava simptoma** u meniju\n2. Unesite SpO₂, temperaturu, brzinu disanja\n3. Označite kako se osećate (1–5)\n4. Ako imate kasalj — označite i odaberite tip\n5. Kliknite **"Pošalji dnevni dekurzus"**' },
  { role: 'PATIENT', patterns: ['lekar', 'hitno', 'pozovem', 'kontakt', 'bolnica'],
    answer: '🚨 **Odmah pozovite lekara ili hitnu (194):**\n• SpO₂ ispod 90%\n• Krv u iskašljaju\n• Otežano disanje u miru\n• Temperatura > 39°C\n• Gubitak svesti\n\nZa blaže simptome: pišite lekaru u chatu ili označite poruku sa ! dugmetom.' },
  { role: 'PATIENT', patterns: ['spo2', 'saturacij', 'kiseonik', 'oksimetar'],
    answer: '🫁 **SpO₂** meri zasićenost hemoglobina kiseonikom.\n\n✅ **Normalno:** 95–100%\n⚠️ **Nisko:** 92–95% — pratite\n🔴 **Kritično:** < 92% — odmah lekaru!\n\nMerite pulsnim oksimetrom u mirovanju, na toplom prstu.' },
  { role: 'PATIENT', patterns: ['osecanj', 'wellness', 'skala', 'kako se'],
    answer: '😊 U dnevnom dekurzusu pitate vas "Kako se osećate danas?" na skali 1–5:\n\n😩 1 – Veoma loše\n😞 2 – Loše\n😐 3 – Umjereno\n🙂 4 – Dobro\n😊 5 – Odlično\n\nOvo pomaže lekaru da prati trend vašeg opšteg stanja.' },
  { role: 'FAMILY', patterns: ['stanje', 'vidim', 'kako', 'pregled'],
    answer: '👨‍👩‍👧 Na stranici **Porodicni pregled** (`/family`) vidite:\n• Poslednju prijavu simptoma\n• Sledeci zakazani pregled\n• Plan oporavka i terapiju' },
  { role: 'FAMILY', patterns: ['hitno', 'alarm', 'pozovem'],
    answer: '📞 Ako je stanje zabrinjavajuće:\n• Kontaktirajte pacijenta odmah\n• Proverite da li je kontaktirao lekara\n• Hitna pomoć: **194**' },
  { role: null, patterns: ['hvala', 'ok', 'super', 'odlicno', 'jasno'],
    answer: '😊 Drago mi je da sam pomogla! Slobodno pitajte ako trebate još nešto.' },
  { role: null, patterns: ['zdravo', 'cao', 'hej', 'hi'],
    answer: `👋 Zdravo! Ja sam **${BOT_NAME}** 👩‍⚕️\n\nVaš digitalni asistent za plućnu patologiju. Pomažem vam da se snađete u aplikaciji i odgovorim na pitanja o SpO₂, terapiji i dekurzusu.\n\nPitajte slobodno!` },
];

function findAnswer(text, role) {
  const lc = text.toLowerCase();
  const hit = KB.find((k) =>
    (k.role === role || (k.role === 'FAMILY' && role === 'FAMILY_MEMBER') || k.role === null) &&
    k.patterns.some((p) => lc.includes(p))
  );
  return hit?.answer || `Nisam sigurna kako da odgovorim. 🤔\n\nPitajte me o:\n• SpO₂ i alarmnim vrednostima\n• Terapiji i uzimanju lekova\n• Dekurzusu i prijavi simptoma\n• Kada kontaktirati lekara`;
}

function renderMd(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br/>');
}

export default function DrMegiPage() {
  const role = localStorage.getItem('careafterRole') || 'PATIENT';
  const qr   = QUICK_REPLIES[role] || QUICK_REPLIES.PATIENT;

  const roleWelcome = {
    DOCTOR: `Zdravo! Ja sam **Dr. Megi** 👩‍⚕️, vaš asistent za navigaciju CareAfter platformom.\n\nMogu da vam pomognem da se snađete u:\n• Tabli i listama pacijenata\n• Pregledu notifikacija i alarma\n• Korišćenju chata i grupnih razgovora\n• Praćenju adherence terapiji\n\nPitajte slobodno kako koristiti aplikaciju!`,
    PATIENT: `Zdravo! Ja sam **Dr. Megi** 👩‍⚕️, vaš digitalni asistent.\n\nMogu da vam pomognem sa:\n• Razumevanjem SpO₂ i vitalnih vrednosti\n• Uputstvima za prijavu simptoma\n• Praćenjem terapije i lekova\n• Kada da kontaktirate lekara\n\nPostavljajte pitanja slobodno!`,
    FAMILY: `Zdravo! Ja sam **Dr. Megi** 👩‍⚕️.\n\nMogu da vam pomognem da pratite stanje vašeg pacijenta i snađete se u aplikaciji.\n\nPitajte slobodno!`,
  };
  const [msgs, setMsgs] = useState([{
    from: 'bot', id: 0,
    text: roleWelcome[role] || roleWelcome.PATIENT,
  }]);
  const [input,  setInput]  = useState('');
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  const scrollBottom = () => setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 80);

  const send = (text) => {
    if (!text.trim()) return;
    setMsgs((p) => [...p, { from: 'user', text: text.trim(), id: Date.now() }]);
    setInput('');
    setTyping(true);
    scrollBottom();
    setTimeout(() => {
      setMsgs((p) => [...p, { from: 'bot', text: findAnswer(text, role), id: Date.now() + 1 }]);
      setTyping(false);
      scrollBottom();
    }, 600 + Math.random() * 400);
  };

  return (
    <div className="layout">
      <Sidebar />
      <div className="main-area">
        <div className="page page-narrow" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 0px)', paddingBottom: 0 }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
            <div style={{
              width: 52, height: 52, borderRadius: '50%',
              background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0,
            }}>{BOT_AVATAR}</div>
            <div>
              <h1 className="page-title" style={{ margin: 0 }}>Dr. Megi</h1>
              <p className="page-sub" style={{ margin: 0 }}>Digitalni asistent za plućnu patologiju — uvek dostupan</p>
            </div>
            <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#10b981', fontWeight: 600 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
              Online
            </span>
          </div>

          {/* Chat area */}
          <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, marginBottom: 0 }}>
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {msgs.map((m) => (
                <div key={m.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexDirection: m.from === 'bot' ? 'row' : 'row-reverse' }}>
                  {m.from === 'bot' && (
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                      {BOT_AVATAR}
                    </div>
                  )}
                  <div style={{
                    maxWidth: '72%', padding: '10px 14px', borderRadius: m.from === 'bot' ? '4px 14px 14px 14px' : '14px 4px 14px 14px',
                    background: m.from === 'bot' ? 'var(--surface)' : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                    color: m.from === 'bot' ? 'var(--text)' : 'white',
                    fontSize: 14, lineHeight: 1.55, boxShadow: 'var(--shadow-xs)',
                    border: m.from === 'bot' ? '1px solid var(--border)' : 'none',
                  }}
                    dangerouslySetInnerHTML={{ __html: renderMd(m.text) }}
                  />
                </div>
              ))}
              {typing && (
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{BOT_AVATAR}</div>
                  <div style={{ padding: '10px 16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '4px 14px 14px 14px', display: 'flex', gap: 4 }}>
                    {[0,1,2].map((i) => (
                      <span key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: '#6366f1', display: 'inline-block', animation: `bounce .9s ${i * 0.15}s infinite` }} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Quick replies */}
            <div style={{ padding: '8px 16px', borderTop: '1px solid var(--border)', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {qr.map((q) => (
                <button key={q} onClick={() => send(q)}
                  style={{ padding: '5px 12px', borderRadius: 20, border: '1.5px solid var(--primary-light)', background: 'var(--primary-bg)', color: 'var(--primary)', fontSize: 12, fontWeight: 500, cursor: 'pointer', transition: 'all .12s' }}>
                  {q}
                </button>
              ))}
            </div>

            {/* Input */}
            <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10 }}>
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && send(input)}
                placeholder="Pitajte Dr. Megi nešto..."
                style={{ flex: 1, padding: '10px 14px', border: '1.5px solid var(--border)', borderRadius: 10, fontSize: 14, background: 'var(--surface)', color: 'var(--text)', outline: 'none' }}
              />
              <button onClick={() => send(input)} disabled={!input.trim()}
                style={{ padding: '10px 18px', borderRadius: 10, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', color: 'white', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>
                Pošalji
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
