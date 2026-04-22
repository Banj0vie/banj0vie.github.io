import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";

// ── Helpers ───────────────────────────────────────────────────────────────────

const getLS  = (k, def = "0") => { try { return localStorage.getItem(k) || def; } catch { return def; } };
const setLS  = (k, v)         => { try { localStorage.setItem(k, v); }            catch {} };
const addGems = (n) => { setLS("sandbox_gems", String(parseInt(getLS("sandbox_gems")) + n)); window.dispatchEvent(new CustomEvent("sandboxGemsChanged")); };
const addHoney = (n) => {
  const next = String(parseInt(getLS("sandbox_honey", "0")) + n);
  setLS("sandbox_honey", next);
  window.dispatchEvent(new CustomEvent("sandboxHoneyChanged", { detail: next }));
};
const fmtHny = (n) => n >= 1000 ? (n / 1000).toFixed(0) + "K" : String(n);
const today   = () => new Date().toDateString();

// ── Event definitions ─────────────────────────────────────────────────────────

const EVENTS = [
  { id:"welcome_beta",   cat:"Events",   label:"🍯 Welcome to Honey Valleys", hasNotif:true,  timer:"7D 0hr",  bannerGrad:["#7b4f00","#3a2400"], bannerTitle:"WELCOME TO HONEY VALLEYS",  bannerSub:"Official Beta Launch — log in daily for exclusive rewards + Beta Pioneer PFP!", type:"welcome_beta" },
  { id:"month_checkin",  cat:"Events",   label:"📅 Monthly Check-In",         hasNotif:true,  timer:"30D",     bannerGrad:["#1a237e","#0d0a3e"], bannerTitle:"MONTHLY CHECK-IN",          bannerSub:"Log in daily for 30 days to earn the exclusive Month PFP!", type:"month_checkin" },
  { id:"flower_pot",     cat:"Events",   label:"🌺 Flower Pot Mystery",       hasNotif:true,  timer:"Ongoing", bannerGrad:["#2e7d32","#1b5e20"], bannerTitle:"FLOWER POT MYSTERY PRIZE",  bannerSub:"Pick one pot per day — one hides the exclusive Flower Pot PFP!", type:"flower_pot" },
  { id:"potato_whack",   cat:"Events",   label:"🥔 Whack-a-Potato",          hasNotif:false, timer:null,      bannerGrad:["#5d4037","#3e2723"], bannerTitle:"WHACK-A-POTATO",            bannerSub:"Smash potatoes, dodge onions, hit golden spuds for top score!", type:"potato_whack" },
  { id:"apple_buckets",  cat:"Events",   label:"🍎 Apple Buckets",            hasNotif:false, timer:"Coming Soon", bannerGrad:["#b71c1c","#4a0a0a"], bannerTitle:"APPLE BUCKETS",             bannerSub:"Swipe up to toss apples into the moving bucket — curve your throw for style!", type:"coming" },
  { id:"queen_pass",     cat:"Beta Pass",label:"👸 Queen Bees Beta Pass",     hasNotif:true,  timer:"14D 0hr", bannerGrad:["#880e4f","#4a004c"], bannerTitle:"QUEEN BEES BETA PASS",      bannerSub:"14 days of queen-tier rewards, cosmetics & exclusive Queen Beta PFP!", type:"queen_pass" },
  { id:"mayor_pass",     cat:"Beta Pass",label:"🎩 Mayor Beta Pass",          hasNotif:true,  timer:"14D 0hr", bannerGrad:["#1a3a5a","#0d1e2e"], bannerTitle:"MAYOR BETA PASS",           bannerSub:"14 days of wealth, power & exclusive Mayor Beta PFP!", type:"mayor_pass" },
  { id:"improve_farm",   cat:"Progress", label:"🌾 Improve Your Farm",        hasNotif:false, timer:null,      bannerGrad:["#33691e","#1b3a0a"], bannerTitle:"IMPROVE YOUR FARM",         bannerSub:"Unlock more farm plots to earn milestone rewards!", type:"improve_farm" },
  { id:"mission_rewards",cat:"Progress", label:"📋 Mission Board Rewards",    hasNotif:false, timer:null,      bannerGrad:["#4a148c","#2a004a"], bannerTitle:"MISSION BOARD REWARDS",     bannerSub:"Complete missions to earn prizes + exclusive Mission Board PFP!", type:"mission_rewards" },
  { id:"valley_pass",    cat:"Season",   label:"Valley Pass",                 hasNotif:false, timer:"14D 0hr", bannerGrad:["#004d40","#001a16"], bannerTitle:"VALLEY PASS",               bannerSub:"Complete tasks to earn exclusive seasonal rewards!", type:"coming" },
];

const CATEGORIES = ["Events", "Beta Pass", "Progress", "Season"];

// ── Shared daily-login hook ───────────────────────────────────────────────────

function useDailyLogin(storageKey, days) {
  const [claimed, setClaimed] = useState(() => parseInt(getLS(`${storageKey}_days`, "0"), 10));
  const [canClaim, setCanClaim] = useState(() => {
    const last = parseInt(getLS(`${storageKey}_last`, "0"), 10);
    return !last || Date.now() - last >= 86400000;
  });
  const [busy, setBusy] = useState(false);
  const [pfpUnlocked, setPfpUnlocked] = useState(false);

  const claim = useCallback(() => {
    if (!canClaim || claimed >= days.length || busy) return;
    setBusy(true);
    setTimeout(() => {
      const r = days[claimed];
      setLS(`${storageKey}_days`, String(claimed + 1));
      setLS(`${storageKey}_last`, String(Date.now()));
      if (r.gems) addGems(r.gems);
      if (r.hny) addHoney(r.hny);
      if (r.pfp) { setLS(r.pfp, "true"); setPfpUnlocked(true); }
      setClaimed(claimed + 1);
      setCanClaim(false);
      setBusy(false);
    }, 400);
  }, [canClaim, claimed, days, busy, storageKey]);

  return { claimed, canClaim, busy, claim, pfpUnlocked };
}

// ── Shared DayCard ────────────────────────────────────────────────────────────

function DayCard({ r, i, claimed, canClaim, busy, onClaim, accent = "#7ec8ff" }) {
  const isCur = i === claimed, isDone = i < claimed, isLock = i > claimed;
  return (
    <div style={{
      flex:1, borderRadius:12, overflow:"hidden", position:"relative",
      border: isCur ? `2px solid ${accent}` : isDone ? "2px solid rgba(255,255,255,0.1)" : "2px solid rgba(255,255,255,0.06)",
      background: isCur ? "linear-gradient(180deg,#0d2b55,#061526)" : "rgba(255,255,255,0.04)",
      opacity: isLock ? 0.35 : 1,
      boxShadow: isCur ? `0 0 18px ${accent}33` : "none",
      display:"flex", flexDirection:"column", alignItems:"center", padding:"10px 6px", gap:4,
    }}>
      {isDone && <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.5)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, zIndex:2 }}>✅</div>}
      <div style={{ fontSize:10, fontWeight:700, color: isCur ? accent : "rgba(255,255,255,0.35)" }}>Day {r.day}</div>
      <div style={{ width:"100%", height:1, background:"rgba(255,255,255,0.08)" }} />
      <div style={{
        width:40, height:40, borderRadius:10, fontSize:20,
        display:"flex", alignItems:"center", justifyContent:"center",
        background: r.pfp    ? "linear-gradient(135deg,#c2185b,#880e4f)"
          : r.special         ? "linear-gradient(135deg,#7b1fa2,#4a0072)"
          : r.gems > 0        ? "linear-gradient(135deg,#1565c0,#0d3a7a)"
          :                     "linear-gradient(135deg,#b8860b,#7a5500)",
      }}>
        {r.pfp ? "👑" : r.special ? "🎁" : r.gems > 0 ? <img src="/images/profile_bar/diamond.png" alt="Gems" style={{ width: '18px', height: '18px', objectFit: 'contain' }} /> : <img src="/images/profile_bar/hny.png" alt="HNY" style={{ width: '18px', height: '18px', objectFit: 'contain' }} />}
      </div>
      {r.pfp
        ? <div style={{ fontSize:8, color:"#f48fb1", textAlign:"center", lineHeight:1.3 }}>Exclusive PFP</div>
        : r.special
        ? <div style={{ fontSize:8, color:"#ce93d8", textAlign:"center", lineHeight:1.3 }}>{r.special}</div>
        : <>
            {r.gems > 0 && <div style={{ fontSize:10, fontWeight:700, color:"#90caf9" }}>{r.gems}<img src="/images/profile_bar/diamond.png" alt="" style={{ width: '10px', height: '10px', objectFit: 'contain', verticalAlign: 'middle', marginLeft: '2px' }} /></div>}
            {r.hny > 0 && <div style={{ fontSize:9, color:"#ffd54f" }}>{fmtHny(r.hny)}<img src="/images/profile_bar/hny.png" alt="HNY" style={{ width: '9px', height: '9px', objectFit: 'contain', verticalAlign: 'middle', marginLeft: '1px' }} /></div>}
          </>
      }
      {isCur && (
        <button onClick={onClaim} disabled={!canClaim || busy} style={{
          width:"90%", padding:"4px 0", borderRadius:16, border:"none",
          background: canClaim ? "linear-gradient(180deg,#66bb6a,#388e3c)" : "rgba(255,255,255,0.07)",
          color: canClaim ? "#fff" : "rgba(255,255,255,0.25)",
          fontSize:10, fontWeight:700, cursor: canClaim ? "pointer" : "default",
        }}>
          {busy ? "..." : canClaim ? "Claim" : "Tomorrow"}
        </button>
      )}
    </div>
  );
}

// ── PFP Unlocked banner ───────────────────────────────────────────────────────

function PfpBanner({ label, color }) {
  return (
    <div style={{
      background: `linear-gradient(135deg,${color},rgba(0,0,0,0.3))`,
      borderRadius:14, padding:"16px 20px", border:`1px solid ${color}66`,
      display:"flex", alignItems:"center", gap:14,
      boxShadow:`0 0 24px ${color}44`,
    }}>
      <div style={{ fontSize:40 }}>👑</div>
      <div>
        <div style={{ fontSize:14, fontWeight:700, color:"#fff" }}>🎉 Exclusive PFP Unlocked!</div>
        <div style={{ fontSize:12, color:"rgba(255,255,255,0.7)", marginTop:3 }}>{label} has been added to your profile.</div>
      </div>
    </div>
  );
}

// ── Login grid (shared layout for all daily-login festivals) ──────────────────

function LoginGrid({ storageKey, days, accent, perRow = 4, pfpLabel, pfpColor }) {
  const { claimed, canClaim, busy, claim, pfpUnlocked } = useDailyLogin(storageKey, days);

  const rows = [];
  for (let i = 0; i < days.length; i += perRow) rows.push(days.slice(i, i + perRow));

  return (
    <div style={{ padding:"18px 20px", display:"flex", flexDirection:"column", gap:12 }}>
      <div style={{ fontSize:12, color:"rgba(255,255,255,0.4)" }}>
        Day {Math.min(claimed + 1, days.length)} of {days.length} · Come back daily!
      </div>

      {pfpUnlocked && pfpLabel && <PfpBanner label={pfpLabel} color={pfpColor || "#9c27b0"} />}

      {rows.map((row, ri) => (
        <div key={ri} style={{ display:"flex", gap:8 }}>
          {row.map((r, ci) => {
            const i = ri * perRow + ci;
            return <DayCard key={i} r={r} i={i} claimed={claimed} canClaim={canClaim} busy={busy} onClaim={claim} accent={accent} />;
          })}
          {row.length < perRow && Array(perRow - row.length).fill(0).map((_, x) => <div key={x} style={{ flex:1 }} />)}
        </div>
      ))}
    </div>
  );
}

// ── Welcome to Honey Valleys ──────────────────────────────────────────────────

const WELCOME_DAYS = [
  { day:1, gems:25,  hny:200  },
  { day:2, gems:0,   hny:500,  special:"🌱 Basic Pack x2"    },
  { day:3, gems:40,  hny:300  },
  { day:4, gems:0,   hny:800,  special:"🌟 Pico Pack x2"     },
  { day:5, gems:60,  hny:400  },
  { day:6, gems:0,   hny:1200, special:"💎 Premium Pack"      },
  { day:7, gems:100, hny:1000, pfp:"sandbox_has_beta_pfp"     },
];

function WelcomeBeta() {
  return (
    <LoginGrid
      storageKey="welcome_beta"
      days={WELCOME_DAYS}
      accent="#ffb74d"
      perRow={4}
      pfpLabel="Beta Pioneer PFP"
      pfpColor="#ff9800"
    />
  );
}

// ── Beta Pass (free + paid two-row layout) ────────────────────────────────────

const QUEEN_PASS_DAYS = [
  { day:1,  free:{ gems:5,   hny:150  },              paid:{ gems:20,  hny:500   } },
  { day:2,  free:{ special:"🌸 Seeds ×3" },           paid:{ gems:30,  hny:800   } },
  { day:3,  free:{ gems:10,  hny:200  },              paid:{ gems:35,  hny:600   } },
  { day:4,  free:{ gems:0,   hny:300  },              paid:{ gems:0,   hny:900,   special:"💎 Premium Pack"   } },
  { day:5,  free:{ gems:15,  hny:250  },              paid:{ gems:50,  hny:700   } },
  { day:6,  free:{ gems:0,   hny:400  },              paid:{ gems:0,   special:"👑 Crown Cosmetic"            } },
  { day:7,  free:{ gems:20,  hny:300  },              paid:{ gems:65,  hny:1000  } },
  { day:8,  free:{ gems:0,   hny:500  },              paid:{ gems:0,   hny:1500,  special:"🌹 Rose Seeds ×5"  } },
  { day:9,  free:{ gems:25,  hny:350  },              paid:{ gems:80,  hny:800   } },
  { day:10, free:{ gems:0,   hny:600  },              paid:{ gems:0,   hny:2000,  special:"💎 Pack ×2"        } },
  { day:11, free:{ gems:30,  hny:400  },              paid:{ gems:90,  hny:1000  } },
  { day:12, free:{ gems:0,   hny:700  },              paid:{ gems:0,   special:"✨ Glitter Cosmetic"          } },
  { day:13, free:{ gems:35,  hny:500  },              paid:{ gems:100, hny:1200  } },
  { day:14, free:{ gems:50,  hny:1000 },              paid:{ gems:150, hny:3000,  pfp:"sandbox_has_queen_pfp" } },
];

const MAYOR_PASS_DAYS = [
  { day:1,  free:{ gems:5,   hny:200  },              paid:{ gems:20,  hny:700   } },
  { day:2,  free:{ special:"🌿 Farm Seeds ×5" },      paid:{ gems:30,  hny:1200  } },
  { day:3,  free:{ gems:10,  hny:300  },              paid:{ gems:30,  hny:800   } },
  { day:4,  free:{ gems:0,   hny:500  },              paid:{ gems:0,   hny:1800,  special:"💼 Briefcase"      } },
  { day:5,  free:{ gems:15,  hny:400  },              paid:{ gems:40,  hny:1000  } },
  { day:6,  free:{ gems:0,   hny:600  },              paid:{ gems:0,   hny:2500,  special:"🌟 Basic Pack ×3"  } },
  { day:7,  free:{ gems:20,  hny:500  },              paid:{ gems:55,  hny:1400  } },
  { day:8,  free:{ gems:0,   hny:800  },              paid:{ gems:0,   hny:3000,  special:"📜 Land Deed"      } },
  { day:9,  free:{ gems:25,  hny:600  },              paid:{ gems:70,  hny:1600  } },
  { day:10, free:{ gems:0,   hny:1000 },              paid:{ gems:0,   hny:4000,  special:"💎 Pack ×2"        } },
  { day:11, free:{ gems:30,  hny:700  },              paid:{ gems:80,  hny:2000  } },
  { day:12, free:{ gems:0,   hny:1200 },              paid:{ gems:0,   hny:5000,  special:"🎩 Top Hat"        } },
  { day:13, free:{ gems:35,  hny:900  },              paid:{ gems:100, hny:2500  } },
  { day:14, free:{ gems:60,  hny:1500 },              paid:{ gems:120, hny:6000,  pfp:"sandbox_has_mayor_pfp" } },
];

function PassRewardCard({ data, isDone, isCur, isLock, rowType }) {
  const isFree = rowType === "free";
  const bg = isDone
    ? isFree ? "rgba(33,150,243,0.15)" : "rgba(255,193,7,0.12)"
    : isCur
    ? isFree ? "linear-gradient(180deg,#0d3466,#061830)" : "linear-gradient(180deg,#5a3a00,#2d1c00)"
    : "rgba(255,255,255,0.04)";
  const border = isDone
    ? isFree ? "2px solid rgba(33,150,243,0.3)" : "2px solid rgba(255,193,7,0.3)"
    : isCur
    ? isFree ? "2px solid #42a5f5" : "2px solid #ffc107"
    : "2px solid rgba(255,255,255,0.07)";

  const icon = data.pfp ? "👑" : data.special ? "🎁" : data.gems > 0 ? <img src="/images/profile_bar/diamond.png" alt="Gems" style={{ width: '20px', height: '20px', objectFit: 'contain' }} /> : <img src="/images/profile_bar/hny.png" alt="HNY" style={{ width: '20px', height: '20px', objectFit: 'contain' }} />;
  const iconBg = data.pfp
    ? "linear-gradient(135deg,#c2185b,#880e4f)"
    : data.special
    ? isFree ? "linear-gradient(135deg,#1565c0,#0d3a7a)" : "linear-gradient(135deg,#7b1fa2,#4a0072)"
    : data.gems > 0
    ? "linear-gradient(135deg,#1565c0,#0d47a1)"
    : isFree ? "linear-gradient(135deg,#1b5e20,#0a2e0a)" : "linear-gradient(135deg,#e65100,#bf360c)";

  return (
    <div style={{
      width:78, flexShrink:0,
      background: bg, border, borderRadius:10, padding:"8px 4px",
      display:"flex", flexDirection:"column", alignItems:"center", gap:4,
      opacity: isLock ? 0.4 : 1, position:"relative",
    }}>
      {isDone && <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.45)", borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, zIndex:2 }}>✅</div>}
      {isLock && !isFree && <div style={{ position:"absolute", top:4, right:4, fontSize:11, zIndex:2 }}>🔒</div>}
      <div style={{ width:38, height:38, borderRadius:9, fontSize:18, display:"flex", alignItems:"center", justifyContent:"center", background:iconBg }}>
        {icon}
      </div>
      {data.pfp
        ? <div style={{ fontSize:8, color:"#f48fb1", textAlign:"center", lineHeight:1.2 }}>Exclusive PFP</div>
        : data.special
        ? <div style={{ fontSize:8, color: isFree ? "#90caf9" : "#ffcc02", textAlign:"center", lineHeight:1.2 }}>{data.special}</div>
        : <div style={{ fontSize:9, textAlign:"center", lineHeight:1.3 }}>
            {data.gems > 0 && <div style={{ color:"#90caf9", fontWeight:700 }}>{data.gems}<img src="/images/profile_bar/diamond.png" alt="" style={{ width: '9px', height: '9px', objectFit: 'contain', verticalAlign: 'middle', marginLeft: '2px' }} /></div>}
            {data.hny > 0 && <div style={{ color: isFree ? "#a5d6a7" : "#ffcc02" }}>{fmtHny(data.hny)}<img src="/images/profile_bar/hny.png" alt="HNY" style={{ width: '9px', height: '9px', objectFit: 'contain', verticalAlign: 'middle', marginLeft: '1px' }} /></div>}
          </div>
      }
    </div>
  );
}

function BetaPass({ storageKey, days, pfpKey, pfpLabel, passName, passEmoji, accentFree, accentPaid, specialRewardLabel, specialRewardEmoji }) {
  const [claimed, setClaimed] = useState(() => parseInt(getLS(`${storageKey}_days`, "0"), 10));
  const [canClaim, setCanClaim] = useState(() => {
    const last = parseInt(getLS(`${storageKey}_last`, "0"), 10);
    return !last || Date.now() - last >= 86400000;
  });
  const [busy, setBusy] = useState(false);
  const [hasPaid, setHasPaid] = useState(() => getLS(`${storageKey}_paid`) === "true");
  const [pfpUnlocked, setPfpUnlocked] = useState(false);
  const scrollRef = useRef(null);
  const dragRef = useRef({ down: false, startX: 0, scrollLeft: 0 });

  const claimDay = () => {
    if (!canClaim || claimed >= days.length || busy) return;
    setBusy(true);
    setTimeout(() => {
      const d = days[claimed];
      setLS(`${storageKey}_days`, String(claimed + 1));
      setLS(`${storageKey}_last`, String(Date.now()));
      if (d.free.gems)  addGems(d.free.gems);
      if (d.free.hny)   addHoney(d.free.hny);
      if (hasPaid) {
        if (d.paid.gems) addGems(d.paid.gems);
        if (d.paid.hny)  addHoney(d.paid.hny);
        if (d.paid.pfp) { setLS(d.paid.pfp, "true"); setPfpUnlocked(true); }
      }
      setClaimed(claimed + 1);
      setCanClaim(false);
      setBusy(false);
    }, 400);
  };

  const buyPass = () => {
    setLS(`${storageKey}_paid`, "true");
    setHasPaid(true);
  };

  const onDragStart = (e) => {
    dragRef.current = { down: true, startX: e.clientX, scrollLeft: scrollRef.current.scrollLeft };
  };
  const onDragMove = (e) => {
    if (!dragRef.current.down) return;
    scrollRef.current.scrollLeft = dragRef.current.scrollLeft - (e.clientX - dragRef.current.startX);
  };
  const onDragEnd = () => { dragRef.current.down = false; };

  const claimable = canClaim && claimed < days.length;

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", overflow:"hidden" }}>
      {pfpUnlocked && <PfpBanner label={pfpLabel} color={accentPaid} />}

      {/* Progress bar */}
      <div style={{ padding:"10px 16px 6px", flexShrink:0 }}>
        <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:"rgba(255,255,255,0.35)", marginBottom:4 }}>
          <span>Day {Math.min(claimed + 1, days.length)} of {days.length}</span>
          <span>{canClaim ? "✅ Ready to claim!" : "Come back tomorrow"}</span>
        </div>
        <div style={{ height:8, background:"rgba(255,255,255,0.08)", borderRadius:8, overflow:"hidden" }}>
          <div style={{ width:`${(claimed/days.length)*100}%`, height:"100%", background:`linear-gradient(90deg,${accentFree},${accentPaid})`, transition:"width 0.4s" }} />
        </div>
      </div>

      {/* Main area: sidebar + scroll */}
      <div style={{ display:"flex", flex:1, overflow:"hidden", gap:0 }}>

        {/* Left sidebar */}
        <div style={{ width:130, flexShrink:0, padding:"12px 14px", display:"flex", flexDirection:"column", alignItems:"center", gap:10, borderRight:"1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ fontSize:10, color:"rgba(255,255,255,0.4)", letterSpacing:"0.06em", textTransform:"uppercase" }}>Special Reward</div>
          <div style={{
            width:90, height:90, borderRadius:16,
            background: hasPaid ? `linear-gradient(135deg,${accentPaid}44,${accentPaid}22)` : "rgba(255,255,255,0.05)",
            border: hasPaid ? `2px solid ${accentPaid}88` : "2px solid rgba(255,255,255,0.1)",
            display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:4,
          }}>
            <div style={{ fontSize:34 }}>{specialRewardEmoji}</div>
            {!hasPaid && <div style={{ fontSize:16 }}>🔒</div>}
          </div>
          <div style={{ fontSize:10, color:"rgba(255,255,255,0.6)", textAlign:"center", lineHeight:1.4 }}>{specialRewardLabel}</div>
          {!hasPaid
            ? <button onClick={buyPass} style={{ width:"100%", padding:"8px 0", borderRadius:20, border:"none", background:`linear-gradient(180deg,${accentPaid},${accentPaid}aa)`, color:"#fff", fontSize:11, fontWeight:700, cursor:"pointer" }}>
                Buy Pass
              </button>
            : <div style={{ fontSize:10, color:"#66bb6a", fontWeight:700 }}>✅ Pass Owned</div>
          }
          {claimable && (
            <button onClick={claimDay} disabled={busy} style={{ width:"100%", padding:"8px 0", borderRadius:20, border:"none", background:"linear-gradient(180deg,#66bb6a,#388e3c)", color:"#fff", fontSize:11, fontWeight:700, cursor:"pointer" }}>
              {busy ? "..." : "Claim Day"}
            </button>
          )}
        </div>

        {/* Scroll area */}
        <div
          ref={scrollRef}
          onMouseDown={onDragStart}
          onMouseMove={onDragMove}
          onMouseUp={onDragEnd}
          onMouseLeave={onDragEnd}
          style={{ flex:1, overflowX:"auto", overflowY:"hidden", cursor:"grab", userSelect:"none", padding:"10px 12px" }}
        >
          <div style={{ display:"flex", flexDirection:"column", gap:6, width:"max-content" }}>

            {/* Free row label */}
            <div style={{ display:"flex", gap:4, alignItems:"center", marginBottom:2 }}>
              <div style={{ width:56, flexShrink:0, fontSize:10, color:accentFree, fontWeight:700, textAlign:"right", paddingRight:6 }}>FREE</div>
              <div style={{ display:"flex", gap:4 }}>
                {days.map((d, i) => (
                  <PassRewardCard key={i} data={d.free} isDone={i < claimed} isCur={i === claimed} isLock={i > claimed} rowType="free" />
                ))}
              </div>
            </div>

            {/* Crown / day numbers row */}
            <div style={{ display:"flex", gap:4 }}>
              <div style={{ width:56, flexShrink:0 }} />
              {days.map((d, i) => (
                <div key={i} style={{
                  width:78, flexShrink:0, display:"flex", flexDirection:"column", alignItems:"center", gap:2,
                }}>
                  <div style={{
                    width:28, height:28, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center",
                    background: i < claimed ? "rgba(255,255,255,0.15)" : i === claimed ? `linear-gradient(135deg,${accentPaid},${accentFree})` : "rgba(255,255,255,0.06)",
                    border: i === claimed ? `2px solid ${accentPaid}` : "2px solid rgba(255,255,255,0.1)",
                    fontSize:11, fontWeight:700, color: i === claimed ? "#fff" : "rgba(255,255,255,0.4)",
                    boxShadow: i === claimed ? `0 0 12px ${accentPaid}66` : "none",
                  }}>
                    {i < claimed ? "✓" : d.day}
                  </div>
                </div>
              ))}
            </div>

            {/* Paid row label */}
            <div style={{ display:"flex", gap:4, alignItems:"center", marginTop:2 }}>
              <div style={{ width:56, flexShrink:0, fontSize:10, color: hasPaid ? accentPaid : "rgba(255,255,255,0.25)", fontWeight:700, textAlign:"right", paddingRight:6 }}>PASS</div>
              <div style={{ display:"flex", gap:4 }}>
                {days.map((d, i) => (
                  <PassRewardCard key={i} data={d.paid} isDone={i < claimed && hasPaid} isCur={i === claimed} isLock={!hasPaid || i > claimed} rowType="paid" />
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

function QueenPass() {
  return (
    <BetaPass
      storageKey="queen_pass"
      days={QUEEN_PASS_DAYS}
      pfpKey="sandbox_has_queen_pfp"
      pfpLabel="Queen Beta Exclusive PFP"
      passName="Queen Bees Beta Pass"
      passEmoji="👸"
      accentFree="#42a5f5"
      accentPaid="#f06292"
      specialRewardLabel="Queen Beta Exclusive PFP"
      specialRewardEmoji="👑"
    />
  );
}

function MayorPass() {
  return (
    <BetaPass
      storageKey="mayor_pass"
      days={MAYOR_PASS_DAYS}
      pfpKey="sandbox_has_mayor_pfp"
      pfpLabel="Mayor Beta Exclusive PFP"
      passName="Mayor Beta Pass"
      passEmoji="🎩"
      accentFree="#42a5f5"
      accentPaid="#ffc107"
      specialRewardLabel="Mayor Beta Exclusive PFP"
      specialRewardEmoji="🎩"
    />
  );
}

// ── Flower Pot Mystery ────────────────────────────────────────────────────────

const POT_PRIZES = [
  { id:"pfp",   label:"🌺 Flower Pot PFP",  emoji:"👑", w:0.04,  apply:() => setLS("sandbox_has_flowerpot_pfp","true") },
  { id:"ppk",   label:"💎 Premium Pack",     emoji:<img src="/images/profile_bar/diamond.png" alt="💎" style={{ width:'20px', height:'20px', objectFit:'contain' }} />, w:0.08,  apply:() => {} },
  { id:"bpk",   label:"🌟 Basic Pack",       emoji:"🌟", w:0.18,  apply:() => {} },
  { id:"gems",  label:"💎 50 Gems",          emoji:<img src="/images/profile_bar/diamond.png" alt="💎" style={{ width:'20px', height:'20px', objectFit:'contain' }} />, w:0.28,  apply:() => addGems(50) },
  { id:"hny",   label:"🍯 800 HNY",           emoji:<img src="/images/profile_bar/hny.png" alt="HNY" style={{ width:'20px', height:'20px', objectFit:'contain' }} />, w:0.42,  apply:() => addHoney(800) },
];

function seededRand(seed) {
  let s = (seed ^ 0xdeadbeef) >>> 0;
  return () => { s = Math.imul(s ^ (s >>> 15), s | 1); s ^= s + Math.imul(s ^ (s >>> 7), s | 61); return ((s ^ (s >>> 14)) >>> 0) / 0x100000000; };
}

function pickPrize(rand) {
  const r = rand();
  let cum = 0;
  for (const p of POT_PRIZES) { cum += p.w; if (r < cum) return p; }
  return POT_PRIZES[POT_PRIZES.length - 1];
}

function FlowerPotMystery() {
  const getPersisted = () => {
    try {
      const raw = getLS("flower_pot_pick", "");
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (data.date === today()) return data;
    } catch {}
    return null;
  };

  const [pick, setPick] = useState(getPersisted);
  const [revealing, setRevealing] = useState(null);
  const [revealed, setRevealed] = useState(null);

  const todayPrizes = useMemo(() => {
    const seed = today().split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    const rand = seededRand(seed);
    return Array(5).fill(null).map(() => pickPrize(rand));
  }, []);

  const handlePick = (idx) => {
    if (pick || revealing !== null) return;
    setRevealing(idx);
    setTimeout(() => {
      const prize = todayPrizes[idx];
      prize.apply();
      const data = { date: today(), idx, prize: { id: prize.id, label: prize.label, emoji: prize.emoji } };
      setLS("flower_pot_pick", JSON.stringify(data));
      setPick(data);
      setRevealed(prize);
      setRevealing(null);
    }, 700);
  };

  const hasPfp = getLS("sandbox_has_flowerpot_pfp") === "true";

  return (
    <div style={{ padding:"24px", display:"flex", flexDirection:"column", gap:18 }}>
      <div style={{ fontSize:13, color:"rgba(255,255,255,0.55)", lineHeight:1.6 }}>
        5 pots are placed each day — pick one to reveal a surprise prize! One pot hides the exclusive Flower Pot PFP. Come back every day!
      </div>

      {hasPfp && (
        <div style={{ background:"linear-gradient(135deg,#2e7d32,#1b5e20)", borderRadius:12, padding:"10px 16px", fontSize:13, color:"#a5d6a7", fontWeight:700 }}>
          🌺 You've unlocked the Flower Pot PFP!
        </div>
      )}

      {/* Pots */}
      <div style={{ display:"flex", gap:14, justifyContent:"center" }}>
        {Array(5).fill(0).map((_, idx) => {
          const isPicked    = pick?.idx === idx;
          const isRevealing = revealing === idx;
          const showAll     = !!pick; // after picking, reveal all
          const prize       = isPicked ? pick.prize : showAll ? { emoji: todayPrizes[idx].emoji, label: todayPrizes[idx].label } : null;

          return (
            <div
              key={idx}
              onClick={() => handlePick(idx)}
              style={{
                width:100, height:120,
                display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
                gap:8, cursor: (!pick && revealing === null) ? "pointer" : "default",
                borderRadius:16, padding:"12px 8px",
                background: isPicked
                  ? "linear-gradient(180deg,rgba(46,125,50,0.3),rgba(27,94,32,0.2))"
                  : showAll
                  ? "rgba(255,255,255,0.05)"
                  : "rgba(255,255,255,0.07)",
                border: isPicked ? "2px solid rgba(102,187,106,0.5)"
                  : showAll      ? "2px solid rgba(255,255,255,0.08)"
                  :                "2px solid rgba(255,255,255,0.12)",
                opacity: showAll && !isPicked ? 0.55 : 1,
                transition:"all 0.3s",
                transform: isRevealing ? "scale(1.08)" : "scale(1)",
              }}
              onMouseEnter={e => { if (!pick && revealing === null) e.currentTarget.style.background = "rgba(255,255,255,0.12)"; }}
              onMouseLeave={e => { if (!pick && revealing === null) e.currentTarget.style.background = "rgba(255,255,255,0.07)"; }}
            >
              {prize ? (
                <>
                  <div style={{ fontSize: isPicked ? 36 : 28 }}>{prize.emoji}</div>
                  <div style={{ fontSize: isPicked ? 10 : 9, color: isPicked ? "#a5d6a7" : "rgba(255,255,255,0.4)", textAlign:"center", lineHeight:1.3 }}>
                    {prize.label}
                  </div>
                  {isPicked && <div style={{ fontSize:9, color:"#66bb6a", marginTop:2 }}>✓ Your pick!</div>}
                </>
              ) : (
                <>
                  <div style={{ fontSize:40, transform:"rotate(180deg)", filter: isRevealing ? "brightness(1.5)" : "none", transition:"filter 0.3s" }}>🪴</div>
                  <div style={{ fontSize:10, color:"rgba(255,255,255,0.3)" }}>Tap!</div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {pick ? (
        <div style={{ background:"rgba(255,255,255,0.07)", borderRadius:12, padding:"14px 18px", textAlign:"center" }}>
          <div style={{ fontSize:13, color:"#a5d6a7", fontWeight:700 }}>You picked: {pick.prize.label}</div>
          <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", marginTop:4 }}>Come back tomorrow for another chance!</div>
        </div>
      ) : (
        <div style={{ textAlign:"center", fontSize:12, color:"rgba(255,255,255,0.3)" }}>
          Remaining picks today: {pick ? 0 : 1}
        </div>
      )}
    </div>
  );
}

// ── Whack-a-Potato ────────────────────────────────────────────────────────────

const ROUND_CFG = [
  { spawnMs:1000, showMs:1400, label:"Round 1 — Easy",         color:"#66bb6a" },
  { spawnMs:650,  showMs:900,  label:"Round 2 — Hard",         color:"#f9a825" },
  { spawnMs:350,  showMs:560,  label:"Round 3 — Super Fast! 🔥",color:"#ef5350" },
];

function getPercentile(s) {
  if (s >= 55) return 5;
  if (s >= 40) return 10;
  if (s >= 28) return 20;
  if (s >= 18) return 35;
  if (s >= 10) return 50;
  if (s >= 5)  return 65;
  return 80;
}

function randomCreature() {
  const r = Math.random();
  if (r < 0.12) return "golden";
  if (r < 0.30) return "onion";
  return "potato";
}

function PotatoWhack() {
  const [phase,  setPhase]  = useState("idle"); // idle|playing|roundEnd|gameover
  const [round,  setRound]  = useState(1);
  const [timer,  setTimer]  = useState(40);
  const [score,  setScore]  = useState(0);
  const [holes,  setHoles]  = useState(Array(8).fill(null));
  const [popups, setPopups] = useState([]);
  const [highScore] = useState(() => parseInt(getLS("potato_whack_hs","0")));

  const scoreRef     = useRef(0);
  const phaseRef     = useRef("idle");
  const timerRef     = useRef(null);
  const spawnRef     = useRef(null);
  const hideRefs     = useRef([]);
  const holeData     = useRef(Array(8).fill(null)); // {creature, id}

  const clearAll = useCallback(() => {
    clearInterval(timerRef.current);
    clearInterval(spawnRef.current);
    hideRefs.current.forEach(clearTimeout);
    hideRefs.current = [];
  }, []);

  useEffect(() => clearAll, [clearAll]);

  const startRound = useCallback((r) => {
    clearAll();
    holeData.current = Array(8).fill(null);
    setHoles(Array(8).fill(null));
    setTimer(40);
    setRound(r);
    phaseRef.current = "playing";
    setPhase("playing");

    const cfg = ROUND_CFG[r - 1];
    let t = 40;

    timerRef.current = setInterval(() => {
      t--;
      setTimer(t);
      if (t <= 0) {
        clearAll();
        holeData.current = Array(8).fill(null);
        setHoles(Array(8).fill(null));
        phaseRef.current = "roundEnd";
        setPhase("roundEnd");
        setTimeout(() => {
          if (r < 3) {
            startRound(r + 1);
          } else {
            const fs = scoreRef.current;
            phaseRef.current = "gameover";
            setPhase("gameover");
            const prev = parseInt(getLS("potato_whack_hs","0"));
            if (fs > prev) setLS("potato_whack_hs", String(fs));
          }
        }, 2200);
      }
    }, 1000);

    const spawn = () => {
      if (phaseRef.current !== "playing") return;
      const empty = holeData.current.reduce((a, h, i) => h === null ? [...a, i] : a, []);
      if (!empty.length) return;
      const idx   = empty[Math.floor(Math.random() * empty.length)];
      const type  = randomCreature();
      const spId  = Math.random();
      holeData.current[idx] = { type, spId };
      setHoles(holeData.current.map(h => h?.type ?? null));

      const t = setTimeout(() => {
        if (holeData.current[idx]?.spId === spId) {
          holeData.current[idx] = null;
          setHoles(holeData.current.map(h => h?.type ?? null));
        }
      }, cfg.showMs);
      hideRefs.current.push(t);
    };

    spawn();
    spawnRef.current = setInterval(spawn, cfg.spawnMs);
  }, [clearAll]);

  const hitHole = (idx) => {
    if (phaseRef.current !== "playing" || !holeData.current[idx]) return;
    const { type, spId } = holeData.current[idx];
    holeData.current[idx] = null;
    setHoles(holeData.current.map(h => h?.type ?? null));

    const pts = type === "golden" ? 3 : type === "onion" ? -1 : 1;
    scoreRef.current = Math.max(0, scoreRef.current + pts);
    setScore(scoreRef.current);

    const popId = Math.random();
    setPopups(p => [...p, { id:popId, pts, col: idx % 4, row: Math.floor(idx / 4) }]);
    setTimeout(() => setPopups(p => p.filter(x => x.id !== popId)), 700);
  };

  const restart = () => {
    scoreRef.current = 0;
    setScore(0);
    setPopups([]);
    startRound(1);
  };

  // ── Idle / Gameover screen
  if (phase === "idle" || phase === "gameover") {
    const pct = getPercentile(score);
    const hs  = parseInt(getLS("potato_whack_hs","0"));
    return (
      <div style={{ padding:"24px", display:"flex", flexDirection:"column", gap:16, alignItems:"center", textAlign:"center" }}>
        <div style={{ fontSize:56 }}>🥔</div>
        {phase === "gameover" && <>
          <div style={{ fontSize:26, fontWeight:700, color:"#fff" }}>Final Score: {score}</div>
          <div style={{ fontSize:14, color:"rgba(255,255,255,0.6)" }}>
            You are in the <span style={{ color:"#ffd54f", fontWeight:700 }}>top {pct}%</span> of Whack-a-Potato players!
          </div>
          <div style={{ background:"rgba(255,255,255,0.06)", borderRadius:12, padding:"10px 20px", fontSize:13, color:"rgba(255,255,255,0.45)" }}>
            🏆 Personal Best: {hs}
          </div>

          {/* Leaderboard bar */}
          <div style={{ width:"100%", maxWidth:340 }}>
            <div style={{ fontSize:11, color:"rgba(255,255,255,0.35)", marginBottom:6 }}>Your rank vs. all players</div>
            <div style={{ height:12, background:"rgba(255,255,255,0.08)", borderRadius:20, overflow:"hidden" }}>
              <div style={{ width:`${100-pct}%`, height:"100%", background:"linear-gradient(90deg,#f9a825,#ef5350)", borderRadius:20 }} />
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, color:"rgba(255,255,255,0.3)", marginTop:4 }}>
              <span>All players</span><span>Top {pct}%</span>
            </div>
          </div>
        </>}

        {phase === "idle" && <>
          <div style={{ fontSize:20, fontWeight:700, color:"#fff" }}>Whack-a-Potato</div>
          <div style={{ fontSize:13, color:"rgba(255,255,255,0.5)", lineHeight:1.7, maxWidth:320 }}>
            Smash 🥔 potatoes for +1 pt. Hit ✨ golden potatoes for +3 pts. Avoid 🧅 onions or lose a point!
            <br/>3 rounds · 40 seconds each
          </div>
          {hs > 0 && <div style={{ fontSize:12, color:"rgba(255,255,255,0.3)" }}>🏆 Best: {hs} pts · Top {getPercentile(hs)}%</div>}
        </>}

        <button onClick={phase === "idle" ? () => startRound(1) : restart} style={{
          padding:"12px 36px", borderRadius:24, border:"none",
          background:"linear-gradient(180deg,#f9a825,#e65100)",
          color:"#fff", fontSize:16, fontWeight:700, cursor:"pointer",
          boxShadow:"0 4px 16px rgba(0,0,0,0.4)",
        }}>
          {phase === "idle" ? "▶ Start Game" : "↺ Play Again"}
        </button>
      </div>
    );
  }

  // ── Round end splash
  if (phase === "roundEnd") {
    return (
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:260, gap:12, textAlign:"center" }}>
        <div style={{ fontSize:40 }}>⏱</div>
        <div style={{ fontSize:22, fontWeight:700, color:"#fff" }}>Round {round} Complete!</div>
        <div style={{ fontSize:18, color:"#ffd54f" }}>Score so far: {score}</div>
        {round < 3 && <div style={{ fontSize:13, color:"rgba(255,255,255,0.4)" }}>
          Get ready for {ROUND_CFG[round].label}…
        </div>}
      </div>
    );
  }

  // ── Playing
  const cfg = ROUND_CFG[round - 1];
  return (
    <div style={{ padding:"14px 20px", display:"flex", flexDirection:"column", gap:10 }}>
      <style>{`
        @keyframes potatoPop { from{transform:translateY(28px);opacity:0} to{transform:translateY(0);opacity:1} }
        @keyframes scoreFloat { from{transform:translateY(0);opacity:1} to{transform:translateY(-36px);opacity:0} }
      `}</style>

      {/* HUD */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div style={{ fontSize:13, fontWeight:700, color:cfg.color }}>{cfg.label}</div>
        <div style={{ display:"flex", gap:18 }}>
          <span style={{ fontSize:15, fontWeight:700, color: timer <= 10 ? "#ef5350":"#fff" }}>⏱ {timer}s</span>
          <span style={{ fontSize:15, fontWeight:700, color:"#a5d6a7" }}>Score: {score}</span>
        </div>
      </div>

      <div style={{ height:8, background:"rgba(255,255,255,0.08)", borderRadius:8, overflow:"hidden" }}>
        <div style={{ width:`${(timer/40)*100}%`, height:"100%", background: timer > 15 ? "#66bb6a" : "#ef5350", transition:"width 1s linear, background 0.3s" }} />
      </div>

      {/* Hole grid */}
      <div style={{ position:"relative", display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10 }}>
        {holes.map((creature, i) => (
          <div key={i} onClick={() => hitHole(i)} style={{
            height:88, borderRadius:14, overflow:"hidden", position:"relative",
            background: creature === "golden" ? "linear-gradient(180deg,#3d2e00,#1a1400)"
              : creature === "onion"          ? "linear-gradient(180deg,#1a2a0a,#0f1a05)"
              : creature                      ? "linear-gradient(180deg,#2d1e10,#1a1008)"
              :                                 "linear-gradient(180deg,#181828,#10101e)",
            border: creature === "golden" ? "2px solid #ffd54f"
              : creature === "onion"      ? "2px solid #8bc34a"
              : creature                  ? "2px solid #6d4c41"
              :                             "2px solid rgba(255,255,255,0.06)",
            boxShadow: creature === "golden" ? "0 0 16px rgba(255,213,79,0.35)" : "none",
            cursor: creature ? "pointer" : "default",
            display:"flex", alignItems:"flex-end", justifyContent:"center",
            userSelect:"none",
          }}>
            <div style={{ position:"absolute", bottom:0, left:"10%", right:"10%", height:22, background:"rgba(0,0,0,0.55)", borderRadius:"50%/0 0 11px 11px" }} />
            {creature && (
              <div style={{
                fontSize: creature === "golden" ? 38 : 32, paddingBottom:2, zIndex:1,
                animation:"potatoPop 0.15s ease-out",
                filter: creature === "golden" ? "drop-shadow(0 0 8px #ffd54f)" : "none",
              }}>
                {creature === "potato" ? "🥔" : creature === "golden" ? "🌟" : "🧅"}
              </div>
            )}
          </div>
        ))}

        {/* Floating score popups */}
        {popups.map(p => (
          <div key={p.id} style={{
            position:"absolute",
            left:`${p.col * 25 + 6}%`, top:`${p.row * 50 + 5}%`,
            fontSize:18, fontWeight:700, pointerEvents:"none",
            color: p.pts >= 3 ? "#ffd54f" : p.pts < 0 ? "#ef9a9a" : "#a5d6a7",
            animation:"scoreFloat 0.7s ease-out forwards",
            textShadow:"0 2px 4px rgba(0,0,0,0.9)",
          }}>
            {p.pts > 0 ? `+${p.pts}` : p.pts}
          </div>
        ))}
      </div>

      <div style={{ display:"flex", justifyContent:"center", gap:20, fontSize:11, color:"rgba(255,255,255,0.3)" }}>
        <span>🥔 Potato +1</span><span>🌟 Golden +3</span><span>🧅 Onion −1</span>
      </div>
    </div>
  );
}

// ── Monthly Check-In (30 days, show 7 at a time) ─────────────────────────────

const MONTH_DAYS = Array(30).fill(0).map((_, i) => {
  const day = i + 1;
  if (day === 30) return { day, gems: 200, hny: 3000, pfp: "sandbox_has_month_pfp" };
  if (day % 7 === 0) return { day, gems: 80,  hny: 0,    special: "💎 Premium Pack"  };
  if (day % 7 === 3) return { day, gems: 0,   hny: 0,    special: "🌟 Basic Pack ×2"  };
  return {
    day,
    gems: Math.round(12 + (day / 30) * 55),
    hny: Math.round(150 + (day / 30) * 900),
  };
});

function MonthCheckIn() {
  const { claimed, canClaim, busy, claim, pfpUnlocked } = useDailyLogin("month_checkin", MONTH_DAYS);
  const weekStart = Math.min(Math.floor(claimed / 7) * 7, 28);
  const weekNum   = Math.floor(weekStart / 7) + 1;
  const weekDays  = MONTH_DAYS.slice(weekStart, Math.min(weekStart + 7, 30));

  return (
    <div style={{ padding:"18px 20px", display:"flex", flexDirection:"column", gap:14 }}>
      {pfpUnlocked && <PfpBanner label="Month Check-In PFP" color="#3949ab" />}

      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div style={{ fontSize:12, color:"rgba(255,255,255,0.4)" }}>
          Week {weekNum} of 5 · Day {claimed} / 30
        </div>
        {/* Week pips */}
        <div style={{ display:"flex", gap:6 }}>
          {[1,2,3,4,5].map(w => (
            <div key={w} style={{
              width:24, height:8, borderRadius:6,
              background: w < weekNum ? "#7986cb" : w === weekNum ? "#42a5f5" : "rgba(255,255,255,0.1)",
              transition:"background 0.3s",
            }} />
          ))}
        </div>
      </div>

      {/* Overall progress bar */}
      <div style={{ height:8, background:"rgba(255,255,255,0.08)", borderRadius:8, overflow:"hidden" }}>
        <div style={{ width:`${(claimed/30)*100}%`, height:"100%", background:"linear-gradient(90deg,#3949ab,#42a5f5)", transition:"width 0.4s" }} />
      </div>

      {/* 7 day cards for current week */}
      <div style={{ display:"flex", gap:8 }}>
        {weekDays.map((r, ci) => {
          const i = weekStart + ci;
          return <DayCard key={i} r={r} i={i} claimed={claimed} canClaim={canClaim} busy={busy} onClaim={claim} accent="#42a5f5" />;
        })}
        {weekDays.length < 7 && Array(7 - weekDays.length).fill(0).map((_, x) => <div key={x} style={{ flex:1 }} />)}
      </div>

      {claimed >= 30 && (
        <div style={{ background:"rgba(66,165,245,0.15)", borderRadius:12, padding:"12px 16px", fontSize:13, color:"#90caf9", fontWeight:700, textAlign:"center" }}>
          🏆 All 30 days complete!
        </div>
      )}
    </div>
  );
}

// ── Improve Your Farm ─────────────────────────────────────────────────────────

const PLOT_MILESTONES = [
  { plots:9,  gems:30,  hny:600,   label:"Starter Farm",    icon:"🌱" },
  { plots:12, gems:50,  hny:1000,  label:"Growing Farm",    icon:"🌿" },
  { plots:18, gems:80,  hny:2000,  label:"Thriving Farm",   icon:"🌾" },
  { plots:24, gems:120, hny:3500,  label:"Expanded Farm",   icon:"🚜" },
  { plots:30, gems:200, hny:6000,  label:"Master Farm 🏆",  icon:"🏡" },
];

function ImproveFarm() {
  const [, forceUpdate] = useState(0);
  const plotCount = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("sandbox_unlocked_plots") || "[6,7,8]").length; }
    catch { return 3; }
  }, []);

  const claimMilestone = (m) => {
    const key = `farm_milestone_${m.plots}`;
    if (getLS(key) === "true") return;
    addGems(m.gems);
    addHoney(m.hny);
    setLS(key, "true");
    forceUpdate(n => n + 1);
  };

  return (
    <div style={{ padding:"20px 24px", display:"flex", flexDirection:"column", gap:14 }}>
      <div style={{ fontSize:13, color:"rgba(255,255,255,0.5)", lineHeight:1.6 }}>
        Expand your farm by unlocking more plots! Visit the Gardener to unlock plots and claim milestone rewards here.
      </div>

      <div style={{ background:"rgba(255,255,255,0.06)", borderRadius:12, padding:"12px 18px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div>
          <div style={{ fontSize:11, color:"rgba(255,255,255,0.35)", marginBottom:2 }}>YOUR PLOTS</div>
          <div style={{ fontSize:22, fontWeight:700, color:"#a5d6a7" }}>{plotCount} <span style={{ fontSize:13, color:"rgba(255,255,255,0.3)" }}>/ 30</span></div>
        </div>
        <div style={{ fontSize:32 }}>🌾</div>
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {PLOT_MILESTONES.map(m => {
          const met     = plotCount >= m.plots;
          const claimed = getLS(`farm_milestone_${m.plots}`) === "true";
          return (
            <div key={m.plots} style={{
              display:"flex", alignItems:"center", gap:14,
              background: claimed ? "rgba(102,187,106,0.1)" : met ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.04)",
              borderRadius:14, padding:"14px 18px",
              border: claimed ? "1px solid rgba(102,187,106,0.35)" : met ? "1px solid rgba(255,255,255,0.15)" : "1px solid rgba(255,255,255,0.06)",
              opacity: (!met && !claimed) ? 0.55 : 1,
            }}>
              <div style={{ fontSize:28, flexShrink:0 }}>{m.icon}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:700, color: claimed ? "#a5d6a7" : met ? "#fff" : "rgba(255,255,255,0.5)" }}>{m.label}</div>
                <div style={{ fontSize:11, color:"rgba(255,255,255,0.35)", marginTop:2 }}>Unlock {m.plots} plots · {!met ? `${plotCount}/${m.plots}` : "Reached!"}</div>
              </div>
              <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                <div style={{ fontSize:12, color:"#90caf9", fontWeight:700 }}>{m.gems}<img src="/images/profile_bar/diamond.png" alt="" style={{ width: '12px', height: '12px', objectFit: 'contain', verticalAlign: 'middle', marginLeft: '2px' }} /></div>
                <div style={{ fontSize:12, color:"#ffd54f", fontWeight:700 }}>{fmtHny(m.hny)}<img src="/images/profile_bar/hny.png" alt="HNY" style={{ width: '12px', height: '12px', objectFit: 'contain', verticalAlign: 'middle', marginLeft: '2px' }} /></div>
                {claimed ? (
                  <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)", marginLeft:4 }}>✅</div>
                ) : met ? (
                  <button onClick={() => claimMilestone(m)} style={{
                    padding:"7px 16px", borderRadius:20, border:"none",
                    background:"linear-gradient(180deg,#66bb6a,#388e3c)",
                    color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer",
                  }}>Claim</button>
                ) : (
                  <div style={{ fontSize:18, color:"rgba(255,255,255,0.2)" }}>🔒</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Mission Board Rewards ─────────────────────────────────────────────────────

const MISSION_TIERS = [
  { quests:5,  gems:40,  hny:800   },
  { quests:10, gems:70,  hny:1500  },
  { quests:15, gems:100, hny:2500  },
  { quests:20, gems:150, hny:4000  },
  { quests:25, gems:200, hny:6000, pfp:"sandbox_has_missionboard_pfp" },
];

function MissionBoardRewards() {
  const [, forceUpdate] = useState(0);
  const questCount = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("sandbox_completed_quests") || "[]").length; }
    catch { return 0; }
  }, []);

  const claimTier = (t) => {
    const key = `mission_tier_${t.quests}`;
    if (getLS(key) === "true") return;
    addGems(t.gems);
    addHoney(t.hny);
    if (t.pfp) setLS(t.pfp, "true");
    setLS(key, "true");
    forceUpdate(n => n + 1);
  };

  const hasPfp = getLS("sandbox_has_missionboard_pfp") === "true";

  return (
    <div style={{ padding:"20px 24px", display:"flex", flexDirection:"column", gap:14 }}>
      <div style={{ fontSize:13, color:"rgba(255,255,255,0.5)", lineHeight:1.6 }}>
        Every 5 missions completed earns you a prize! Reach all 5 tiers to unlock the exclusive Mission Board PFP.
      </div>

      {hasPfp && <PfpBanner label="Mission Board Beta PFP" color="#7b1fa2" />}

      <div style={{ background:"rgba(255,255,255,0.06)", borderRadius:12, padding:"12px 18px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div>
          <div style={{ fontSize:11, color:"rgba(255,255,255,0.35)", marginBottom:2 }}>MISSIONS COMPLETED</div>
          <div style={{ fontSize:22, fontWeight:700, color:"#ce93d8" }}>{questCount}</div>
        </div>
        <div style={{ fontSize:32 }}>📋</div>
      </div>

      {/* Progress to next tier */}
      {(() => {
        const next = MISSION_TIERS.find(t => questCount < t.quests);
        if (!next) return null;
        const prev = MISSION_TIERS[MISSION_TIERS.indexOf(next) - 1];
        const from = prev?.quests ?? 0;
        const pct  = Math.min((questCount - from) / (next.quests - from), 1);
        return (
          <div>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:"rgba(255,255,255,0.35)", marginBottom:6 }}>
              <span>Progress to next tier</span><span>{questCount - from} / {next.quests - from}</span>
            </div>
            <div style={{ height:10, background:"rgba(255,255,255,0.08)", borderRadius:10, overflow:"hidden" }}>
              <div style={{ width:`${pct*100}%`, height:"100%", background:"linear-gradient(90deg,#9c27b0,#e040fb)", transition:"width 0.4s" }} />
            </div>
          </div>
        );
      })()}

      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {MISSION_TIERS.map(t => {
          const met     = questCount >= t.quests;
          const claimed = getLS(`mission_tier_${t.quests}`) === "true";
          return (
            <div key={t.quests} style={{
              display:"flex", alignItems:"center", gap:14,
              background: claimed ? "rgba(156,39,176,0.12)" : met ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.04)",
              borderRadius:14, padding:"14px 18px",
              border: claimed ? "1px solid rgba(156,39,176,0.4)" : met ? "1px solid rgba(255,255,255,0.15)" : "1px solid rgba(255,255,255,0.06)",
              opacity: (!met && !claimed) ? 0.55 : 1,
            }}>
              <div style={{ fontSize:26, flexShrink:0 }}>{t.pfp ? "👑" : "📋"}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:700, color: claimed ? "#ce93d8" : met ? "#fff" : "rgba(255,255,255,0.5)" }}>
                  {t.quests} Missions{t.pfp ? " — Exclusive PFP" : ""}
                </div>
                <div style={{ fontSize:11, color:"rgba(255,255,255,0.35)", marginTop:2 }}>
                  {!met ? `${questCount} / ${t.quests} completed` : "Requirement met!"}
                </div>
              </div>
              <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                <div style={{ fontSize:12, color:"#90caf9", fontWeight:700 }}>{t.gems}<img src="/images/profile_bar/diamond.png" alt="" style={{ width: '12px', height: '12px', objectFit: 'contain', verticalAlign: 'middle', marginLeft: '2px' }} /></div>
                <div style={{ fontSize:12, color:"#ffd54f", fontWeight:700 }}>{fmtHny(t.hny)}<img src="/images/profile_bar/hny.png" alt="HNY" style={{ width: '12px', height: '12px', objectFit: 'contain', verticalAlign: 'middle', marginLeft: '2px' }} /></div>
                {claimed ? (
                  <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)", marginLeft:4 }}>✅</div>
                ) : met ? (
                  <button onClick={() => claimTier(t)} style={{
                    padding:"7px 16px", borderRadius:20, border:"none",
                    background:"linear-gradient(180deg,#9c27b0,#6a1b9a)",
                    color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer",
                  }}>Claim</button>
                ) : (
                  <div style={{ fontSize:18, color:"rgba(255,255,255,0.2)" }}>🔒</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Apple Buckets ─────────────────────────────────────────────────────────────

const BUCKET_Y = 20;

function AppleBuckets() {
  const [phase,     setPhase]     = useState("idle");
  const [score,     setScore]     = useState(0);
  const [timeLeft,  setTimeLeft]  = useState(60);
  const [bucketX,   setBucketX]   = useState(50);
  const [apple,     setApple]     = useState({ x:50, y:80, angle:0 });
  const [feedback,  setFeedback]  = useState(null);
  const [aimLine,   setAimLine]   = useState(null);

  const containerRef = useRef(null);
  const bucketRef    = useRef({ x:50, vx:1.5, pauseUntil:0 });
  const gameRef      = useRef({ flying:false, drag:null });
  const scoreRef     = useRef(0);
  const rafRef       = useRef(null);
  const bucketRafRef = useRef(null);
  const timerRef     = useRef(null);

  const stopAll = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    cancelAnimationFrame(bucketRafRef.current);
    clearInterval(timerRef.current);
  }, []);
  useEffect(() => () => stopAll(), [stopAll]);

  const bucketLoop = useCallback(() => {
    const b = bucketRef.current;
    const now = Date.now();
    if (now >= b.pauseUntil) {
      b.x += b.vx;
      if (b.x >= 83) b.vx = -Math.abs(b.vx);
      if (b.x <= 17) b.vx =  Math.abs(b.vx);
      if (Math.random() < 0.007) b.pauseUntil = now + 400 + Math.random() * 900;
      setBucketX(b.x);
    }
    bucketRafRef.current = requestAnimationFrame(bucketLoop);
  }, []);

  const startGame = () => {
    stopAll();
    scoreRef.current = 0;
    setScore(0);
    setTimeLeft(60);
    setFeedback(null);
    setAimLine(null);
    bucketRef.current = { x:50, vx:1.5, pauseUntil:0 };
    gameRef.current   = { flying:false, drag:null };
    setApple({ x:50, y:80, angle:0 });
    setBucketX(50);
    setPhase("playing");
    let t = 60;
    timerRef.current = setInterval(() => {
      t--;
      setTimeLeft(t);
      if (t <= 0) { stopAll(); setPhase("gameover"); }
    }, 1000);
    bucketRafRef.current = requestAnimationFrame(bucketLoop);
  };

  const toPercent = (clientX, clientY) => {
    const r = containerRef.current.getBoundingClientRect();
    return { x:((clientX - r.left) / r.width) * 100, y:((clientY - r.top) / r.height) * 100 };
  };

  const launchApple = (sd, endX, endY) => {
    const dt = Math.max((Date.now() - sd.time) / 1000, 0.04);
    const dx = endX - sd.x;
    const dy = sd.y - endY;
    if (dy < 4) return;
    const speed = Math.min(dy / dt / 14, 7);
    const vx    = (dx / dt) / 22;
    const curve = dx * 0.035;
    const sx = 50, sy = 80;
    let t = 0;
    const GRAVITY = 0.14;
    const fly = () => {
      t++;
      const nx = sx + vx * t + curve * 0.004 * t * t;
      const ny = sy - speed * t + 0.5 * GRAVITY * t * t;
      const ang = (vx + curve * t * 0.08) * 7;
      if (ny <= BUCKET_Y + 6) {
        const bx = bucketRef.current.x;
        const hit = Math.abs(nx - bx) < 10;
        if (hit) { scoreRef.current++; setScore(scoreRef.current); }
        setFeedback(hit ? "hit" : "miss");
        setApple({ x: hit ? bx : nx, y: Math.max(ny, 2), angle: ang });
        setTimeout(() => { setFeedback(null); gameRef.current.flying = false; setApple({ x:50, y:80, angle:0 }); }, 700);
        return;
      }
      if (nx < -8 || nx > 108 || ny > 92) {
        setFeedback("miss");
        setTimeout(() => { setFeedback(null); gameRef.current.flying = false; setApple({ x:50, y:80, angle:0 }); }, 500);
        return;
      }
      setApple({ x:nx, y:ny, angle:ang });
      rafRef.current = requestAnimationFrame(fly);
    };
    gameRef.current.flying = true;
    rafRef.current = requestAnimationFrame(fly);
  };

  const onMouseDown = (e) => {
    if (phase !== "playing" || gameRef.current.flying) return;
    const pos = toPercent(e.clientX, e.clientY);
    if (Math.hypot(pos.x - apple.x, pos.y - apple.y) > 18) return;
    e.preventDefault();
    gameRef.current.drag = { ...pos, time: Date.now() };
  };
  const onMouseMove = (e) => {
    if (!gameRef.current.drag || gameRef.current.flying) return;
    const pos = toPercent(e.clientX, e.clientY);
    const sd  = gameRef.current.drag;
    setAimLine({ x1:sd.x, y1:sd.y, x2:pos.x, y2:pos.y });
  };
  const onMouseUp = (e) => {
    const sd = gameRef.current.drag;
    if (!sd) return;
    gameRef.current.drag = null;
    setAimLine(null);
    const pos = toPercent(e.clientX, e.clientY);
    launchApple(sd, pos.x, pos.y);
  };

  const hs = parseInt(getLS("apple_hs", "0"));
  if (phase === "idle" || phase === "gameover") {
    const newHs = Math.max(score, hs);
    if (phase === "gameover" && score > hs) setLS("apple_hs", String(score));
    const pct = score >= 20 ? 5 : score >= 14 ? 10 : score >= 9 ? 25 : score >= 5 ? 50 : score >= 2 ? 70 : 85;
    return (
      <div style={{ padding:24, display:"flex", flexDirection:"column", alignItems:"center", gap:16, textAlign:"center" }}>
        <div style={{ fontSize:56 }}>🍎</div>
        {phase === "gameover" ? <>
          <div style={{ fontSize:26, fontWeight:700, color:"#fff" }}>Score: {score} catches</div>
          <div style={{ fontSize:14, color:"rgba(255,255,255,0.6)" }}>Top <span style={{ color:"#ffd54f", fontWeight:700 }}>{pct}%</span> of Apple Buckets players!</div>
          <div style={{ background:"rgba(255,255,255,0.06)", borderRadius:12, padding:"10px 20px", fontSize:13, color:"rgba(255,255,255,0.45)" }}>🏆 Best: {newHs} catches</div>
        </> : <>
          <div style={{ fontSize:20, fontWeight:700, color:"#fff" }}>Apple Buckets</div>
          <div style={{ fontSize:13, color:"rgba(255,255,255,0.5)", lineHeight:1.7, maxWidth:320 }}>
            Swipe up from the 🍎 to toss it into the moving 🪣 bucket!<br/>
            Diagonal swipes add curve. 60 seconds — catch as many as you can!
          </div>
          {hs > 0 && <div style={{ fontSize:12, color:"rgba(255,255,255,0.3)" }}>🏆 Best: {hs} catches</div>}
        </>}
        <button onClick={startGame} style={{ padding:"12px 36px", borderRadius:24, border:"none", background:"linear-gradient(180deg,#ef5350,#b71c1c)", color:"#fff", fontSize:16, fontWeight:700, cursor:"pointer", boxShadow:"0 4px 16px rgba(0,0,0,0.4)" }}>
          {phase === "idle" ? "▶ Start" : "↺ Play Again"}
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding:"14px 20px", display:"flex", flexDirection:"column", gap:10 }}>
      <style>{`@keyframes fbFloat{from{transform:translate(-50%,-50%);opacity:1}to{transform:translate(-50%,-200%);opacity:0}}`}</style>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div style={{ fontSize:15, fontWeight:700, color: timeLeft <= 10 ? "#ef5350" : "#fff" }}>⏱ {timeLeft}s</div>
        <div style={{ fontSize:15, fontWeight:700, color:"#a5d6a7" }}>🍎 {score} catches</div>
      </div>
      <div style={{ height:6, background:"rgba(255,255,255,0.08)", borderRadius:6, overflow:"hidden" }}>
        <div style={{ width:`${(timeLeft/60)*100}%`, height:"100%", background: timeLeft > 20 ? "#66bb6a" : "#ef5350", transition:"width 1s linear, background 0.3s" }} />
      </div>

      <div
        ref={containerRef}
        style={{ position:"relative", width:"100%", height:290, background:"linear-gradient(180deg,#0c1f3a,#071020)", borderRadius:16, overflow:"hidden", cursor:"crosshair", userSelect:"none" }}
        onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp}
        onMouseLeave={() => { gameRef.current.drag = null; setAimLine(null); }}
      >
        {/* Sky glow */}
        <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse at 50% 0%,rgba(80,140,255,0.18) 0%,transparent 65%)", pointerEvents:"none" }} />
        {/* Ground line */}
        <div style={{ position:"absolute", bottom:0, left:0, right:0, height:24, background:"linear-gradient(0deg,rgba(30,60,30,0.6),transparent)", borderTop:"1px solid rgba(255,255,255,0.05)" }} />

        {/* Bucket */}
        <div style={{ position:"absolute", left:`${bucketX}%`, top:`${BUCKET_Y}%`, transform:"translateX(-50%)", fontSize:38, filter:"drop-shadow(0 4px 10px rgba(0,0,0,0.6))", pointerEvents:"none" }}>🪣</div>

        {/* Aim line */}
        {aimLine && (
          <svg style={{ position:"absolute", inset:0, width:"100%", height:"100%", pointerEvents:"none" }}>
            <defs>
              <marker id="arrow" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                <path d="M0,0 L6,3 L0,6 Z" fill="rgba(255,255,255,0.5)" />
              </marker>
            </defs>
            <line x1={`${aimLine.x1}%`} y1={`${aimLine.y1}%`} x2={`${aimLine.x2}%`} y2={`${aimLine.y2}%`}
              stroke="rgba(255,255,255,0.35)" strokeWidth="2" strokeDasharray="7,5" markerEnd="url(#arrow)" />
          </svg>
        )}

        {/* Hit/miss feedback */}
        {feedback && (
          <div style={{ position:"absolute", top:"42%", left:"50%", fontSize:28, fontWeight:700, pointerEvents:"none",
            color: feedback === "hit" ? "#66bb6a" : "#ef5350",
            textShadow:"0 2px 8px rgba(0,0,0,0.9)", animation:"fbFloat 0.7s ease-out forwards" }}>
            {feedback === "hit" ? "🎉 Catch!" : "💨 Miss!"}
          </div>
        )}

        {/* Apple */}
        <div style={{
          position:"absolute", left:`${apple.x}%`, top:`${apple.y}%`,
          transform:`translate(-50%,-50%) rotate(${apple.angle}deg)`,
          fontSize:36, cursor: !gameRef.current.flying ? "grab" : "default",
          filter: feedback === "hit" ? "drop-shadow(0 0 14px #66bb6a)" : "drop-shadow(0 3px 8px rgba(0,0,0,0.7))",
          pointerEvents: gameRef.current.flying ? "none" : "auto",
          transition: gameRef.current.flying ? "none" : "none",
        }}>🍎</div>

        {!gameRef.current.flying && !gameRef.current.drag && (
          <div style={{ position:"absolute", bottom:8, left:"50%", transform:"translateX(-50%)", fontSize:10, color:"rgba(255,255,255,0.3)", whiteSpace:"nowrap", pointerEvents:"none" }}>
            Swipe up from 🍎 to throw · angle for curve
          </div>
        )}
      </div>
    </div>
  );
}

// ── Coming Soon ───────────────────────────────────────────────────────────────

function ComingSoon({ ev }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:260, gap:12, color:"rgba(255,255,255,0.4)", textAlign:"center", padding:32 }}>
      <div style={{ fontSize:52 }}>🔒</div>
      <div style={{ fontSize:16, fontWeight:700, color:"rgba(255,255,255,0.6)" }}>Coming Soon</div>
      <div style={{ fontSize:12, lineHeight:1.6 }}>{ev.bannerSub}</div>
      {ev.timer && <div style={{ background:"rgba(255,255,255,0.06)", borderRadius:20, padding:"6px 16px", fontSize:12 }}>⏱ {ev.timer}</div>}
    </div>
  );
}

// ── Main Dialog ───────────────────────────────────────────────────────────────

export default function FestivalsDialog({ onClose }) {
  const [activeId, setActiveId] = useState("welcome_beta");
  const active = EVENTS.find(e => e.id === activeId);

  const renderContent = () => {
    switch (active.type) {
      case "welcome_beta":  return <WelcomeBeta />;
      case "queen_pass":    return <QueenPass />;
      case "mayor_pass":    return <MayorPass />;
      case "month_checkin":   return <MonthCheckIn />;
      case "flower_pot":      return <FlowerPotMystery />;
      case "potato_whack":    return <PotatoWhack />;
      case "apple_buckets":   return <AppleBuckets />;
      case "improve_farm":    return <ImproveFarm />;
      case "mission_rewards": return <MissionBoardRewards />;
      default:                return <ComingSoon ev={active} />;
    }
  };

  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, zIndex:1200, background:"rgba(0,0,0,0.78)", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div onClick={e => e.stopPropagation()} style={{
        width:900, maxHeight:"88vh", display:"flex", borderRadius:4, overflow:"hidden",
        boxShadow:"0 16px 80px rgba(0,0,0,0.95)", fontFamily:"Cartoonist, sans-serif",
      }}>

        {/* Sidebar */}
        <div style={{ width:210, flexShrink:0, background:"#18181f", display:"flex", flexDirection:"column", overflowY:"auto", borderRight:"1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ padding:"16px 18px 12px", display:"flex", alignItems:"center", gap:10, borderBottom:"1px solid rgba(255,255,255,0.07)", flexShrink:0 }}>
            <span style={{ fontSize:22 }}>🎪</span>
            <span style={{ fontSize:20, fontWeight:700, color:"#fff" }}>Events</span>
          </div>

          {CATEGORIES.map(cat => {
            const items = EVENTS.filter(e => e.cat === cat);
            if (!items.length) return null;
            return (
              <div key={cat}>
                <div style={{ display:"flex", alignItems:"center", gap:6, padding:"12px 14px 4px", fontSize:10, color:"rgba(255,255,255,0.3)", letterSpacing:"0.08em", textTransform:"uppercase" }}>
                  <span>✦</span><span>{cat}</span><span>✦</span>
                </div>
                {items.map(ev => {
                  const isActive = ev.id === activeId;
                  return (
                    <div key={ev.id} onClick={() => setActiveId(ev.id)} style={{
                      position:"relative", padding:"12px 16px 12px 18px", cursor:"pointer",
                      fontSize:13, fontWeight: isActive ? 700 : 400, lineHeight:1.3,
                      color: isActive ? "#fff" : "rgba(255,255,255,0.6)",
                      background: isActive ? "linear-gradient(90deg,rgba(233,30,140,0.9),rgba(170,0,100,0.85))" : "transparent",
                      borderLeft: isActive ? "3px solid #ff80c0" : "3px solid transparent",
                      userSelect:"none",
                    }}
                      onMouseEnter={e => { if(!isActive) e.currentTarget.style.background="rgba(255,255,255,0.05)"; }}
                      onMouseLeave={e => { if(!isActive) e.currentTarget.style.background="transparent"; }}
                    >
                      {ev.label}
                      {ev.hasNotif && <span style={{ position:"absolute", top:8, right:10, background:"#f44336", color:"#fff", width:16, height:16, borderRadius:"50%", fontSize:10, fontWeight:900, display:"flex", alignItems:"center", justifyContent:"center" }}>!</span>}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Main content */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", background:"#0e0e1a", overflow:"hidden" }}>

          {/* Banner */}
          <div style={{
            background:`linear-gradient(135deg,${active.bannerGrad[0]} 0%,${active.bannerGrad[1]} 100%)`,
            padding:"20px 22px 16px", position:"relative", flexShrink:0, minHeight:100,
            display:"flex", flexDirection:"column", justifyContent:"flex-end", overflow:"hidden",
          }}>
            <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse at 60% 30%,rgba(255,255,255,0.12) 0%,transparent 60%)", pointerEvents:"none" }} />
            <div style={{ position:"absolute", inset:0, opacity:0.05, backgroundImage:"radial-gradient(circle,rgba(255,255,255,0.8) 1px,transparent 1px)", backgroundSize:"20px 20px", pointerEvents:"none" }} />
            {active.timer && <div style={{ position:"absolute", top:12, right:52, background:"rgba(0,0,0,0.5)", borderRadius:20, padding:"4px 12px", fontSize:12, color:"#fff" }}>⏱ {active.timer}</div>}
            <button onClick={onClose} style={{ position:"absolute", top:8, right:10, width:32, height:32, borderRadius:"50%", background:"#1565c0", border:"2px solid rgba(255,255,255,0.3)", color:"#fff", fontSize:14, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}
              onMouseEnter={e => e.currentTarget.style.background="#0d47a1"}
              onMouseLeave={e => e.currentTarget.style.background="#1565c0"}
            >✕</button>
            <div style={{ fontSize:24, fontWeight:700, color:"#fff", textShadow:"2px 3px 0 rgba(0,0,0,0.6)", letterSpacing:"0.5px" }}>{active.bannerTitle}</div>
            <div style={{ fontSize:12, color:"rgba(255,255,255,0.8)", marginTop:3 }}>{active.bannerSub}</div>
          </div>

          {/* Body */}
          <div style={{ flex:1, overflowY:"auto" }}>{renderContent()}</div>
        </div>
      </div>
    </div>
  );
}
