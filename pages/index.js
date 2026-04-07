// pages/index.js — Màn hình Nhân viên (7 stages)
import { useEffect, useState, useRef } from "react";
import { db } from "../firebase";
import { ref, set, push, onValue, get } from "firebase/database";
import Head from "next/head";
import { CULTURE_VALUES } from "../data/cultureValues";

//test
function getUserId() {
  if (typeof window === "undefined") return null;
  let id = localStorage.getItem("oppo_uid");
  if (!id) { id = "u_" + Math.random().toString(36).slice(2, 9) + "_" + Date.now(); localStorage.setItem("oppo_uid", id); }
  return id;
}

function normalizeText(str) {
  return str.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/\s+/g, " ");
}

// ── Stage Transition Wrapper ──────────────────────────────────────────────────
function StageTransition({ stage, children }) {
  const [visible, setVisible] = useState(true);
  const [content, setContent] = useState(children);
  const prevStage = useRef(stage);

  useEffect(() => {
    if (prevStage.current !== stage) {
      setVisible(false);
      const t = setTimeout(() => {
        setContent(children);
        prevStage.current = stage;
        setVisible(true);
      }, 300);
      return () => clearTimeout(t);
    } else {
      setContent(children);
    }
  }, [stage, children]);

  return (
    <div style={{ opacity: visible ? 1 : 0, transition: "opacity 0.3s ease" }}>
      {content}
    </div>
  );
}

// ── Login ─────────────────────────────────────────────────────────────────────
function StageLogin({ onJoin }) {
  const [name, setName] = useState(""); const [dept, setDept] = useState(""); const [loading, setLoading] = useState(false);
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-emerald-950 flex flex-col items-center justify-center px-6 gap-6">
      <img src="/mascot.png" alt="OPPO" className="w-28 h-28 object-contain drop-shadow-xl" />
      <div className="text-center"><h1 className="text-3xl font-black text-white">OPPO <span className="text-emerald-400">CULTURE</span></h1><h2 className="text-xl font-black text-white">WORKSHOP</h2></div>
      <div className="w-full max-w-xs space-y-3">
        <input className="w-full bg-white/10 border border-white/20 rounded-2xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500" placeholder="Họ và tên *" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="w-full bg-white/10 border border-white/20 rounded-2xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500" placeholder="Phòng ban (tuỳ chọn)" value={dept} onChange={(e) => setDept(e.target.value)} />
        <button onClick={async () => { if (!name.trim()) return; setLoading(true); await onJoin(name.trim(), dept.trim()); }} disabled={!name.trim() || loading}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-400 text-white font-black text-lg disabled:opacity-40 active:scale-95 transition-all shadow-lg shadow-emerald-500/30">
          {loading ? "Đang tham gia…" : "Tham gia ngay →"}
        </button>
      </div>
    </div>
  );
}

// ── Waiting ───────────────────────────────────────────────────────────────────
function StageWaiting({ userName }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-emerald-950 flex flex-col items-center justify-center gap-4 px-6 text-center">
      <img src="/mascot.png" alt="OPPO" className="w-24 h-24 object-contain" />
      <h1 className="text-2xl font-black text-white">Xin chào <span className="text-emerald-400">{userName}</span>!</h1>
      <div className="flex items-center gap-2 mt-2"><span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /><span className="text-emerald-400 text-sm">Chờ Host bắt đầu…</span></div>
    </div>
  );
}

// ── Stage 1: Ice Breaking ─────────────────────────────────────────────────────
function StageIceBreaking({ userId }) {
  const [heartCount, setHeartCount] = useState(0); const [burst, setBurst] = useState(false);
  useEffect(() => { const u = onValue(ref(db, "hearts"), (s) => setHeartCount(s.exists() ? Object.keys(s.val()).length : 0)); return () => u(); }, []);
  async function sendHeart() {
    setBurst(true); setTimeout(() => setBurst(false), 500);
    await push(ref(db, "hearts"), { userId, ts: Date.now() });
    const r = ref(db, `scores/${userId}/hearts`); const s = await get(r); await set(r, (s.exists() ? s.val() : 0) + 1);
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-emerald-950 flex flex-col items-center justify-center gap-8">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 bg-rose-500/10 border border-rose-500/30 rounded-full px-4 py-1.5 mb-4">
          <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
          <span className="text-rose-400 text-xs font-semibold tracking-widest">STAGE 1 — ICE BREAKING</span>
        </div>
        <h2 className="text-2xl font-black text-white">WELCOME TO</h2>
        <h3 className="text-xl font-black text-emerald-400">OPPO CULTURE WORKSHOP</h3>
        <p className="text-gray-400 text-sm mt-2">Thả tim để làm nóng không khí! 🔥</p>
      </div>
      <button onClick={sendHeart} className={`w-28 h-28 rounded-full bg-gradient-to-br from-rose-500 to-pink-600 text-6xl flex items-center justify-center shadow-xl active:scale-90 transition-all ${burst ? "scale-110" : "scale-100"}`}>❤️</button>
      <div className="text-center"><span className="text-white font-black text-4xl">{heartCount}</span><p className="text-gray-400 text-sm">tim đã gửi</p></div>
    </div>
  );
}

// ── Stage 2: Biết Để Hiểu ─────────────────────────────────────────────────────
function StageBietDeHieu({ userId, userName, sessionData }) {
  const questions = sessionData?.s2questions || [];
  const currentQ = sessionData?.s2current ?? 0;
  const showAns = sessionData?.s2showAnswer || false;
  const gameEnded = sessionData?.s2ended || false;
  const [input, setInput] = useState(""); const [submitted, setSubmitted] = useState(false); const [result, setResult] = useState(null); const [timeLeft, setTimeLeft] = useState(30);
  const timerRef = useRef(null);
  const q = questions[currentQ];

  useEffect(() => { setInput(""); setSubmitted(false); setResult(null); setTimeLeft(30); }, [currentQ]);
  useEffect(() => {
    if (!q || submitted || showAns || gameEnded) return;
    timerRef.current = setInterval(() => setTimeLeft((t) => { if (t <= 1) { clearInterval(timerRef.current); handleAutoSubmit(); return 0; } return t - 1; }), 1000);
    return () => clearInterval(timerRef.current);
  }, [currentQ, submitted, showAns, gameEnded]);

  async function handleAutoSubmit() {
    if (submitted) return; setSubmitted(true); setResult("wrong");
    await set(ref(db, `s2answers/${userId}_${currentQ}`), { userId, userName, answer: "", correct: false, ts: Date.now() });
  }
  async function handleSubmit() {
    if (submitted || !input.trim()) return;
    clearInterval(timerRef.current); setSubmitted(true);
    const isCorrect = normalizeText(input) === normalizeText(q.answer);
    setResult(isCorrect ? "correct" : "wrong");
    await set(ref(db, `s2answers/${userId}_${currentQ}`), { userId, userName, answer: input, correct: isCorrect, ts: Date.now() });
    if (isCorrect) { const r = ref(db, `scores/${userId}/s2`); const s = await get(r); await set(r, (s.exists() ? s.val() : 0) + 20); }
  }

  const [openValue, setOpenValue] = useState(null);
  if (gameEnded) {
    if (openValue !== null) {
      const val = CULTURE_VALUES[openValue];
      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-emerald-950 flex flex-col px-4 py-8 gap-5">
          <button onClick={() => setOpenValue(null)} className="text-gray-400 text-sm">← Quay lại</button>
          <div className={`bg-gradient-to-br ${val.color} rounded-3xl p-6`}><div className="text-4xl mb-2">{val.icon}</div><h2 className="text-white font-black text-2xl">{val.title}</h2></div>
          <div className="space-y-3">{val.behaviors.map((b, i) => <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-4"><p className="text-gray-200 text-sm leading-relaxed">{b}</p></div>)}</div>
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-emerald-950 flex flex-col px-4 py-8 gap-6">
        <div className="text-center"><h2 className="text-2xl font-black text-white">4 Giá Trị Văn Hóa OPPO</h2><p className="text-gray-400 text-sm mt-1">Bấm để xem chi tiết</p></div>
        <div className="grid grid-cols-2 gap-3">
          {CULTURE_VALUES.map((val, i) => (
            <button key={val.id} onClick={() => setOpenValue(i)} className={`bg-gradient-to-br ${val.color} rounded-2xl p-4 text-left active:scale-95`}>
              <div className="text-2xl mb-1">{val.icon}</div>
              <p className="text-white font-black text-sm">{val.title}</p>
              <p className="text-white/60 text-xs mt-1">Xem chi tiết →</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (!q) return <StageWaiting userName={userName} />;
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-emerald-950 flex flex-col px-4 py-6 gap-4">
      <div className="flex items-center justify-between">
        <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 rounded-full px-3 py-1"><span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" /><span className="text-blue-400 text-xs font-semibold">BIẾT ĐỂ HIỂU</span></div>
        <span className="text-gray-500 text-sm">Câu {currentQ + 1}/{questions.length}</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden"><div className={`h-full rounded-full transition-all duration-1000 ${timeLeft > 10 ? "bg-blue-500" : "bg-red-500"}`} style={{ width: `${(timeLeft / 30) * 100}%` }} /></div>
        <span className={`font-black text-lg w-8 text-right ${timeLeft <= 10 ? "text-red-400" : "text-white"}`}>{timeLeft}s</span>
      </div>
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex-1"><p className="text-white font-semibold text-base leading-relaxed">{q.question}</p></div>
      {!submitted ? (
        <div className="space-y-3">
          <input className="w-full bg-white/10 border border-white/20 rounded-2xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 text-lg"
            placeholder="Điền câu trả lời…" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSubmit()} autoFocus />
          <button onClick={handleSubmit} disabled={!input.trim()} className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-400 text-white font-black text-lg disabled:opacity-40 active:scale-95">Xác nhận ✓</button>
        </div>
      ) : (
        <div className={`py-5 rounded-2xl text-center font-black text-xl ${result === "correct" ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}>
          {result === "correct" ? "🎉 Chính xác! +20 điểm" : <div><p>❌ Chưa đúng!</p>{showAns && <p className="text-sm font-semibold mt-1">Đáp án: <span className="text-white font-black">{q.answer}</span></p>}</div>}
        </div>
      )}
    </div>
  );
}

// ── Stage 3: Giải Mã Hành Vi ──────────────────────────────────────────────────
function StageGiaiMaHanhVi({ userId, userName, sessionData }) {
  const questions = sessionData?.s3questions || [];
  const gameStartTime = sessionData?.s3startTime || null;
  const gameEnded = sessionData?.s3ended || false;
  const TOTAL_TIME = 600;
  const [answers, setAnswers] = useState({}); const [submitted, setSubmitted] = useState(false); const [timeLeft, setTimeLeft] = useState(TOTAL_TIME); const [currentView, setCurrentView] = useState(0);

  useEffect(() => {
    if (!gameStartTime || gameEnded) return;
    const tick = () => { const e = Math.floor((Date.now() - gameStartTime) / 1000); setTimeLeft(Math.max(0, TOTAL_TIME - e)); };
    tick(); const t = setInterval(tick, 1000); return () => clearInterval(t);
  }, [gameStartTime, gameEnded]);

  async function handleSubmitAll() {
    if (submitted) return; setSubmitted(true);
    const submitTime = Date.now();
    const elapsed = gameStartTime ? Math.floor((submitTime - gameStartTime) / 1000) : TOTAL_TIME;
    const bonus = Math.max(0, 50 - Math.floor(elapsed / 60) * 5);
    let correctCount = 0;
    const answersToSave = {};
    questions.forEach((q, i) => { const ans = answers[i] || null; const isCorrect = ans && ans === q.correct; if (isCorrect) correctCount++; answersToSave[i] = { answer: ans, correct: isCorrect }; });
    await set(ref(db, `s3answers/${userId}`), { userId, userName, answers: answersToSave, submitTime, elapsed, bonus, ts: Date.now() });
    const r = ref(db, `scores/${userId}/s3`); const s = await get(r); await set(r, (s.exists() ? s.val() : 0) + correctCount * 20 + bonus);
  }

  const answeredCount = Object.keys(answers).length;
  const mins = Math.floor(timeLeft / 60); const secs = timeLeft % 60;
  if (gameEnded || submitted) return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-emerald-950 flex flex-col items-center justify-center gap-4 text-center px-6">
      <div className="text-5xl">✅</div>
      <h2 className="text-2xl font-black text-white">Đã nộp bài!</h2>
      <p className="text-gray-400 text-sm">Chờ Host tổng kết…</p>
    </div>
  );
  if (!questions.length) return <StageWaiting userName={userName} />;
  const q = questions[currentView];
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-emerald-950 flex flex-col px-4 py-4 gap-3">
      <div className="flex items-center justify-between">
        <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/30 rounded-full px-3 py-1"><span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" /><span className="text-purple-400 text-xs font-semibold">GIẢI MÃ HÀNH VI</span></div>
        <div className={`font-black text-lg ${timeLeft < 60 ? "text-red-400 animate-pulse" : "text-white"}`}>⏱ {mins}:{secs.toString().padStart(2, "0")}</div>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-purple-500 rounded-full transition-all" style={{ width: `${(answeredCount / questions.length) * 100}%` }} /></div>
        <span className="text-gray-400 text-xs">{answeredCount}/{questions.length}</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {questions.map((_, i) => (
          <button key={i} onClick={() => setCurrentView(i)}
            className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${i === currentView ? "bg-purple-500 text-white scale-110" : answers[i] ? "bg-emerald-500/40 text-emerald-300" : "bg-white/10 text-gray-500"}`}>{i + 1}</button>
        ))}
      </div>
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4"><p className="text-gray-400 text-xs mb-1">Câu {currentView + 1}</p><p className="text-white font-semibold text-sm leading-relaxed">{q.question}</p></div>
      <div className="grid grid-cols-2 gap-2">
        {["A", "B", "C", "D"].map((ans) => {
          const COLORS = { A: "from-emerald-600 to-green-500", B: "from-teal-600 to-cyan-500", C: "from-green-600 to-emerald-500", D: "from-cyan-600 to-teal-500" };
          const isSelected = answers[currentView] === ans;
          return (
            <button key={ans} onClick={() => setAnswers((a) => ({ ...a, [currentView]: ans }))}
              className={`min-h-16 rounded-2xl font-bold text-sm px-3 py-2 active:scale-95 transition-all bg-gradient-to-br ${COLORS[ans]} text-white ${isSelected ? "ring-2 ring-white/40 scale-105 shadow-lg" : "opacity-60 hover:opacity-90"}`}>
              <span className="block text-lg font-black">{ans}</span>
              <span className="block text-xs leading-tight break-words whitespace-normal">{q[`opt${ans}`]}</span>
            </button>
          );
        })}
      </div>
      <div className="flex gap-2">
        <button onClick={() => setCurrentView((v) => Math.max(0, v - 1))} disabled={currentView === 0} className="px-4 py-3 rounded-xl bg-white/10 text-white font-bold disabled:opacity-30">←</button>
        <button onClick={() => setCurrentView((v) => Math.min(questions.length - 1, v + 1))} disabled={currentView === questions.length - 1} className="flex-1 py-3 rounded-xl bg-white/10 text-white font-bold disabled:opacity-30">Câu tiếp →</button>
        <button onClick={handleSubmitAll} className={`px-4 py-3 rounded-xl font-black text-sm transition-all ${answeredCount === questions.length ? "bg-emerald-500 text-white shadow-lg" : "bg-white/10 text-gray-400"}`}>Nộp ✓</button>
      </div>
    </div>
  );
}

// ── Stage 4: Thảo Luận Nhóm — Card Flip ──────────────────────────────────────
const CARD_THEMES = [
  { icon: "🎯", label: "BỔN PHẬN", color: "from-emerald-500 to-green-400", back: "from-emerald-900 to-green-900" },
  { icon: "🤝", label: "HƯỚNG ĐẾN\nKHÁCH HÀNG", color: "from-teal-500 to-cyan-400", back: "from-teal-900 to-cyan-900" },
  { icon: "⭐", label: "THEO ĐUỔI\nSỰ XUẤT SẮC", color: "from-green-500 to-emerald-400", back: "from-green-900 to-emerald-900" },
  { icon: "🏆", label: "HƯỚNG ĐẾN\nKẾT QUẢ", color: "from-cyan-500 to-teal-400", back: "from-cyan-900 to-teal-900" },
];

function CardFlip({ theme, flipped, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{ perspective: "800px", cursor: flipped ? "default" : "pointer" }}
      className="w-full aspect-[3/4]"
    >
      <div style={{
        position: "relative", width: "100%", height: "100%",
        transformStyle: "preserve-3d",
        transition: "transform 0.6s cubic-bezier(.4,2,.6,1)",
        transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
      }}>
        {/* Back side (face down) */}
        <div style={{ backfaceVisibility: "hidden", position: "absolute", inset: 0 }}
          className={`rounded-2xl bg-gradient-to-br ${theme.back} border-2 border-white/10 flex items-center justify-center shadow-xl`}>
          <span className="text-4xl opacity-30">🎴</span>
        </div>
        {/* Front side (face up) */}
        <div style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)", position: "absolute", inset: 0 }}
          className={`rounded-2xl bg-gradient-to-br ${theme.color} flex flex-col items-center justify-center gap-2 p-3 shadow-xl`}>
          <span className="text-3xl">{theme.icon}</span>
          <p className="text-white font-black text-xs text-center leading-tight whitespace-pre-line">{theme.label}</p>
        </div>
      </div>
    </div>
  );
}

function StageCardReveal({ onDone }) {
  const [flipped, setFlipped] = useState([false, false, false, false]);
  const allFlipped = flipped.every(Boolean);

  function flipCard(i) {
    setFlipped((prev) => prev.map((v, idx) => idx === i ? true : v));
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-emerald-950 flex flex-col px-4 py-8 gap-6">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 rounded-full px-4 py-1.5 mb-3">
          <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
          <span className="text-orange-400 text-xs font-semibold tracking-widest">STAGE 4 — THẢO LUẬN NHÓM</span>
        </div>
        <h2 className="text-xl font-black text-white">Lật bài để khám phá</h2>
        <p className="text-gray-400 text-sm mt-1">4 giá trị văn hóa OPPO</p>
      </div>

      <div className="grid grid-cols-2 gap-3 flex-1">
        {CARD_THEMES.map((theme, i) => (
          <CardFlip key={i} theme={theme} flipped={flipped[i]} onClick={() => flipCard(i)} />
        ))}
      </div>

      <button
        onClick={onDone}
        disabled={!allFlipped}
        className="w-full py-4 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-400 text-white font-black text-lg disabled:opacity-30 active:scale-95 transition-all shadow-lg"
      >
        {allFlipped ? "Bắt đầu thảo luận →" : `Lật hết ${flipped.filter(Boolean).length}/4 lá bài`}
      </button>
    </div>
  );
}

function StageThaoLuanNhom({ userId, sessionData }) {
  const groups = sessionData?.groups || [];
  const activeGroup = sessionData?.activeGroup || null;
  const [heartCount, setHeartCount] = useState(0);
  const [burst, setBurst] = useState(false);
  // FIX 1: cardsRevealed dùng localStorage để chỉ show 1 lần
  const [cardsRevealed, setCardsRevealed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("s4_cards_revealed") === "true";
  });

  const myGroup = groups.find((g) => (g.members || []).includes(userId));
  const activeGroupData = groups.find((g) => g.id === activeGroup);

  useEffect(() => {
    const u = onValue(ref(db, "groupHearts"), (s) => setHeartCount(s.exists() ? Object.keys(s.val()).length : 0));
    return () => u();
  }, []);

  function handleCardsDone() {
    localStorage.setItem("s4_cards_revealed", "true");
    setCardsRevealed(true);
  }

  // FIX 1: Bỏ điều kiện isActive — ai cũng tim được
  async function sendHeart() {
    setBurst(true); setTimeout(() => setBurst(false), 500);
    await push(ref(db, "groupHearts"), { userId, ts: Date.now() });
  }

  if (!cardsRevealed) {
    return <StageCardReveal onDone={handleCardsDone} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-emerald-950 flex flex-col px-4 py-6 gap-5">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 rounded-full px-4 py-1.5 mb-2">
          <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
          <span className="text-orange-400 text-xs font-semibold tracking-widest">STAGE 4 — THẢO LUẬN NHÓM</span>
        </div>
        {myGroup ? (
          <div>
            <p className="text-gray-400 text-sm">Nhóm của bạn:</p>
            <p className="text-2xl font-black text-orange-400">{myGroup.name}</p>
          </div>
        ) : (
          <p className="text-gray-400 text-sm mt-1">Chờ Host chia nhóm…</p>
        )}
      </div>

      {/* Đang trình bày */}
      {activeGroupData ? (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-center space-y-4">
          <p className="text-gray-400 text-sm">Đang trình bày:</p>
          <p className="text-2xl font-black text-white">{activeGroupData.name}</p>
          <p className="text-gray-400 text-sm">Thả tim ủng hộ nhóm! ❤️</p>
          {/* FIX 1: Nút tim luôn hoạt động cho tất cả */}
          <button
            onClick={sendHeart}
            className={`w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-rose-500 to-pink-600 text-4xl flex items-center justify-center shadow-xl active:scale-90 transition-all ${burst ? "scale-110" : "scale-100"}`}
          >❤️</button>
          <p className="text-white font-black text-2xl">{heartCount} <span className="text-gray-400 text-sm font-normal">tim</span></p>
        </div>
      ) : (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
          <div className="flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
            <span className="text-orange-400 text-sm">Chờ Host chọn nhóm trình bày…</span>
          </div>
        </div>
      )}

      {/* Danh sách nhóm */}
      {groups.length > 0 && (
        <div className="space-y-2">
          <p className="text-gray-500 text-xs font-semibold uppercase tracking-wide">Các nhóm</p>
          <div className="grid grid-cols-2 gap-2">
            {groups.map((g) => (
              <div key={g.id}
                className={`rounded-xl px-3 py-2.5 text-sm font-bold text-center transition-all ${g.id === activeGroup ? "bg-orange-500 text-white shadow-lg shadow-orange-500/30" : "bg-white/5 border border-white/10 text-gray-400"}`}>
                {g.name}
                {g.id === activeGroup && <span className="block text-xs font-normal opacity-80">🎤 Đang present</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Stage 5: DNA Sharing ──────────────────────────────────────────────────────
function StageDNASharing({ userId }) {
  const [heartCount, setHeartCount] = useState(0); const [burst, setBurst] = useState(false);
  useEffect(() => { const u = onValue(ref(db, "hearts"), (s) => setHeartCount(s.exists() ? Object.keys(s.val()).length : 0)); return () => u(); }, []);
  async function sendHeart() {
    setBurst(true); setTimeout(() => setBurst(false), 500);
    await push(ref(db, "hearts"), { userId, ts: Date.now() });
    const r = ref(db, `scores/${userId}/hearts`); const s = await get(r); await set(r, (s.exists() ? s.val() : 0) + 1);
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-emerald-950 flex flex-col items-center justify-center gap-8">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/30 rounded-full px-4 py-1.5 mb-4"><span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" /><span className="text-purple-400 text-xs font-semibold tracking-widest">STAGE 5 — DNA SHARING</span></div>
        <h2 className="text-2xl font-black text-white">Lắng nghe & cảm nhận 💬</h2>
        <p className="text-gray-400 text-sm mt-2">Thả tim ủng hộ người chia sẻ!</p>
      </div>
      <button onClick={sendHeart} className={`w-28 h-28 rounded-full bg-gradient-to-br from-rose-500 to-pink-600 text-6xl flex items-center justify-center shadow-xl active:scale-90 transition-all ${burst ? "scale-110" : "scale-100"}`}>❤️</button>
      <p className="text-white font-black text-2xl">{heartCount} <span className="text-gray-400 text-sm font-normal">tim</span></p>
    </div>
  );
}

// ── Stage 6: Keywords ─────────────────────────────────────────────────────────
function StageKeywords({ userId, userName }) {
  const [keywords, setKeywords] = useState(["", "", ""]);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit() {
    const filled = keywords.filter((k) => k.trim());
    if (filled.length < 3) return alert("Hãy điền đủ 3 keyword nhé!");
    setSubmitted(true);
    await set(ref(db, `keywords/${userId}`), { userId, userName, words: keywords.map((k) => k.trim()), ts: Date.now() });
  }

  if (submitted) return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-emerald-950 flex flex-col items-center justify-center gap-4 text-center px-6">
      <div className="text-5xl">✨</div>
      <h2 className="text-2xl font-black text-white">Đã gửi keyword!</h2>
      <div className="flex flex-wrap justify-center gap-3 mt-2">
        {keywords.map((k, i) => <span key={i} className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-bold px-4 py-2 rounded-full text-sm">{k}</span>)}
      </div>
      <p className="text-gray-400 text-sm mt-2">Hãy xem màn hình chiếu nhé! 🎉</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-emerald-950 flex flex-col items-center justify-center gap-6 px-6">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/30 rounded-full px-4 py-1.5 mb-4"><span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" /><span className="text-cyan-400 text-xs font-semibold tracking-widest">STAGE 6 — KEYWORDS</span></div>
        <h2 className="text-2xl font-black text-white">3 từ bạn nhớ nhất</h2>
        <p className="text-gray-400 text-sm mt-1">sau buổi workshop hôm nay</p>
      </div>
      <div className="w-full max-w-xs space-y-3">
        {keywords.map((k, i) => (
          <div key={i} className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500 font-black text-lg">{i + 1}.</span>
            <input className="w-full bg-white/10 border border-white/20 rounded-2xl pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 text-lg font-semibold"
              placeholder={`Keyword ${i + 1}…`} value={k} onChange={(e) => setKeywords((prev) => prev.map((x, j) => j === i ? e.target.value : x))} maxLength={20} />
          </div>
        ))}
        <button onClick={handleSubmit} disabled={keywords.filter((k) => k.trim()).length < 3}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-teal-400 text-white font-black text-lg disabled:opacity-40 active:scale-95 transition-all shadow-lg">
          Gửi keyword ✨
        </button>
      </div>
    </div>
  );
}

// ── Stage 7: Kết quả ──────────────────────────────────────────────────────────
function StageKetQua({ userId }) {
  const [scores, setScores] = useState([]); const [myRank, setMyRank] = useState(null);
  useEffect(() => {
    const u = onValue(ref(db, "scores"), (snap) => {
      if (!snap.exists()) return;
      const list = Object.entries(snap.val()).filter(([_, s]) => s.name)
        .map(([uid, s]) => ({ uid, name: s.name, total: (s.s2 || 0) + (s.s3 || 0) + (s.hearts || 0) + (s.groupHearts || 0) }))
        .sort((a, b) => b.total - a.total);
      setScores(list); setMyRank(list.findIndex((x) => x.uid === userId) + 1);
    });
    return () => u();
  }, [userId]);
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-emerald-950 flex flex-col px-4 py-8 gap-5">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 rounded-full px-4 py-1.5 mb-3"><span className="text-yellow-400 text-xs font-semibold tracking-widest">🏆 KẾT QUẢ</span></div>
        {myRank > 0 && <p className="text-white font-black text-lg">Bạn xếp hạng <span className="text-yellow-400 text-3xl">#{myRank}</span></p>}
      </div>
      <div className="space-y-2">
        {scores.slice(0, 10).map((s, i) => (
          <div key={s.uid} className={`flex items-center gap-3 rounded-2xl px-4 py-3 ${s.uid === userId ? "bg-emerald-500/20 border border-emerald-500/40" : "bg-white/5 border border-white/10"}`}>
            <span className="text-lg font-black text-gray-400 w-6">{i + 1}</span>
            <span className="flex-1 text-white font-semibold text-sm truncate">{s.name}</span>
            <span className="text-emerald-400 font-black">{s.total}đ</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function EmployeePage() {
  const [userId, setUserId] = useState(null);
  const [userName, setUserName] = useState(null);
  const [stage, setStage] = useState(0);
  const [sessionData, setSessionData] = useState(null);

  useEffect(() => {
    setUserId(getUserId());
    const n = typeof window !== "undefined" ? localStorage.getItem("oppo_name") : null;
    if (n) setUserName(n);
  }, []);

  useEffect(() => {
    const u = onValue(ref(db, "session"), (snap) => {
      if (!snap.exists()) return;
      const d = snap.val();
      setStage(d.stage ?? 0);
      setSessionData(d);
    });
    return () => u();
  }, []);

  // Reset card reveal state khi stage thay đổi khỏi stage 4
  useEffect(() => {
    if (stage !== 4 && typeof window !== "undefined") {
      localStorage.removeItem("s4_cards_revealed");
    }
  }, [stage]);

  async function handleJoin(name, dept) {
    const uid = getUserId(); setUserName(name); localStorage.setItem("oppo_name", name);
    await set(ref(db, `users/${uid}`), { name, dept, joinedAt: Date.now() });
    await set(ref(db, `scores/${uid}/name`), name);
  }

  if (!userId) return null;
  if (!userName) return <StageLogin onJoin={handleJoin} />;

  const renderStage = () => {
    if (stage === 0) return <StageWaiting userName={userName} />;
    if (stage === 1) return <StageIceBreaking userId={userId} />;
    if (stage === 2) return <StageBietDeHieu userId={userId} userName={userName} sessionData={sessionData} />;
    if (stage === 3) return <StageGiaiMaHanhVi userId={userId} userName={userName} sessionData={sessionData} />;
    if (stage === 4) return <StageThaoLuanNhom userId={userId} sessionData={sessionData} />;
    if (stage === 5) return <StageDNASharing userId={userId} />;
    if (stage === 6) return <StageKeywords userId={userId} userName={userName} />;
    if (stage === 7) return <StageKetQua userId={userId} />;
    return null;
  };

  return (
    <>
      <Head><title>OPPO Culture Workshop</title></Head>
      {/* FIX 2: Chuyển cảnh mượt */}
      <StageTransition stage={stage}>
        {renderStage()}
      </StageTransition>
    </>
  );
}
