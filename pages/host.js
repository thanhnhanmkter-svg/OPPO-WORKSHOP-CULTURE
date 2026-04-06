// pages/host.js — Màn hình Máy chiếu (v4 - bigger layout + mascot)
import { useEffect, useState, useRef } from "react";
import { db } from "../firebase";
import { ref, onValue, set } from "firebase/database";
import Head from "next/head";
import { CULTURE_VALUES } from "../data/cultureValues";
import QRCode from "qrcode";

function FloatingHeart({ id, x, onDone }) {
  const emojis = ["❤️", "💚", "🩷", "💛", "🧡"];
  const emoji = emojis[id % emojis.length];
  const size = 40 + (id % 3) * 18;
  const dur = 2.5 + (id % 4) * 0.5;
  useEffect(() => { const t = setTimeout(onDone, dur * 1000); return () => clearTimeout(t); }, []);
  return <span className="absolute bottom-0 pointer-events-none select-none" style={{ left: `${x}%`, fontSize: size, animation: `floatUp ${dur}s ease-out forwards` }}>{emoji}</span>;
}

function JoinPopup({ name, dept, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t); }, []);
  return (
    <div className="animate-slideIn flex items-center gap-4 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl px-6 py-4 shadow-xl">
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-green-400 flex items-center justify-center text-white font-black text-xl flex-shrink-0">{name.charAt(0).toUpperCase()}</div>
      <div><p className="text-white font-bold text-lg">{name}</p>{dept && <p className="text-emerald-400 text-sm">{dept}</p>}</div>
      <span className="text-emerald-400 text-base ml-2">đã tham gia ✓</span>
    </div>
  );
}

// Stage 0: Welcome + QR + mascot
function HostWelcome({ url, users, onStart }) {
  const [qr, setQr] = useState("");
  const [popups, setPopups] = useState([]);
  const prevCount = useRef(0);
  const popupId = useRef(0);

  useEffect(() => {
    if (!url) return;
    QRCode.toDataURL(url, { width: 360, margin: 2, color: { dark: "#ffffff", light: "#00000000" } }).then(setQr).catch(console.error);
  }, [url]);

  useEffect(() => {
    if (users.length > prevCount.current) {
      users.slice(prevCount.current).forEach((u) => {
        const id = popupId.current++;
        setPopups((p) => [...p, { id, name: u.name, dept: u.dept }]);
      });
    }
    prevCount.current = users.length;
  }, [users]);

  return (
    <div className="flex h-full">
      {/* Left: Logo + Mascot + QR + Start */}
      <div className="flex-1 flex flex-col items-center justify-center gap-8">
        {/* Mascot thay cho 🟢 */}
        <img src="/mascot.png" alt="OPPO Mascot" className="w-48 h-48 object-contain drop-shadow-2xl" />

        <div className="text-center">
          <h1 className="text-9xl font-black text-white tracking-tight leading-none">OPPO</h1>
          <h2 className="text-6xl font-black text-emerald-400 tracking-wider mt-2">CULTURE WORKSHOP</h2>
        </div>

        {qr && (
          <div className="flex flex-col items-center gap-4">
            <div className="bg-white/10 border border-white/20 rounded-3xl p-6">
              <img src={qr} alt="QR" className="w-64 h-64" />
            </div>
            <p className="text-gray-300 text-2xl">Quét QR để tham gia</p>
            <p className="text-emerald-400 font-mono text-lg">{url}</p>
          </div>
        )}

        <button onClick={onStart} disabled={users.length === 0}
          className="px-20 py-6 rounded-3xl bg-gradient-to-r from-emerald-500 to-green-400 text-white font-black text-3xl
            hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-emerald-500/40
            disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100">
          {users.length === 0 ? "Chờ người tham gia…" : `🚀 Bắt đầu (${users.length} người)`}
        </button>
      </div>

      {/* Right: Danh sách */}
      <div className="w-96 flex flex-col border-l border-white/10 p-8 gap-5">
        <div className="flex items-center gap-3">
          <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
          <p className="text-emerald-400 font-bold text-lg tracking-widest uppercase">Người tham gia</p>
          <span className="ml-auto bg-emerald-500/20 text-emerald-400 font-black text-xl px-4 py-1.5 rounded-full">{users.length}</span>
        </div>
        <div className="flex-1 overflow-y-auto space-y-3">
          {users.length === 0 && <p className="text-gray-600 text-lg text-center mt-8">Chưa có ai…</p>}
          {users.map((u) => (
            <div key={u.uid} className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-green-400 flex items-center justify-center text-white font-black text-base">{u.name?.charAt(0).toUpperCase()}</div>
              <div className="min-w-0">
                <p className="text-white text-base font-semibold truncate">{u.name}</p>
                {u.dept && <p className="text-gray-500 text-sm truncate">{u.dept}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Popups */}
      <div className="fixed top-8 right-8 flex flex-col gap-4 z-50 pointer-events-none" style={{ maxWidth: 380 }}>
        {popups.map((p) => <JoinPopup key={p.id} name={p.name} dept={p.dept} onDone={() => setPopups((x) => x.filter((i) => i.id !== p.id))} />)}
      </div>
    </div>
  );
}

// Stage 1: Ice Breaking
function HostIceBreaking({ totalHearts, users }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-10">
      <div className="text-center">
        <div className="inline-flex items-center gap-4 bg-rose-500/10 border border-rose-500/30 rounded-full px-8 py-3 mb-8">
          <span className="w-4 h-4 rounded-full bg-rose-400 animate-pulse" />
          <span className="text-rose-400 text-3xl font-black tracking-widest">STAGE 1 — ICE BREAKING</span>
        </div>
        <h1 className="text-8xl font-black text-white leading-tight">WELCOME TO</h1>
        <h2 className="text-7xl font-black text-emerald-400 mt-2">OPPO CULTURE WORKSHOP</h2>
      </div>
      <p className="text-[12rem] font-black text-rose-400 leading-none">{totalHearts}</p>
      <p className="text-4xl text-gray-400">❤️ tim đã gửi</p>
      <div className="flex flex-wrap justify-center gap-4 max-w-5xl px-8 mt-4">
        {users.map((u) => (
          <span key={u.uid} className="bg-white/10 border border-white/20 rounded-full px-6 py-2 text-white text-xl">{u.name}</span>
        ))}
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

  useEffect(() => {
    setTimeLeft(30);
    clearInterval(timerRef.current);
    if (!q || gameEnded) return;
    timerRef.current = setInterval(() => setTimeLeft((t) => { if (t <= 1) { clearInterval(timerRef.current); return 0; } return t - 1; }), 1000);
    return () => clearInterval(timerRef.current);
  }, [currentQ, gameEnded]);

  const answered = Object.values(s2answers).filter((a) => a.userId).length;

  if (gameEnded) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-12 px-16">
        <div className="text-center">
          <div className="inline-flex items-center gap-4 bg-blue-500/10 border border-blue-500/30 rounded-full px-8 py-3 mb-8">
            <span className="text-blue-400 text-2xl font-bold">BIẾT ĐỂ HIỂU — KẾT THÚC</span>
          </div>
          <h2 className="text-6xl font-black text-white mb-3">4 Giá Trị Văn Hóa OPPO</h2>
          <p className="text-gray-400 text-2xl">Speaker diễn giải thêm về từng giá trị</p>
        </div>
        <div className="grid grid-cols-2 gap-8 w-full max-w-6xl">
          {CULTURE_VALUES.map((val) => (
            <div key={val.id} className={`bg-gradient-to-br ${val.color} rounded-3xl p-10`}>
              <div className="text-6xl mb-4">{val.icon}</div>
              <h3 className="text-white font-black text-4xl mb-5">{val.title}</h3>
              <div className="space-y-3">
                {val.behaviors.map((b, i) => <p key={i} className="text-white/80 text-lg leading-relaxed">• {b}</p>)}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!q) return <div className="flex items-center justify-center h-full"><p className="text-gray-400 text-3xl">Thêm câu hỏi Stage 2 trong Admin.</p></div>;

  return (
    <div className="flex flex-col h-full p-12 gap-8">
      <div className="flex items-center justify-between">
        <div className="inline-flex items-center gap-4 bg-blue-500/10 border border-blue-500/30 rounded-full px-8 py-3">
          <span className="w-4 h-4 rounded-full bg-blue-400 animate-pulse" />
          <span className="text-blue-400 text-2xl font-bold">STAGE 2 — BIẾT ĐỂ HIỂU</span>
        </div>
        <div className="flex items-center gap-6">
          <span className="text-gray-400 text-2xl">Câu {currentQ + 1}/{questions.length}</span>
          <div className={`font-black text-5xl ${timeLeft <= 10 ? "text-red-400 animate-pulse" : "text-white"}`}>{timeLeft}s</div>
        </div>
      </div>

      <div className="h-4 bg-white/10 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-1000 ${timeLeft > 10 ? "bg-blue-500" : "bg-red-500"}`} style={{ width: `${(timeLeft / 30) * 100}%` }} />
      </div>

      <div className="bg-white/5 border border-white/10 rounded-3xl p-12 flex-1 flex items-center justify-center">
        <p className="text-white text-5xl font-bold leading-relaxed text-center">{q.question}</p>
      </div>

      {showAns && (
        <div className="bg-emerald-500/20 border border-emerald-500/40 rounded-3xl px-10 py-6 text-center">
          <p className="text-emerald-400 font-black text-4xl">✓ Đáp án: {q.answer}</p>
        </div>
      )}

      <div className="flex items-center justify-between">
        <span className="text-gray-500 text-2xl">{answered} người đã trả lời</span>
        <div className="flex gap-4">
          {!showAns ? (
            <button onClick={onShowAnswer} className="px-12 py-5 rounded-2xl bg-yellow-500 text-black font-black text-2xl hover:bg-yellow-400 active:scale-95 transition-all shadow-xl">
              📢 Hiện đáp án
            </button>
          ) : (
            <button onClick={onNext} className="px-12 py-5 rounded-2xl bg-emerald-500 text-white font-black text-2xl hover:bg-emerald-400 active:scale-95 transition-all shadow-xl">
              {currentQ < questions.length - 1 ? "Câu tiếp →" : "Kết thúc ✓"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Stage 3: Giải Mã Hành Vi
function HostGiaiMaHanhVi({ sessionData, s3answers, users, onEndGame }) {
  const gameEnded = sessionData?.s3ended || false;
  const gameStartTime = sessionData?.s3startTime || null;
  const TOTAL_TIME = 10 * 60;
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const questions = sessionData?.s3questions || [];

  useEffect(() => {
    if (!gameStartTime || gameEnded) return;
    const tick = () => { const e = Math.floor((Date.now() - gameStartTime) / 1000); setTimeLeft(Math.max(0, TOTAL_TIME - e)); };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [gameStartTime, gameEnded]);

  const submitted = Object.keys(s3answers).length;
  const total = users.length;
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const leaderboard = Object.values(s3answers).sort((a, b) => a.elapsed - b.elapsed).slice(0, 5);

  return (
    <div className="flex h-full p-12 gap-10">
      <div className="flex-1 flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-4 bg-purple-500/10 border border-purple-500/30 rounded-full px-8 py-3">
            <span className="w-4 h-4 rounded-full bg-purple-400 animate-pulse" />
            <span className="text-purple-400 text-2xl font-bold">STAGE 3 — GIẢI MÃ HÀNH VI</span>
          </div>
          <div className={`font-black text-7xl ${timeLeft < 60 ? "text-red-400 animate-pulse" : "text-white"}`}>
            ⏱ {mins}:{secs.toString().padStart(2, "0")}
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center gap-8">
          <p className="text-[10rem] font-black text-white leading-none">{submitted}</p>
          <p className="text-4xl text-gray-400">/ {total} đã nộp bài</p>
          <div className="w-full max-w-2xl h-6 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-purple-500 to-violet-400 rounded-full transition-all duration-500" style={{ width: `${total > 0 ? (submitted / total) * 100 : 0}%` }} />
          </div>
          <p className="text-gray-500 text-2xl">{questions.length} câu • Đúng +20đ • Hoàn thành sớm +50đ</p>
        </div>

        {!gameEnded ? (
          <div className="text-center">
            <button onClick={onEndGame} className="px-16 py-6 rounded-3xl bg-purple-600 text-white font-black text-3xl hover:bg-purple-500 active:scale-95 transition-all shadow-xl">
              Kết thúc Game ✓
            </button>
          </div>
        ) : <p className="text-center text-emerald-400 font-black text-3xl">✅ Game đã kết thúc</p>}
      </div>

      <div className="w-80 flex flex-col border-l border-white/10 pl-10 gap-5">
        <p className="text-white font-black text-2xl">🏃 Nộp bài sớm nhất</p>
        {leaderboard.length === 0 && <p className="text-gray-600 text-lg">Chưa có ai nộp…</p>}
        {leaderboard.map((s, i) => {
          const m = Math.floor(s.elapsed / 60); const sc = s.elapsed % 60;
          return (
            <div key={s.userId} className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl px-5 py-4">
              <span className="text-yellow-400 font-black text-2xl">#{i + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="text-white text-lg font-semibold truncate">{s.userName}</p>
                <p className="text-gray-500 text-sm">{m}:{sc.toString().padStart(2, "0")} • +{s.bonus}đ thưởng</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Stage 4: DNA Sharing
function HostDNASharing({ totalHearts }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-10">
      <div className="text-center">
        <div className="inline-flex items-center gap-4 bg-purple-500/10 border border-purple-500/30 rounded-full px-8 py-3 mb-8">
          <span className="w-4 h-4 rounded-full bg-purple-400 animate-pulse" />
          <span className="text-purple-400 text-3xl font-black tracking-widest">STAGE 4 — DNA SHARING</span>
        </div>
        <h2 className="text-8xl font-black text-white">Màn chia sẻ 💬</h2>
        <p className="text-gray-400 text-3xl mt-4">Lắng nghe những câu chuyện thực tế</p>
      </div>
      <p className="text-[12rem] font-black text-rose-400 leading-none">❤️</p>
      <p className="text-[8rem] font-black text-white leading-none">{totalHearts}</p>
      <p className="text-4xl text-gray-400">tim ủng hộ</p>
    </div>
  );
}

// Stage 5: Kết quả
function HostKetQua({ scores }) {
  const [showEnd, setShowEnd] = useState(false);
  if (showEnd) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-8 text-center">
        <img src="/mascot.png" alt="mascot" className="w-64 h-64 object-contain drop-shadow-2xl" />
        <h1 className="text-[10rem] font-black text-emerald-400 leading-none">CHÀO MỪNG</h1>
        <h2 className="text-8xl font-black text-white">BẠN ĐẾN NHÀ O</h2>
        <button onClick={() => setShowEnd(false)} className="mt-6 text-gray-600 text-lg underline">← Quay lại</button>
      </div>
    );
  }

  const top3 = scores.slice(0, 3);
  const rest = scores.slice(3, 10);
  return (
    <div className="flex flex-col h-full p-12 gap-8">
      <div className="text-center">
        <div className="inline-flex items-center gap-4 bg-yellow-500/10 border border-yellow-500/30 rounded-full px-8 py-3">
          <span className="text-yellow-400 text-2xl font-bold tracking-widest">🏆 STAGE 5 — BẢNG XẾP HẠNG</span>
        </div>
      </div>

      <div className="flex justify-center items-end gap-10">
        {[1, 0, 2].map((i) => {
          const s = top3[i]; if (!s) return null;
          const medals = ["🥇", "🥈", "🥉"];
          const heights = { 0: "h-52", 1: "h-36", 2: "h-32" };
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
        <button onClick={() => setShowEnd(true)} className="px-20 py-6 rounded-3xl bg-gradient-to-r from-emerald-500 to-green-400 text-white font-black text-3xl hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-emerald-500/30">
          🏠 Kết thúc chương trình
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
  const [users, setUsers] = useState([]);
  const [s2answers, setS2answers] = useState({});
  const [s3answers, setS3answers] = useState({});
  const [scores, setScores] = useState([]);
  const [siteUrl, setSiteUrl] = useState("");
  const prevHearts = useRef(0);
  const heartId = useRef(0);

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
    const u3 = onValue(ref(db, "users"), (snap) => { if (!snap.exists()) return setUsers([]); setUsers(Object.entries(snap.val()).map(([uid, v]) => ({ uid, ...v }))); });
    const u4 = onValue(ref(db, "s2answers"), (snap) => setS2answers(snap.exists() ? snap.val() : {}));
    const u5 = onValue(ref(db, "s3answers"), (snap) => setS3answers(snap.exists() ? snap.val() : {}));
    const u6 = onValue(ref(db, "scores"), (snap) => {
      if (!snap.exists()) return setScores([]);
      const list = Object.entries(snap.val()).filter(([_, s]) => s.name)
        .map(([uid, s]) => ({ uid, name: s.name, total: (s.s2 || 0) + (s.s3 || 0) + (s.hearts || 0) }))
        .sort((a, b) => b.total - a.total);
      setScores(list);
    });
    return () => { u1(); u2(); u3(); u4(); u5(); u6(); };
  }, []);

  useEffect(() => {
    if (stage !== 3 || !sessionData?.s3startTime || sessionData?.s3ended) return;
    const allDone = users.length > 0 && Object.keys(s3answers).length >= users.length;
    const elapsed = Math.floor((Date.now() - sessionData.s3startTime) / 1000);
    if (allDone || elapsed >= 600) { set(ref(db, "session/s3ended"), true); }
  }, [s3answers, users, stage, sessionData]);

  async function handleStart() { await set(ref(db, "session/stage"), 1); }
  async function handleS2ShowAnswer() { await set(ref(db, "session/s2showAnswer"), true); }
  async function handleS2Next() {
    const cur = sessionData?.s2current ?? 0;
    const qs = sessionData?.s2questions || [];
    if (cur < qs.length - 1) { await set(ref(db, "session/s2current"), cur + 1); await set(ref(db, "session/s2showAnswer"), false); }
    else { await set(ref(db, "session/s2ended"), true); }
  }
  async function handleS3EndGame() { await set(ref(db, "session/s3ended"), true); }

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
      <div className="bg-gradient-to-br from-gray-950 via-gray-900 to-emerald-950 relative overflow-hidden" style={{ height: "100vh", width: "100vw" }}>
        <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
          {hearts.map((h) => <FloatingHeart key={h.id} id={h.id} x={h.x} onDone={() => setHearts((x) => x.filter((i) => i.id !== h.id))} />)}
        </div>
        <div className="h-full w-full">
          {stage === 0 && <HostWelcome url={siteUrl} users={users} onStart={handleStart} />}
          {stage === 1 && <HostIceBreaking totalHearts={totalHearts} users={users} />}
          {stage === 2 && <HostBietDeHieu sessionData={sessionData} s2answers={s2answers} onShowAnswer={handleS2ShowAnswer} onNext={handleS2Next} />}
          {stage === 3 && <HostGiaiMaHanhVi sessionData={sessionData} s3answers={s3answers} users={users} onEndGame={handleS3EndGame} />}
          {stage === 4 && <HostDNASharing totalHearts={totalHearts} />}
          {stage === 5 && <HostKetQua scores={scores} />}
        </div>
      </div>
    </>
  );
}
