import React, { useState, useEffect, useRef, useCallback } from "react";

const CROPS = [
  { emoji: "🥕", points: 10, color: "#e65100" },
  { emoji: "🥔", points: 15, color: "#5d4037" },
  { emoji: "🥬", points: 20, color: "#2e7d32" },
  { emoji: "🌽", points: 25, color: "#f9a825" },
  { emoji: "🍅", points: 30, color: "#c62828" },
  { emoji: "⭐", points: 60, color: "#f57f17" }, // rare golden crop
];

const GAME_DURATION = 40;
const HOLE_COUNT = 9;

const getReward = (score) => {
  if (score >= 500) return { gems: 50, gold: 500, label: "🏆 Amazing!" };
  if (score >= 300) return { gems: 30, gold: 300, label: "🥇 Great!" };
  if (score >= 150) return { gems: 15, gold: 150, label: "🥈 Good!" };
  return { gems: 5, gold: 50, label: "🥉 Keep Trying!" };
};

export default function WhackAMole() {
  const [phase, setPhase] = useState("idle"); // idle | playing | ended
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [holes, setHoles] = useState(Array(HOLE_COUNT).fill(null));
  const [flashes, setFlashes] = useState(Array(HOLE_COUNT).fill(null));
  const [highScore, setHighScore] = useState(() =>
    parseInt(localStorage.getItem("whack_high_score") || "0", 10)
  );
  const [rewardClaimed, setRewardClaimed] = useState(false);
  const popTimers = useRef([]);

  const clearPops = () => { popTimers.current.forEach(clearTimeout); popTimers.current = []; };

  const startGame = () => {
    clearPops();
    setScore(0);
    setTimeLeft(GAME_DURATION);
    setHoles(Array(HOLE_COUNT).fill(null));
    setFlashes(Array(HOLE_COUNT).fill(null));
    setRewardClaimed(false);
    setPhase("playing");
  };

  // countdown
  useEffect(() => {
    if (phase !== "playing") return;
    const t = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { setPhase("ended"); clearPops(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [phase]);

  // mole popping scheduler
  useEffect(() => {
    if (phase !== "playing") return;
    let active = true;
    const schedule = () => {
      if (!active) return;
      const delay = 500 + Math.random() * 600;
      const t = setTimeout(() => {
        if (!active) return;
        const idx = Math.floor(Math.random() * HOLE_COUNT);
        const isRare = Math.random() < 0.08;
        const crop = isRare ? CROPS[5] : CROPS[Math.floor(Math.random() * 5)];
        setHoles(prev => { const n = [...prev]; if (!n[idx]) { n[idx] = crop; } return n; });
        const hideT = setTimeout(() => {
          setHoles(prev => { const n = [...prev]; n[idx] = null; return n; });
        }, 1200 + Math.random() * 400);
        popTimers.current.push(hideT);
        schedule();
      }, delay);
      popTimers.current.push(t);
    };
    schedule();
    return () => { active = false; clearPops(); };
  }, [phase]);

  const whack = useCallback((idx) => {
    setHoles(prev => {
      if (!prev[idx]) return prev;
      const crop = prev[idx];
      setScore(s => s + crop.points);
      setFlashes(f => { const n = [...f]; n[idx] = crop.color; return n; });
      setTimeout(() => setFlashes(f => { const n = [...f]; n[idx] = null; return n; }), 250);
      const n = [...prev]; n[idx] = null; return n;
    });
  }, []);

  const handleClaimReward = () => {
    const r = getReward(score);
    const curGems = parseInt(localStorage.getItem("sandbox_gems") || "0", 10);
    localStorage.setItem("sandbox_gems", String(curGems + r.gems));
    window.dispatchEvent(new CustomEvent("sandboxGemsChanged"));
    const curGold = parseInt(localStorage.getItem("sandbox_gold") || "0", 10);
    localStorage.setItem("sandbox_gold", String(curGold + r.gold));
    window.dispatchEvent(new CustomEvent("goldChanged"));
    if (score > highScore) {
      localStorage.setItem("whack_high_score", String(score));
      setHighScore(score);
    }
    setRewardClaimed(true);
  };

  const reward = getReward(score);

  // ── Idle screen ────────────────────────────────────────────────────────────
  if (phase === "idle") return (
    <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>
        Crops are popping up from their holes! Tap them as fast as you can before they disappear.<br />
        Rare ⭐ Golden Crops are worth the most — keep your eyes peeled!
      </div>

      <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
        <div style={{
          background: "rgba(255,255,255,0.07)", borderRadius: 12,
          padding: "12px 20px", flex: 1, textAlign: "center",
        }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 2 }}>HIGH SCORE</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#ffd54f" }}>{highScore}</div>
        </div>
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6, flex: 2,
        }}>
          {CROPS.map(c => (
            <div key={c.emoji} style={{
              background: "rgba(255,255,255,0.06)", borderRadius: 8, padding: "6px 4px",
              textAlign: "center", fontSize: 10, color: "rgba(255,255,255,0.6)",
            }}>
              <div style={{ fontSize: 20 }}>{c.emoji}</div>
              <div style={{ color: "#ffd54f", fontWeight: 700 }}>+{c.points}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Reward tiers */}
      <div style={{ display: "flex", gap: 8 }}>
        {[
          { label: "150+ pts", gems: 15, gold: 150 },
          { label: "300+ pts", gems: 30, gold: 300 },
          { label: "500+ pts", gems: 50, gold: 500 },
        ].map(t => (
          <div key={t.label} style={{
            flex: 1, background: "rgba(255,255,255,0.06)", borderRadius: 10,
            padding: "10px 8px", textAlign: "center",
          }}>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginBottom: 4 }}>{t.label}</div>
            <div style={{ fontSize: 12, color: "#90caf9" }}>💎 {t.gems}</div>
            <div style={{ fontSize: 12, color: "#ffd54f" }}>🪙 {t.gold}</div>
          </div>
        ))}
      </div>

      <button onClick={startGame} style={{
        background: "linear-gradient(180deg, #66bb6a, #2e7d32)",
        border: "none", borderRadius: 30, padding: "14px 0",
        color: "#fff", fontSize: 18, fontWeight: 700,
        cursor: "pointer", boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
        transition: "transform 0.1s",
      }}
        onMouseDown={e => e.currentTarget.style.transform = "scale(0.97)"}
        onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}
        onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
      >▶ START GAME</button>
    </div>
  );

  // ── Playing screen ──────────────────────────────────────────────────────────
  if (phase === "playing") return (
    <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
      {/* HUD */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{
          background: "rgba(255,255,255,0.1)", borderRadius: 20,
          padding: "6px 16px", fontSize: 15, fontWeight: 700, color: "#ffd54f",
        }}>Score: {score}</div>
        <div style={{
          background: timeLeft <= 10 ? "rgba(244,67,54,0.3)" : "rgba(0,0,0,0.3)",
          border: `2px solid ${timeLeft <= 10 ? "#f44336" : "rgba(255,255,255,0.2)"}`,
          borderRadius: 20, padding: "6px 16px",
          fontSize: 15, fontWeight: 700,
          color: timeLeft <= 10 ? "#f44336" : "#fff",
          transition: "all 0.3s",
        }}>⏱ {timeLeft}s</div>
      </div>

      {/* Hole grid */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(3,1fr)",
        gap: 12, padding: "0 4px",
      }}>
        {holes.map((crop, i) => (
          <div
            key={i}
            onClick={() => whack(i)}
            style={{
              aspectRatio: "1",
              borderRadius: 16,
              background: flashes[i]
                ? flashes[i]
                : crop
                  ? "linear-gradient(180deg, #4a2c0a 0%, #2d1a05 100%)"
                  : "linear-gradient(180deg, #1a0f03 0%, #0d0800 100%)",
              border: crop
                ? `2px solid ${crop.color}`
                : "2px solid rgba(255,255,255,0.08)",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: crop ? "pointer" : "default",
              fontSize: crop ? 38 : 24,
              transition: "background 0.1s, transform 0.08s",
              transform: crop ? "scale(1.05)" : "scale(1)",
              boxShadow: crop ? `0 0 16px ${crop.color}55` : "inset 0 4px 8px rgba(0,0,0,0.6)",
              userSelect: "none",
            }}
          >
            {crop ? crop.emoji : "🕳️"}
          </div>
        ))}
      </div>
    </div>
  );

  // ── Ended screen ────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: "28px", display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
      <div style={{ fontSize: 28, fontWeight: 700, color: "#fff", textAlign: "center" }}>
        {reward.label}
      </div>
      <div style={{ fontSize: 48, fontWeight: 700, color: "#ffd54f" }}>{score}</div>
      <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
        {score > highScore ? "🎉 New High Score!" : `High Score: ${highScore}`}
      </div>

      <div style={{
        background: "rgba(255,255,255,0.07)", borderRadius: 16,
        padding: "16px 32px", display: "flex", gap: 24, alignItems: "center",
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 28 }}>💎</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#90caf9" }}>{reward.gems}</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 28 }}>🪙</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#ffd54f" }}>{reward.gold}</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, width: "100%" }}>
        <button onClick={startGame} style={{
          flex: 1, background: "rgba(255,255,255,0.1)",
          border: "1px solid rgba(255,255,255,0.2)", borderRadius: 24,
          padding: "12px 0", color: "#fff", fontSize: 15, fontWeight: 700,
          cursor: "pointer",
        }}>↺ Play Again</button>
        <button
          onClick={handleClaimReward}
          disabled={rewardClaimed}
          style={{
            flex: 2,
            background: rewardClaimed
              ? "rgba(255,255,255,0.08)"
              : "linear-gradient(180deg, #66bb6a, #2e7d32)",
            border: "none", borderRadius: 24,
            padding: "12px 0", color: rewardClaimed ? "rgba(255,255,255,0.3)" : "#fff",
            fontSize: 15, fontWeight: 700,
            cursor: rewardClaimed ? "default" : "pointer",
            boxShadow: rewardClaimed ? "none" : "0 4px 12px rgba(0,0,0,0.4)",
          }}
        >{rewardClaimed ? "✓ Claimed" : "Claim Reward"}</button>
      </div>
    </div>
  );
}
