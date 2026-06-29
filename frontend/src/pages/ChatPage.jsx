import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';

const api = (path, opts = {}) =>
  axios({
    url: `http://localhost:8081${path}`,
    headers: { Authorization: `Bearer ${localStorage.getItem('careafterToken')}` },
    ...opts,
  });

function getEmailFromToken() {
  try {
    const tok = localStorage.getItem('careafterToken');
    const payload = JSON.parse(atob(tok.split('.')[1]));
    return payload.sub || '';
  } catch { return ''; }
}

function fmtTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString('sr-Latn', { hour: '2-digit', minute: '2-digit' });
}

function fmtDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Danas';
  if (d.toDateString() === yesterday.toDateString()) return 'Juče';
  return d.toLocaleDateString('sr-Latn', { day: '2-digit', month: 'long', year: 'numeric' });
}

function getInitials(name) {
  if (!name) return '?';
  const words = name.split(/[\s—–-]+/).filter((w) => w.length > 1);
  return words.slice(0, 2).map((w) => w[0]?.toUpperCase()).join('') || '?';
}

function convDisplayName(conv, myEmail) {
  if (conv.group) return conv.title || 'Grupni chat';
  const others = (conv.participants || []).filter((p) => p.email !== myEmail);
  if (others.length === 0) return conv.title || 'Razgovor';
  const u = others[0];
  if (u.role === 'DOCTOR') return `Dr. ${u.lastName}`;
  return `${u.firstName} ${u.lastName}`;
}

export default function ChatPage() {
  const myEmail = getEmailFromToken();
  const role    = localStorage.getItem('careafterRole') || '';

  const [conversations,  setConversations]  = useState([]);
  const [activeConvId,   setActiveConvId]   = useState(null);
  const [messages,       setMessages]       = useState([]);
  const [input,          setInput]          = useState('');
  const [unread,         setUnread]         = useState(0);
  const [loadingConvs,   setLoadingConvs]   = useState(true);
  const [loadingMsgs,    setLoadingMsgs]    = useState(false);
  const [sending,        setSending]        = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [myDoctors,      setMyDoctors]      = useState([]);
  const [groupTitle,     setGroupTitle]     = useState('');
  const [selectedDocs,   setSelectedDocs]   = useState([]);
  const [creatingGroup,  setCreatingGroup]  = useState(false);
  const [muteStatus,     setMuteStatus]     = useState(false);
  const [reportModal,    setReportModal]    = useState(false);
  const [reportReason,   setReportReason]   = useState('');
  const [sendingReport,  setSendingReport]  = useState(false);
  const [reportToast,    setReportToast]    = useState('');

  const messagesEndRef = useRef(null);
  const pollRef        = useRef(null);
  const inputRef       = useRef(null);

  const loadConversations = useCallback(async () => {
    try {
      const res = await api('/api/conversations');
      setConversations(res.data);
    } catch {}
    setLoadingConvs(false);
  }, []);

  const loadMessages = useCallback(async (convId) => {
    if (!convId) return;
    try {
      const res = await api(`/api/conversations/${convId}/messages`);
      setMessages(res.data);
    } catch {}
    setLoadingMsgs(false);
  }, []);

  const loadUnread = useCallback(async () => {
    try {
      const res = await api('/api/conversations/unread-count');
      setUnread(res.data.unread ?? 0);
    } catch {}
  }, []);

  // Initial load
  useEffect(() => {
    loadConversations();
    loadUnread();
  }, [loadConversations, loadUnread]);

  // Auto-select first conversation
  useEffect(() => {
    if (!activeConvId && conversations.length > 0) {
      setActiveConvId(conversations[0].id);
    }
  }, [conversations, activeConvId]);

  // Load messages + poll + mute status when active conversation changes
  useEffect(() => {
    if (!activeConvId) return;
    setMessages([]);
    setLoadingMsgs(true);
    loadMessages(activeConvId);
    api(`/api/conversations/${activeConvId}/mute-status`)
      .then((res) => setMuteStatus(res.data.muted ?? false))
      .catch(() => setMuteStatus(false));
    clearInterval(pollRef.current);
    pollRef.current = setInterval(() => {
      loadMessages(activeConvId);
      loadUnread();
    }, 3000);
    return () => clearInterval(pollRef.current);
  }, [activeConvId, loadMessages, loadUnread]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || !activeConvId || sending) return;
    setSending(true);
    setInput('');
    try {
      await api(`/api/conversations/${activeConvId}/messages`, {
        method: 'post',
        data: { content: text },
      });
      loadMessages(activeConvId);
      loadConversations();
    } catch {
      setInput(text);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const markUrgent = async (msgId) => {
    try {
      await api(`/api/conversations/messages/${msgId}/urgent`, { method: 'patch' });
      loadMessages(activeConvId);
    } catch {}
  };

  const getMuted = () => {
    try { return JSON.parse(localStorage.getItem('mutedConvs') || '[]'); } catch { return []; }
  };
  const isMuted = (id) => getMuted().includes(id);
  const toggleMute = (id) => {
    const muted = getMuted();
    const idx = muted.indexOf(id);
    if (idx === -1) muted.push(id); else muted.splice(idx, 1);
    localStorage.setItem('mutedConvs', JSON.stringify(muted));
    setConversations((prev) => [...prev]); // force re-render
  };

  const toggleMutePatient = async () => {
    try {
      const res = await api(`/api/conversations/${activeConvId}/mute-patient`, { method: 'patch' });
      setMuteStatus(res.data.muted ?? false);
    } catch {}
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const submitReport = async () => {
    if (!reportReason.trim() || !activeConv) return;
    const doctor = activeConv.participants?.find((p) => p.role === 'DOCTOR');
    if (!doctor) return;
    setSendingReport(true);
    try {
      await api('/api/reports', { method: 'post', data: { reportedUserId: String(doctor.id), reportType: 'PATIENT_REPORTS_DOCTOR', reason: reportReason } });
      setReportModal(false); setReportReason('');
      setReportToast('Prijava je poslata. Ustanova će pregledati Vašu prijavu.');
      setTimeout(() => setReportToast(''), 4000);
    } catch {
      setReportToast('Greška pri slanju prijave.');
      setTimeout(() => setReportToast(''), 3000);
    } finally { setSendingReport(false); }
  };

  const openGroupModal = async () => {
    setShowGroupModal(true);
    setGroupTitle('');
    setSelectedDocs([]);
    try {
      const res = await api('/api/doctor-requests/my-doctors');
      setMyDoctors(res.data.map((r) => r.doctor).filter(Boolean));
    } catch { setMyDoctors([]); }
  };

  const createGroup = async () => {
    if (!selectedDocs.length) return;
    setCreatingGroup(true);
    try {
      const title = groupTitle.trim() || `Grupni chat (${selectedDocs.length + 1} učesnika)`;
      await api('/api/conversations/group', {
        method: 'post',
        data: { title, participantIds: selectedDocs },
      });
      setShowGroupModal(false);
      await loadConversations();
    } catch {} finally { setCreatingGroup(false); }
  };

  const activeConv = conversations.find((c) => c.id === activeConvId);

  // Group messages by date label
  const grouped = [];
  let lastDate = null;
  for (const msg of messages) {
    const d = fmtDate(msg.sentAt);
    if (d !== lastDate) { grouped.push({ type: 'date', label: d }); lastDate = d; }
    grouped.push({ type: 'msg', msg });
  }

  return (
    <div className="layout">
      <Sidebar chatCount={unread} />
      <main className="chat-layout">

        {/* ── Left: conversation list ─────────────────────────────── */}
        <div className="chat-conv-list">
          <div className="chat-conv-header">
            <span className="chat-conv-title">Poruke</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {unread > 0 && <span className="badge-red">{unread}</span>}
              {role === 'PATIENT' && (
                <button onClick={openGroupModal} title="Kreiraj grupni chat"
                  style={{ background: 'var(--primary)', color: 'white', border: 'none', borderRadius: 8, padding: '4px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                  + Grupni
                </button>
              )}
            </div>
          </div>

          {loadingConvs ? (
            <div className="loading" style={{ padding: '20px 16px' }}>Ucitavanje...</div>
          ) : conversations.length === 0 ? (
            <div className="empty" style={{ padding: '20px 16px' }}>
              Nemate razgovora.<br />Lekari se dodaju automatski kada prihvate Vas zahtev.
            </div>
          ) : (
            conversations.map((conv) => {
              const displayName = convDisplayName(conv, myEmail);
              return (
                <button
                  key={conv.id}
                  className={`chat-conv-item${activeConvId === conv.id ? ' active' : ''}`}
                  onClick={() => setActiveConvId(conv.id)}
                  style={isMuted(conv.id) ? { opacity: 0.5 } : undefined}
                >
                  <div className="chat-conv-avatar-sm" style={conv.group ? { background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' } : undefined}>
                    {conv.group ? '👥' : getInitials(displayName)}
                  </div>
                  <div className="chat-conv-meta">
                    <div className="chat-conv-name" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {displayName}
                      {isMuted(conv.id) && <span style={{ fontSize: 11 }}>🔕</span>}
                    </div>
                    <div className="chat-conv-time">
                      {conv.lastMessageAt ? fmtTime(conv.lastMessageAt) : 'Nema poruka'}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* ── Right: message view ─────────────────────────────────── */}
        <div className="chat-msg-panel">
          {!activeConv ? (
            <div className="chat-empty-state">
              <div className="chat-empty-icon">💬</div>
              <div>Izaberite razgovor iz liste</div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="chat-msg-header">
                <div className="chat-conv-avatar-sm" style={{ width: 42, height: 42, fontSize: 15, ...(activeConv.group ? { background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' } : {}) }}>
                  {activeConv.group ? '👥' : getInitials(convDisplayName(activeConv, myEmail))}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="chat-msg-title">{convDisplayName(activeConv, myEmail)}</div>
                  {activeConv.group && activeConv.participants && (
                    <div className="chat-msg-subtitle" style={{ fontSize: 12 }}>
                      {activeConv.participants.filter(p => p.email !== myEmail).map(p => `${p.firstName} ${p.lastName}`).join(', ')}
                    </div>
                  )}
                  {activeConv.patient?.diagnosis && (
                    <div className="chat-msg-subtitle">
                      {activeConv.patient.diagnosis.slice(0, 90)}
                      {activeConv.patient.diagnosis.length > 90 ? '…' : ''}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  {/* Doctor: mute/unmute patient */}
                  {role === 'DOCTOR' && activeConv?.patient && (
                    <button
                      onClick={toggleMutePatient}
                      title={muteStatus ? 'Odmutuj pacijenta' : 'Mutiraj pacijenta'}
                      style={{
                        background: muteStatus ? '#fef2f2' : 'none',
                        border: `1.5px solid ${muteStatus ? '#fca5a5' : 'var(--border)'}`,
                        borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600,
                        color: muteStatus ? '#ef4444' : 'var(--muted)',
                        padding: '5px 10px', display: 'flex', alignItems: 'center', gap: 5,
                      }}
                    >
                      {muteStatus ? '🔔 Odmutuj pacijenta' : '🔕 Mutiraj pacijenta'}
                    </button>
                  )}
                  {/* Patient: report doctor */}
                  {role === 'PATIENT' && activeConv?.participants?.some((p) => p.role === 'DOCTOR') && (
                    <button
                      onClick={() => { setReportModal(true); setReportReason(''); }}
                      title="Prijavi lekara"
                      style={{
                        background: 'none', border: '1.5px solid #fca5a5', borderRadius: 8,
                        cursor: 'pointer', fontSize: 12, fontWeight: 600,
                        color: '#ef4444', padding: '5px 10px', display: 'flex', alignItems: 'center', gap: 5,
                      }}
                    >
                      🚩 Prijavi lekara
                    </button>
                  )}
                  {/* Mute conversation notifications */}
                  <button
                    onClick={() => toggleMute(activeConvId)}
                    title={isMuted(activeConvId) ? 'Uključi obaveštenja' : 'Mutiraj obaveštenja'}
                    style={{
                      background: 'none', border: '1.5px solid var(--border)', borderRadius: 8,
                      cursor: 'pointer', fontSize: 12, fontWeight: 600,
                      color: isMuted(activeConvId) ? '#6366f1' : 'var(--muted)',
                      padding: '5px 10px', display: 'flex', alignItems: 'center', gap: 5,
                    }}
                  >
                    {isMuted(activeConvId) ? '🔔 Uključi' : '🔕'}
                  </button>
                </div>
              </div>

              {/* Messages body */}
              <div className="chat-msg-body">
                {loadingMsgs && messages.length === 0 ? (
                  <div className="loading" style={{ padding: 32 }}>Ucitavanje poruka...</div>
                ) : messages.length === 0 ? (
                  <div className="chat-no-msgs">
                    Nema poruka. Budite prvi koji ce pisati!
                  </div>
                ) : (
                  grouped.map((item, i) =>
                    item.type === 'date' ? (
                      <div key={`d-${i}`} className="chat-date-divider">
                        <span>{item.label}</span>
                      </div>
                    ) : (
                      <MsgBubble
                        key={item.msg.id}
                        msg={item.msg}
                        isMe={item.msg.sender?.email === myEmail}
                        onMarkUrgent={markUrgent}
                      />
                    )
                  )
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input / muted banner */}
              {role === 'PATIENT' && muteStatus ? (
                <div style={{
                  padding: '16px 20px', background: '#fef2f2',
                  borderTop: '1px solid #fecaca',
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <span style={{ fontSize: 20 }}>🔕</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: '#dc2626' }}>Slanje poruka je onemogućeno</div>
                    <div style={{ fontSize: 12, color: '#ef4444', marginTop: 2 }}>Lekar je privremeno ograničio Vašu komunikaciju u ovom razgovoru.</div>
                  </div>
                </div>
              ) : (
                <div className="chat-input-area">
                  <textarea
                    ref={inputRef}
                    className="chat-textarea"
                    placeholder="Unesite poruku... (Enter za slanje)"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKey}
                    rows={1}
                  />
                  <button
                    className="btn-primary chat-send-btn"
                    onClick={send}
                    disabled={sending || !input.trim()}
                  >
                    <SendIcon />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* ── Group chat creation modal ── */}
      {showGroupModal && (
        <div className="modal-overlay" onClick={() => setShowGroupModal(false)}>
          <div className="modal-sheet" style={{ maxWidth: 440 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span style={{ fontWeight: 700, fontSize: 15 }}>👥 Novi grupni chat</span>
              <button className="modal-close" onClick={() => setShowGroupModal(false)}>✕</button>
            </div>
            <div className="modal-body" style={{ padding: '16px 24px' }}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: 'block' }}>Naziv grupe</label>
                <input
                  value={groupTitle}
                  onChange={(e) => setGroupTitle(e.target.value)}
                  placeholder="npr. Tim za praćenje (opciono)"
                  style={{ width: '100%', padding: '9px 12px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, display: 'block' }}>Izaberi lekare za grupu</label>
                {myDoctors.length === 0 ? (
                  <div style={{ color: 'var(--muted)', fontSize: 13 }}>Nema pratećih lekara.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {myDoctors.map((doc) => (
                      <label key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: 'var(--surface-2)', borderRadius: 10, cursor: 'pointer', border: `1.5px solid ${selectedDocs.includes(doc.id) ? 'var(--primary)' : 'var(--border)'}` }}>
                        <input type="checkbox" checked={selectedDocs.includes(doc.id)}
                          onChange={() => setSelectedDocs((prev) => prev.includes(doc.id) ? prev.filter((id) => id !== doc.id) : [...prev, doc.id])}
                          style={{ width: 16, height: 16, accentColor: 'var(--primary)', flexShrink: 0 }}
                        />
                        <div className="chat-conv-avatar-sm" style={{ width: 34, height: 34, fontSize: 13, flexShrink: 0 }}>
                          {doc.firstName?.[0]}{doc.lastName?.[0]}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>Dr. {doc.lastName}</div>
                          <div style={{ fontSize: 12, color: 'var(--muted)' }}>{doc.firstName} {doc.lastName}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              <button
                className="btn btn-primary"
                onClick={createGroup}
                disabled={selectedDocs.length === 0 || creatingGroup}
                style={{ width: '100%', marginTop: 20, padding: '11px 0', fontSize: 14 }}
              >
                {creatingGroup ? 'Kreiranje...' : `Kreiraj grupni chat (${selectedDocs.length + 1} učesnika)`}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ── Report doctor modal ── */}
      {reportModal && (
        <div style={{ position: 'fixed', inset: 0, background: '#00000077', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card" style={{ width: 400, padding: '28px 28px 24px' }}>
            <h3 style={{ marginBottom: 8, color: '#ef4444' }}>🚩 Prijava lekara</h3>
            <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20 }}>
              Zdravstvena ustanova će pregledati Vašu prijavu. Prva prijava šalje upozorenje lekaru, a ponavljanje može dovesti do privremene zabrane profila.
            </p>
            <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Razlog prijave:</label>
            <textarea
              placeholder="Opišite problem — npr. lekar ne odgovara na poruke, neprofesionalno ponašanje..."
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              rows={4}
              style={{
                width: '100%', boxSizing: 'border-box', padding: '10px 12px',
                border: '1.5px solid var(--border)', borderRadius: 10,
                fontSize: 13.5, resize: 'vertical', marginBottom: 20,
                background: 'var(--surface)', color: 'var(--text)',
              }}
            />
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setReportModal(false)}>Otkaži</button>
              <button className="btn btn-primary" style={{ flex: 1, background: '#ef4444', borderColor: '#ef4444' }}
                disabled={!reportReason.trim() || sendingReport}
                onClick={submitReport}>
                {sendingReport ? 'Slanje...' : 'Pošalji prijavu'}
              </button>
            </div>
          </div>
        </div>
      )}

      {reportToast && (
        <div className="toast" style={{ background: reportToast.startsWith('Greška') ? '#ef4444' : '#6366f1' }}>
          {reportToast}
        </div>
      )}
    </div>
  );
}

function MsgBubble({ msg, isMe, onMarkUrgent }) {
  return (
    <div className={`chat-msg-row${isMe ? ' me' : ''}${msg.urgent ? ' urgent' : ''}`}>
      {!isMe && (
        <div className="chat-msg-avatar-sm">
          {msg.sender?.firstName?.[0] ?? '?'}{msg.sender?.lastName?.[0] ?? ''}
        </div>
      )}
      <div className={`chat-bubble${isMe ? ' me' : ''}${msg.urgent ? ' urgent' : ''}`}>
        {!isMe && (
          <div className="chat-bubble-sender">
            {msg.sender?.firstName} {msg.sender?.lastName}
          </div>
        )}
        {msg.urgent && (
          <div style={{ fontSize: 11, fontWeight: 700, color: '#ef4444', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span>⚠️</span> Hitna poruka
          </div>
        )}
        <div className="chat-bubble-text">{msg.content}</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <div className="chat-bubble-time">{fmtTime(msg.sentAt)}</div>
          {isMe && !msg.urgent && (
            <button
              onClick={() => onMarkUrgent(msg.id)}
              title="Označi kao hitno"
              style={{ background: 'none', border: '1.5px solid #fca5a5', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 700, color: '#ef4444', padding: '1px 7px', lineHeight: 1.4, flexShrink: 0 }}
            >
              ! Hitno
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function SendIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13"/>
      <polygon points="22 2 15 22 11 13 2 9 22 2"/>
    </svg>
  );
}
