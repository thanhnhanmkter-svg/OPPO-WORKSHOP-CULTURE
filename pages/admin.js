// pages/admin.js
import { useState, useEffect } from "react";
import { db } from "../firebase";
import { ref, set, onValue, remove } from "firebase/database";
import Head from "next/head";

const STAGES = [
  { id: 0, label: "🏠 Màn hình chào / QR", color: "from-gray-600 to-gray-500" },
  { id: 1, label: "🧊 Stage 1 — Ice Breaking", color: "from-rose-600 to-pink-500" },
  { id: 2, label: "📝 Stage 2 — Biết Để Hiểu", color: "from-blue-600 to-indigo-500" },
  { id: 3, label: "🧩 Stage 3 — Giải Mã Hành Vi", color: "from-purple-600 to-violet-500" },
  { id: 4, label: "👥 Stage 4 — Thảo Luận Nhóm", color: "from-orange-600 to-amber-500" },
  { id: 5, label: "💬 Stage 5 — DNA Sharing", color: "from-pink-600 to-rose-500" },
  { id: 6, label: "💡 Stage 6 — Keywords", color: "from-cyan-600 to-teal-500" },
  { id: 7, label: "🏆 Stage 7 — Kết Quả", color: "from-yellow-600 to-amber-500" },
];

const EMPTY_Q2 = { question: "", answer: "" };
const EMPTY_Q3 = { question: "", optA: "", optB: "", optC: "", optD: "", correct: "A" };

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
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

  useEffect(() => {
    const u1 = onValue(ref(db, "session"), (snap) => {
      if (!snap.exists()) return;
      const d = snap.val();
      setStage(d.stage ?? 0);
      setS2questions(d.s2questions || []);
      setS3questions(d.s3questions || []);
      setGroups(d.groups || []);
      setActiveGroupState(d.activeGroup ?? null);
    });
    const u2 = onValue(ref(db, "users"), (snap) => {
      const list = snap.exists() ? Object.entries(snap.val()).map(([uid, v]) => ({ uid, ...v })) : [];
      setUsers(list);
      setStats((s) => ({ ...s, users: list.length }));
    });
    const u3 = onValue(ref(db, "hearts"), (snap) => setStats((s) => ({ ...s, hearts: snap.exists() ? Object.keys(snap.val()).length : 0 })));
    return () => { u1(); u2(); u3(); };
  }, []);

  async function changeStage(s) {
    if (s === 3) { await set(ref(db, "session/s3startTime"), Date.now()); await set(ref(db, "session/s3ended"), false); }
    if (s === 2) { await set(ref(db, "session/s2current"), 0); await set(ref(db, "session/s2showAnswer"), false); await set(ref(db, "session/s2ended"), false); }
    if (s === 4) { await set(ref(db, "session/activeGroup"), null); }
    await set(ref(db, "session/stage"), s);
  }

  async function resetAll() {
    if (!confirm("⚠️ Xóa toàn bộ dữ liệu kể cả người tham gia?")) return;
    await Promise.all([
      remove(ref(db, "s2answers")), remove(ref(db, "s3answers")),
      remove(ref(db, "hearts")), remove(ref(db, "scores")),
      remove(ref(db, "users")), remove(ref(db, "keywords")),
      remove(ref(db, "groupHearts")),
      set(ref(db, "session/stage"), 0),
      set(ref(db, "session/s2current"), 0),
      set(ref(db, "session/s2showAnswer"), false),
      set(ref(db, "session/s2ended"), false),
      set(ref(db, "session/s3ended"), false),
      set(ref(db, "session/s3startTime"), null),
      set(ref(db, "session/activeGroup"), null),
      set(ref(db, "session/groups"), []),
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
    const newGroups = groups.filter((g) => g.id !== gid);
    await set(ref(db, "session/groups"), newGroups);
  }

  async function assignUserToGroup(uid, gid) {
    const newGroups = groups.map((g) => ({
      ...g,
      members: g.id === gid
        ? [...new Set([...(g.members || []), uid])]
        : (g.members || []).filter((m) => m !== uid),
    }));
    await set(ref(db, "session/groups"), newGroups);
  }

  async function removeFromGroup(uid) {
    const newGroups = groups.map((g) => ({ ...g, members: (g.members || []).filter((m) => m !== uid) }));
    await set(ref(db, "session/groups"), newGroups);
  }

  function getUserGroup(uid) { return groups.find((g) => (g.members || []).includes(uid)); }

  // ── Stage 4 group presenting ──
  async function startGroupPresent(gid) {
    await remove(ref(db, "groupHearts"));
    await set(ref(db, "session/activeGroup"), gid);
    await set(ref(db, "session/activeGroupStart"), Date.now());
  }

  async function endGroupPresent() {
    // Đọc tim và chia đều
    const grp = groups.find((g) => g.id === activeGroup);
    if (grp && (grp.members || []).length > 0) {
      await new Promise((resolve) => {
        onValue(ref(db, "groupHearts"), async (snap) => {
          const heartCount = snap.exists() ? Object.keys(snap.val()).length : 0;
          if (heartCount > 0) {
            const bonus = Math.floor(heartCount / grp.members.length);
            for (const uid of grp.members) {
              const r = ref(db, `scores/${uid}/groupHearts`);
              await new Promise((res) => {
                onValue(r, async (s) => {
                  await set(r, (s.exists() ? s.val() : 0) + bonus);
                  res();
                }, { onlyOnce: true });
              });
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
  async function shuffleS2() { const q = shuffle(s2questions); await set(ref(db, "session/s2questions"), q); }
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
  async function shuffleS3() { const q = shuffle(s3questions); await set(ref(db, "session/s3questions"), q); }
  async function deleteS3(i) { if (!confirm("Xóa?")) return; await set(ref(db, "session/s3questions"), s3questions.filter((_, x) => x !== i)); }

  const ungrouped = users.filter((u) => !getUserGroup(u.uid));

  return (
    <>
      <Head><title>OPPO Workshop — Admin</title></Head>
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-emerald-950 flex flex-col">
        <div className="bg-black/30 border-b border-white/10 px-6 py-4 flex items-center justify-between">
          <div><h1 className="text-white font-black text-xl">🎛️ Admin</h1><p className="text-gray-500 text-xs">OPPO Culture Workshop</p></div>
          <div className="flex items-center gap-3 text-sm text-gray-400">
            <span>👥 {stats.users}</span><span>❤️ {stats.hearts}</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
        </div>

        <div className="flex border-b border-white/10 overflow-x-auto">
          {[
            { id: "control", label: "🎮 Điều khiển" },
            { id: "groups", label: `👥 Nhóm (${groups.length})` },
            { id: "s2", label: `📝 S2 (${s2questions.length})` },
            { id: "s3", label: `🧩 S3 (${s3questions.length})` },
          ].map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-1 py-3 text-xs font-bold whitespace-nowrap px-2 transition-colors ${tab === t.id ? "text-emerald-400 border-b-2 border-emerald-400" : "text-gray-500"}`}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4">

          {tab === "control" && (
            <div className="space-y-3 max-w-lg mx-auto">
              <h2 className="text-white font-black text-lg text-center mb-4">Chọn Stage</h2>
              {STAGES.map((s) => (
                <button key={s.id} onClick={() => changeStage(s.id)}
                  className={`w-full py-4 rounded-2xl font-black text-base transition-all active:scale-95 bg-gradient-to-r ${s.color} text-white ${stage === s.id ? "ring-4 ring-white/40 scale-105" : "opacity-70 hover:opacity-100"}`}>
                  {stage === s.id && "▶ "}{s.label}
                </button>
              ))}

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

              <div className="pt-3 border-t border-white/10">
                <button onClick={resetAll} className="w-full py-4 rounded-2xl bg-red-900/40 border border-red-700/40 text-red-400 font-bold hover:bg-red-900/60 active:scale-95">
                  🔄 Reset toàn bộ (xóa cả người tham gia)
                </button>
              </div>
              <div className="flex gap-3">
                <a href="/" target="_blank" className="flex-1 text-center py-3 rounded-xl bg-white/5 border border-white/10 text-gray-400 text-sm">📱 Nhân viên</a>
                <a href="/host" target="_blank" className="flex-1 text-center py-3 rounded-xl bg-white/5 border border-white/10 text-gray-400 text-sm">🖥️ Host</a>
              </div>
            </div>
          )}

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
                      return (
                        <div key={uid} className="flex items-center gap-1 bg-orange-500/20 border border-orange-500/30 rounded-full pl-3 pr-1 py-1">
                          <span className="text-white text-sm">{u.name}</span>
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
        </div>
      </div>
    </>
  );
}
