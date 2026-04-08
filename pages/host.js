// pages/host.js — Màn hình Máy chiếu (7 stages)
import { useEffect, useState, useRef } from "react";
import { db } from "../firebase";
import { ref, onValue, set, remove } from "firebase/database";
import Head from "next/head";
import { CULTURE_VALUES } from "../data/cultureValues";
import QRCode from "qrcode";

const DEFAULT_CARDS_FALLBACK = [
  { id: "c1", icon: "🎯", label: "BỔN PHẬN", color: "from-emerald-500 to-green-400", back: "from-emerald-900 to-green-900" },
  { id: "c2", icon: "🤝", label: "HƯỚNG ĐẾN KHÁCH HÀNG", color: "from-teal-500 to-cyan-400", back: "from-teal-900 to-cyan-900" },
  { id: "c3", icon: "⭐", label: "THEO ĐUỔI SỰ XUẤT SẮC", color: "from-green-500 to-emerald-400", back: "from-green-900 to-emerald-900" },
  { id: "c4", icon: "🏆", label: "HƯỚNG ĐẾN KẾT QUẢ", color: "from-cyan-500 to-teal-400", back: "from-cyan-900 to-teal-900" },
];

// Tim có kích thước to nhỏ xen kẽ
function FloatingHeart({ id, x, onDone }) {
  const emojis = ["❤️", "💚", "🩷", "💛", "🧡", "❤️", "🩷", "❤️"];
  const emoji = emojis[id % emojis.length];
  const sizes = [48, 80, 56, 120, 64, 96, 44, 140];
  const size = sizes[id % sizes.length];
  const dur = 2.5 + (id % 5) * 0.6;
  useEffect(() => { const t = setTimeout(onDone, dur * 1000); return () => clearTimeout(t); }, []);
  return <span className="absolute bottom-0 pointer-events-none select-none" style={{ left: `${x}%`, fontSize: size, animation: `floatUp ${dur}s ease-out forwards` }}>{emoji}</span>;
}

function JoinPopup({ name, dept, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t); }, []);
  return (
    <div className="animate-slideIn flex items-center gap-4 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl px-6 py-4 shadow-xl">
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-green-400 flex items-center justify-center text-white font-black text-xl">{name.charAt(0).toUpperCase()}</div>
      <div><p className="text-white font-bold text-lg">{name}</p>{dept && <p className="text-emerald-400 text-sm">{dept}</p>}</div>
      <span className="text-emerald-400 ml-2">đã tham gia ✓</span>
    </div>
  );
}

// Keywords: màu emerald tối trên nền trắng
function FloatingKeyword({ word, x, y, size, delay, speed }) {
  const EMERALD_DARK = [
    "#022c22", "#064e3b", "#065f46", "#047857",
    "#059669", "#10b981", "#34d399", "#6ee7b7",
    "#0f766e", "#115e59", "#134e4a", "#0f766e"
  ];
  const color = EMERALD_DARK[Math.floor(Math.abs(word.charCodeAt(0) + x * 7)) % EMERALD_DARK.length];
  return (
    <span
      className="absolute font-black select-none pointer-events-none"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        fontSize: size,
        color,
        animation: `floatKeyword ${speed}s ease-in-out ${delay}s infinite alternate`,
        textShadow: `0 4px 20px ${color}44`,
        filter: `drop-shadow(0 2px 8px ${color}33)`,
      }}
    >{word}</span>
  );
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
      }, 400);
      return () => clearTimeout(t);
    } else {
      setContent(children);
    }
  }, [stage, children]);

  return (
    <div style={{
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(12px)",
      transition: "opacity 0.4s ease, transform 0.4s ease",
      height: "100%", width: "100%",
    }}>
      {content}
    </div>
  );
}

// Stage 0: Welcome
function HostWelcome({ url, users, onStart, sessionData }) {
  const [qr, setQr] = useState("");
  const [popups, setPopups] = useState([]);
  const prevCount = useRef(0); const popupId = useRef(0);

  const stageTitle = sessionData?.stageConfig?.[0]?.title || "OPPO CULTURE WORKSHOP";
  const stageSubtitle = sessionData?.stageConfig?.[0]?.subtitle || "Quét QR để tham gia";

  useEffect(() => {
    if (!url) return;
    QRCode.toDataURL(url, { width: 360, margin: 2, color: { dark: "#ffffff", light: "#00000000" } }).then(setQr).catch(console.error);
  }, [url]);
  useEffect(() => {
    if (users.length > prevCount.current) {
      users.slice(prevCount.current).forEach((u) => { const id = popupId.current++; setPopups((p) => [...p, { id, name: u.name, dept: u.dept }]); });
    }
    prevCount.current = users.length;
  }, [users]);
  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col items-center justify-center gap-8">
        <img src="/mascot.png" alt="OPPO Mascot" className="w-52 h-52 object-contain drop-shadow-2xl" onError={(e) => { e.target.style.display = "none"; }} />
        <div className="text-center">
          <h1 className="text-9xl font-black text-white tracking-tight leading-none">OPPO</h1>
          <h2 className="text-6xl font-black text-emerald-400 tracking-wider mt-2">{stageTitle}</h2>
        </div>
        {qr && (
          <div className="flex flex-col items-center gap-4">
            <div className="bg-white/10 border border-white/20 rounded-3xl p-6"><img src={qr} alt="QR" className="w-64 h-64" /></div>
            <p className="text-gray-300 text-2xl">{stageSubtitle}</p>
            <p className="text-emerald-400 font-mono text-lg">{url}</p>
          </div>
        )}
        <button onClick={onStart} disabled={users.length === 0}
          className="px-20 py-6 rounded-3xl bg-gradient-to-r from-emerald-500 to-green-400 text-white font-black text-3xl hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-emerald-500/40 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100">
          {users.length === 0 ? "Chờ người tham gia…" : `🚀 Bắt đầu (${users.length} người)`}
        </button>
      </div>
      <div className="w-96 flex flex-col border-l border-white/10 p-8 gap-5">
        <div className="flex items-center gap-3">
          <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
          <p className="text-emerald-400 font-bold text-lg uppercase tracking-widest">Người tham gia</p>
          <span className="ml-auto bg-emerald-500/20 text-emerald-400 font-black text-xl px-4 py-1.5 rounded-full">{users.length}</span>
        </div>
        <div className="flex-1 overflow-y-auto space-y-3">
          {users.length === 0 && <p className="text-gray-600 text-lg text-center mt-8">Chưa có ai…</p>}
          {users.map((u) => (
            <div key={u.uid} className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-green-400 flex items-center justify-center text-white font-black">{u.name?.charAt(0).toUpperCase()}</div>
              <div className="min-w-0"><p className="text-white text-base font-semibold truncate">{u.name}</p>{u.dept && <p className="text-gray-500 text-sm truncate">{u.dept}</p>}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="fixed top-8 right-8 flex flex-col gap-4 z-50 pointer-events-none" style={{ maxWidth: 380 }}>
        {popups.map((p) => <JoinPopup key={p.id} name={p.name} dept={p.dept} onDone={() => setPopups((x) => x.filter((i) => i.id !== p.id))} />)}
      </div>
    </div>
  );
}

// Stage 1: Ice Breaking
function HostIceBreaking({ totalHearts, users, sessionData }) {
  const title = sessionData?.stageConfig?.[1]?.title || "WELCOME TO OPPO CULTURE WORKSHOP";
  const subtitle = sessionData?.stageConfig?.[1]?.subtitle || "Thả tim để làm nóng không khí! 🔥";
  return (
    <div className="flex flex-col items-center justify-center h-full gap-10">
      <div className="inline-flex items-center gap-4 bg-rose-500/10 border border-rose-500/30 rounded-full px-8 py-3">
        <span className="w-4 h-4 rounded-full bg-rose-400 animate-pulse" />
        <span className="text-rose-400 text-3xl font-black tracking-widest">STAGE 1 — ICE BREAKING</span>
      </div>
      <h1 className="text-7xl font-black text-white leading-tight text-center">{title}</h1>
      {subtitle && <p className="text-gray-400 text-2xl">{subtitle}</p>}
      <p className="text-[10rem] font-black text-rose-400 leading-none">{totalHearts} ❤️</p>
      <div className="flex flex-wrap justify-center gap-4 max-w-5xl px-8">
        {users.map((u) => <span key={u.uid} className="bg-white/10 border border-white/20 rounded-full px-6 py-2 text-white text-xl">{u.name}</span>)}
      </div>
    </div>
  );
}

// Stage 2: Biết Để Hiểu
function HostBietDeHieu({ sessionData, s2answers, onShowAnswer, onNext }) {
  const questions = sessionData?.s2questions || [];
  const currentQ = sessionData?.s2current ?? 0;
  const showAns = sessionData?.s2showAnswer || false;
  const gameEnded = sessionData?.s2ended || false;
  const [timeLeft, setTimeLeft] = useState(30);
  const timerRef = useRef(null);
  const q = questions[currentQ];

  const title = sessionData?.stageConfig?.[2]?.title || "BIẾT ĐỂ HIỂU";
  const subtitle = sessionData?.stageConfig?.[2]?.subtitle || "";

  useEffect(() => {
    setTimeLeft(30); clearInterval(timerRef.current);
    if (!q || gameEnded) return;
    timerRef.current = setInterval(() => setTimeLeft((t) => { if (t <= 1) { clearInterval(timerRef.current); return 0; } return t - 1; }), 1000);
    return () => clearInterval(timerRef.current);
  }, [currentQ, gameEnded]);
  const answered = Object.values(s2answers).filter((a) => a.userId).length;

  if (gameEnded) return (
    <div className="flex flex-col items-center justify-center h-full gap-12 px-16">
      <div className="text-center">
        <h2 className="text-6xl font-black text-white mb-3">4 Giá Trị Văn Hóa OPPO</h2>
        <p className="text-gray-400 text-2xl">Speaker diễn giải thêm về từng giá trị</p>
      </div>
      <div className="grid grid-cols-2 gap-8 w-full max-w-6xl">
        {CULTURE_VALUES.map((val) => (
          <div key={val.id} className={`bg-gradient-to-br ${val.color} rounded-3xl p-10`}>
            <div className="text-6xl mb-4">{val.icon}</div>
            <h3 className="text-white font-black text-4xl mb-5">{val.title}</h3>
            <div className="space-y-3">{val.behaviors.map((b, i) => <p key={i} className="text-white/80 text-lg">• {b}</p>)}</div>
          </div>
        ))}
      </div>
    </div>
  );
  if (!q) return <div className="flex items-center justify-center h-full"><p className="text-gray-400 text-3xl">Thêm câu hỏi Stage 2 trong Admin.</p></div>;
  return (
    <div className="flex flex-col h-full p-12 gap-8">
      <div className="flex items-center justify-between">
        <div className="inline-flex items-center gap-4 bg-blue-500/10 border border-blue-500/30 rounded-full px-8 py-3">
          <span className="w-4 h-4 rounded-full bg-blue-400 animate-pulse" />
          <span className="text-blue-400 text-2xl font-bold">STAGE 2 — {title}</span>
        </div>
        <div className="flex items-center gap-6">
          <span className="text-gray-400 text-2xl">Câu {currentQ + 1}/{questions.length}</span>
          <div className={`font-black text-5xl ${timeLeft <= 10 ? "text-red-400 animate-pulse" : "text-white"}`}>{timeLeft}s</div>
        </div>
      </div>
      {subtitle && <p className="text-gray-500 text-xl -mt-4">{subtitle}</p>}
      <div className="h-4 bg-white/10 rounded-full overflow-hidden"><div className={`h-full rounded-full transition-all duration-1000 ${timeLeft > 10 ? "bg-blue-500" : "bg-red-500"}`} style={{ width: `${(timeLeft / 30) * 100}%` }} /></div>
      <div className="bg-white/5 border border-white/10 rounded-3xl p-12 flex-1 flex items-center justify-center"><p className="text-white text-5xl font-bold leading-relaxed text-center">{q.question}</p></div>
      {showAns && <div className="bg-emerald-500/20 border border-emerald-500/40 rounded-3xl px-10 py-6 text-center"><p className="text-emerald-400 font-black text-4xl">✓ Đáp án: {q.answer}</p></div>}
      <div className="flex items-center justify-between">
        <span className="text-gray-500 text-2xl">{answered} người đã trả lời</span>
        {!showAns ? (
          <button onClick={onShowAnswer} className="px-12 py-5 rounded-2xl bg-yellow-500 text-black font-black text-2xl hover:bg-yellow-400 active:scale-95 transition-all">📢 Hiện đáp án</button>
        ) : (
          <button onClick={onNext} className="px-12 py-5 rounded-2xl bg-emerald-500 text-white font-black text-2xl hover:bg-emerald-400 active:scale-95 transition-all">{currentQ < questions.length - 1 ? "Câu tiếp →" : "Kết thúc ✓"}</button>
        )}
      </div>
    </div>
  );
}

// Stage 3: Giải Mã Hành Vi
function HostGiaiMaHanhVi({ sessionData, s3answers, users, onEndGame }) {
  const gameEnded = sessionData?.s3ended || false;
  const gameStartTime = sessionData?.s3startTime || null;
  const TOTAL_TIME = 600;
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const [reviewIdx, setReviewIdx] = useState(0);
  const questions = sessionData?.s3questions || [];
  const title = sessionData?.stageConfig?.[3]?.title || "GIẢI MÃ HÀNH VI";
  const subtitle = sessionData?.stageConfig?.[3]?.subtitle || "";

  useEffect(() => {
    if (!gameStartTime || gameEnded) return;
    const tick = () => { const e = Math.floor((Date.now() - gameStartTime) / 1000); setTimeLeft(Math.max(0, TOTAL_TIME - e)); };
    tick(); const t = setInterval(tick, 1000); return () => clearInterval(t);
  }, [gameStartTime, gameEnded]);

  const submitted = Object.keys(s3answers).length;
  const total = users.length;
  const mins = Math.floor(timeLeft / 60); const secs = timeLeft % 60;
  const leaderboard = Object.values(s3answers).sort((a, b) => a.elapsed - b.elapsed).slice(0, 5);

  // ── Review Screen khi game kết thúc ──
  if (gameEnded && questions.length > 0) {
    const q = questions[reviewIdx];
    const OPT_COLORS = { A: "from-emerald-600 to-green-500", B: "from-teal-600 to-cyan-500", C: "from-green-600 to-emerald-500", D: "from-cyan-600 to-teal-500" };
    // Tính thống kê chọn đáp án
    const answerStats = { A: 0, B: 0, C: 0, D: 0 };
    Object.values(s3answers).forEach((r) => {
      const ans = r.answers?.[reviewIdx]?.answer;
      if (ans && answerStats[ans] !== undefined) answerStats[ans]++;
    });
    const maxVotes = Math.max(...Object.values(answerStats), 1);

    return (
      <div className="flex flex-col h-full p-10 gap-6">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-4 bg-purple-500/10 border border-purple-500/30 rounded-full px-8 py-3">
            <span className="w-4 h-4 rounded-full bg-purple-400 animate-pulse" />
            <span className="text-purple-400 text-2xl font-bold">REVIEW — {title}</span>
          </div>
          <span className="text-gray-500 text-2xl">Câu {reviewIdx + 1} / {questions.length}</span>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 flex-1 flex flex-col gap-6">
          <p className="text-white text-4xl font-bold leading-relaxed">{q.question}</p>
          <div className="grid grid-cols-2 gap-4 flex-1">
            {["A", "B", "C", "D"].map((opt) => {
              const isCorrect = opt === q.correct;
              const count = answerStats[opt];
              const pct = Math.round((count / Math.max(submitted, 1)) * 100);
              return (
                <div key={opt} className={`rounded-2xl p-5 relative overflow-hidden border-2 ${isCorrect ? "border-emerald-400 bg-emerald-500/10" : "border-white/10 bg-white/5"}`}>
                  <div className="absolute inset-0 rounded-2xl opacity-20 bg-gradient-to-br " style={{ width: `${pct}%`, background: isCorrect ? "#10b981" : "#6b7280", transition: "width 1s ease" }} />
                  <div className="relative z-10 flex items-start gap-3">
                    <span className={`text-3xl font-black ${isCorrect ? "text-emerald-400" : "text-gray-400"}`}>{opt}</span>
                    <div className="flex-1">
                      <p className={`text-xl font-semibold leading-tight ${isCorrect ? "text-emerald-300" : "text-white"}`}>{q[`opt${opt}`]}</p>
                      <p className={`text-lg mt-2 font-black ${isCorrect ? "text-emerald-400" : "text-gray-400"}`}>{count} người ({pct}%)</p>
                    </div>
                    {isCorrect && <span className="text-4xl">✅</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between gap-4">
          <button onClick={() => setReviewIdx((i) => Math.max(0, i - 1))} disabled={reviewIdx === 0}
            className="px-10 py-5 rounded-2xl bg-white/10 text-white font-black text-2xl disabled:opacity-30 hover:bg-white/20 active:scale-95">
            ← Trước
          </button>
          <p className="text-gray-500 text-xl">{submitted} người đã nộp bài</p>
          {reviewIdx < questions.length - 1 ? (
            <button onClick={() => setReviewIdx((i) => i + 1)}
              className="px-10 py-5 rounded-2xl bg-purple-600 text-white font-black text-2xl hover:bg-purple-500 active:scale-95">
              Tiếp →
            </button>
          ) : (
            <div className="px-10 py-5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-black text-2xl text-center">
              ✅ Đã xem hết
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full p-12 gap-10">
      <div className="flex-1 flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-4 bg-purple-500/10 border border-purple-500/30 rounded-full px-8 py-3">
              <span className="w-4 h-4 rounded-full bg-purple-400 animate-pulse" />
              <span className="text-purple-400 text-2xl font-bold">STAGE 3 — {title}</span>
            </div>
            {subtitle && <p className="text-gray-500 text-lg mt-2 ml-2">{subtitle}</p>}
          </div>
          <div className={`font-black text-7xl ${timeLeft < 60 ? "text-red-400 animate-pulse" : "text-white"}`}>⏱ {mins}:{secs.toString().padStart(2, "0")}</div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-8">
          <p className="text-[10rem] font-black text-white leading-none">{submitted}</p>
          <p className="text-4xl text-gray-400">/ {total} đã nộp bài</p>
          <div className="w-full max-w-2xl h-6 bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-purple-500 to-violet-400 rounded-full transition-all duration-500" style={{ width: `${total > 0 ? (submitted / total) * 100 : 0}%` }} /></div>
          <p className="text-gray-500 text-xl">{questions.length} câu hỏi</p>
          {submitted >= total && total > 0 && (
            <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl px-6 py-3">
              <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
              <p className="text-emerald-400 text-2xl font-bold">✅ Tất cả đã nộp bài!</p>
            </div>
          )}
        </div>
        {!gameEnded ? <div className="text-center"><button onClick={onEndGame} className="px-16 py-6 rounded-3xl bg-purple-600 text-white font-black text-3xl hover:bg-purple-500 active:scale-95 transition-all">Kết thúc ✓</button></div>
          : <p className="text-center text-emerald-400 font-black text-3xl">✅ Đã kết thúc</p>}
      </div>
      <div className="w-80 flex flex-col border-l border-white/10 pl-10 gap-5">
        <p className="text-white font-black text-2xl">🏃 Nộp sớm nhất</p>
        {leaderboard.length === 0 && <p className="text-gray-600 text-lg">Chưa có ai…</p>}
        {leaderboard.map((s, i) => { const m = Math.floor(s.elapsed / 60); const sc = s.elapsed % 60; return (
          <div key={s.userId} className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl px-5 py-4">
            <span className="text-yellow-400 font-black text-2xl">#{i + 1}</span>
            <div className="flex-1"><p className="text-white text-lg font-semibold truncate">{s.userName}</p><p className="text-gray-500 text-sm">{m}:{sc.toString().padStart(2, "0")} • +{s.bonus}đ</p></div>
          </div>
        ); })}
      </div>
    </div>
  );
}

// Stage 4: Thảo Luận Nhóm — Hiển thị thẻ bài theo nhóm
function HostThaoLuanNhom({ sessionData, totalGroupHearts }) {
  const groups = sessionData?.groups || [];
  const activeGroup = sessionData?.activeGroup || null;
  const groupCards = sessionData?.groupCards || {};
  const cards = sessionData?.cards || DEFAULT_CARDS_FALLBACK;
  const activeGroupData = groups.find((g) => g.id === activeGroup);
  const title = sessionData?.stageConfig?.[4]?.title || "THẢO LUẬN NHÓM";
  const subtitle = sessionData?.stageConfig?.[4]?.subtitle || "";

  return (
    <div className="flex flex-col h-full p-10 gap-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <div className="inline-flex items-center gap-4 bg-orange-500/10 border border-orange-500/30 rounded-full px-8 py-3">
            <span className="w-4 h-4 rounded-full bg-orange-400 animate-pulse" />
            <span className="text-orange-400 text-2xl font-black tracking-widest">STAGE 4 — {title}</span>
          </div>
          {subtitle && <p className="text-gray-400 text-lg mt-1 ml-2">{subtitle}</p>}
        </div>
        {activeGroupData && (
          <div className="flex items-center gap-3 bg-orange-500/20 border border-orange-500/40 rounded-2xl px-6 py-3">
            <span className="text-2xl">🎤</span>
            <div>
              <p className="text-orange-400 text-sm">Đang present:</p>
              <p className="text-white font-black text-xl">{activeGroupData.name}</p>
            </div>
            {totalGroupHearts > 0 && <p className="text-rose-400 font-black text-2xl ml-3">{totalGroupHearts} ❤️</p>}
          </div>
        )}
      </div>

      {/* Card Grid — lật khi nhóm chọn */}
      <div className={`grid gap-5 flex-1 ${cards.length <= 4 ? "grid-cols-4" : "grid-cols-4"}`}>
        {cards.map((card) => {
          const pickedByGroupId = Object.entries(groupCards).find(([, cId]) => cId === card.id)?.[0];
          const pickedByGroup = pickedByGroupId ? groups.find((g) => g.id === pickedByGroupId) : null;
          const isFlipped = !!pickedByGroupId;
          const isActive = pickedByGroupId === activeGroup;
          return (
            <div key={card.id} style={{ perspective: "1200px" }} className="relative">
              <div style={{
                transformStyle: "preserve-3d",
                transition: "transform 1s cubic-bezier(.4,2,.6,1)",
                transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                width: "100%", paddingBottom: "133%", position: "relative"
              }}>
                {/* Mặt úp */}
                <div style={{ backfaceVisibility: "hidden", position: "absolute", inset: 0 }}
                  className={`rounded-3xl bg-gradient-to-br ${card.back || "from-gray-800 to-gray-700"} flex items-center justify-center shadow-2xl border border-white/10`}>
                  <span className="text-8xl opacity-10">🎴</span>
                </div>
                {/* Mặt ngửa */}
                <div style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)", position: "absolute", inset: 0 }}
                  className={`rounded-3xl bg-gradient-to-br ${card.color} flex flex-col items-center justify-center gap-4 p-6 shadow-2xl ${isActive ? "ring-4 ring-white/60" : ""}`}>
                  <span className="text-6xl">{card.icon}</span>
                  <p className="text-white font-black text-2xl text-center leading-tight">{card.label}</p>
                  {pickedByGroup && (
                    <div className="bg-black/30 rounded-2xl px-5 py-2 text-center mt-1">
                      <p className="text-white/70 text-sm">Nhóm</p>
                      <p className="text-white font-black text-xl">{pickedByGroup.name}</p>
                      {isActive && <span className="text-orange-300 text-sm">🎤 Present</span>}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Groups status */}
      <div className="flex flex-wrap justify-center gap-3 flex-shrink-0">
        {groups.map((g) => {
          const hasCard = !!groupCards[g.id];
          return (
            <div key={g.id} className={`px-6 py-3 rounded-2xl text-xl font-bold transition-all
              ${g.id === activeGroup ? "bg-orange-500 text-white shadow-lg shadow-orange-500/30 scale-110"
              : hasCard ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-400"
              : "bg-white/5 text-gray-500"}`}>
              {g.name} {hasCard ? "✓" : "⌛"}
              {g.id === activeGroup && <span className="block text-sm font-normal opacity-80">🎤 Present</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Stage 5: DNA Sharing — Không hiện số tim, chỉ floating hearts
function HostDNASharing({ sessionData }) {
  const title = sessionData?.stageConfig?.[5]?.title || "DNA SHARING";
  const subtitle = sessionData?.stageConfig?.[5]?.subtitle || "Lắng nghe những câu chuyện thực tế";
  return (
    <div className="flex flex-col items-center justify-center h-full gap-10">
      <div className="inline-flex items-center gap-4 bg-purple-500/10 border border-purple-500/30 rounded-full px-8 py-3">
        <span className="w-4 h-4 rounded-full bg-purple-400 animate-pulse" />
        <span className="text-purple-400 text-3xl font-black tracking-widest">STAGE 5 — {title}</span>
      </div>
      <h2 className="text-7xl font-black text-white text-center leading-tight max-w-4xl">{subtitle}</h2>
      <p className="text-gray-400 text-2xl">Thả tim ủng hộ người chia sẻ ❤️</p>
    </div>
  );
}

// FIX 6: Stage 6 — Keywords với màu nổi bật, tránh tràn header
function HostKeywords({ keywords, sessionData }) {
  const allWords = keywords.flatMap((k) => k.words || []);
  const [floaters, setFloaters] = useState([]);
  const title = sessionData?.stageConfig?.[6]?.title || "KEYWORDS";
  const subtitle = sessionData?.stageConfig?.[6]?.subtitle || "";

  useEffect(() => {
    // Kích thước lớn hơn, y bắt đầu từ 18% để tránh đè header
    const placed = allWords.map((word, i) => ({
      word, id: i,
      x: 3 + Math.random() * 88,
      y: 18 + Math.random() * 72,
      size: 48 + Math.random() * 56,
      delay: Math.random() * 4,
      speed: 2.5 + Math.random() * 3,
    }));
    setFloaters(placed);
  }, [keywords.length]);

  return (
    // Nền TRẮNG, chữ màu emerald tối nổi bật
    <div className="relative h-full w-full overflow-hidden bg-white">
      <style>{`
        @keyframes floatKeyword {
          0%   { transform: translateY(0px) rotate(-5deg) scale(1); }
          100% { transform: translateY(-110px) rotate(5deg) scale(1.12); }
        }
      `}</style>

      {/* Header trắng */}
      <div className="absolute top-0 left-0 right-0 z-20 px-8 py-6"
        style={{ background: "linear-gradient(to bottom, rgba(255,255,255,0.97) 70%, transparent)" }}>
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-3 bg-emerald-100 border border-emerald-300 rounded-full px-8 py-3">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-emerald-800 text-2xl font-black tracking-widest">STAGE 6 — {title}</span>
          </div>
          <div className="text-right">
            <p className="text-emerald-700 text-xl font-bold">{allWords.length} keyword</p>
            <p className="text-gray-400 text-sm">từ {keywords.length} người</p>
          </div>
        </div>
        {subtitle && <p className="text-gray-600 text-lg mt-2 ml-2">{subtitle}</p>}
      </div>

      {/* Floating keywords */}
      {floaters.map((f) => (
        <FloatingKeyword key={f.id} word={f.word} x={f.x} y={f.y} size={f.size} delay={f.delay} speed={f.speed} />
      ))}

      {allWords.length === 0 && (
        <div className="flex items-center justify-center h-full">
          <p className="text-emerald-400 text-3xl font-bold opacity-40">Chờ mọi người điền keyword…</p>
        </div>
      )}
    </div>
  );
}

// Stage 7: Kết quả → NOW YOU ARE OPPOER
function HostKetQua({ scores, sessionData }) {
  const showEnd = sessionData?.showNow || false;
  const [transitioning, setTransitioning] = useState(false);
  const title = sessionData?.stageConfig?.[7]?.title || "BẢNG XẾP HẠNG";
  const subtitle = sessionData?.stageConfig?.[7]?.subtitle || "";

  function handleEnd() {
    setTransitioning(true);
    setTimeout(async () => {
      await set(ref(db, "session/showNow"), true);
    }, 800);
  }

  async function handleBack() {
    await set(ref(db, "session/showNow"), false);
  }

  if (showEnd) return (
    <div className="flex flex-col items-center justify-center h-full gap-8 text-center" style={{ background: "linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%)" }}>
      <img src="/mascot.png" alt="mascot" className="w-72 h-72 object-contain drop-shadow-2xl animate-bounce" onError={(e) => { e.target.style.display = "none"; }} />
      <div>
        <p className="text-emerald-300 text-3xl font-semibold tracking-widest mb-4">CHÀO MỪNG BẠN</p>
        <h1 className="text-[8rem] font-black text-white leading-none tracking-tight">NOW YOU ARE</h1>
        <h2 className="text-[9rem] font-black leading-none" style={{ color: "#34d399", textShadow: "0 0 60px rgba(52,211,153,0.6)" }}>OPPOER</h2>
      </div>
      <button onClick={handleBack} className="mt-4 text-emerald-600 text-lg underline">← Quay lại</button>
    </div>
  );

  const top3 = scores.slice(0, 3); const rest = scores.slice(3, 10);
  return (
    <div className={`flex flex-col h-full p-12 gap-8 transition-opacity duration-700 ${transitioning ? "opacity-0" : "opacity-100"}`}>
      <div className="text-center">
        <div className="inline-flex items-center gap-4 bg-yellow-500/10 border border-yellow-500/30 rounded-full px-8 py-3">
          <span className="text-yellow-400 text-2xl font-bold tracking-widest">🏆 STAGE 7 — {title}</span>
        </div>
        {subtitle && <p className="text-gray-400 text-xl mt-2">{subtitle}</p>}
      </div>
      <div className="flex justify-center items-end gap-10">
        {[1, 0, 2].map((i) => {
          const s = top3[i]; if (!s) return null;
          const medals = ["🥇", "🥈", "🥉"]; const heights = { 0: "h-52", 1: "h-36", 2: "h-32" };
          return (
            <div key={s.uid} className={`flex flex-col items-center gap-3 ${i === 0 ? "order-2" : i === 1 ? "order-1" : "order-3"}`}>
              <span className="text-6xl">{medals[i]}</span>
              <p className="text-white font-black text-2xl">{s.name}</p>
              <p className="text-emerald-400 font-black text-4xl">{s.total}đ</p>
              <div className={`w-44 ${heights[i]} bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-3xl flex items-start justify-center pt-5`}>
                <span className="text-white font-black text-5xl">#{i + 1}</span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="grid grid-cols-2 gap-4 flex-1">
        {rest.map((s, i) => (
          <div key={s.uid} className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl px-6 py-4">
            <span className="text-gray-500 font-black text-2xl w-10">#{i + 4}</span>
            <span className="flex-1 text-white font-semibold text-xl truncate">{s.name}</span>
            <span className="text-emerald-400 font-black text-2xl">{s.total}đ</span>
          </div>
        ))}
      </div>
      <div className="text-center">
        <button onClick={handleEnd} className="px-20 py-6 rounded-3xl bg-gradient-to-r from-emerald-500 to-green-400 text-white font-black text-3xl hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-emerald-500/30">
          🏠 Kết thúc → NOW YOU ARE OPPOER
        </button>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function HostPage() {
  const [stage, setStage] = useState(0);
  const [sessionData, setSessionData] = useState(null);
  const [hearts, setHearts] = useState([]);
  const [totalHearts, setTotalHearts] = useState(0);
  const [groupHearts, setGroupHearts] = useState([]);
  const [totalGroupHearts, setTotalGroupHearts] = useState(0);
  const [users, setUsers] = useState([]);
  const [s2answers, setS2answers] = useState({});
  const [s3answers, setS3answers] = useState({});
  const [keywords, setKeywords] = useState([]);
  const [scores, setScores] = useState([]);
  const [siteUrl, setSiteUrl] = useState("");
  const prevHearts = useRef(0); const heartId = useRef(0);
  const prevGroupHearts = useRef(0); const groupHeartId = useRef(0);

  useEffect(() => { if (typeof window !== "undefined") setSiteUrl(window.location.origin); }, []);

  useEffect(() => {
    const u1 = onValue(ref(db, "session"), (snap) => { if (!snap.exists()) return; const d = snap.val(); setStage(d.stage ?? 0); setSessionData(d); });
    const u2 = onValue(ref(db, "hearts"), (snap) => {
      if (!snap.exists()) { prevHearts.current = 0; setHearts([]); setTotalHearts(0); return; }
      const count = Object.keys(snap.val()).length; setTotalHearts(count);
      const newC = count - prevHearts.current;
      if (newC > 0) { const nh = Array.from({ length: Math.min(newC, 12) }, () => ({ id: heartId.current++, x: 5 + Math.random() * 90 })); setHearts((h) => [...h, ...nh]); }
      prevHearts.current = count;
    });
    const u3 = onValue(ref(db, "groupHearts"), (snap) => {
      if (!snap.exists()) { prevGroupHearts.current = 0; setGroupHearts([]); setTotalGroupHearts(0); return; }
      const count = Object.keys(snap.val()).length; setTotalGroupHearts(count);
      const newC = count - prevGroupHearts.current;
      if (newC > 0) { const nh = Array.from({ length: Math.min(newC, 12) }, () => ({ id: groupHeartId.current++, x: 5 + Math.random() * 90 })); setGroupHearts((h) => [...h, ...nh]); }
      prevGroupHearts.current = count;
    });
    const u4 = onValue(ref(db, "users"), (snap) => { if (!snap.exists()) return setUsers([]); setUsers(Object.entries(snap.val()).map(([uid, v]) => ({ uid, ...v }))); });
    const u5 = onValue(ref(db, "s2answers"), (snap) => setS2answers(snap.exists() ? snap.val() : {}));
    const u6 = onValue(ref(db, "s3answers"), (snap) => setS3answers(snap.exists() ? snap.val() : {}));
    const u7 = onValue(ref(db, "keywords"), (snap) => { if (!snap.exists()) return setKeywords([]); setKeywords(Object.values(snap.val())); });
    const u8 = onValue(ref(db, "scores"), (snap) => {
      if (!snap.exists()) return setScores([]);
      const list = Object.entries(snap.val()).filter(([_, s]) => s.name)
        .map(([uid, s]) => ({ uid, name: s.name, total: (s.s2 || 0) + (s.s3 || 0) + (s.hearts || 0) + (s.groupHearts || 0) }))
        .sort((a, b) => b.total - a.total);
      setScores(list);
    });
    return () => { u1(); u2(); u3(); u4(); u5(); u6(); u7(); u8(); };
  }, []);

  useEffect(() => {
    if (stage !== 3 || !sessionData?.s3startTime || sessionData?.s3ended) return;
    const allDone = users.length > 0 && Object.keys(s3answers).length >= users.length;
    const elapsed = Math.floor((Date.now() - sessionData.s3startTime) / 1000);
    if (allDone || elapsed >= 600) { set(ref(db, "session/s3ended"), true); }
  }, [s3answers, users, stage, sessionData]);

  const allHearts = [...hearts, ...groupHearts];

  async function handleStart() { await set(ref(db, "session/stage"), 1); }
  async function handleS2ShowAnswer() { await set(ref(db, "session/s2showAnswer"), true); }
  async function handleS2Next() {
    const cur = sessionData?.s2current ?? 0; const qs = sessionData?.s2questions || [];
    if (cur < qs.length - 1) { await set(ref(db, "session/s2current"), cur + 1); await set(ref(db, "session/s2showAnswer"), false); }
    else { await set(ref(db, "session/s2ended"), true); }
  }
  async function handleS3EndGame() { await set(ref(db, "session/s3ended"), true); }

  const isKeywordStage = stage === 6;

  const renderStage = () => {
    if (stage === 0) return <HostWelcome url={siteUrl} users={users} onStart={handleStart} sessionData={sessionData} />;
    if (stage === 1) return <HostIceBreaking totalHearts={totalHearts} users={users} sessionData={sessionData} />;
    if (stage === 2) return <HostBietDeHieu sessionData={sessionData} s2answers={s2answers} onShowAnswer={handleS2ShowAnswer} onNext={handleS2Next} />;
    if (stage === 3) return <HostGiaiMaHanhVi sessionData={sessionData} s3answers={s3answers} users={users} onEndGame={handleS3EndGame} />;
    if (stage === 4) return <HostThaoLuanNhom sessionData={sessionData} totalGroupHearts={totalGroupHearts} />;
    if (stage === 5) return <HostDNASharing totalHearts={totalHearts} sessionData={sessionData} />;
    if (stage === 6) return <HostKeywords keywords={keywords} sessionData={sessionData} />;
    if (stage === 7) return <HostKetQua scores={scores} sessionData={sessionData} />;
    return null;
  };

  return (
    <>
      <Head>
        <title>OPPO Workshop — Host</title>
        <style>{`
          @keyframes floatUp { 0%{transform:translateY(0) scale(1);opacity:1;} 60%{opacity:1;} 100%{transform:translateY(-90vh) scale(0.4);opacity:0;} }
          @keyframes slideIn { from{transform:translateX(120%);opacity:0;} to{transform:translateX(0);opacity:1;} }
          .animate-slideIn { animation: slideIn 0.4s cubic-bezier(.34,1.56,.64,1) forwards; }
        `}</style>
      </Head>
      <div className={`relative overflow-hidden ${isKeywordStage ? "" : "bg-gradient-to-br from-gray-950 via-gray-900 to-emerald-950"}`}
        style={{ height: "100vh", width: "100vw" }}>
        {/* Floating hearts — chỉ hiện khi không phải keyword stage */}
        {!isKeywordStage && (
          <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
            {allHearts.map((h) => (
              <FloatingHeart key={h.id} id={h.id} x={h.x}
                onDone={() => {
                  setHearts((x) => x.filter((i) => i.id !== h.id));
                  setGroupHearts((x) => x.filter((i) => i.id !== h.id));
                }} />
            ))}
          </div>
        )}
        {/* FIX 2: Stage transition mượt */}
        <StageTransition stage={stage}>
          {renderStage()}
        </StageTransition>
      </div>
    </>
  );
}
