import React, { useState, useCallback } from "react";
import "./style.css";
import BaseButton from "../../../components/buttons/BaseButton";
import { useNotification } from "../../../contexts/NotificationContext";
import { ONE_SEED_HEIGHT, ONE_SEED_WIDTH, ALL_SEED_IMAGE_HEIGHT } from "../../../constants/item_seed";
const COST = 1000;

const SPRITE_URL = "/images/crops/seeds.webp";

const CropSprite = ({ pos, size = 56 }) => {
  const scale = size / ONE_SEED_HEIGHT;
  return (
    <div style={{
      width: Math.round(ONE_SEED_WIDTH * scale),
      height: size,
      backgroundImage: `url(${SPRITE_URL})`,
      backgroundSize: `${Math.round(ONE_SEED_WIDTH * scale)}px ${Math.round(ALL_SEED_IMAGE_HEIGHT * scale)}px`,
      backgroundPosition: `0 ${-Math.round(pos * ONE_SEED_HEIGHT * scale)}px`,
      backgroundRepeat: 'no-repeat',
      flexShrink: 0,
    }} />
  );
};

// Symbols ordered by value (lowest → highest)
const SYMBOLS = [
  { id: "potato",      pos: 24, label: "Potato",      prize: 250   },
  { id: "carrot",      pos: 3,  label: "Carrot",      prize: 700   },
  { id: "tomato",      pos: 2,  label: "Tomato",      prize: 1200  },
  { id: "corn",        pos: 4,  label: "Corn",        prize: 1800  },
  { id: "blueberry",   pos: 17, label: "Blueberry",   prize: 3000  },
  { id: "mango",       pos: 14, label: "Mango",       prize: 7000  },
  { id: "dragonfruit", pos: 23, label: "Dragonfruit", prize: 15000 },
];

// Win tier probability table (cumulative %)
// Jackpot 1%, MegaWin 2%, SuperWin 5%, BigWin 8%, Win 12%, SmallWin 15%, TinyWin 17%, Loss 40%
const WIN_TABLE = [
  { cumPct: 1,  symbolId: "dragonfruit" },
  { cumPct: 3,  symbolId: "mango"       },
  { cumPct: 8,  symbolId: "blueberry"   },
  { cumPct: 16, symbolId: "corn"        },
  { cumPct: 28, symbolId: "tomato"      },
  { cumPct: 43, symbolId: "carrot"      },
  { cumPct: 60, symbolId: "potato"      },
  // 40%+ = loss
];

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomSymbolExcluding(excludeId) {
  const pool = SYMBOLS.filter(s => s.id !== excludeId);
  return pickRandom(pool);
}

function generateTicket() {
  const roll = Math.random() * 100;
  const winTier = WIN_TABLE.find(t => roll < t.cumPct);

  // 3×3 grid, rows 0-2. Each row has 3 cells.
  // Win = one row has 3 matching winning symbols.
  // Loss = all rows guaranteed non-matching.
  const grid = Array.from({ length: 9 }, () => pickRandom(SYMBOLS));

  if (winTier) {
    const winSym = SYMBOLS.find(s => s.id === winTier.symbolId);
    // Pick a random row to be the winning row
    const winRow = Math.floor(Math.random() * 3);
    for (let col = 0; col < 3; col++) {
      grid[winRow * 3 + col] = winSym;
    }
    // Ensure no other row accidentally matches
    for (let row = 0; row < 3; row++) {
      if (row === winRow) continue;
      // Make sure cols 0 and 1 don't both match col 2, or any 3 match
      const col0 = randomSymbolExcluding(winSym.id);
      const col1 = randomSymbolExcluding(winSym.id);
      let col2 = randomSymbolExcluding(winSym.id);
      // If col0 === col1, make col2 different to avoid another win
      if (col0.id === col1.id) {
        col2 = randomSymbolExcluding(col0.id);
      }
      grid[row * 3 + 0] = col0;
      grid[row * 3 + 1] = col1;
      grid[row * 3 + 2] = col2;
    }
    return { grid, prize: winSym.prize, winRow, winSymbol: winSym };
  } else {
    // Loss: ensure no row is 3-of-a-kind
    for (let row = 0; row < 3; row++) {
      const a = pickRandom(SYMBOLS);
      let b = pickRandom(SYMBOLS);
      let c = pickRandom(SYMBOLS);
      // Guarantee no row matches
      while (a.id === b.id) b = pickRandom(SYMBOLS);
      while (a.id === c.id || b.id === c.id) c = pickRandom(SYMBOLS);
      grid[row * 3 + 0] = a;
      grid[row * 3 + 1] = b;
      grid[row * 3 + 2] = c;
    }
    return { grid, prize: 0, winRow: -1, winSymbol: null };
  }
}

const PRIZE_TABLE = SYMBOLS.slice().reverse().map(s => ({
  symbolId: s.id,
  pos: s.pos,
  label: s.prize === 15000 ? "JACKPOT" : s.prize === 7000 ? "MEGA WIN" : s.prize === 3000 ? "SUPER WIN" : s.prize === 1800 ? "BIG WIN" : s.prize === 1200 ? "WIN" : s.prize === 700 ? "SMALL WIN" : "TINY WIN",
  prize: s.prize,
}));

const DAILY_LIMIT = 5;
const DATE_KEY = "sandbox_scratchoff_date";
const COUNT_KEY = "sandbox_scratchoff_count";

function getTodayStr() {
  return new Date().toISOString().slice(0, 10);
}

function getDailyCount() {
  const stored = localStorage.getItem(DATE_KEY);
  if (stored !== getTodayStr()) return 0;
  return parseInt(localStorage.getItem(COUNT_KEY) || "0", 10);
}

function incrementDailyCount() {
  localStorage.setItem(DATE_KEY, getTodayStr());
  localStorage.setItem(COUNT_KEY, (getDailyCount() + 1).toString());
}

const ScratchOff = ({ onBack }) => {
  const { show } = useNotification();
  const [phase, setPhase] = useState("buy"); // buy | scratch | result
  const [ticket, setTicket] = useState(null);
  const [revealed, setRevealed] = useState(Array(9).fill(false));
  const [showPrize, setShowPrize] = useState(false);
  const [dailyCount, setDailyCount] = useState(() => getDailyCount());

  const allRevealed = revealed.every(Boolean);

  const buyTicket = useCallback(() => {
    const count = getDailyCount();
    if (count >= DAILY_LIMIT) {
      show(`Daily limit reached! Come back tomorrow. (${DAILY_LIMIT}/${DAILY_LIMIT} used)`, "error");
      return;
    }
    const honey = parseFloat(localStorage.getItem("sandbox_honey") || "0");
    if (honey < COST) {
      show(`Not enough Honey! Need ${COST} Gold.`, "error");
      return;
    }
    const newHoney = honey - COST;
    localStorage.setItem("sandbox_honey", newHoney.toString());
    window.dispatchEvent(new CustomEvent("sandboxHoneyChanged", { detail: newHoney.toString() }));

    incrementDailyCount();
    setDailyCount(getDailyCount());

    const t = generateTicket();
    setTicket(t);
    setRevealed(Array(9).fill(false));
    setShowPrize(false);
    setPhase("scratch");
  }, [show]);

  const revealCell = useCallback((i) => {
    setRevealed(prev => {
      const next = [...prev];
      next[i] = true;
      return next;
    });
  }, []);

  const revealAll = useCallback(() => {
    setRevealed(Array(9).fill(true));
  }, []);

  const collectPrize = useCallback(() => {
    if (!ticket || ticket.prize === 0) {
      setPhase("buy");
      setTicket(null);
      return;
    }
    const honey = parseFloat(localStorage.getItem("sandbox_honey") || "0");
    const newHoney = honey + ticket.prize;
    localStorage.setItem("sandbox_honey", newHoney.toString());
    window.dispatchEvent(new CustomEvent("sandboxHoneyChanged", { detail: newHoney.toString() }));
    show(`+${ticket.prize.toLocaleString()} Gold!`, "success");
    setPhase("buy");
    setTicket(null);
  }, [ticket, show]);

  // When all cells revealed, show prize after short delay
  React.useEffect(() => {
    if (allRevealed && ticket && !showPrize) {
      const t = setTimeout(() => setShowPrize(true), 400);
      return () => clearTimeout(t);
    }
  }, [allRevealed, ticket, showPrize]);

  const isWinRow = (row) => ticket && ticket.winRow === row;

  return (
    <div className="scratch-off-wrapper">
      {phase === "buy" && (
        <>
          <div className="scratch-off-title">🎰 Scratch Off</div>
          <div className="scratch-off-subtitle">Match 3 in a row to win!</div>

          {/* Prize table */}
          <div className="scratch-prize-table">
            {PRIZE_TABLE.map(p => (
              <div key={p.label} className="scratch-prize-row">
                <span className="scratch-prize-combo">
                  {[0,1,2].map(i => (
                    <CropSprite key={i} pos={p.pos} size={36} />
                  ))}
                </span>
                <span className="scratch-prize-label">{p.label}</span>
                <span className="scratch-prize-amount">+{p.prize.toLocaleString()} Gold</span>
              </div>
            ))}
          </div>

          <div className="scratch-cost-label">Cost: {COST.toLocaleString()} Gold per ticket</div>
          <div className="scratch-cost-label">{dailyCount}/{DAILY_LIMIT} tickets used today</div>
          <div style={{ display: "flex", gap: "8px" }}>
            <BaseButton label={`Buy Ticket (${COST} Gold)`} onClick={buyTicket} disabled={dailyCount >= DAILY_LIMIT} />
            <BaseButton label="Back" onClick={onBack} isError />
          </div>
        </>
      )}

      {phase === "scratch" && ticket && (
        <>
          <div className="scratch-off-title">🎰 Scratch Your Ticket</div>
          <div className="scratch-off-subtitle">Tap each square to reveal</div>

          <div className="scratch-grid">
            {Array.from({ length: 3 }, (_, row) => (
              <div key={row} className={`scratch-row${isWinRow(row) && allRevealed ? " scratch-row-win" : ""}`}>
                {Array.from({ length: 3 }, (_, col) => {
                  const i = row * 3 + col;
                  const sym = ticket.grid[i];
                  const isRev = revealed[i];
                  return (
                    <button
                      key={col}
                      className={`scratch-cell${isRev ? " revealed" : ""}`}
                      onClick={() => !isRev && revealCell(i)}
                      disabled={isRev}
                    >
                      {isRev ? (
                        <CropSprite pos={sym.pos} size={56} />
                      ) : (
                        <span className="scratch-cover">?</span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {!allRevealed && (
            <BaseButton label="Reveal All" onClick={revealAll} />
          )}

          {allRevealed && showPrize && (
            <div className={`scratch-result${ticket.prize > 0 ? " win" : " loss"}`}>
              {ticket.prize > 0 ? (
                <>
                  <div className="scratch-result-label">🎉 {PRIZE_TABLE.find(p => p.prize === ticket.prize)?.label ?? "YOU WIN!"}</div>
                  <div className="scratch-result-amount">+{ticket.prize.toLocaleString()} Gold</div>
                  <BaseButton label={`Collect ${ticket.prize.toLocaleString()} Gold`} onClick={collectPrize} />
                </>
              ) : (
                <>
                  <div className="scratch-result-label">😔 No Match</div>
                  <div className="scratch-result-sublabel">Better luck next time!</div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <BaseButton label={`Try Again (${COST} Gold)`} onClick={buyTicket} />
                    <BaseButton label="Back" onClick={onBack} isError />
                  </div>
                </>
              )}
            </div>
          )}

          {allRevealed && !showPrize && (
            <div style={{ color: "#aaa", fontSize: "14px", textAlign: "center" }}>...</div>
          )}
        </>
      )}
    </div>
  );
};

export default ScratchOff;
