import React, { useState, useCallback } from "react";

// ── Helpers ───────────────────────────────────────────────────────────────────

const getLS = (k, def = "0") => { try { return localStorage.getItem(k) || def; } catch { return def; } };
const setLS = (k, v) => { try { localStorage.setItem(k, v); } catch {} };

const addGems = (n) => {
  setLS("sandbox_gems", String(parseInt(getLS("sandbox_gems")) + n));
  window.dispatchEvent(new CustomEvent("sandboxGemsChanged"));
};

const getFarmLevel = () =>
  Math.floor(Math.sqrt(parseInt(getLS("sandbox_farming_xp", "0")) / 150)) + 1;

const fmt = (n) =>
  n >= 1_000_000 ? (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M"
  : n >= 1_000   ? (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K"
  : String(n);

// ── Achievement definitions ───────────────────────────────────────────────────

const ACHIEVEMENTS = [
  {
    id: "farm_level",
    cat: "Farming",
    title: "Seasoned Farmer",
    desc: "Reach Farm Level",
    tiers: [
      { goal: 5,  gems: 20  },
      { goal: 10, gems: 35  },
      { goal: 20, gems: 55  },
      { goal: 30, gems: 80  },
      { goal: 50, gems: 120 },
    ],
    getValue: getFarmLevel,
    fmtProgress: (v, g) => `Lv.${v} / Lv.${g}`,
  },
  {
    id: "plots_unlocked",
    cat: "Farming",
    title: "Land Baron",
    desc: "Unlock farm plots",
    tiers: [
      { goal: 9,  gems: 15  },
      { goal: 12, gems: 25  },
      { goal: 18, gems: 40  },
      { goal: 24, gems: 65  },
      { goal: 30, gems: 100 },
    ],
    getValue: () => {
      try { return JSON.parse(localStorage.getItem("sandbox_unlocked_plots") || "[6,7,8]").length; }
      catch { return 3; }
    },
    fmtProgress: (v, g) => `${v} / ${g} plots`,
  },
  {
    id: "total_harvested",
    cat: "Farming",
    title: "Bountiful Harvest",
    desc: "Harvest crops",
    tiers: [
      { goal: 10,   gems: 15  },
      { goal: 50,   gems: 25  },
      { goal: 100,  gems: 40  },
      { goal: 500,  gems: 65  },
      { goal: 1000, gems: 100 },
    ],
    getValue: () => parseInt(getLS("sandbox_total_harvested", "0")),
    fmtProgress: (v, g) => `${v} / ${g} crops`,
  },
  {
    id: "gold_held",
    cat: "Wealth",
    title: "Gold Hoarder",
    desc: "Hold gold",
    tiers: [
      { goal: 1_000,    gems: 10  },
      { goal: 10_000,   gems: 20  },
      { goal: 50_000,   gems: 40  },
      { goal: 200_000,  gems: 65  },
      { goal: 1_000_000,gems: 100 },
    ],
    getValue: () => parseInt(getLS("sandbox_gold", "0")),
    fmtProgress: (v, g) => `${fmt(v)} / ${fmt(g)} 🪙`,
  },
  {
    id: "gems_held",
    cat: "Wealth",
    title: "Gem Collector",
    desc: "Accumulate gems",
    tiers: [
      { goal: 50,   gems: 10  },
      { goal: 200,  gems: 20  },
      { goal: 500,  gems: 35  },
      { goal: 1000, gems: 60  },
      { goal: 5000, gems: 100 },
    ],
    getValue: () => parseInt(getLS("sandbox_gems", "0")),
    fmtProgress: (v, g) => `${v} / ${g} 💎`,
  },
  {
    id: "quests_completed",
    cat: "Quests",
    title: "Quest Seeker",
    desc: "Complete quests",
    tiers: [
      { goal: 1,  gems: 10 },
      { goal: 3,  gems: 20 },
      { goal: 5,  gems: 35 },
      { goal: 10, gems: 60 },
      { goal: 20, gems: 100 },
    ],
    getValue: () => {
      try { return JSON.parse(localStorage.getItem("sandbox_completed_quests") || "[]").length; }
      catch { return 0; }
    },
    fmtProgress: (v, g) => `${v} / ${g} quests`,
  },
  {
    id: "packs_opened",
    cat: "Collection",
    title: "Pack Ripper",
    desc: "Open seed packs",
    tiers: [
      { goal: 1,  gems: 10  },
      { goal: 5,  gems: 20  },
      { goal: 15, gems: 35  },
      { goal: 30, gems: 60  },
      { goal: 60, gems: 100 },
    ],
    getValue: () => parseInt(getLS("sandbox_packs_opened", "0")),
    fmtProgress: (v, g) => `${v} / ${g} packs`,
  },
  {
    id: "unique_crops",
    cat: "Collection",
    title: "Crop Connoisseur",
    desc: "Grow different crop types",
    tiers: [
      { goal: 2, gems: 15  },
      { goal: 4, gems: 30  },
      { goal: 6, gems: 50  },
      { goal: 8, gems: 75  },
      { goal: 10,gems: 120 },
    ],
    getValue: () => {
      try {
        const produce = JSON.parse(localStorage.getItem("sandbox_produce") || "{}");
        return Object.keys(produce).filter(k => {
          const v = produce[k];
          return Array.isArray(v) ? v.length > 0 : Number(v) > 0;
        }).length;
      } catch { return 0; }
    },
    fmtProgress: (v, g) => `${v} / ${g} types`,
  },
];

const CATS = ["All", "Farming", "Wealth", "Quests", "Collection"];

// ── State helpers ─────────────────────────────────────────────────────────────

function getAchState(ach) {
  const value = ach.getValue();
  let claimed;
  try { claimed = JSON.parse(getLS(`ach_claimed_${ach.id}`, "[]")); }
  catch { claimed = []; }

  // Index of first unclaimed tier
  let activeTierIdx = ach.tiers.length; // beyond last = all done
  for (let i = 0; i < ach.tiers.length; i++) {
    if (!claimed.includes(i)) { activeTierIdx = i; break; }
  }

  const allDone = activeTierIdx >= ach.tiers.length;
  const activeTier = allDone ? null : ach.tiers[activeTierIdx];
  const claimable = !allDone && value >= activeTier.goal;
  const pct = allDone ? 1 : Math.min(value / activeTier.goal, 1);

  return { value, claimed, activeTierIdx, allDone, activeTier, claimable, pct };
}

// ── Wavy divider (CSS scallop) ────────────────────────────────────────────────

const WAVE_STYLE = {
  height: 10,
  backgroundImage:
    "radial-gradient(circle at 8px 0, rgba(0,0,0,0.25) 7px, transparent 7px)",
  backgroundSize: "16px 10px",
  backgroundRepeat: "repeat-x",
  flexShrink: 0,
};

// ── Achievement Card ──────────────────────────────────────────────────────────

function AchCard({ ach, onClaim }) {
  const state = getAchState(ach);
  const { value, claimed, activeTierIdx, allDone, activeTier, claimable, pct } = state;

  const isLocked = false; // future: unlock conditions
  if (isLocked) return <LockedCard />;

  const barColor = allDone ? "#66bb6a"
    : claimable            ? "#66bb6a"
    : "#f9a825";

  return (
    <div style={{
      background: "linear-gradient(180deg, #3a2060 0%, #2a1545 100%)",
      borderRadius: 14,
      overflow: "hidden",
      border: claimable && !allDone
        ? "2px solid #a0e080"
        : allDone
        ? "2px solid rgba(102,187,106,0.5)"
        : "2px solid rgba(255,255,255,0.08)",
      boxShadow: claimable && !allDone ? "0 0 16px rgba(160,224,128,0.25)" : "none",
      display: "flex",
      flexDirection: "column",
      minHeight: 140,
    }}>
      {/* Header */}
      <div style={{ padding: "10px 14px 6px" }}>
        <div style={{ fontSize: 10, color: "#ce93d8", letterSpacing: "0.06em", marginBottom: 2 }}>
          {ach.cat.toUpperCase()}
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", lineHeight: 1.2 }}>
          {ach.title}
        </div>
      </div>

      {/* Wavy divider */}
      <div style={WAVE_STYLE} />

      {/* Milestone dots */}
      <div style={{ padding: "8px 14px 4px", display: "flex", alignItems: "center", gap: 0 }}>
        {ach.tiers.map((t, i) => {
          const isClaimed = claimed.includes(i);
          const isActive = i === activeTierIdx;
          const isFuture = i > activeTierIdx;
          return (
            <React.Fragment key={i}>
              {i > 0 && (
                <div style={{
                  flex: 1, height: 3,
                  background: isClaimed || (i <= activeTierIdx && !isFuture)
                    ? "linear-gradient(90deg,#9c4dcc,#7b1fa2)"
                    : "rgba(255,255,255,0.12)",
                  borderRadius: 2,
                }} />
              )}
              <div style={{
                width: isActive ? 18 : 14,
                height: isActive ? 18 : 14,
                borderRadius: "50%",
                flexShrink: 0,
                background: isClaimed ? "linear-gradient(135deg,#9c4dcc,#6a1b9a)"
                  : isActive    ? "linear-gradient(135deg,#e040fb,#9c27b0)"
                  : "rgba(255,255,255,0.12)",
                border: isActive ? "2px solid #ea80fc" : isClaimed ? "2px solid #ab47bc" : "2px solid rgba(255,255,255,0.15)",
                boxShadow: isActive ? "0 0 10px #ea80fc88" : "none",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: isClaimed ? 8 : 0,
              }}>
                {isClaimed ? "✓" : ""}
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {/* Progress bar + info row */}
      <div style={{ padding: "6px 14px 10px", flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
        {/* Bar */}
        <div style={{ height: 14, background: "rgba(0,0,0,0.35)", borderRadius: 20, overflow: "hidden", position: "relative" }}>
          <div style={{
            height: "100%",
            width: `${pct * 100}%`,
            background: allDone
              ? "linear-gradient(90deg,#388e3c,#66bb6a)"
              : claimable
              ? "linear-gradient(90deg,#388e3c,#a5d6a7)"
              : "linear-gradient(90deg,#e65100,#f9a825)",
            borderRadius: 20,
            transition: "width 0.4s",
          }} />
          <div style={{
            position: "absolute", inset: 0, display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: 9, fontWeight: 700,
            color: "rgba(255,255,255,0.85)",
          }}>
            {allDone
              ? "COMPLETE"
              : activeTier
              ? ach.fmtProgress(value, activeTier.goal)
              : ""}
          </div>
        </div>

        {/* Reward row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8 }}>
          {!allDone && activeTier && (
            <>
              {claimable ? (
                <button onClick={() => onClaim(ach, activeTierIdx)} style={{
                  display: "flex", alignItems: "center", gap: 6,
                  background: "linear-gradient(180deg,#7cb342,#33691e)",
                  border: "none", borderRadius: 20,
                  padding: "5px 12px",
                  cursor: "pointer", color: "#fff", fontSize: 12, fontWeight: 700,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
                }}>
                  <span style={{ fontSize: 14 }}>»</span>
                  <span style={{
                    background: "linear-gradient(180deg,#1565c0,#0d47a1)",
                    borderRadius: 12, padding: "2px 8px", fontSize: 11, fontWeight: 700,
                    display: "flex", alignItems: "center", gap: 4,
                  }}><img src="/images/profile_bar/diamond.png" alt="" style={{ width: '13px', height: '13px', objectFit: 'contain', verticalAlign: 'middle' }} /> {activeTier.gems}</span>
                </button>
              ) : (
                <div style={{
                  background: "rgba(0,0,0,0.4)", borderRadius: 12,
                  padding: "3px 10px", fontSize: 11, fontWeight: 700,
                  color: "rgba(255,255,255,0.6)", display: "flex", alignItems: "center", gap: 4,
                }}>
                  <img src="/images/profile_bar/diamond.png" alt="" style={{ width: '13px', height: '13px', objectFit: 'contain', verticalAlign: 'middle' }} /> {activeTier.gems}
                </div>
              )}
            </>
          )}
          {allDone && (
            <div style={{
              fontSize: 11, color: "#a5d6a7", fontWeight: 700,
              display: "flex", alignItems: "center", gap: 4,
            }}>✅ All claimed</div>
          )}
        </div>
      </div>
    </div>
  );
}

function LockedCard() {
  return (
    <div style={{
      background: "rgba(255,255,255,0.04)",
      borderRadius: 14, minHeight: 140,
      border: "2px solid rgba(255,255,255,0.06)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <span style={{ fontSize: 36, color: "rgba(255,255,255,0.15)" }}>?</span>
    </div>
  );
}

// ── Main Dialog ───────────────────────────────────────────────────────────────

export default function AchievementsDialog({ onClose }) {
  const [activeCat, setActiveCat] = useState("All");
  const [, forceUpdate] = useState(0);

  const handleClaim = useCallback((ach, tierIdx) => {
    let claimed;
    try { claimed = JSON.parse(getLS(`ach_claimed_${ach.id}`, "[]")); }
    catch { claimed = []; }
    if (claimed.includes(tierIdx)) return;
    const next = [...claimed, tierIdx];
    setLS(`ach_claimed_${ach.id}`, JSON.stringify(next));
    addGems(ach.tiers[tierIdx].gems);
    forceUpdate(n => n + 1);
  }, []);

  const filtered = activeCat === "All"
    ? ACHIEVEMENTS
    : ACHIEVEMENTS.filter(a => a.cat === activeCat);

  const claimableCount = ACHIEVEMENTS.filter(a => {
    const s = getAchState(a);
    return s.claimable && !s.allDone;
  }).length;

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, zIndex: 1200,
      background: "rgba(0,0,0,0.82)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: 760, maxHeight: "88vh",
        background: "linear-gradient(180deg,#1a0d2e,#100820)",
        borderRadius: 16, overflow: "hidden",
        boxShadow: "0 20px 80px rgba(0,0,0,0.95)",
        display: "flex", flexDirection: "column",
        fontFamily: "Cartoonist, sans-serif",
        border: "1px solid rgba(255,255,255,0.08)",
      }}>

        {/* Header */}
        <div style={{
          padding: "18px 24px 14px",
          background: "linear-gradient(180deg,#2a0d4a,#1a0830)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 28 }}>🏆</span>
            <div>
              <div style={{ fontSize: 22, fontWeight: 700, color: "#fff" }}>Achievements</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 1 }}>
                {ACHIEVEMENTS.filter(a => getAchState(a).allDone).length} / {ACHIEVEMENTS.length} completed
              </div>
            </div>
            {claimableCount > 0 && (
              <div style={{
                background: "#f44336", color: "#fff",
                borderRadius: "50%", width: 20, height: 20,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 700, marginLeft: 4,
              }}>{claimableCount}</div>
            )}
          </div>
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: "50%",
            background: "#1565c0", border: "2px solid rgba(255,255,255,0.3)",
            color: "#fff", fontSize: 16, fontWeight: 700, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>✕</button>
        </div>

        {/* Category tabs */}
        <div style={{
          display: "flex", gap: 6, padding: "12px 24px 0",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          flexShrink: 0,
        }}>
          {CATS.map(cat => {
            const isActive = cat === activeCat;
            const catClaimable = cat === "All"
              ? claimableCount
              : ACHIEVEMENTS.filter(a => a.cat === cat && getAchState(a).claimable && !getAchState(a).allDone).length;
            return (
              <button key={cat} onClick={() => setActiveCat(cat)} style={{
                padding: "8px 16px", borderRadius: "8px 8px 0 0",
                border: "none", cursor: "pointer",
                background: isActive ? "rgba(255,255,255,0.1)" : "transparent",
                color: isActive ? "#fff" : "rgba(255,255,255,0.45)",
                fontSize: 13, fontWeight: isActive ? 700 : 400,
                borderBottom: isActive ? "2px solid #e040fb" : "2px solid transparent",
                position: "relative", paddingBottom: 10,
              }}>
                {cat}
                {catClaimable > 0 && (
                  <span style={{
                    position: "absolute", top: 4, right: 4,
                    background: "#f44336", color: "#fff",
                    borderRadius: "50%", width: 14, height: 14,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 9, fontWeight: 900,
                  }}>{catClaimable}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Achievement grid */}
        <div style={{
          flex: 1, overflowY: "auto", padding: "16px 24px 24px",
          display: "grid", gridTemplateColumns: "1fr 1fr",
          gap: 14, alignContent: "start",
        }}>
          {filtered.map(ach => (
            <AchCard key={ach.id} ach={ach} onClaim={handleClaim} />
          ))}
          {/* Locked placeholder if odd count */}
          {filtered.length % 2 !== 0 && <LockedCard />}
        </div>
      </div>
    </div>
  );
}
