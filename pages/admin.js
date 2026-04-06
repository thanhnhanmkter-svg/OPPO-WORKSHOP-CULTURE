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
  { id: 4, label: "💬 Stage 4 — DNA Sharing", color: "from-pink-600 to-rose-500" },
  { id: 5, label: "🏆 Stage 5 — Kết Quả", color: "from-yellow-600 to-amber-500" },
];

const EMPTY_Q2 = { question: "", answer: "" };
const EMPTY_Q3 = { question: "", optA: "", optB: "", optC: "", optD: "", correct: "A" };

export default function AdminPage() {
  const [stage, setStage] = useState(0);
  const [tab, setTab] = useState("control");
  const [s2questions, setS2questions] = useState([]);
  const [s3questions, setS3questions] = useState([]);
  const [stats, setStats] = useState({ users: 0, hearts: 0 });
  const [editingS2, setEditingS2] = useState(null);
  const [formS2, setFormS2] = useState(EMPTY_Q2);
  const [editingS3, setEditingS3] = useState(null);
  const [formS3, setFormS3] = useState(EMPTY_Q3);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const u1 = onValue(ref(db, "session"), (snap) => {
      if (!snap.exists()) return;
      const d = snap.val();
      setStage(d.stage ?? 0);
      setS2questions(d.s2questions || []);
      setS3questions(d.s3questions || []);
    });
    const u2 = onValue(ref(db, "users"), (snap) => setStats((s) => ({ ...s, users: snap.exists() ? Object.keys(snap.val()).length : 0 })));
    const u3 = onValue(ref(db, "hearts"), (snap) => setStats((s) => ({ ...s, hearts: snap.exists() ? Object.keys(snap.val()).length : 0 })));
    return () => { u1(); u2(); u3(); };
  }, []);

  async function changeStage(s) {
    if (s === 3) {
      // Khởi động timer Stage 3
      await set(ref(db, "session/s3startTime"), Date.now());
      await set(ref(db, "session/s3ended"), false);
    }
    if (s === 2) {
      await set(ref(db, "session/s2current"), 0);
      await set(ref(db, "session/s2showAnswer"), false);
      await set(ref(db, "session/s2ended"), false);
    }
    await set(ref(db, "session/stage"), s);
  }

  // ── Stage 2 CRUD ──
  async function saveS2() {
    if (!formS2.question.trim() || !formS2.answer.trim()) return alert("Điền đủ câu hỏi và đáp án!");
    setSaving(true);
    const newQs = [...s2questions];
    editingS2 === "new" ? newQs.push({ ...formS2 }) : (newQs[editingS2] = { ...formS2 });
    await set(ref(db, "session/s2questions"), newQs);
    setS2questions(newQs); setEditingS2(null); setFormS2(EMPTY_Q2); setSaving(false);
  }
  async function deleteS2(i) {
    if (!confirm("Xóa câu này?")) return;
    const newQs = s2questions.filter((_, idx) => idx !== i);
    await set(ref(db, "session/s2questions"), newQs); setS2questions(newQs);
  }

  // ── Stage 3 CRUD ──
  async function saveS3() {
    if (!formS3.question.trim() || !formS3.optA || !formS3.optB || !formS3.optC || !formS3.optD) return alert("Điền đủ thông tin!");
    setSaving(true);
    const newQs = [...s3questions];
    editingS3 === "new" ? newQs.push({ ...formS3 }) : (newQs[editingS3] = { ...formS3 });
    await set(ref(db, "session/s3questions"), newQs);
    setS3questions(newQs); setEditingS3(null); setFormS3(EMPTY_Q3); setSaving(false);
  }
  async function deleteS3(i) {
    if (!confirm("Xóa câu này?")) return;
    const newQs = s3questions.filter((_, idx) => idx !== i);
    await set(ref(db, "session/s3questions"), newQs); setS3questions(newQs);
  }

  async function resetAll() {
    if (!confirm("⚠️ Xóa toàn bộ dữ liệu (giữ câu hỏi)?")) return;
    await Promise.all([
      remove(ref(db, "s2answers")), remove(ref(db, "s3answers")),
      remove(ref(db, "hearts")), remove(ref(db, "scores")),
      set(ref(db, "session/stage"), 0),
      set(ref(db, "session/s2current"), 0), set(ref(db, "session/s2showAnswer"), false), set(ref(db, "session/s2ended"), false),
      set(ref(db, "session/s3ended"), false), set(ref(db, "session/s3startTime"), null),
    ]);
  }

  return (
    <>
      <Head><title>OPPO Workshop — Admin</title></Head>
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-emerald-950 flex flex-col">
        {/* Header */}
        <div className="bg-black/30 border-b border-white/10 px-6 py-4 flex items-center justify-between">
          <div><h1 className="text-white font-black text-xl">🎛️ Admin Control</h1><p className="text-gray-500 text-xs">OPPO Culture Workshop</p></div>
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <span>👥 {stats.users}</span><span>❤️ {stats.hearts}</span>
            <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /><span className="text-emerald-400 text-xs font-semibold">LIVE</span></div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10 overflow-x-auto">
          {[
            { id: "control", label: "🎮 Điều khiển" },
            { id: "s2", label: `📝 Stage 2 (${s2questions.length})` },
            { id: "s3", label: `🧩 Stage 3 (${s3questions.length})` },
          ].map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-1 py-3 text-sm font-bold whitespace-nowrap transition-colors ${tab === t.id ? "text-emerald-400 border-b-2 border-emerald-400 bg-emerald-500/5" : "text-gray-500 hover:text-gray-300"}`}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4">

          {/* ── CONTROL TAB ── */}
          {tab === "control" && (
            <div className="space-y-3 max-w-lg mx-auto">
              <h2 className="text-white font-black text-lg text-center mb-6">Chọn Stage</h2>
              {STAGES.map((s) => (
                <button key={s.id} onClick={() => changeStage(s.id)}
                  className={`w-full py-4 rounded-2xl font-black text-lg transition-all active:scale-95 bg-gradient-to-r ${s.color} text-white shadow-lg ${stage === s.id ? "ring-4 ring-white/40 scale-105" : "opacity-70 hover:opacity-100"}`}>
                  {stage === s.id && "▶ "}{s.label}
                </button>
              ))}
              <div className="pt-4 border-t border-white/10">
                <button onClick={resetAll} className="w-full py-4 rounded-2xl bg-red-900/40 border border-red-700/40 text-red-400 font-bold hover:bg-red-900/60 active:scale-95 transition-all">
                  🔄 Reset toàn bộ dữ liệu
                </button>
              </div>
              <div className="flex gap-3">
                <a href="/" target="_blank" className="flex-1 text-center py-3 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white text-sm">📱 Nhân viên</a>
                <a href="/host" target="_blank" className="flex-1 text-center py-3 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white text-sm">🖥️ Host</a>
              </div>
            </div>
          )}

          {/* ── STAGE 2 TAB ── */}
          {tab === "s2" && (
            <div className="max-w-2xl mx-auto">
              {editingS2 !== null ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-white font-black text-lg">{editingS2 === "new" ? "➕ Thêm câu Stage 2" : `✏️ Sửa câu ${editingS2 + 1}`}</h2>
                    <button onClick={() => { setEditingS2(null); setFormS2(EMPTY_Q2); }} className="text-gray-500 text-sm">✕ Hủy</button>
                  </div>
                  <div>
                    <label className="text-gray-400 text-xs mb-1 block">Câu hỏi điền vào chỗ trống *</label>
                    <textarea rows={3} className="w-full bg-white/10 border border-white/20 rounded-2xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
                      placeholder="VD: ___ là loại bỏ các tác động bên ngoài…" value={formS2.question} onChange={(e) => setFormS2((f) => ({ ...f, question: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-gray-400 text-xs mb-1 block">Đáp án đúng *</label>
                    <input className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                      placeholder="Từ/cụm từ cần điền…" value={formS2.answer} onChange={(e) => setFormS2((f) => ({ ...f, answer: e.target.value }))} />
                  </div>
                  <button onClick={saveS2} disabled={saving} className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-black text-lg disabled:opacity-50 active:scale-95 transition-all">
                    {saving ? "Đang lưu…" : "💾 Lưu"}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-white font-black text-lg">📝 {s2questions.length} câu — Biết Để Hiểu</h2>
                    <button onClick={() => { setEditingS2("new"); setFormS2(EMPTY_Q2); }} className="px-4 py-2 rounded-xl bg-blue-500 text-white font-bold text-sm hover:bg-blue-400 active:scale-95">➕ Thêm câu</button>
                  </div>
                  {s2questions.length === 0 && <div className="text-center py-12 text-gray-600"><p className="text-4xl mb-3">📝</p><p>Chưa có câu hỏi nào</p></div>}
                  {s2questions.map((q, i) => (
                    <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <p className="text-gray-400 text-xs mb-1">Câu {i + 1}</p>
                          <p className="text-white text-sm font-semibold leading-snug line-clamp-2">{q.question}</p>
                          <p className="text-blue-400 text-xs mt-1">✓ Đáp án: {q.answer}</p>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => { setEditingS2(i); setFormS2({ ...q }); }} className="px-3 py-1.5 rounded-lg bg-white/10 text-gray-300 text-xs hover:bg-white/20">✏️</button>
                          <button onClick={() => deleteS2(i)} className="px-3 py-1.5 rounded-lg bg-red-900/30 text-red-400 text-xs hover:bg-red-900/50">🗑️</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── STAGE 3 TAB ── */}
          {tab === "s3" && (
            <div className="max-w-2xl mx-auto">
              {editingS3 !== null ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-white font-black text-lg">{editingS3 === "new" ? "➕ Thêm Case Study" : `✏️ Sửa câu ${editingS3 + 1}`}</h2>
                    <button onClick={() => { setEditingS3(null); setFormS3(EMPTY_Q3); }} className="text-gray-500 text-sm">✕ Hủy</button>
                  </div>
                  <div>
                    <label className="text-gray-400 text-xs mb-1 block">Tình huống / Câu hỏi *</label>
                    <textarea rows={3} className="w-full bg-white/10 border border-white/20 rounded-2xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 resize-none"
                      placeholder="Mô tả tình huống…" value={formS3.question} onChange={(e) => setFormS3((f) => ({ ...f, question: e.target.value }))} />
                  </div>
                  {["A", "B", "C", "D"].map((opt) => (
                    <div key={opt}>
                      <label className="text-gray-400 text-xs mb-1 block">Đáp án {opt} *</label>
                      <input className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                        placeholder={`Nội dung đáp án ${opt}…`} value={formS3[`opt${opt}`]} onChange={(e) => setFormS3((f) => ({ ...f, [`opt${opt}`]: e.target.value }))} />
                    </div>
                  ))}
                  <div>
                    <label className="text-gray-400 text-xs mb-2 block">Đáp án đúng *</label>
                    <div className="flex gap-3">
                      {["A", "B", "C", "D"].map((opt) => (
                        <button key={opt} onClick={() => setFormS3((f) => ({ ...f, correct: opt }))}
                          className={`flex-1 py-3 rounded-xl font-black text-lg transition-all ${formS3.correct === opt ? "bg-purple-500 text-white" : "bg-white/10 text-gray-400 hover:bg-white/20"}`}>{opt}</button>
                      ))}
                    </div>
                  </div>
                  <button onClick={saveS3} disabled={saving} className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-500 to-violet-500 text-white font-black text-lg disabled:opacity-50 active:scale-95 transition-all">
                    {saving ? "Đang lưu…" : "💾 Lưu"}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-white font-black text-lg">🧩 {s3questions.length} case study</h2>
                    <button onClick={() => { setEditingS3("new"); setFormS3(EMPTY_Q3); }} className="px-4 py-2 rounded-xl bg-purple-500 text-white font-bold text-sm hover:bg-purple-400 active:scale-95">➕ Thêm câu</button>
                  </div>
                  {s3questions.length === 0 && <div className="text-center py-12 text-gray-600"><p className="text-4xl mb-3">🧩</p><p>Chưa có case study nào</p></div>}
                  {s3questions.map((q, i) => (
                    <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <p className="text-gray-400 text-xs mb-1">Case {i + 1}</p>
                          <p className="text-white text-sm font-semibold leading-snug line-clamp-2">{q.question}</p>
                          <p className="text-purple-400 text-xs mt-1">✓ Đúng: {q.correct} — {q[`opt${q.correct}`]}</p>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => { setEditingS3(i); setFormS3({ ...q }); }} className="px-3 py-1.5 rounded-lg bg-white/10 text-gray-300 text-xs hover:bg-white/20">✏️</button>
                          <button onClick={() => deleteS3(i)} className="px-3 py-1.5 rounded-lg bg-red-900/30 text-red-400 text-xs hover:bg-red-900/50">🗑️</button>
                        </div>
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
