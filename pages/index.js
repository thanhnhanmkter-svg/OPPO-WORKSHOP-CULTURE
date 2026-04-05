// pages/index.js — Màn hình Nhân viên (Điện thoại)
import { useEffect, useState, useRef } from "react";
import { db } from "../firebase";
import { ref, push, set, get, onValue } from "firebase/database";
import Head from "next/head";

// ─── Tạo hoặc lấy userId từ localStorage ───────────────────────────────────
function getUserId() {
  if (typeof window === "undefined") return null;
  let id = localStorage.getItem("oppo_user_id");
  if (!id) {
    id = "user_" + Math.random().toString(36).slice(2, 10) + "_" + Date.now();
    localStorage.setItem("oppo_user_id", id);
  }
  return id;
}

const ANSWERS = ["A", "B", "C", "D"];
const ANSWER_COLORS = {
  A: "from-emerald-500 to-green-400",
  B: "from-teal-500 to-cyan-400",
  C: "from-green-600 to-emerald-400",
  D: "from-cyan-600 to-teal-400",
};

export default function EmployeePage() {
  const [userId, setUserId] = useState(null);
  const [selected, setSelected] = useState(null);
  const [heartBurst, setHeartBurst] = useState(false);
  const [heartCount, setHeartCount] = useState(0);
  const [ripples, setRipples] = useState([]);
  const rippleId = useRef(0);

  // ── Init userId sau khi mount (tránh SSR mismatch) ──
  useEffect(() => {
    setUserId(getUserId());
  }, []);

  // ── Lắng nghe reset từ Admin ──
  useEffect(() => {
    if (!userId) return;
    const resetRef = ref(db, "session/reset_counter");
    const unsub = onValue(resetRef, () => {
      setSelected(null);
    });
    return () => unsub();
  }, [userId]);

  // ── Lắng nghe tổng số tim ──
  useEffect(() => {
    const heartsRef = ref(db, "hearts");
    const unsub = onValue(heartsRef, (snap) => {
      setHeartCount(snap.exists() ? Object.keys(snap.val()).length : 0);
    });
    return () => unsub();
  }, []);

  // ── Thả tim ──
  async function handleHeart() {
    if (!userId) return;
    setHeartBurst(true);
    setTimeout(() => setHeartBurst(false), 600);

    // Tạo ripple
    const id = rippleId.current++;
    setRipples((r) => [...r, id]);
    setTimeout(() => setRipples((r) => r.filter((x) => x !== id)), 800);

    await push(ref(db, "hearts"), {
      userId,
      ts: Date.now(),
    });
  }

  // ── Chọn đáp án ──
  async function handleAnswer(ans) {
    if (!userId || selected) return;
    setSelected(ans);
    await set(ref(db, `answers/${userId}`), { answer: ans, ts: Date.now() });
  }

  return (
    <>
      <Head>
        <title>OPPO Workshop — Nhân viên</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-emerald-950 flex flex-col items-center justify-between py-10 px-4 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="text-center z-10">
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-4 py-1.5 mb-3">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400 text-xs font-semibold tracking-widest uppercase">Live Session</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            OPPO <span className="text-emerald-400">Workshop</span>
          </h1>
          <p className="text-gray-400 text-sm mt-1">Tham gia ngay — Bấm tim & chọn đáp án</p>
        </div>

        {/* Heart Button */}
        <div className="z-10 flex flex-col items-center gap-4 w-full max-w-xs">
          <p className="text-gray-400 text-sm text-center">Cảm thấy hứng thú? Thả tim ngay! 🎉</p>

          <div className="relative flex items-center justify-center">
            {/* Ripple rings */}
            {ripples.map((id) => (
              <span
                key={id}
                className="absolute w-24 h-24 rounded-full border-2 border-rose-400/60 animate-ping"
                style={{ animationDuration: "0.8s" }}
              />
            ))}

            <button
              onClick={handleHeart}
              className={`relative w-24 h-24 rounded-full flex items-center justify-center text-5xl
                bg-gradient-to-br from-rose-500 to-pink-600
                shadow-lg shadow-rose-500/40
                transition-all duration-150 active:scale-90
                ${heartBurst ? "scale-110" : "scale-100"}
              `}
            >
              ❤️
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-rose-400 text-lg">❤️</span>
            <span className="text-white font-bold text-xl">{heartCount}</span>
            <span className="text-gray-400 text-sm">tim đã gửi</span>
          </div>
        </div>

        {/* Answer Buttons */}
        <div className="z-10 w-full max-w-sm space-y-3">
          <p className="text-gray-300 text-sm text-center font-medium mb-4">
            {selected
              ? `✅ Bạn đã chọn đáp án `
              : "Chọn đáp án của bạn:"}
            {selected && (
              <span className="text-emerald-400 font-black text-lg ml-1">{selected}</span>
            )}
          </p>

          <div className="grid grid-cols-2 gap-3">
            {ANSWERS.map((ans) => {
              const isSelected = selected === ans;
              const isDisabled = !!selected && !isSelected;
              return (
                <button
                  key={ans}
                  onClick={() => handleAnswer(ans)}
                  disabled={!!selected}
                  className={`
                    relative h-16 rounded-2xl text-2xl font-black
                    transition-all duration-200
                    ${isSelected
                      ? `bg-gradient-to-br ${ANSWER_COLORS[ans]} text-white scale-105 shadow-lg shadow-emerald-500/40 ring-2 ring-white/30`
                      : isDisabled
                      ? "bg-gray-800/50 text-gray-600 cursor-not-allowed"
                      : `bg-gradient-to-br ${ANSWER_COLORS[ans]} text-white active:scale-95 hover:scale-105 shadow-md`
                    }
                  `}
                >
                  {isSelected && (
                    <span className="absolute top-1 right-2 text-xs">✓</span>
                  )}
                  {ans}
                </button>
              );
            })}
          </div>

          {selected && (
            <p className="text-center text-gray-500 text-xs mt-2">
              Chờ kết quả từ Host nhé! 🎯
            </p>
          )}
        </div>

        {/* Footer */}
        <p className="text-gray-700 text-xs z-10">
          ID: {userId ? userId.slice(0, 16) + "…" : "…"}
        </p>
      </div>
    </>
  );
}
