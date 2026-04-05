// pages/index.js — Màn hình Nhân viên
import { useEffect, useState, useRef } from "react";
import { db } from "../firebase";
import { ref, set, push, onValue, get } from "firebase/database";
import Head from "next/head";
import { CULTURE_VALUES } from "../data/cultureValues";

function getUserId() {
  if (typeof window === "undefined") return null;
  let id = localStorage.getItem("oppo_uid");
  if (!id) {
    id = "u_" + Math.random().toString(36).slice(2, 9) + "_" + Date.now();
    localStorage.setItem("oppo_uid", id);
  }
  return id;
}

// ── Stage 0: Màn hình chào / đăng nhập ──────────────────────────────────────
function StageWelcome({ onJoin }) {
  const [name, setName] = useState("");
  const [dept, setDept] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleJoin() {
    if (!name.trim()) return;
    setLoading(true);
    onJoin(name.trim(), dept.trim());
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-emerald-950 flex flex-col items-center justify-center px-6 gap-6">
      <div className="text-center mb-2">
        <div className="text-5xl mb-3">🟢</div>
        <h1 className="text-3xl font-black text-white">OPPO <span className="text-emerald-400">CULTURE</span></h1>
        <h2 className="text-xl font-black text-white">WORKSHOP</h2>
        <p className="text-gray-400 text-sm mt-2">Nhập thông tin để tham gia</p>
      </div>
      <div className="w-full max-w-xs space-y-3">
        <input
          className="w-full bg-white/10 border border-white/20 rounded-2xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors"
          placeholder="Họ và tên *"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="w-full bg-white/10 border border-white/20 rounded-2xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors"
          placeholder="Phòng ban (tuỳ chọn)"
          value={dept}
          onChange={(e) => setDept(e.target.value)}
        />
        <button
          onClick={handleJoin}
          disabled={!name.trim() || loading}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-400 text-white font-black text-lg disabled:opacity-40 active:scale-95 transition-all shadow-lg shadow-emerald-500/30"
        >
          {loading ? "Đang tham gia…" : "Tham gia ngay →"}
        </button>
      </div>
    </div>
  );
}

// ── Stage 1: Ice Breaking ────────────────────────────────────────────────────
function StageIceBreaking({ userId, userName }) {
  const [heartCount, setHeartCount] = useState(0);
  const [burst, setBurst] = useState(false);

  useEffect(() => {
    const unsub = onValue(ref(db, "hearts"), (snap) => {
      setHeartCount(snap.exists() ? Object.keys(snap.val()).length : 0);
    });
    return () => unsub();
  }, []);

  async function sendHeart() {
    setBurst(true);
    setTimeout(() => setBurst(false), 500);
    await push(ref(db, "hearts"), { userId, ts: Date.now() });
    // +1 điểm tim
    const scoreRef = ref(db, `scores/${userId}/hearts`);
    const snap = await get(scoreRef);
    await set(scoreRef, (snap.exists() ? snap.val() : 0) + 1);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-emerald-950 flex flex-col items-center justify-center gap-8 px-6">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-4 py-1.5 mb-4">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-emerald-400 text-xs font-semibold tracking-widest">STAGE 1 — ICE BREAKING</span>
        </div>
        <h2 className="text-2xl font-black text-white">Chào {userName}! 👋</h2>
        <p className="text-gray-400 text-sm mt-2">Thả tim để làm nóng không khí nào!</p>
      </div>
      <button
        onClick={sendHeart}
        className={`w-28 h-28 rounded-full bg-gradient-to-br from-rose-500 to-pink-600 text-6xl flex items-center justify-center shadow-xl shadow-rose-500/40 transition-all duration-150 active:scale-90 ${burst ? "scale-110" : "scale-100"}`}
      >❤️</button>
      <div className="text-center">
        <span className="text-white font-black text-3xl">{heartCount}</span>
        <p className="text-gray-400 text-sm">tim đã gửi</p>
      </div>
    </div>
  );
}

// ── Stage 2: Case Study ──────────────────────────────────────────────────────
function StageCaseStudy({ userId, userName, sessionData }) {
  const [myAnswer, setMyAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const currentQ = sessionData?.currentQuestion || 0;
  const questions = sessionData?.questions || [];
  const showAns = sessionData?.showAnswer || false;
  const q = questions[currentQ];

  // Reset khi câu hỏi đổi
  useEffect(() => {
    setMyAnswer(null);
    setShowResult(false);
  }, [currentQ]);

  useEffect(() => {
    if (showAns) setShowResult(true);
  }, [showAns]);

  async function handleAnswer(ans) {
    if (myAnswer) return;
    setMyAnswer(ans);
    const isCorrect = ans === q.correct;
    await set(ref(db, `answers/${userId}_${currentQ}`), { userId, userName, answer: ans, correct: isCorrect, ts: Date.now() });
    if (isCorrect) {
      const scoreRef = ref(db, `scores/${userId}/quiz`);
      const snap = await get(scoreRef);
      await set(scoreRef, (snap.exists() ? snap.val() : 0) + 10);
    }
  }

  if (!q) return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-emerald-950 flex items-center justify-center">
      <p className="text-gray-400">Chờ Host bắt đầu câu hỏi…</p>
    </div>
  );

  const COLORS = {
    A: { normal: "from-emerald-600 to-green-500", correct: "from-emerald-400 to-green-300", wrong: "from-gray-700 to-gray-600" },
    B: { normal: "from-teal-600 to-cyan-500", correct: "from-teal-400 to-cyan-300", wrong: "from-gray-700 to-gray-600" },
    C: { normal: "from-green-600 to-emerald-500", correct: "from-green-400 to-emerald-300", wrong: "from-gray-700 to-gray-600" },
    D: { normal: "from-cyan-600 to-teal-500", correct: "from-cyan-400 to-teal-300", wrong: "from-gray-700 to-gray-600" },
  };

  function getBtnStyle(ans) {
    if (!showResult) {
      if (myAnswer === ans) return `bg-gradient-to-br ${COLORS[ans].normal} ring-2 ring-white/40 scale-105`;
      if (myAnswer) return "bg-gray-800/50 text-gray-500 cursor-not-allowed";
      return `bg-gradient-to-br ${COLORS[ans].normal} active:scale-95 hover:scale-105`;
    }
    if (ans === q.correct) return `bg-gradient-to-br ${COLORS[ans].correct} ring-2 ring-white/60 scale-105`;
    if (myAnswer === ans && ans !== q.correct) return "bg-gradient-to-br from-red-700 to-red-600";
    return "bg-gray-800/40 text-gray-600";
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-emerald-950 flex flex-col px-4 py-6 gap-4">
      <div className="flex items-center justify-between">
        <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-3 py-1">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-emerald-400 text-xs font-semibold">STAGE 2 — CASE STUDY</span>
        </div>
        <span className="text-gray-500 text-sm">Câu {currentQ + 1}/{questions.length}</span>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex-1">
        <p className="text-white font-semibold text-base leading-relaxed">{q.question}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {["A", "B", "C", "D"].map((ans) => (
          <button
            key={ans}
            onClick={() => handleAnswer(ans)}
            disabled={!!myAnswer}
            className={`relative h-16 rounded-2xl text-white font-black text-xl transition-all duration-200 ${getBtnStyle(ans)}`}
          >
            {showResult && ans === q.correct && <span className="absolute top-1 right-2 text-xs">✓</span>}
            {showResult && myAnswer === ans && ans !== q.correct && <span className="absolute top-1 right-2 text-xs">✗</span>}
            <span className="block text-sm font-bold opacity-60">{ans}</span>
            <span className="block text-xs font-semibold px-1 leading-tight">{q[`opt${ans}`]}</span>
          </button>
        ))}
      </div>

      {myAnswer && !showResult && (
        <p className="text-center text-emerald-400 text-sm font-semibold">✅ Đã chọn {myAnswer} — Chờ kết quả…</p>
      )}
      {showResult && (
        <div className={`text-center py-3 rounded-2xl font-black text-lg ${myAnswer === q.correct ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}>
          {myAnswer === q.correct ? "🎉 Chính xác! +10 điểm" : `❌ Đáp án đúng là ${q.correct}`}
        </div>
      )}
    </div>
  );
}

// ── Stage 3: Sharing ─────────────────────────────────────────────────────────
function StageSharing({ userId }) {
  const [burst, setBurst] = useState(false);
  const [heartCount, setHeartCount] = useState(0);

  useEffect(() => {
    const unsub = onValue(ref(db, "hearts"), (snap) => {
      setHeartCount(snap.exists() ? Object.keys(snap.val()).length : 0);
    });
    return () => unsub();
  }, []);

  async function sendHeart() {
    setBurst(true);
    setTimeout(() => setBurst(false), 500);
    await push(ref(db, "hearts"), { userId, ts: Date.now() });
    const scoreRef = ref(db, `scores/${userId}/hearts`);
    const snap = await get(scoreRef);
    await set(scoreRef, (snap.exists() ? snap.val() : 0) + 1);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-emerald-950 flex flex-col items-center justify-center gap-8 px-6">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/30 rounded-full px-4 py-1.5 mb-4">
          <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
          <span className="text-purple-400 text-xs font-semibold tracking-widest">STAGE 3 — SHARING</span>
        </div>
        <h2 className="text-2xl font-black text-white">Lắng nghe & cảm nhận 💬</h2>
        <p className="text-gray-400 text-sm mt-2">Thả tim để ủng hộ người chia sẻ!</p>
      </div>
      <button
        onClick={sendHeart}
        className={`w-28 h-28 rounded-full bg-gradient-to-br from-rose-500 to-pink-600 text-6xl flex items-center justify-center shadow-xl shadow-rose-500/40 transition-all duration-150 active:scale-90 ${burst ? "scale-110" : "scale-100"}`}
      >❤️</button>
      <p className="text-white font-black text-2xl">{heartCount} <span className="text-gray-400 text-sm font-normal">tim</span></p>
    </div>
  );
}

// ── Stage 4: Kết quả + Giá trị văn hóa ──────────────────────────────────────
function StageResult({ userId }) {
  const [scores, setScores] = useState([]);
  const [myRank, setMyRank] = useState(null);
  const [openValue, setOpenValue] = useState(null);

  useEffect(() => {
    const unsub = onValue(ref(db, "scores"), (snap) => {
      if (!snap.exists()) return;
      const data = snap.val();
      const list = Object.entries(data).map(([uid, s]) => ({
        uid,
        name: s.name || uid,
        total: (s.quiz || 0) + (s.hearts || 0),
      })).sort((a, b) => b.total - a.total);
      setScores(list);
      const rank = list.findIndex((x) => x.uid === userId) + 1;
      setMyRank(rank);
    });
    return () => unsub();
  }, [userId]);

  if (openValue !== null) {
    const val = CULTURE_VALUES[openValue];
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-emerald-950 flex flex-col px-4 py-8 gap-6">
        <button onClick={() => setOpenValue(null)} className="text-gray-400 text-sm flex items-center gap-2">← Quay lại</button>
        <div className={`bg-gradient-to-br ${val.color} rounded-3xl p-6`}>
          <div className="text-4xl mb-2">{val.icon}</div>
          <h2 className="text-white font-black text-2xl">{val.title}</h2>
        </div>
        <div className="space-y-3">
          {val.behaviors.map((b, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <p className="text-gray-200 text-sm leading-relaxed">{b}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-emerald-950 flex flex-col px-4 py-8 gap-6">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 rounded-full px-4 py-1.5 mb-3">
          <span className="text-yellow-400 text-xs font-semibold tracking-widest">STAGE 4 — KẾT QUẢ</span>
        </div>
        {myRank && <p className="text-white font-black text-lg">Bạn xếp hạng <span className="text-yellow-400 text-3xl">#{myRank}</span></p>}
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

      <div>
        <h3 className="text-white font-black text-lg mb-3 text-center">4 Giá trị Văn hóa OPPO</h3>
        <div className="grid grid-cols-2 gap-3">
          {CULTURE_VALUES.map((val, i) => (
            <button
              key={val.id}
              onClick={() => setOpenValue(i)}
              className={`bg-gradient-to-br ${val.color} rounded-2xl p-4 text-left active:scale-95 transition-all`}
            >
              <div className="text-2xl mb-1">{val.icon}</div>
              <p className="text-white font-black text-sm leading-tight">{val.title}</p>
              <p className="text-white/60 text-xs mt-1">Xem chi tiết →</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function EmployeePage() {
  const [userId, setUserId] = useState(null);
  const [userName, setUserName] = useState(null);
  const [stage, setStage] = useState(null);
  const [sessionData, setSessionData] = useState(null);

  useEffect(() => {
    const uid = getUserId();
    setUserId(uid);
    const savedName = typeof window !== "undefined" ? localStorage.getItem("oppo_name") : null;
    if (savedName) setUserName(savedName);
  }, []);

  useEffect(() => {
    const unsub = onValue(ref(db, "session"), (snap) => {
      if (!snap.exists()) return;
      const data = snap.val();
      setStage(data.stage ?? 0);
      setSessionData(data);
    });
    return () => unsub();
  }, []);

  async function handleJoin(name, dept) {
    const uid = getUserId();
    setUserName(name);
    localStorage.setItem("oppo_name", name);
    await set(ref(db, `users/${uid}`), { name, dept, joinedAt: Date.now() });
    await set(ref(db, `scores/${uid}/name`), name);
  }

  if (!userId) return null;

  // Chưa đăng nhập tên
  if (!userName) return <StageWelcome onJoin={handleJoin} />;

  // Chờ host bắt đầu
  if (stage === null || stage === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-emerald-950 flex flex-col items-center justify-center gap-4 px-6">
        <div className="text-5xl">🟢</div>
        <h1 className="text-3xl font-black text-white text-center">OPPO <span className="text-emerald-400">CULTURE</span> WORKSHOP</h1>
        <p className="text-gray-400 text-sm">Xin chào <span className="text-white font-bold">{userName}</span>!</p>
        <div className="flex items-center gap-2 mt-4">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-emerald-400 text-sm">Chờ Host bắt đầu chương trình…</span>
        </div>
      </div>
    );
  }

  if (stage === 1) return <StageIceBreaking userId={userId} userName={userName} />;
  if (stage === 2) return <StageCaseStudy userId={userId} userName={userName} sessionData={sessionData} />;
  if (stage === 3) return <StageSharing userId={userId} />;
  if (stage === 4) return <StageResult userId={userId} />;

  return null;
}
