// pages/admin.js — Màn hình Điều khiển
import { useState, useEffect } from "react";
import { db } from "../firebase";
import { ref, set, onValue, remove, get } from "firebase/database";
import Head from "next/head";

const STAGE_LABELS = [
  { id: 0, label: "🏠 Màn hình chào / QR", color: "from-gray-600 to-gray-500" },
  { id: 1, label: "🧊 Stage 1 — Ice Breaking", color: "from-rose-600 to-pink-500" },
  { id: 2, label: "📋 Stage 2 — Case Study", color: "from-emerald-600 to-green-500" },
  { id: 3, label: "💬 Stage 3 — Sharing", color: "from-purple-600 to-violet-500" },
  { id: 4, label: "🏆 Stage 4 — Kết quả", color: "from-yellow-600 to-amber-500" },
];

const EMPTY_Q = { question: "", optA: "", optB: "", optC: "", optD: "", correct: "A" };

export default function AdminPage() {
  const [stage, setStage] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [editingQ, setEditingQ] = useState(null); // null | index | "new"
  const [form, setForm] = useState(EMPTY_Q);
  const [stats, setStats] = useState({ users: 0, hearts: 0, votes: 0 });
  const [tab, setTab] = useState("control"); // control | questions | stats
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const u1 = onValue(ref(db, "session"), (snap) => {
      if (!snap.exists()) return;
      const d = snap.val();
      setStage(d.stage ?? 0);
      setQuestions(d.questions || []);
    });
    const u2 = onValue(ref(db, "users"), (snap) => {
      setStats((s) => ({ ...s, users: snap.exists() ? Object.keys(snap.val()).length : 0 }));
    });
    const u3 = onValue(ref(db, "hearts"), (snap) => {
      setStats((s) => ({ ...s, hearts: snap.exists() ? Object.keys(snap.val()).length : 0 }));
    });
    const u4 = onValue(ref(db, "answers"), (snap) => {
      setStats((s) => ({ ...s, votes: snap.exists() ? Object.keys(snap.val()).length : 0 }));
    });
    return () => { u1(); u2(); u3(); u4(); };
  }, []);

  async function changeStage(s) {
    await set(ref(db, "session/stage"), s);
    if (s === 2) {
      await set(ref(db, "session/currentQuestion"), 0);
      await set(ref(db, "session/showAnswer"), false);
    }
    if (s === 1) {
      await remove(ref(db, "hearts"));
    }
  }

  async function saveQuestion() {
    if (!form.question.trim() || !form.optA || !form.optB || !form.optC || !form.optD) {
      alert("Vui lòng điền đầy đủ câu hỏi và 4 đáp án!");
      return;
    }
    setSaving(true);
    const newQs = [...questions];
    if (editingQ === "new") {
      newQs.push({ ...form });
    } else {
      newQs[editingQ] = { ...form };
    }
    await set(ref(db, "session/questions"), newQs);
    setQuestions(newQs);
    setEditingQ(null);
    setForm(EMPTY_Q);
    setSaving(false);
  }

  async function deleteQuestion(i) {
    if (!confirm("Xóa câu hỏi này?")) return;
    const newQs = questions.filter((_, idx) => idx !== i);
    await set(ref(db, "session/questions"), newQs);
    setQuestions(newQs);
  }

  async function resetAll() {
    if (!confirm("⚠️ Xóa toàn bộ dữ liệu (điểm, tim, câu trả lời)? Câu hỏi vẫn giữ nguyên.")) return;
    await Promise.all([
      remove(ref(db, "answers")),
      remove(ref(db, "hearts")),
      remove(ref(db, "scores")),
      set(ref(db, "session/stage"), 0),
      set(ref(db, "session/currentQuestion"), 0),
      set(ref(db, "session/showAnswer"), false),
    ]);
  }

  function openEdit(i) {
    setForm(i === "new" ? EMPTY_Q : { ...questions[i] });
    setEditingQ(i);
  }

  return (
    <>
      <Head><title>OPPO Workshop — Admin</title></Head>
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-emerald-950 flex flex-col">
        {/* Header */}
        <div className="bg-black/30 border-b border-white/10 px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-white font-black text-xl">🎛️ Admin Control</h1>
            <p className="text-gray-500 text-xs">OPPO Culture Workshop</p>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <span>👥 {stats.users}</span>
            <span>❤️ {stats.hearts}</span>
            <span>🗳️ {stats.votes}</span>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-400 text-xs font-semibold">LIVE</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10">
          {[
            { id: "control", label: "🎮 Điều khiển" },
            { id: "questions", label: "📋 Case Study" },
            { id: "stats", label: "📊 Thống kê" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 py-3 text-sm font-bold transition-colors ${tab === t.id ? "text-emerald-400 border-b-2 border-emerald-400 bg-emerald-500/5" : "text-gray-500 hover:text-gray-300"}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {/* ── TAB: CONTROL ── */}
          {tab === "control" && (
            <div className="space-y-4 max-w-lg mx-auto">
              <h2 className="text-white font-black text-lg text-center mb-6">Chọn Stage hiện tại</h2>
              {STAGE_LABELS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => changeStage(s.id)}
                  className={`w-full py-5 rounded-2xl font-black text-lg transition-all duration-200 active:scale-95 bg-gradient-to-r ${s.color} text-white shadow-lg
                    ${stage === s.id ? "ring-4 ring-white/40 scale-105" : "opacity-70 hover:opacity-100"}`}
                >
                  {stage === s.id && "▶ "}{s.label}
                </button>
              ))}

              <div className="pt-4 border-t border-white/10">
                <button
                  onClick={resetAll}
                  className="w-full py-4 rounded-2xl bg-red-900/40 border border-red-700/40 text-red-400 font-bold hover:bg-red-900/60 active:scale-95 transition-all"
                >
                  🔄 Reset toàn bộ dữ liệu (giữ câu hỏi)
                </button>
              </div>

              <div className="flex gap-3 pt-2">
                <a href="/" target="_blank" className="flex-1 text-center py-3 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white text-sm transition-colors">
                  📱 Nhân viên
                </a>
                <a href="/host" target="_blank" className="flex-1 text-center py-3 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white text-sm transition-colors">
                  🖥️ Host
                </a>
              </div>
            </div>
          )}

          {/* ── TAB: QUESTIONS ── */}
          {tab === "questions" && (
            <div className="max-w-2xl mx-auto">
              {editingQ !== null ? (
                // Form chỉnh sửa
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-white font-black text-lg">{editingQ === "new" ? "➕ Thêm câu hỏi" : `✏️ Sửa câu ${editingQ + 1}`}</h2>
                    <button onClick={() => setEditingQ(null)} className="text-gray-500 hover:text-white text-sm">✕ Hủy</button>
                  </div>

                  <div>
                    <label className="text-gray-400 text-xs mb-1 block">Nội dung câu hỏi *</label>
                    <textarea
                      rows={3}
                      className="w-full bg-white/10 border border-white/20 rounded-2xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 resize-none"
                      placeholder="Nhập câu hỏi / tình huống…"
                      value={form.question}
                      onChange={(e) => setForm((f) => ({ ...f, question: e.target.value }))}
                    />
                  </div>

                  {["A", "B", "C", "D"].map((opt) => (
                    <div key={opt}>
                      <label className="text-gray-400 text-xs mb-1 block">Đáp án {opt} *</label>
                      <input
                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                        placeholder={`Nội dung đáp án ${opt}…`}
                        value={form[`opt${opt}`]}
                        onChange={(e) => setForm((f) => ({ ...f, [`opt${opt}`]: e.target.value }))}
                      />
                    </div>
                  ))}

                  <div>
                    <label className="text-gray-400 text-xs mb-2 block">Đáp án đúng *</label>
                    <div className="flex gap-3">
                      {["A", "B", "C", "D"].map((opt) => (
                        <button
                          key={opt}
                          onClick={() => setForm((f) => ({ ...f, correct: opt }))}
                          className={`flex-1 py-3 rounded-xl font-black text-lg transition-all ${form.correct === opt ? "bg-emerald-500 text-white" : "bg-white/10 text-gray-400 hover:bg-white/20"}`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={saveQuestion}
                    disabled={saving}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-400 text-white font-black text-lg disabled:opacity-50 active:scale-95 transition-all"
                  >
                    {saving ? "Đang lưu…" : "💾 Lưu câu hỏi"}
                  </button>
                </div>
              ) : (
                // Danh sách câu hỏi
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-white font-black text-lg">📋 {questions.length} câu hỏi</h2>
                    <button
                      onClick={() => openEdit("new")}
                      className="px-4 py-2 rounded-xl bg-emerald-500 text-white font-bold text-sm hover:bg-emerald-400 active:scale-95 transition-all"
                    >
                      ➕ Thêm câu
                    </button>
                  </div>

                  {questions.length === 0 && (
                    <div className="text-center py-12 text-gray-600">
                      <p className="text-4xl mb-3">📝</p>
                      <p>Chưa có câu hỏi nào</p>
                      <p className="text-sm mt-1">Bấm "Thêm câu" để bắt đầu</p>
                    </div>
                  )}

                  {questions.map((q, i) => (
                    <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <p className="text-gray-400 text-xs mb-1">Câu {i + 1}</p>
                          <p className="text-white text-sm font-semibold leading-snug line-clamp-2">{q.question}</p>
                          <p className="text-emerald-400 text-xs mt-2">✓ Đúng: {q.correct} — {q[`opt${q.correct}`]}</p>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <button onClick={() => openEdit(i)} className="px-3 py-1.5 rounded-lg bg-white/10 text-gray-300 text-xs hover:bg-white/20 transition-colors">✏️</button>
                          <button onClick={() => deleteQuestion(i)} className="px-3 py-1.5 rounded-lg bg-red-900/30 text-red-400 text-xs hover:bg-red-900/50 transition-colors">🗑️</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── TAB: STATS ── */}
          {tab === "stats" && (
            <div className="max-w-lg mx-auto space-y-4">
              <h2 className="text-white font-black text-lg text-center mb-4">📊 Thống kê live</h2>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Người tham gia", value: stats.users, icon: "👥", color: "text-emerald-400" },
                  { label: "Tim đã gửi", value: stats.hearts, icon: "❤️", color: "text-rose-400" },
                  { label: "Lượt trả lời", value: stats.votes, icon: "🗳️", color: "text-cyan-400" },
                ].map((s) => (
                  <div key={s.label} className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                    <p className="text-2xl">{s.icon}</p>
                    <p className={`font-black text-3xl ${s.color}`}>{s.value}</p>
                    <p className="text-gray-500 text-xs mt-1">{s.label}</p>
                  </div>
                ))}
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <p className="text-white font-bold mb-3">Stage hiện tại</p>
                <p className="text-emerald-400 font-black text-xl">{STAGE_LABELS[stage]?.label}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
