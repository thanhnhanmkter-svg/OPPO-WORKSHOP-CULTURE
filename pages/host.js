// pages/host.js — Màn hình Máy chiếu
import { useEffect, useState, useRef } from "react";
import { db } from "../firebase";
import { ref, onValue, set, get } from "firebase/database";
import Head from "next/head";
import { CULTURE_VALUES } from "../data/cultureValues";
import QRCode from "qrcode";

// Floating heart
function FloatingHeart({ id, x, onDone }) {
  const emojis = ["❤️", "💚", "🩷", "💛", "🧡"];
  const emoji = emojis[id % emojis.length];
  const size = 30 + (id % 3) * 14;
  const dur = 2.5 + (id % 4) * 0.5;
  useEffect(() => { const t = setTimeout(onDone, dur * 1000); return () => clearTimeout(t); }, []);
  return (
    <span className="absolute bottom-0 pointer-events-none select-none" style={{ left: `${x}%`, fontSize: size, animation: `floatUp ${dur}s ease-out forwards` }}>
      {emoji}
    </span>
  );
}

// Stage 0: Welcome + QR
function HostWelcome({ url }) {
  const [qr, setQr] = useState("");
  useEffect(() => {
    if (!url) return;
    QRCode.toDataURL(url, { width: 300, margin: 2, color: { dark: "#ffffff", light: "#00000000" } })
      .then(setQr).catch(console.error);
  }, [url]);

  return (
    <div className="flex flex-col items-center justify-center h-full gap-10">
      <div className="text-center">
        <div className="text-8xl mb-4">🟢</div>
        <h1 className="text-8xl font-black text-white tracking-tight leading-none">OPPO</h1>
        <h2 className="text-5xl font-black text-emerald-400 tracking-wider">CULTURE WORKSHOP</h2>
      </div>
      {qr && (
        <div className="flex flex-col items-center gap-4">
          <div className="bg-white/10 border border-white/20 rounded-3xl p-6">
            <img src={qr} alt="QR" className="w-52 h-52" />
          </div>
          <p className="text-gray-300 text-lg">Quét QR để tham gia</p>
          <p className="text-emerald-400 font-mono text-sm">{url}</p>
        </div>
      )}
      <div className="flex items-center gap-2">
        <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-emerald-400 text-xl">Đang chờ người tham gia…</span>
      </div>
    </div>
  );
}

// Stage 1: Ice Breaking
function HostIceBreaking({ hearts, totalHearts, users }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-8">
      <div className="text-center">
        <div className="inline-flex items-center gap-3 bg-rose-500/10 border border-rose-500/30 rounded-full px-6 py-2 mb-6">
          <span className="w-3 h-3 rounded-full bg-rose-400 animate-pulse" />
          <span className="text-rose-400 text-xl font-bold tracking-widest">STAGE 1 — ICE BREAKING</span>
        </div>
        <h2 className="text-7xl font-black text-white">❤️ {totalHearts}</h2>
        <p className="text-gray-400 text-2xl mt-2">tim đã gửi</p>
      </div>
      <div className="flex flex-wrap justify-center gap-3 max-w-3xl">
        {users.map((u) => (
          <span key={u.uid} className="bg-white/10 border border-white/20 rounded-full px-4 py-2 text-white text-sm">{u.name}</span>
        ))}
      </div>
    </div>
  );
}

// Stage 2: Case Study
function HostCaseStudy({ sessionData, answers, onNext, onShowAnswer, onPrev }) {
  const questions = sessionData?.questions || [];
  const currentQ = sessionData?.currentQuestion || 0;
  const showAns = sessionData?.showAnswer || false;
  const q = questions[currentQ];

  const counts = { A: 0, B: 0, C: 0, D: 0 };
  const totalVotes = Object.values(answers).length;
  Object.values(answers).forEach(({ answer, correct: _c }) => {
    if (counts[answer] !== undefined) counts[answer]++;
  });

  const BAR = {
    A: "from-emerald-500 to-green-400",
    B: "from-teal-500 to-cyan-400",
    C: "from-green-600 to-emerald-400",
    D: "from-cyan-600 to-teal-400",
  };

  const maxC = Math.max(...Object.values(counts), 1);

  if (!q) return (
    <div className="flex items-center justify-center h-full">
      <p className="text-gray-400 text-2xl">Chưa có câu hỏi. Thêm câu hỏi trong Admin.</p>
    </div>
  );

  return (
    <div className="flex flex-col h-full p-10 gap-6">
      <div className="flex items-center justify-between">
        <div className="inline-flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-6 py-2">
          <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-emerald-400 text-lg font-bold">STAGE 2 — CASE STUDY</span>
        </div>
        <span className="text-gray-400 text-xl">Câu {currentQ + 1} / {questions.length}</span>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-3xl p-8 flex-shrink-0">
        <p className="text-white text-3xl font-bold leading-relaxed">{q.question}</p>
        {showAns && (
          <div className="mt-4 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl px-6 py-3">
            <p className="text-emerald-400 font-black text-xl">✓ Đáp án đúng: {q.correct} — {q[`opt${q.correct}`]}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 flex-1">
        {["A", "B", "C", "D"].map((ans) => {
          const count = counts[ans];
          const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
          const barW = (count / maxC) * 100;
          const isCorrect = showAns && ans === q.correct;
          return (
            <div key={ans} className={`relative bg-white/5 border rounded-2xl p-5 overflow-hidden transition-all duration-300 ${isCorrect ? "border-emerald-500/60 bg-emerald-500/10" : "border-white/10"}`}>
              <div className={`absolute inset-y-0 left-0 bg-gradient-to-r ${BAR[ans]} opacity-20 transition-all duration-700`} style={{ width: `${barW}%` }} />
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`w-10 h-10 rounded-xl bg-gradient-to-br ${BAR[ans]} text-white font-black text-lg flex items-center justify-center`}>{ans}</span>
                  <span className="text-white text-lg font-semibold">{q[`opt${ans}`]}</span>
                </div>
                <div className="text-right">
                  <span className="text-white font-black text-3xl">{count}</span>
                  <span className="text-gray-400 text-sm ml-1">({pct}%)</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex gap-4 justify-center">
        {!showAns ? (
          <button onClick={onShowAnswer} className="px-10 py-4 rounded-2xl bg-yellow-500 text-black font-black text-lg hover:bg-yellow-400 active:scale-95 transition-all">
            📢 Hiện đáp án đúng
          </button>
        ) : (
          <button onClick={onNext} className="px-10 py-4 rounded-2xl bg-emerald-500 text-white font-black text-lg hover:bg-emerald-400 active:scale-95 transition-all">
            {currentQ < questions.length - 1 ? "Câu tiếp theo →" : "Kết thúc Case Study ✓"}
          </button>
        )}
        <span className="text-gray-600 text-sm self-center">{totalVotes} người đã chọn</span>
      </div>
    </div>
  );
}

// Stage 3: Sharing
function HostSharing({ hearts, totalHearts }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-8 relative overflow-hidden">
      <div className="text-center">
        <div className="inline-flex items-center gap-3 bg-purple-500/10 border border-purple-500/30 rounded-full px-6 py-2 mb-6">
          <span className="w-3 h-3 rounded-full bg-purple-400 animate-pulse" />
          <span className="text-purple-400 text-xl font-bold tracking-widest">STAGE 3 — SHARING</span>
        </div>
        <h2 className="text-6xl font-black text-white">Màn chia sẻ</h2>
        <p className="text-gray-400 text-2xl mt-3">Lắng nghe những câu chuyện thực tế 💬</p>
      </div>
      <div className="text-center">
        <p className="text-8xl font-black text-rose-400">❤️ {totalHearts}</p>
        <p className="text-gray-400 text-xl">tim ủng hộ</p>
      </div>
    </div>
  );
}

// Stage 4: Kết quả
function HostResult({ scores }) {
  const [showEnd, setShowEnd] = useState(false);
  const top3 = scores.slice(0, 3);
  const rest = scores.slice(3, 10);

  if (showEnd) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 text-center">
        <div className="text-8xl">🏠</div>
        <h1 className="text-8xl font-black text-emerald-400 leading-tight">CHÀO MỪNG</h1>
        <h2 className="text-6xl font-black text-white">BẠN ĐẾN NHÀ O</h2>
        <button onClick={() => setShowEnd(false)} className="mt-8 text-gray-600 text-sm underline">← Quay lại bảng xếp hạng</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-10 gap-8">
      <div className="text-center">
        <div className="inline-flex items-center gap-3 bg-yellow-500/10 border border-yellow-500/30 rounded-full px-6 py-2 mb-2">
          <span className="text-yellow-400 text-xl font-bold tracking-widest">🏆 STAGE 4 — BẢNG XẾP HẠNG</span>
        </div>
      </div>

      {/* Top 3 */}
      <div className="flex justify-center items-end gap-6">
        {[1, 0, 2].map((i) => {
          const s = top3[i];
          if (!s) return null;
          const rank = i + 1;
          const heights = { 0: "h-40", 1: "h-28", 2: "h-24" };
          const medals = ["🥇", "🥈", "🥉"];
          return (
            <div key={s.uid} className={`flex flex-col items-center gap-2 ${i === 0 ? "order-2" : i === 1 ? "order-1" : "order-3"}`}>
              <span className="text-4xl">{medals[rank - 1]}</span>
              <p className="text-white font-black text-lg">{s.name}</p>
              <p className="text-emerald-400 font-black text-2xl">{s.total}đ</p>
              <div className={`w-32 ${heights[i]} bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-2xl flex items-start justify-center pt-3`}>
                <span className="text-white font-black text-3xl">#{rank}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Rest */}
      <div className="grid grid-cols-2 gap-3 flex-1">
        {rest.map((s, i) => (
          <div key={s.uid} className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-5 py-3">
            <span className="text-gray-500 font-black text-xl w-8">#{i + 4}</span>
            <span className="flex-1 text-white font-semibold truncate">{s.name}</span>
            <span className="text-emerald-400 font-black text-lg">{s.total}đ</span>
          </div>
        ))}
      </div>

      <div className="text-center">
        <button onClick={() => setShowEnd(true)} className="px-16 py-5 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-400 text-white font-black text-2xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-emerald-500/30">
          🏠 Kết thúc chương trình
        </button>
      </div>
    </div>
  );
}

// ── Main Host ─────────────────────────────────────────────────────────────────
export default function HostPage() {
  const [stage, setStage] = useState(0);
  const [sessionData, setSessionData] = useState(null);
  const [hearts, setHearts] = useState([]);
  const [totalHearts, setTotalHearts] = useState(0);
  const [users, setUsers] = useState([]);
  const [answers, setAnswers] = useState({});
  const [scores, setScores] = useState([]);
  const [siteUrl, setSiteUrl] = useState("");
  const prevHearts = useRef(0);
  const heartId = useRef(0);

  useEffect(() => {
    if (typeof window !== "undefined") setSiteUrl(window.location.origin);
  }, []);

  useEffect(() => {
    const u1 = onValue(ref(db, "session"), (snap) => {
      if (!snap.exists()) return;
      const d = snap.val();
      setStage(d.stage ?? 0);
      setSessionData(d);
    });
    const u2 = onValue(ref(db, "hearts"), (snap) => {
      if (!snap.exists()) { prevHearts.current = 0; setHearts([]); setTotalHearts(0); return; }
      const count = Object.keys(snap.val()).length;
      setTotalHearts(count);
      const newC = count - prevHearts.current;
      if (newC > 0) {
        const nh = Array.from({ length: Math.min(newC, 10) }, () => ({ id: heartId.current++, x: 5 + Math.random() * 90 }));
        setHearts((h) => [...h, ...nh]);
      }
      prevHearts.current = count;
    });
    const u3 = onValue(ref(db, "users"), (snap) => {
      if (!snap.exists()) return setUsers([]);
      setUsers(Object.entries(snap.val()).map(([uid, v]) => ({ uid, ...v })));
    });
    const u4 = onValue(ref(db, "answers"), (snap) => {
      setAnswers(snap.exists() ? snap.val() : {});
    });
    const u5 = onValue(ref(db, "scores"), (snap) => {
      if (!snap.exists()) return setScores([]);
      const list = Object.entries(snap.val()).map(([uid, s]) => ({
        uid, name: s.name || uid, total: (s.quiz || 0) + (s.hearts || 0),
      })).sort((a, b) => b.total - a.total);
      setScores(list);
    });
    return () => { u1(); u2(); u3(); u4(); u5(); };
  }, []);

  function removeHeart(id) { setHearts((h) => h.filter((x) => x.id !== id)); }

  async function handleShowAnswer() {
    await set(ref(db, "session/showAnswer"), true);
  }

  async function handleNextQ() {
    const currentQ = sessionData?.currentQuestion || 0;
    const questions = sessionData?.questions || [];
    if (currentQ < questions.length - 1) {
      await set(ref(db, "session/currentQuestion"), currentQ + 1);
      await set(ref(db, "session/showAnswer"), false);
    } else {
      await set(ref(db, "session/stage"), 3);
      await set(ref(db, "session/showAnswer"), false);
    }
  }

  return (
    <>
      <Head>
        <title>OPPO Workshop — Host</title>
        <style>{`
          @keyframes floatUp {
            0% { transform: translateY(0) scale(1); opacity: 1; }
            60% { opacity: 1; }
            100% { transform: translateY(-85vh) scale(0.5); opacity: 0; }
          }
        `}</style>
      </Head>
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-emerald-950 relative overflow-hidden" style={{ height: "100vh" }}>
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {hearts.map((h) => (
            <FloatingHeart key={h.id} id={h.id} x={h.x} onDone={() => removeHeart(h.id)} />
          ))}
        </div>
        <div className="h-full">
          {stage === 0 && <HostWelcome url={siteUrl} />}
          {stage === 1 && <HostIceBreaking hearts={hearts} totalHearts={totalHearts} users={users} />}
          {stage === 2 && <HostCaseStudy sessionData={sessionData} answers={answers} onShowAnswer={handleShowAnswer} onNext={handleNextQ} />}
          {stage === 3 && <HostSharing hearts={hearts} totalHearts={totalHearts} />}
          {stage === 4 && <HostResult scores={scores} />}
        </div>
      </div>
    </>
  );
}
