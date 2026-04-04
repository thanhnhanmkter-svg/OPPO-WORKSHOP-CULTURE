// pages/host.js — Màn hình Máy chiếu
import { useEffect, useState, useRef } from "react";
import { db } from "../firebase";
import { ref, onValue } from "firebase/database";
import Head from "next/head";

const ANSWERS = ["A", "B", "C", "D"];
const BAR_COLORS = {
  A: { bar: "from-emerald-500 to-green-400", glow: "shadow-emerald-500/50", text: "text-emerald-400" },
  B: { bar: "from-teal-500 to-cyan-400", glow: "shadow-teal-500/50", text: "text-teal-400" },
  C: { bar: "from-green-600 to-emerald-400", glow: "shadow-green-500/50", text: "text-green-400" },
  D: { bar: "from-cyan-600 to-teal-400", glow: "shadow-cyan-500/50", text: "text-cyan-400" },
};

// Floating heart component
function FloatingHeart({ id, x, onDone }) {
  const emojis = ["❤️", "💚", "🩷", "💛", "🧡"];
  const emoji = emojis[id % emojis.length];
  const size = 28 + (id % 3) * 10;
  const duration = 2.5 + (id % 4) * 0.4;
  const rotate = -20 + (id % 40);

  useEffect(() => {
    const t = setTimeout(onDone, duration * 1000);
    return () => clearTimeout(t);
  }, []);

  return (
    <span
      className="absolute bottom-0 pointer-events-none select-none animate-float-up"
      style={{
        left: `${x}%`,
        fontSize: size,
        animation: `floatUp ${duration}s ease-out forwards`,
        transform: `rotate(${rotate}deg)`,
      }}
    >
      {emoji}
    </span>
  );
}

export default function HostPage() {
  const [answers, setAnswers] = useState({});
  const [hearts, setHearts] = useState([]);
  const [totalHearts, setTotalHearts] = useState(0);
  const prevHeartsCount = useRef(0);
  const heartId = useRef(0);

  // ── Lắng nghe đáp án ──
  useEffect(() => {
    const ansRef = ref(db, "answers");
    const unsub = onValue(ansRef, (snap) => {
      if (!snap.exists()) return setAnswers({});
      const data = snap.val();
      const counts = { A: 0, B: 0, C: 0, D: 0 };
      Object.values(data).forEach(({ answer }) => {
        if (counts[answer] !== undefined) counts[answer]++;
      });
      setAnswers(counts);
    });
    return () => unsub();
  }, []);

  // ── Lắng nghe hearts — chỉ hiện tim MỚI ──
  useEffect(() => {
    const heartsRef = ref(db, "hearts");
    const unsub = onValue(heartsRef, (snap) => {
      if (!snap.exists()) {
        prevHeartsCount.current = 0;
        setHearts([]);
        setTotalHearts(0);
        return;
      }
      const data = snap.val();
      const count = Object.keys(data).length;
      setTotalHearts(count);

      const newCount = count - prevHeartsCount.current;
      if (newCount > 0) {
        const newHearts = Array.from({ length: Math.min(newCount, 8) }, () => ({
          id: heartId.current++,
          x: 5 + Math.random() * 90,
        }));
        setHearts((h) => [...h, ...newHearts]);
      }
      prevHeartsCount.current = count;
    });
    return () => unsub();
  }, []);

  function removeHeart(id) {
    setHearts((h) => h.filter((x) => x.id !== id));
  }

  const total = Object.values(answers).reduce((s, v) => s + v, 0);
  const maxCount = Math.max(...Object.values(answers), 1);

  return (
    <>
      <Head>
        <title>OPPO Workshop — Host Display</title>
        <style>{`
          @keyframes floatUp {
            0%   { transform: translateY(0) scale(1) rotate(var(--r, 0deg)); opacity: 1; }
            60%  { opacity: 1; }
            100% { transform: translateY(-85vh) scale(0.6) rotate(var(--r, 0deg)); opacity: 0; }
          }
          @keyframes barGrow {
            from { transform: scaleX(0); }
            to   { transform: scaleX(1); }
          }
          .bar-animate { transform-origin: left; animation: barGrow 0.5s cubic-bezier(.34,1.56,.64,1) forwards; }
          @keyframes countPop {
            0%   { transform: scale(1); }
            40%  { transform: scale(1.3); }
            100% { transform: scale(1); }
          }
          .count-pop { animation: countPop 0.35s ease; }
        `}</style>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-emerald-950 flex flex-col relative overflow-hidden p-8 gap-8">
        {/* Background orbs */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-teal-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Floating hearts layer */}
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {hearts.map((h) => (
            <FloatingHeart key={h.id} id={h.id} x={h.x} onDone={() => removeHeart(h.id)} />
          ))}
        </div>

        {/* Header */}
        <div className="text-center z-10">
          <div className="inline-flex items-center gap-3 mb-2">
            <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400 text-sm font-semibold tracking-widest uppercase">Live Results</span>
            <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <h1 className="text-6xl font-black text-white tracking-tighter">
            OPPO <span className="text-emerald-400">Workshop</span>
          </h1>
        </div>

        {/* Stats row */}
        <div className="flex justify-center gap-10 z-10">
          <div className="flex flex-col items-center bg-white/5 border border-white/10 rounded-2xl px-8 py-4">
            <span className="text-5xl font-black text-white">{total}</span>
            <span className="text-gray-400 text-sm mt-1">Phiếu bầu</span>
          </div>
          <div className="flex flex-col items-center bg-rose-500/10 border border-rose-500/20 rounded-2xl px-8 py-4">
            <span className="text-5xl font-black text-rose-400">❤️ {totalHearts}</span>
            <span className="text-gray-400 text-sm mt-1">Tim đã nhận</span>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="z-10 flex-1 flex flex-col gap-5 max-w-4xl mx-auto w-full">
          {ANSWERS.map((ans) => {
            const count = answers[ans] || 0;
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
            const barPct = maxCount > 0 ? (count / maxCount) * 100 : 0;
            const colors = BAR_COLORS[ans];
            const isLeading = count === maxCount && count > 0;

            return (
              <div key={ans} className="flex items-center gap-5">
                {/* Label */}
                <div
                  className={`
                    w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black flex-shrink-0
                    bg-gradient-to-br ${colors.bar} shadow-lg ${colors.glow}
                    ${isLeading ? "ring-2 ring-white/40 scale-110" : ""}
                    transition-all duration-300
                  `}
                >
                  {ans}
                </div>

                {/* Bar container */}
                <div className="flex-1 relative h-14 bg-white/5 rounded-2xl overflow-hidden border border-white/10">
                  <div
                    className={`absolute inset-y-0 left-0 bg-gradient-to-r ${colors.bar} rounded-2xl transition-all duration-700 ease-out`}
                    style={{ width: `${barPct}%` }}
                  />
                  {isLeading && barPct > 10 && (
                    <div className="absolute inset-0 bg-white/5 rounded-2xl animate-pulse" />
                  )}
                </div>

                {/* Count & percent */}
                <div className="flex-shrink-0 text-right w-24">
                  <span className={`text-3xl font-black text-white block leading-none`}>
                    {count}
                  </span>
                  <span className={`text-sm font-bold ${colors.text}`}>{pct}%</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <p className="text-center text-gray-700 text-xs z-10">
          Mở trang nhân viên tại <span className="text-emerald-600">/</span> · Điều khiển tại <span className="text-emerald-600">/admin</span>
        </p>
      </div>
    </>
  );
}
