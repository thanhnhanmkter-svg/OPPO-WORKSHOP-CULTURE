// pages/admin.js — Màn hình Điều khiển
import { useState, useEffect } from "react";
import { db } from "../firebase";
import { ref, remove, set, get, onValue } from "firebase/database";
import Head from "next/head";

export default function AdminPage() {
  const [stats, setStats] = useState({ answers: {}, hearts: 0 });
  const [resetting, setResetting] = useState(false);
  const [lastReset, setLastReset] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // ── Live stats ──
  useEffect(() => {
    const ansUnsub = onValue(ref(db, "answers"), (snap) => {
      if (!snap.exists()) return setStats((s) => ({ ...s, answers: {} }));
      const counts = { A: 0, B: 0, C: 0, D: 0 };
      Object.values(snap.val()).forEach(({ answer }) => {
        if (counts[answer] !== undefined) counts[answer]++;
      });
      setStats((s) => ({ ...s, answers: counts }));
    });
    const heartUnsub = onValue(ref(db, "hearts"), (snap) => {
      setStats((s) => ({ ...s, hearts: snap.exists() ? Object.keys(snap.val()).length : 0 }));
    });
    return () => { ansUnsub(); heartUnsub(); };
  }, []);

  async function handleReset() {
    setResetting(true);
    try {
      await Promise.all([
        remove(ref(db, "answers")),
        remove(ref(db, "hearts")),
        // Tăng reset_counter để báo cho các màn hình nhân viên reset UI
        get(ref(db, "session/reset_counter")).then((snap) => {
          const cur = snap.exists() ? snap.val() : 0;
          return set(ref(db, "session/reset_counter"), cur + 1);
        }),
      ]);
      setLastReset(new Date().toLocaleTimeString("vi-VN"));
    } finally {
      setResetting(false);
      setConfirmOpen(false);
    }
  }

  const totalVotes = Object.values(stats.answers).reduce((s, v) => s + v, 0);
  const COLORS = { A: "bg-emerald-500", B: "bg-teal-500", C: "bg-green-600", D: "bg-cyan-600" };

  return (
    <>
      <Head>
        <title>OPPO Workshop — Admin</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-emerald-950 flex flex-col items-center justify-center p-6 gap-8">
        {/* Card */}
        <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-sm">
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-xl">
              🎛️
            </div>
            <div>
              <h1 className="text-white font-black text-xl">Admin Control</h1>
              <p className="text-gray-500 text-xs">OPPO Workshop Dashboard</p>
            </div>
            <div className="ml-auto flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-400 text-xs font-semibold">LIVE</span>
            </div>
          </div>

          {/* Stats */}
          <div className="space-y-3 mb-8">
            <div className="flex justify-between items-center py-3 border-b border-white/5">
              <span className="text-gray-400 text-sm">Tổng phiếu bầu</span>
              <span className="text-white font-black text-2xl">{totalVotes}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-white/5">
              <span className="text-gray-400 text-sm">Tổng tim ❤️</span>
              <span className="text-rose-400 font-black text-2xl">{stats.hearts}</span>
            </div>

            {/* Per-answer breakdown */}
            <div className="pt-2 space-y-2">
              {["A", "B", "C", "D"].map((ans) => {
                const count = stats.answers[ans] || 0;
                const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
                return (
                  <div key={ans} className="flex items-center gap-3">
                    <span className={`w-7 h-7 rounded-lg ${COLORS[ans]} text-white text-xs font-black flex items-center justify-center flex-shrink-0`}>
                      {ans}
                    </span>
                    <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${COLORS[ans]} rounded-full transition-all duration-500`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-gray-300 text-sm w-16 text-right">
                      {count} <span className="text-gray-600">({pct}%)</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Reset Button */}
          {!confirmOpen ? (
            <button
              onClick={() => setConfirmOpen(true)}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-rose-600 to-pink-600 text-white font-black text-lg
                hover:from-rose-500 hover:to-pink-500 active:scale-95 transition-all duration-150
                shadow-lg shadow-rose-500/30"
            >
              🔄 Reset — Câu hỏi mới
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-center text-yellow-400 text-sm font-semibold">
                ⚠️ Xác nhận xóa toàn bộ dữ liệu?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmOpen(false)}
                  className="flex-1 py-3 rounded-2xl bg-white/10 text-white font-bold hover:bg-white/20 active:scale-95 transition-all"
                >
                  Hủy
                </button>
                <button
                  onClick={handleReset}
                  disabled={resetting}
                  className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-rose-600 to-pink-600 text-white font-black
                    hover:from-rose-500 hover:to-pink-500 active:scale-95 transition-all disabled:opacity-50"
                >
                  {resetting ? "Đang reset…" : "✅ Xác nhận"}
                </button>
              </div>
            </div>
          )}

          {lastReset && (
            <p className="text-center text-gray-600 text-xs mt-4">
              Lần reset cuối: {lastReset}
            </p>
          )}
        </div>

        {/* Quick links */}
        <div className="flex gap-4">
          <a href="/" target="_blank" className="text-emerald-500 hover:text-emerald-400 text-sm underline underline-offset-2 transition-colors">
            → Màn hình Nhân viên
          </a>
          <a href="/host" target="_blank" className="text-emerald-500 hover:text-emerald-400 text-sm underline underline-offset-2 transition-colors">
            → Màn hình Host
          </a>
        </div>
      </div>
    </>
  );
}
