// pages/admin.js
import { useState, useEffect } from "react";
import { db } from "../firebase";
import { ref, set, onValue, remove } from "firebase/database";
import Head from "next/head";

const DEFAULT_STAGE_CONFIG = [
  { id: 0, label: "🏠 Stage 0", title: "CULTURE WORKSHOP", subtitle: "Quét QR để tham gia", enabled: true },
  { id: 1, label: "🧊 Stage 1", title: "ICE BREAKING", subtitle: "", enabled: true },
  { id: 2, label: "📝 Stage 2", title: "BIẾT ĐỂ HIỂU", subtitle: "", enabled: true },
  { id: 3, label: "🧩 Stage 3", title: "GIẢI MÃ HÀNH VI", subtitle: "", enabled: true },
  { id: 4, label: "👥 Stage 4", title: "THẢO LUẬN NHÓM", subtitle: "", enabled: true },
  { id: 5, label: "💬 Stage 5", title: "DNA SHARING", subtitle: "Lắng nghe những câu chuyện thực tế", enabled: true },
  { id: 6, label: "💡 Stage 6", title: "KEYWORDS", subtitle: "", enabled: true },
  { id: 7, label: "🏆 Stage 7", title: "BẢNG XẾP HẠNG", subtitle: "", enabled: true },
];

const DEFAULT_CARDS = [
  { id: "c1", icon: "🎯", label: "BỔN PHẬN", color: "from-emerald-500 to-green-400", back: "from-emerald-900 to-green-900" },
  { id: "c2", icon: "🤝", label: "HƯỚNG ĐẾN KHÁCH HÀNG", color: "from-teal-500 to-cyan-400", back: "from-teal-900 to-cyan-900" },
  { id: "c3", icon: "⭐", label: "THEO ĐUỔI SỰ XUẤT SẮC", color: "from-green-500 to-emerald-400", back: "from-green-900 to-emerald-900" },
  { id: "c4", icon: "🏆", label: "HƯỚNG ĐẾN KẾT QUẢ", color: "from-cyan-500 to-teal-400", back: "from-cyan-900 to-teal-900" },
];

const CARD_COLOR_OPTIONS = [
  { label: "Emerald", color: "from-emerald-500 to-green-400", back: "from-emerald-900 to-green-900" },
  { label: "Teal", color: "from-teal-500 to-cyan-400", back: "from-teal-900 to-cyan-900" },
  { label: "Green", color: "from-green-500 to-emerald-400", back: "from-green-900 to-emerald-900" },
  { label: "Cyan", color: "from-cyan-500 to-teal-400", back: "from-cyan-900 to-teal-900" },
  { label: "Blue", color: "from-blue-500 to-indigo-400", back: "from-blue-900 to-indigo-900" },
  { label: "Purple", color: "from-purple-500 to-violet-400", back: "from-purple-900 to-violet-900" },
  { label: "Orange", color: "from-orange-500 to-amber-400", back: "from-orange-900 to-amber-900" },
  { label: "Rose", color: "from-rose-500 to-pink-400", back: "from-rose-900 to-pink-900" },
];

const STAGE_COLORS = [
  "from-gray-600 to-gray-500",
  "from-rose-600 to-pink-500",
  "from-blue-600 to-indigo-500",
  "from-purple-600 to-violet-500",
  "from-orange-600 to-amber-500",
  "from-pink-600 to-rose-500",
  "from-cyan-600 to-teal-500",
  "from-yellow-600 to-amber-500",
];

const EMPTY_Q2 = { question: "", answer: "" };
const EMPTY_Q3 = { question: "", optA: "", optB: "", optC: "", optD: "", correct: "A" };
const EMPTY_CARD = { icon: "🎯", label: "", color: "from-emerald-500 to-green-400", back: "from-emerald-900 to-green-900" };

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Toggle Switch component
function Toggle({ value, onChange }) {
  return (
    <button onClick={() => onChange(!value)}
      className={`w-12 h-6 rounded-full transition-all relative flex-shrink-0 ${value ? "bg-emerald-500" : "bg-gray-600"}`}>
      <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all shadow ${value ? "left-6" : "left-0.5"}`} />
    </button>
  );
}

export default function AdminPage() {
  const [stage, setStage] = useState(0);
  const [tab, setTab] = useState("control");
  const [s2questions, setS2questions] = useState([]);
  const [s3questions, setS3questions] = useState([]);
  const [stats, setStats] = useState({ users: 0, hearts: 0 });
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [activeGroup, setActiveGroupState] = useState(null);
  const [editingS2, setEditingS2] = useState(null);
  const [formS2, setFormS2] = useState(EMPTY_Q2);
  const [editingS3, setEditingS3] = useState(null);
  const [formS3, setFormS3] = useState(EMPTY_Q3);
  const [saving, setSaving] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [stageConfig, setStageConfig] = useState(DEFAULT_STAGE_CONFIG);
  const [editingStage, setEditingStage] = useState(null);
  const [editForm, setEditForm] = useState({ title: "", subtitle: "", enabled: true });
  const [savingConfig, setSavingConfig] = useState(false);
  // Cards
  const [cards, setCards] = useState(DEFAULT_CARDS);
  const [editingCard, setEditingCard] = useState(null);
  const [cardForm, setCardForm] = useState(EMPTY_CARD);
  const [savingCard, setSavingCard] = useState(false);
  // Cá nhân tim
  const [scores, setScores] = useState({});

  useEffect(() => {
    const u1 = onValue(ref(db, "session"), (snap) => {
      if (!snap.exists()) return;
      const d = snap.val();
      setStage(d.stage ?? 0);
      setS2questions(d.s2questions || []);
      setS3questions(d.s3questions || []);
      setGroups(d.groups || []);
      setActiveGroupState(d.activeGroup ?? null);
      if (d.stageConfig) setStageConfig(d.stageConfig);
      if (d.cards) setCards(d.cards);
    });
    const u2 = onValue(ref(db, "users"), (snap) => {
      const list = snap.exists() ? Object.entries(snap.val()).map(([uid, v]) => ({ uid, ...v })) : [];
      setUsers(list);
      setStats((s) => ({ ...s, users: list.length }));
    });
    const u3 = onValue(ref(db, "hearts"), (snap) => setStats((s) => ({ ...s, hearts: snap.exists() ? Object.keys(snap.val()).length : 0 })));
    const u4 = onValue(ref(db, "scores"), (snap) => setScores(snap.exists() ? snap.val() : {}));
    return () => { u1(); u2(); u3(); u4(); };
  }, []);

  async function changeStage(s) {
    const cfg = stageConfig.find((c) => c.id === s);
    if (s !== 0 && cfg && cfg.enabled === false) return;
    if (s === 3) { await set(ref(db, "session/s3startTime"), Date.now()); await set(ref(db, "session/s3ended"), false); await set(ref(db, "session/s3reviewIndex"), 0); }
    if (s === 2) { await set(ref(db, "session/s2current"), 0); await set(ref(db, "session/s2showAnswer"), false); await set(ref(db, "session/s2ended"), false); }
    if (s === 4) { await set(ref(db, "session/activeGroup"), null); }
    await set(ref(db, "session/stage"), s);
  }

  // Reset participants — clears group members but keeps group names
  async function resetParticipants() {
    if (!confirm("⚠️ Reset người tham gia? Điểm số, câu trả lời và thành viên nhóm sẽ bị xoá. Tên nhóm và câu hỏi được giữ lại.")) return;
    const clearedGroups = groups.map((g) => ({ ...g, members: [] }));
    await Promise.all([
      remove(ref(db, "s2answers")),
      remove(ref(db, "s3answers")),
      remove(ref(db, "hearts")),
      remove(ref(db, "scores")),
      remove(ref(db, "users")),
      remove(ref(db, "keywords")),
      remove(ref(db, "groupHearts")),
      remove(ref(db, "session/groupCards")),
      set(ref(db, "session/stage"), 0),
      set(ref(db, "session/s2current"), 0),
      set(ref(db, "session/s2showAnswer"), false),
      set(ref(db, "session/s2ended"), false),
      set(ref(db, "session/s3ended"), false),
      set(ref(db, "session/s3startTime"), null),
      set(ref(db, "session/s3reviewIndex"), 0),
      set(ref(db, "session/activeGroup"), null),
      set(ref(db, "session/showNow"), false),
      clearedGroups.length > 0 ? set(ref(db, "session/groups"), clearedGroups) : Promise.resolve(),
    ]);
  }

  async function resetAll() {
    if (!confirm("⚠️ XÓA TOÀN BỘ kể cả câu hỏi và nhóm? Không thể hoàn tác!")) return;
    await Promise.all([
      remove(ref(db, "s2answers")),
      remove(ref(db, "s3answers")),
      remove(ref(db, "hearts")),
      remove(ref(db, "scores")),
      remove(ref(db, "users")),
      remove(ref(db, "keywords")),
      remove(ref(db, "groupHearts")),
      remove(ref(db, "session/groupCards")),
      set(ref(db, "session/stage"), 0),
      set(ref(db, "session/s2current"), 0),
      set(ref(db, "session/s2showAnswer"), false),
      set(ref(db, "session/s2ended"), false),
      set(ref(db, "session/s3ended"), false),
      set(ref(db, "session/s3startTime"), null),
      set(ref(db, "session/s3reviewIndex"), 0),
      set(ref(db, "session/activeGroup"), null),
      set(ref(db, "session/showNow"), false),
      set(ref(db, "session/groups"), []),
      set(ref(db, "session/s2questions"), []),
      set(ref(db, "session/s3questions"), []),
    ]);
  }

  // ── Groups ──
  async function addGroup() {
    if (!newGroupName.trim()) return;
    const newGroups = [...groups, { id: Date.now().toString(), name: newGroupName.trim(), members: [] }];
    await set(ref(db, "session/groups"), newGroups);
    setGroups(newGroups); setNewGroupName("");
  }
  async function deleteGroup(gid) {
    await set(ref(db, "session/groups"), groups.filter((g) => g.id !== gid));
  }
  async function assignUserToGroup(uid, gid) {
    const newGroups = groups.map((g) => ({
      ...g,
      members: g.id === gid ? [...new Set([...(g.members || []), uid])] : (g.members || []).filter((m) => m !== uid),
    }));
    await set(ref(db, "session/groups"), newGroups);
  }
  async function removeFromGroup(uid) {
    await set(ref(db, "session/groups"), groups.map((g) => ({ ...g, members: (g.members || []).filter((m) => m !== uid) })));
  }
  function getUserGroup(uid) { return groups.find((g) => (g.members || []).includes(uid)); }

  // ── Stage 4 ──
  async function startGroupPresent(gid) {
    await remove(ref(db, "groupHearts"));
    await set(ref(db, "session/activeGroup"), gid);
    await set(ref(db, "session/activeGroupStart"), Date.now());
  }
  async function endGroupPresent() {
    const grp = groups.find((g) => g.id === activeGroup);
    if (grp && (grp.members || []).length > 0) {
      await new Promise((resolve) => {
        onValue(ref(db, "groupHearts"), async (snap) => {
          const heartCount = snap.exists() ? Object.keys(snap.val()).length : 0;
          if (heartCount > 0) {
            const bonus = Math.floor(heartCount / grp.members.length);
            for (const uid of grp.members) {
              const r = ref(db, `scores/${uid}/groupHearts`);
              await new Promise((res) => { onValue(r, async (s) => { await set(r, (s.exists() ? s.val() : 0) + bonus); res(); }, { onlyOnce: true }); });
            }
          }
          resolve();
        }, { onlyOnce: true });
      });
    }
    await set(ref(db, "session/activeGroup"), null);
    await remove(ref(db, "groupHearts"));
  }

  // ── S2 ──
  async function saveS2() {
    if (!formS2.question.trim() || !formS2.answer.trim()) return alert("Điền đủ!");
    setSaving(true);
    const newQs = [...s2questions];
    editingS2 === "new" ? newQs.push({ ...formS2 }) : (newQs[editingS2] = { ...formS2 });
    await set(ref(db, "session/s2questions"), newQs);
    setEditingS2(null); setFormS2(EMPTY_Q2); setSaving(false);
  }
  async function shuffleS2() { await set(ref(db, "session/s2questions"), shuffle(s2questions)); }
  async function deleteS2(i) { if (!confirm("Xóa?")) return; await set(ref(db, "session/s2questions"), s2questions.filter((_, x) => x !== i)); }

  // ── S3 ──
  async function saveS3() {
    if (!formS3.question.trim() || !formS3.optA || !formS3.optB || !formS3.optC || !formS3.optD) return alert("Điền đủ!");
    setSaving(true);
    const newQs = [...s3questions];
    editingS3 === "new" ? newQs.push({ ...formS3 }) : (newQs[editingS3] = { ...formS3 });
    await set(ref(db, "session/s3questions"), newQs);
    setEditingS3(null); setFormS3(EMPTY_Q3); setSaving(false);
  }
  async function shuffleS3() { await set(ref(db, "session/s3questions"), shuffle(s3questions)); }
  async function deleteS3(i) { if (!confirm("Xóa?")) return; await set(ref(db, "session/s3questions"), s3questions.filter((_, x) => x !== i)); }

  // ── Cards ──
  async function saveCard() {
    if (!cardForm.label.trim() || !cardForm.icon.trim()) return alert("Điền đủ icon và tên thẻ!");
    setSavingCard(true);
    const newCards = [...cards];
    if (editingCard === "new") newCards.push({ ...cardForm, id: "c" + Date.now() });
    else newCards[editingCard] = { ...cards[editingCard], ...cardForm };
    await set(ref(db, "session/cards"), newCards);
    setCards(newCards); setEditingCard(null); setCardForm(EMPTY_CARD); setSavingCard(false);
  }
  async function deleteCard(i) {
    if (!confirm("Xóa thẻ này?")) return;
    const newCards = cards.filter((_, x) => x !== i);
    await set(ref(db, "session/cards"), newCards); setCards(newCards);
  }
  async function resetCardsToDefault() {
    if (!confirm("Khôi phục 4 thẻ mặc định?")) return;
    await set(ref(db, "session/cards"), DEFAULT_CARDS); setCards(DEFAULT_CARDS);
  }

  // ── Stage Config ──
  function startEditStage(cfg) {
    setEditingStage(cfg.id);
    setEditForm({ title: cfg.title, subtitle: cfg.subtitle, enabled: cfg.enabled !== false });
  }
  async function saveStageConfig() {
    setSavingConfig(true);
    const newConfig = stageConfig.map((c) => c.id === editingStage ? { ...c, ...editForm } : c);
    await set(ref(db, "session/stageConfig"), newConfig);
    setStageConfig(newConfig); setEditingStage(null); setSavingConfig(false);
  }
  async function toggleStageEnabled(id) {
    if (id === 0) return;
    const newConfig = stageConfig.map((c) => c.id === id ? { ...c, enabled: c.enabled === false ? true : false } : c);
    await set(ref(db, "session/stageConfig"), newConfig); setStageConfig(newConfig);
  }

  const ungrouped = users.filter((u) => !getUserGroup(u.uid));

  return (
    <>
      <Head><title>OPPO Workshop — Admin</title></Head>
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-emerald-950 flex flex-col">
        {/* Header */}
        <div className="bg-black/30 border-b border-white/10 px-6 py-4 flex items-center justify-between">
          <div><h1 className="text-white font-black text-xl">🎛️ Admin</h1><p className="text-gray-500 text-xs">OPPO Culture Workshop</p></div>
          <div className="flex items-center gap-3 text-sm text-gray-400">
            <span>👥 {stats.users}</span><span>❤️ {stats.hearts}</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10 overflow-x-auto">
          {[
            { id: "control", label: "🎮 Control" },
            { id: "groups", label: `👥 Nhóm (${groups.length})` },
            { id: "s2", label: `📝 S2 (${s2questions.length})` },
            { id: "s3", label: `🧩 S3 (${s3questions.length})` },
            { id: "cards", label: `🃏 Thẻ (${cards.length})` },
            { id: "config", label: "⚙️ Stage" },
          ].map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-1 py-3 text-xs font-bold whitespace-nowrap px-2 transition-colors ${tab === t.id ? "text-emerald-400 border-b-2 border-emerald-400" : "text-gray-500"}`}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4">

          {/* ── Tab Điều khiển ── */}
          {tab === "control" && (
            <div className="space-y-3 max-w-lg mx-auto">
              <h2 className="text-white font-black text-lg text-center mb-4">Chọn Stage</h2>
              {DEFAULT_STAGE_CONFIG.map((s) => {
                const cfg = stageConfig.find((c) => c.id === s.id) || s;
                const isDisabled = s.id !== 0 && cfg.enabled === false;
                return (
                  <button key={s.id} onClick={() => !isDisabled && changeStage(s.id)} disabled={isDisabled}
                    className={`w-full py-4 rounded-2xl font-black text-base transition-all bg-gradient-to-r ${STAGE_COLORS[s.id]} text-white
                      ${stage === s.id ? "ring-4 ring-white/40 scale-105" : "opacity-70 hover:opacity-100"}
                      ${isDisabled ? "!opacity-25 cursor-not-allowed grayscale" : "active:scale-95"}`}>
                    {isDisabled ? "🚫 " : stage === s.id ? "▶ " : ""}{s.label} — {cfg.title}
                    {isDisabled && <span className="text-xs font-normal ml-2">(đã tắt)</span>}
                  </button>
                );
              })}

              {stage === 4 && groups.length > 0 && (
                <div className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-4 space-y-3 mt-2">
                  <p className="text-orange-400 font-black text-sm">👥 Nhóm đang trình bày:</p>
                  {groups.map((g) => (
                    <div key={g.id} className="flex items-center gap-2">
                      <button onClick={() => startGroupPresent(g.id)}
                        className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${activeGroup === g.id ? "bg-orange-500 text-white ring-2 ring-white/30" : "bg-white/10 text-gray-300 hover:bg-white/20"}`}>
                        {g.name} ({(g.members || []).length} người)
                      </button>
                      {activeGroup === g.id && (
                        <button onClick={endGroupPresent} className="px-4 py-3 rounded-xl bg-emerald-500 text-white text-sm font-black">✓ Xong</button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-3 border-t border-white/10 space-y-2">
                <button onClick={resetParticipants} className="w-full py-4 rounded-2xl bg-orange-900/40 border border-orange-700/40 text-orange-400 font-bold hover:bg-orange-900/60 active:scale-95">
                  🔄 Reset người tham gia (giữ câu hỏi + tên nhóm)
                </button>
                <button onClick={resetAll} className="w-full py-4 rounded-2xl bg-red-900/40 border border-red-700/40 text-red-400 font-bold hover:bg-red-900/60 active:scale-95">
                  💣 Reset toàn bộ (xóa cả câu hỏi)
                </button>
              </div>

              {/* ❤️ Tim cá nhân */}
              {users.length > 0 && (
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-3">
                  <p className="text-rose-400 text-xs font-semibold mb-2">❤️ Tim cá nhân ({stats.hearts} tổng)</p>
                  <div className="grid grid-cols-2 gap-1">
                    {users
                      .map((u) => ({ ...u, hearts: scores[u.uid]?.hearts || 0 }))
                      .sort((a, b) => b.hearts - a.hearts)
                      .slice(0, 10)
                      .map((u) => (
                        <div key={u.uid} className="flex items-center justify-between px-2 py-1 rounded-lg bg-white/5">
                          <span className="text-gray-300 text-xs truncate flex-1">{u.name}</span>
                          <span className="text-rose-400 text-xs font-bold ml-1">❤️ {u.hearts}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
              <div className="flex gap-3">
                <a href="/" target="_blank" className="flex-1 text-center py-3 rounded-xl bg-white/5 border border-white/10 text-gray-400 text-sm">📱 Nhân viên</a>
                <a href="/host" target="_blank" className="flex-1 text-center py-3 rounded-xl bg-white/5 border border-white/10 text-gray-400 text-sm">🖥️ Host</a>
              </div>
            </div>
          )}

          {/* ── Tab Nhóm ── */}
          {tab === "groups" && (
            <div className="max-w-2xl mx-auto space-y-4">
              <h2 className="text-white font-black text-lg">👥 Chia nhóm</h2>
              <div className="flex gap-2">
                <input className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 text-sm"
                  placeholder="Tên nhóm mới…" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addGroup()} />
                <button onClick={addGroup} className="px-4 py-2.5 rounded-xl bg-orange-500 text-white font-bold text-sm active:scale-95">➕ Thêm</button>
              </div>
              {ungrouped.length > 0 && (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                  <p className="text-gray-400 text-xs font-semibold mb-3 uppercase">Chưa có nhóm ({ungrouped.length})</p>
                  <div className="flex flex-wrap gap-2">
                    {ungrouped.map((u) => (
                      <div key={u.uid} className="flex items-center gap-1 bg-white/10 rounded-full pl-3 pr-2 py-1">
                        <span className="text-white text-sm">{u.name}</span>
                        {(scores[u.uid]?.hearts || 0) > 0 && <span className="text-rose-400 text-xs">❤️{scores[u.uid]?.hearts}</span>}
                        <select onChange={(e) => e.target.value && assignUserToGroup(u.uid, e.target.value)}
                          className="bg-transparent text-emerald-400 text-xs cursor-pointer outline-none ml-1" defaultValue="">
                          <option value="" disabled>→ nhóm</option>
                          {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {groups.length === 0 && <p className="text-gray-600 text-center py-8">Tạo nhóm ở trên trước!</p>}
              {groups.map((g) => (
                <div key={g.id} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-white font-black">{g.name} <span className="text-gray-500 font-normal text-sm">({(g.members || []).length} người)</span></p>
                    <button onClick={() => deleteGroup(g.id)} className="text-red-400 text-xs px-2 py-1 rounded-lg hover:bg-red-900/30">🗑️</button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(g.members || []).map((uid) => {
                      const u = users.find((x) => x.uid === uid);
                      if (!u) return null;
                      const hearts = scores[uid]?.hearts || 0;
                      return (
                        <div key={uid} className="flex items-center gap-1 bg-orange-500/20 border border-orange-500/30 rounded-full pl-3 pr-1 py-1">
                          <span className="text-white text-sm">{u.name}</span>
                          {hearts > 0 && <span className="text-rose-400 text-xs font-bold">❤️{hearts}</span>}
                          <button onClick={() => removeFromGroup(uid)} className="text-gray-500 hover:text-red-400 px-1 text-xs">✕</button>
                        </div>
                      );
                    })}
                    {(g.members || []).length === 0 && <p className="text-gray-600 text-sm">Chưa có thành viên</p>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Tab S2 ── */}
          {tab === "s2" && (
            <div className="max-w-2xl mx-auto">
              {editingS2 !== null ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-white font-black text-lg">{editingS2 === "new" ? "➕ Thêm câu S2" : `✏️ Sửa câu ${editingS2 + 1}`}</h2>
                    <button onClick={() => { setEditingS2(null); setFormS2(EMPTY_Q2); }} className="text-gray-500 text-sm">✕</button>
                  </div>
                  <textarea rows={3} className="w-full bg-white/10 border border-white/20 rounded-2xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
                    placeholder="Câu hỏi điền vào chỗ trống…" value={formS2.question} onChange={(e) => setFormS2((f) => ({ ...f, question: e.target.value }))} />
                  <input className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                    placeholder="Đáp án đúng…" value={formS2.answer} onChange={(e) => setFormS2((f) => ({ ...f, answer: e.target.value }))} />
                  <button onClick={saveS2} disabled={saving} className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-black text-lg disabled:opacity-50 active:scale-95">
                    {saving ? "Lưu…" : "💾 Lưu"}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-white font-black text-lg">📝 {s2questions.length} câu</h2>
                    <div className="flex gap-2">
                      <button onClick={shuffleS2} disabled={s2questions.length < 2} className="px-3 py-2 rounded-xl bg-white/10 text-gray-300 text-sm disabled:opacity-30">🔀 Trộn</button>
                      <button onClick={() => { setEditingS2("new"); setFormS2(EMPTY_Q2); }} className="px-4 py-2 rounded-xl bg-blue-500 text-white font-bold text-sm active:scale-95">➕ Thêm</button>
                    </div>
                  </div>
                  {s2questions.length === 0 && <p className="text-center text-gray-600 py-8">Chưa có câu hỏi</p>}
                  {s2questions.map((q, i) => (
                    <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <p className="text-gray-400 text-xs mb-1">Câu {i + 1}</p>
                        <p className="text-white text-sm font-semibold line-clamp-2">{q.question}</p>
                        <p className="text-blue-400 text-xs mt-1">✓ {q.answer}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => { setEditingS2(i); setFormS2({ ...q }); }} className="px-3 py-1.5 rounded-lg bg-white/10 text-gray-300 text-xs">✏️</button>
                        <button onClick={() => deleteS2(i)} className="px-3 py-1.5 rounded-lg bg-red-900/30 text-red-400 text-xs">🗑️</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Tab S3 ── */}
          {tab === "s3" && (
            <div className="max-w-2xl mx-auto">
              {editingS3 !== null ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-white font-black text-lg">{editingS3 === "new" ? "➕ Thêm Case Study" : `✏️ Sửa câu ${editingS3 + 1}`}</h2>
                    <button onClick={() => { setEditingS3(null); setFormS3(EMPTY_Q3); }} className="text-gray-500 text-sm">✕</button>
                  </div>
                  <textarea rows={3} className="w-full bg-white/10 border border-white/20 rounded-2xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 resize-none"
                    placeholder="Tình huống…" value={formS3.question} onChange={(e) => setFormS3((f) => ({ ...f, question: e.target.value }))} />
                  {["A", "B", "C", "D"].map((opt) => (
                    <input key={opt} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                      placeholder={`Đáp án ${opt}…`} value={formS3[`opt${opt}`]} onChange={(e) => setFormS3((f) => ({ ...f, [`opt${opt}`]: e.target.value }))} />
                  ))}
                  <div className="flex gap-3">
                    {["A", "B", "C", "D"].map((opt) => (
                      <button key={opt} onClick={() => setFormS3((f) => ({ ...f, correct: opt }))}
                        className={`flex-1 py-3 rounded-xl font-black text-lg ${formS3.correct === opt ? "bg-purple-500 text-white" : "bg-white/10 text-gray-400"}`}>{opt}</button>
                    ))}
                  </div>
                  <button onClick={saveS3} disabled={saving} className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-500 to-violet-500 text-white font-black text-lg disabled:opacity-50 active:scale-95">
                    {saving ? "Lưu…" : "💾 Lưu"}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-white font-black text-lg">🧩 {s3questions.length} case study</h2>
                    <div className="flex gap-2">
                      <button onClick={shuffleS3} disabled={s3questions.length < 2} className="px-3 py-2 rounded-xl bg-white/10 text-gray-300 text-sm disabled:opacity-30">🔀 Trộn</button>
                      <button onClick={() => { setEditingS3("new"); setFormS3(EMPTY_Q3); }} className="px-4 py-2 rounded-xl bg-purple-500 text-white font-bold text-sm active:scale-95">➕ Thêm</button>
                    </div>
                  </div>
                  {s3questions.length === 0 && <p className="text-center text-gray-600 py-8">Chưa có case study</p>}
                  {s3questions.map((q, i) => (
                    <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <p className="text-gray-400 text-xs mb-1">Case {i + 1}</p>
                        <p className="text-white text-sm font-semibold line-clamp-2">{q.question}</p>
                        <p className="text-purple-400 text-xs mt-1">✓ {q.correct} — {q[`opt${q.correct}`]}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => { setEditingS3(i); setFormS3({ ...q }); }} className="px-3 py-1.5 rounded-lg bg-white/10 text-gray-300 text-xs">✏️</button>
                        <button onClick={() => deleteS3(i)} className="px-3 py-1.5 rounded-lg bg-red-900/30 text-red-400 text-xs">🗑️</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Tab Thẻ bài ── */}
          {tab === "cards" && (
            <div className="max-w-2xl mx-auto">
              {editingCard !== null ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-white font-black text-lg">{editingCard === "new" ? "➕ Thêm thẻ bài" : `✏️ Sửa thẻ ${editingCard + 1}`}</h2>
                    <button onClick={() => { setEditingCard(null); setCardForm(EMPTY_CARD); }} className="text-gray-500 text-sm">✕</button>
                  </div>
                  {/* Preview */}
                  <div className={`rounded-2xl bg-gradient-to-br ${cardForm.color} flex flex-col items-center justify-center gap-2 p-6 h-32`}>
                    <span className="text-3xl">{cardForm.icon || "🎯"}</span>
                    <p className="text-white font-black text-sm text-center">{cardForm.label || "Tên thẻ"}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-gray-400 text-xs font-semibold uppercase mb-1 block">Icon / Emoji</label>
                      <input className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white text-2xl text-center focus:outline-none focus:border-orange-500"
                        placeholder="🎯" value={cardForm.icon} onChange={(e) => setCardForm((f) => ({ ...f, icon: e.target.value }))} maxLength={4} />
                    </div>
                    <div>
                      <label className="text-gray-400 text-xs font-semibold uppercase mb-1 block">Tên thẻ</label>
                      <input className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 font-bold"
                        placeholder="Tên giá trị…" value={cardForm.label} onChange={(e) => setCardForm((f) => ({ ...f, label: e.target.value }))} />
                    </div>
                  </div>
                  <div>
                    <label className="text-gray-400 text-xs font-semibold uppercase mb-2 block">Màu thẻ</label>
                    <div className="grid grid-cols-4 gap-2">
                      {CARD_COLOR_OPTIONS.map((opt) => (
                        <button key={opt.label} onClick={() => setCardForm((f) => ({ ...f, color: opt.color, back: opt.back }))}
                          className={`h-10 rounded-xl bg-gradient-to-br ${opt.color} transition-all ${cardForm.color === opt.color ? "ring-2 ring-white scale-105" : "opacity-60 hover:opacity-90"}`}>
                          <span className="text-white text-xs font-bold">{opt.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <button onClick={saveCard} disabled={savingCard} className="w-full py-4 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-400 text-white font-black text-lg disabled:opacity-50 active:scale-95">
                    {savingCard ? "Lưu…" : "💾 Lưu thẻ"}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-white font-black text-lg">🃏 {cards.length} thẻ bài</h2>
                    <div className="flex gap-2">
                      <button onClick={resetCardsToDefault} className="px-3 py-2 rounded-xl bg-white/10 text-gray-300 text-xs hover:bg-white/20">↩️ Mặc định</button>
                      <button onClick={() => { setEditingCard("new"); setCardForm(EMPTY_CARD); }} className="px-4 py-2 rounded-xl bg-orange-500 text-white font-bold text-sm active:scale-95">➕ Thêm</button>
                    </div>
                  </div>
                  <p className="text-gray-500 text-xs bg-white/5 rounded-xl px-3 py-2">💡 Mỗi nhóm chỉ được chọn 1 thẻ duy nhất ở Stage 4.</p>
                  {cards.length === 0 && <p className="text-center text-gray-600 py-8">Chưa có thẻ bài</p>}
                  <div className="grid grid-cols-2 gap-3">
                    {cards.map((c, i) => (
                      <div key={c.id || i} className={`bg-gradient-to-br ${c.color} rounded-2xl p-4 relative`}>
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-2xl">{c.icon}</span>
                          <div className="flex gap-1">
                            <button onClick={() => { setEditingCard(i); setCardForm({ icon: c.icon, label: c.label, color: c.color, back: c.back }); }}
                              className="px-2 py-1 rounded-lg bg-black/20 text-white text-xs backdrop-blur-sm">✏️</button>
                            <button onClick={() => deleteCard(i)} className="px-2 py-1 rounded-lg bg-black/30 text-red-300 text-xs backdrop-blur-sm">🗑️</button>
                          </div>
                        </div>
                        <p className="text-white font-black text-sm leading-tight">{c.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Tab Config Stage ── */}
          {tab === "config" && (
            <div className="max-w-2xl mx-auto space-y-4">
              <h2 className="text-white font-black text-lg">⚙️ Cài đặt Stage</h2>
              <p className="text-gray-500 text-sm">Bật/tắt stage và chỉnh tên hiển thị. Stage bị tắt sẽ mờ và không thể chọn.</p>
              {editingStage !== null ? (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-white font-black">{DEFAULT_STAGE_CONFIG.find((s) => s.id === editingStage)?.label}</h3>
                    <button onClick={() => setEditingStage(null)} className="text-gray-500 text-sm">✕ Hủy</button>
                  </div>
                  {editingStage !== 0 && (
                    <div className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3">
                      <span className="text-white font-semibold text-sm">Bật stage này</span>
                      <Toggle value={editForm.enabled} onChange={(v) => setEditForm((f) => ({ ...f, enabled: v }))} />
                    </div>
                  )}
                  <div>
                    <label className="text-gray-400 text-xs font-semibold uppercase mb-1 block">Tiêu đề chính</label>
                    <input className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 font-bold"
                      placeholder="Tiêu đề stage…" value={editForm.title} onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-gray-400 text-xs font-semibold uppercase mb-1 block">Mô tả / Subtitle (tuỳ chọn)</label>
                    <input className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                      placeholder="Mô tả ngắn…" value={editForm.subtitle} onChange={(e) => setEditForm((f) => ({ ...f, subtitle: e.target.value }))} />
                  </div>
                  <button onClick={saveStageConfig} disabled={savingConfig || !editForm.title.trim()}
                    className="w-full py-3 rounded-xl bg-emerald-500 text-white font-black text-base disabled:opacity-50 active:scale-95">
                    {savingConfig ? "Đang lưu…" : "💾 Lưu thay đổi"}
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {stageConfig.map((cfg, i) => {
                    const isEnabled = cfg.id === 0 || cfg.enabled !== false;
                    return (
                      <div key={cfg.id} className={`bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-3 transition-opacity ${!isEnabled ? "opacity-40" : ""}`}>
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${STAGE_COLORS[i]} flex items-center justify-center text-white font-black text-sm flex-shrink-0`}>
                          {cfg.id}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-bold text-sm truncate">{cfg.title}</p>
                          <p className="text-gray-600 text-xs italic truncate">{cfg.subtitle || "Không có subtitle"}</p>
                        </div>
                        {cfg.id !== 0 && <Toggle value={isEnabled} onChange={() => toggleStageEnabled(cfg.id)} />}
                        <button onClick={() => startEditStage(cfg)} className="px-3 py-1.5 rounded-lg bg-white/10 text-gray-300 text-xs hover:bg-white/20 flex-shrink-0">✏️ Sửa</button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </>
  );
}
