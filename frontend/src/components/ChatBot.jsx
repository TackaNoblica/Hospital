import { useState, useEffect, useRef } from 'react';

const BOT_NAME  = 'Dr. Megi';
const BOT_AVATAR = '👩‍⚕️';

const QUICK_REPLIES = {
  DOCTOR: [
    'Kako da vidim upozorenja?',
    'Sta znaci crveni rizik kod SpO2?',
    'Kako da pregledam anamnezu?',
    'Kada hitno kontaktirati pacijenta?',
  ],
  PATIENT: [
    'Kad da pozovem lekara hitno?',
    'Sta je SpO2 i zasto je vazna?',
    'Kako da koristim vremensku osu?',
    'Gde vidim svoju terapiju?',
  ],
  FAMILY_MEMBER: [
    'Kako da vidim stanje?',
    'Sta znaci crveni rizik?',
    'Kad da pozovem lekara?',
    'Gde su obavestenja?',
  ],
  FAMILY: [
    'Kako da vidim stanje?',
    'Sta znaci crveni rizik?',
    'Kad da pozovem lekara?',
    'Gde su obavestenja?',
  ],
};

const KB = [
  // DOCTOR
  {
    role: 'DOCTOR',
    patterns: ['upozoren', 'alert', 'alarm'],
    answer: '🔔 **Upozorenja** se prikazuju na **Tabli lekara** (`/dashboard`). Broj aktivnih upozorenja vidite na ikoni u sidebaru.\n\nUpozorenje mozete resiti klikom na dugme **"Reši"** pored njega. Sistem automatski kreira upozorenja kada pacijent prijavi simptome visokog rizika.',
  },
  {
    role: 'DOCTOR',
    patterns: ['pregled', 'detalj', 'pacijent', 'pogledaj', 'anamnez', 'istorij'],
    answer: '👤 Idite na **Pacijenti** (`/patients`) i kliknite na karticu pacijenta.\n\nNa stranici detalja vidite:\n• SpO₂ trend i trend temperature\n• **Medicinska istorija** tab — kompletna anamneza sa vremenskom osom\n• Dekurzus svih prijava (sa pulmonološkim vrednostima)\n• Plan oporavka i terapiju',
  },
  {
    role: 'DOCTOR',
    patterns: ['crveni', 'red', 'rizik', 'visok', 'spo2', 'saturacij'],
    answer: '🔴 **Crveni rizik** se aktivira kod:\n• SpO₂ < 92% — kritična hipoksemija\n• Hemoptiza (krv u iskašljaju)\n• mMRC ≥ 3 — teška dispneja\n• Temperatura > 38.5°C\n• Bol ≥ 8/10\n\n🟡 **Žuti rizik** kod: SpO₂ 92–95%, mMRC 2, temperatura 37.5–38.5°C\n\nPreporuka pri crvenom: kontaktirajte pacijenta odmah ili zakazite hitan pregled.',
  },
  {
    role: 'DOCTOR',
    patterns: ['resi', 'zatvori', 'resolve'],
    answer: '✅ Da biste rešili upozorenje:\n1. Idite na **Tablu** (`/dashboard`)\n2. Nađite upozorenje u listi\n3. Kliknite **"Reši"**\n\nUpozorenje će biti označeno kao rešeno i skloniće se sa liste aktivnih.',
  },
  {
    role: 'DOCTOR',
    patterns: ['hitno', 'kontaktirajte', 'kada hitno'],
    answer: '🚨 **Odmah kontaktirajte pacijenta kada:**\n• SpO₂ < 90% prijavljena vrednost\n• Hemoptiza (krv u sputumu)\n• Naglo pogoršanje dispneje (mMRC 4)\n• Temperatura > 39.5°C\n• Pacijent označio poruku kao hitnu (!\\ u chatu)\n\nKod KOPB-a: svako pogoršanje sa FEV1 < 40% zahteva brzu procenu.',
  },
  // PATIENT
  {
    role: 'PATIENT',
    patterns: ['prijavim', 'prijava', 'simptom', 'checkin', 'dekurzus'],
    answer: '📋 Da prijavite dnevni dekurzus:\n1. Idite na **Prijava simptoma** u meniju\n2. Unesite SpO₂, temperaturu, brzinu disanja\n3. Ako imate kasalj — označite i odaberite tip\n4. Ako imate otežano disanje — ocenite na mMRC skali (0–4)\n5. Kliknite **"Pošalji dnevni dekurzus"**\n\nPokušajte da prijavljujete svaki dan u isto vreme — trend je važan!',
  },
  {
    role: 'PATIENT',
    patterns: ['lekar', 'hitno', 'pozovem', 'kontakt', 'bolnica'],
    answer: '🚨 **Odmah pozovite lekara ili hitnu (194) ako imate:**\n• SpO₂ ispod 90%\n• Krv u iskašljaju (hemoptiza)\n• Otežano disanje u miru — ne možete izgovoriti rečenicu\n• Temperaturu iznad 39°C\n• Jak bol u grudima koji se pojačava\n• Gubitak svesti ili konfuziju\n\nZa blaže simptome: pišite lekaru u chatu ili označite poruku kao hitnu (!) dugme.',
  },
  {
    role: 'PATIENT',
    patterns: ['spo2', 'saturacij', 'kiseonik', 'oksimetar'],
    answer: '🫁 **SpO₂ (saturacija kiseonika)** meri koliko je hemoglobin u krvi zasićen kiseonikom.\n\n✅ **Normalno:** 95–100%\n⚠️ **Umereno niska:** 92–95% — pratite stanje\n🔴 **Kritično:** ispod 92% — odmah kontaktirajte lekara!\n\nMerite pulsnim oksimetrom (nabavite ga u apoteci za ~1500 din). Merite uvek u mirovanju, na toplom prstu bez laka za nokte.',
  },
  {
    role: 'PATIENT',
    patterns: ['rizik', 'zeleni', 'zuti', 'crveni', 'sta znaci'],
    answer: '🟢 **Zeleni rizik** — parametri su u redu, nastavite terapiju\n🟡 **Žuti rizik** — obratite pažnju, razmislite o kontaktu\n🔴 **Crveni rizik** — potrebna hitna provera!\n\nCrveni rizik aktivira automatsko upozorenje vašem lekaru. Sistem prati temperaturu, SpO₂, brzinu disanja i nivo dispneje.',
  },
  {
    role: 'PATIENT',
    patterns: ['terapij', 'lek', 'plan', 'oporavak'],
    answer: '💊 Vašu terapiju i plan oporavka možete naći na stranici **Plan oporavka** (`/plan`).\n\nTamo vidite:\n• Dijagnozu i uputstvo za oporavak\n• Listu lekova sa doziranjem\n• Zakazane kontrole\n• Datum otpusta',
  },
  {
    role: 'PATIENT',
    patterns: ['vremensku', 'osu', 'karton', 'istorij', 'anamnez', 'nalaz'],
    answer: '📅 **Medicinska istorija** je dostupna na stranici **Zdravstveni karton** (`/health`).\n\nNa vremenskoj osi vidite sve anamneze, nalaze i izveštaje koji su sačuvani od prvog pregleda do danas. Kliknite na markicu da otvorite dokument.\n\nTakođe možete **uploudovati sopstvene nalaze** (laboratorija, RTG) klikom na dugme "+ Dodaj nalaz". Vaši uplodovi se prikazuju zelenom bojom.',
  },
  // FAMILY
  {
    role: 'FAMILY',
    patterns: ['stanje', 'vidim', 'kako', 'pregled'],
    answer: '👨‍👩‍👧 Na stranici **Porodicni pregled** (`/family`) mozete videti:\n• Trenutni rizik vaseg voljenoga\n• Poslednju prijavu simptoma sa vitalnim znacima\n• Sledeci zakazani pregled\n• Plan oporavka i terapiju\n• Istoriju svih prijava',
  },
  {
    role: 'FAMILY',
    patterns: ['crveni', 'rizik', 'hitno', 'alarm'],
    answer: '🔴 Ako je pacijentov status **crveni**, to znaci da su simptomi zabrinjavajuci.\n\nPreporuka:\n• Kontaktirajte pacijenta odmah\n• Proverite da li je kontaktirao svog lekara\n• Ako ne mozete da ga kontaktirate — pozovite hitnu pomoc (194)',
  },
  {
    role: 'FAMILY',
    patterns: ['lekar', 'pozovem', 'kontakt', 'hitna'],
    answer: '📞 **Kada kontaktirati lekara:**\n• Pacijentov rizik je crveni i ne mozete ga dobiti\n• Primetite nagli pad u vitalnim znacima\n• Pacijent prijavljuje bol >8/10\n\n**Hitna pomoc:** 194\n**Centar za informacije:** 0800 300 200',
  },
  {
    role: 'FAMILY',
    patterns: ['obavestenj', 'notif', 'poruka'],
    answer: '🔔 Obavestenja mozete videti na stranici **Obavestenja** (`/notifications`).\n\nBroj neprocitanih obavestenja prikazan je kao crvena tacka na ikoni zvona u sidebaru. Kliknite na obavestenje da ga oznacite kao procitano.',
  },
  // UNIVERSAL
  {
    role: null,
    patterns: ['lozinka', 'password', 'zaboravio'],
    answer: '🔑 Za promenu lozinke ili problema sa prijavom, kontaktirajte administratora sistema ili vaseg lekara koji moze da resetuje pristup.',
  },
  {
    role: null,
    patterns: ['hvala', 'ok', 'super', 'odlicno', 'jasno'],
    answer: '😊 Drago mi je da sam pomogao! Ako imate jos pitanja, slobodno pitajte.',
  },
  {
    role: null,
    patterns: ['zdravo', 'cao', 'hej', 'hi', 'hello'],
    answer: `👋 Zdravo! Ja sam **${BOT_NAME}**.\n\nMogu da vam pomognem sa koriscenjem aplikacije, objasnim sta znace rizici i status pacijenta, i usmerim vas na pravu stranicu. Pitajte sta god zelite!`,
  },
];

function findAnswer(text, role) {
  const lc = text.toLowerCase();
  const specific = KB.find(
    (item) => item.role === role && item.patterns.some((p) => lc.includes(p))
  );
  if (specific) return specific.answer;
  const mapped = KB.find(
    (item) => item.role === 'FAMILY' &&
      ['FAMILY_MEMBER'].includes(role) &&
      item.patterns.some((p) => lc.includes(p))
  );
  if (mapped) return mapped.answer;
  const universal = KB.find(
    (item) => item.role === null && item.patterns.some((p) => lc.includes(p))
  );
  if (universal) return universal.answer;
  return `Nisam siguran kako da odgovorim na to. 🤔\n\nMozete me pitati o:\n• Koriscenju stranica aplikacije\n• Znacenju rizika (zeleni/zuti/crveni)\n• Kada kontaktirati lekara\n• Gde naci odredjene informacije`;
}

function renderMarkdown(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br/>');
}

export default function ChatBot() {
  const role    = localStorage.getItem('careafterRole') || '';
  const token   = localStorage.getItem('careafterToken');
  const [open,  setOpen]  = useState(false);
  const [msgs,  setMsgs]  = useState([
    {
      from: 'bot',
      text: `Zdravo! Ja sam **Dr. Megi** 👩‍⚕️, vaš digitalni asistent za plućnu patologiju.\n\nMogu da vam pomognem sa:\n• Snalaženjem u aplikaciji\n• Razumevanjem SpO₂ i ostalih vrednosti\n• Savetu kada da se javite lekaru\n• Korišćenjem medicinske istorije i dekurzusa\n\nPostavljajte pitanja slobodno!`,
      id: 0,
    },
  ]);
  const [input,    setInput]    = useState('');
  const [typing,   setTyping]   = useState(false);
  const [unread,   setUnread]   = useState(0);
  const bottomRef  = useRef(null);
  const inputRef   = useRef(null);

  if (!token) return null;

  const quickReplies = QUICK_REPLIES[role] || QUICK_REPLIES['PATIENT'];

  const scrollBottom = () => setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 80);

  const sendMsg = (text) => {
    if (!text.trim()) return;
    const userMsg = { from: 'user', text: text.trim(), id: Date.now() };
    setMsgs((prev) => [...prev, userMsg]);
    setInput('');
    setTyping(true);
    scrollBottom();

    setTimeout(() => {
      const answer = findAnswer(text, role);
      setMsgs((prev) => [...prev, { from: 'bot', text: answer, id: Date.now() + 1 }]);
      setTyping(false);
      if (!open) setUnread((u) => u + 1);
      scrollBottom();
    }, 700 + Math.random() * 500);
  };

  const handleOpen = () => {
    setOpen(true);
    setUnread(0);
    setTimeout(() => { inputRef.current?.focus(); scrollBottom(); }, 100);
  };

  return (
    <>
      {/* Floating button */}
      <button className="chat-fab" onClick={open ? () => setOpen(false) : handleOpen} title="CareAfter Asistent">
        {open ? (
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M4 4l12 12M16 4L4 16"/>
          </svg>
        ) : (
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 5a2 2 0 012-2h12a2 2 0 012 2v7a2 2 0 01-2 2H6l-4 3V5z"/>
          </svg>
        )}
        {!open && unread > 0 && <span className="chat-fab-badge">{unread}</span>}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="chat-panel">
          {/* Header */}
          <div className="chat-header">
            <div className="chat-avatar">{BOT_AVATAR}</div>
            <div>
              <div className="chat-header-name">{BOT_NAME}</div>
              <div className="chat-header-status"><span className="chat-online-dot"/>Online</div>
            </div>
            <button className="chat-close" onClick={() => setOpen(false)}>
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M4 4l12 12M16 4L4 16"/></svg>
            </button>
          </div>

          {/* Messages */}
          <div className="chat-messages">
            {msgs.map((m) => (
              <div key={m.id} className={`chat-msg ${m.from}`}>
                {m.from === 'bot' && <div className="chat-msg-avatar">{BOT_AVATAR}</div>}
                <div
                  className="chat-bubble"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(m.text) }}
                />
              </div>
            ))}
            {typing && (
              <div className="chat-msg bot">
                <div className="chat-msg-avatar">{BOT_AVATAR}</div>
                <div className="chat-bubble chat-typing">
                  <span/><span/><span/>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick replies */}
          <div className="chat-quick">
            {quickReplies.map((q) => (
              <button key={q} className="chat-quick-btn" onClick={() => sendMsg(q)}>{q}</button>
            ))}
          </div>

          {/* Input */}
          <div className="chat-input-row">
            <input
              ref={inputRef}
              className="chat-input"
              placeholder="Napisite poruku..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMsg(input)}
            />
            <button
              className="chat-send"
              onClick={() => sendMsg(input)}
              disabled={!input.trim()}
            >
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path d="M2.94 3.06a1 1 0 011.28-.32l14 6a1 1 0 010 1.82l-14 6a1 1 0 01-1.39-1.22L4.63 11H9a1 1 0 000-2H4.63L2.83 4.46a1 1 0 01.11-1.4z"/>
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
