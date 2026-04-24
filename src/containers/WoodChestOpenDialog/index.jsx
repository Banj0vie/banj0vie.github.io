import React, { useState, useEffect, useRef } from "react";
import ItemSmallView from "../../components/boxes/ItemViewSmall";

const IDLE_COUNT = 21;   // frames 00000–00020
const OPEN_COUNT = 27;   // frames 00021–00047
const IDLE_FPS = 12;
const DRAG_PX_FULL = 140; // px of upward drag to fully open

const pad = (n) => String(n).padStart(5, "0");

const WoodChestOpenDialog = ({ revealedSeeds = [], onClose }) => {
  const [phase, setPhase] = useState("idle"); // idle | opening | revealed
  const [idleFrame, setIdleFrame] = useState(0);
  const [openFrame, setOpenFrame] = useState(0);

  const phaseRef = useRef("idle");
  const startYRef = useRef(null);
  const openFrameRef = useRef(0);
  const idleTimerRef = useRef(null);
  const completeRafRef = useRef(null);

  const syncPhase = (p) => { phaseRef.current = p; setPhase(p); };
  const syncOpenFrame = (f) => { openFrameRef.current = f; setOpenFrame(f); };

  // Idle loop
  useEffect(() => {
    if (phase !== "idle") return;
    idleTimerRef.current = setInterval(
      () => setIdleFrame((f) => (f + 1) % IDLE_COUNT),
      1000 / IDLE_FPS
    );
    return () => clearInterval(idleTimerRef.current);
  }, [phase]);

  // Auto-complete opening animation once pointer released past threshold
  const runComplete = () => {
    const finish = () => {
      if (openFrameRef.current >= OPEN_COUNT - 1) {
        syncPhase("revealed");
        return;
      }
      syncOpenFrame(Math.min(OPEN_COUNT - 1, openFrameRef.current + 1));
      completeRafRef.current = requestAnimationFrame(finish);
    };
    completeRafRef.current = requestAnimationFrame(finish);
  };

  // Reverse animation back to start if swipe cancelled
  const runReverse = () => {
    const reverse = () => {
      if (openFrameRef.current <= 0) {
        syncOpenFrame(0);
        syncPhase("idle");
        return;
      }
      syncOpenFrame(openFrameRef.current - 1);
      completeRafRef.current = requestAnimationFrame(reverse);
    };
    completeRafRef.current = requestAnimationFrame(reverse);
  };

  useEffect(() => () => {
    clearInterval(idleTimerRef.current);
    if (completeRafRef.current) cancelAnimationFrame(completeRafRef.current);
  }, []);

  const handlePointerDown = (e) => {
    if (phaseRef.current === "revealed") return;
    clearInterval(idleTimerRef.current);
    if (completeRafRef.current) { cancelAnimationFrame(completeRafRef.current); completeRafRef.current = null; }
    startYRef.current = e.clientY;
    syncPhase("opening");
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (phaseRef.current !== "opening") return;
    const dy = Math.max(0, startYRef.current - e.clientY); // upward drag
    const frame = Math.min(OPEN_COUNT - 1, Math.floor((dy / DRAG_PX_FULL) * OPEN_COUNT));
    syncOpenFrame(frame);
  };

  const handlePointerUp = () => {
    if (phaseRef.current !== "opening") return;
    if (openFrameRef.current >= OPEN_COUNT - 1) {
      syncPhase("revealed");
    } else if (openFrameRef.current >= OPEN_COUNT * 0.5) {
      runComplete();
    } else {
      runReverse();
    }
  };

  const frameSrc =
    phase === "idle"
      ? `/images/cardfront/card1idle/chest_wood/New_idle_chest_wood_${pad(idleFrame)}.png`
      : phase !== "revealed"
      ? `/images/cardfront/card1open/new_open_chest_wood/NEW_open_chest_wood_${pad(21 + openFrame)}.png`
      : null;

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 999999,
        background: "rgba(0,0,0,0.88)",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 24,
      }}
    >
      {phase !== "revealed" ? (
        <>
          <img
            src={frameSrc}
            alt="chest"
            draggable={false}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            style={{
              width: 320, imageRendering: "pixelated",
              cursor: "grab", userSelect: "none", touchAction: "none",
              filter: "drop-shadow(0 0 24px rgba(255,210,80,0.5))",
            }}
          />
          <div style={{
            fontFamily: "Cartoonist", fontSize: 20, color: "#ffd700",
            textShadow: "1px 1px 0 #000",
            animation: "swipeHintBob 1.6s ease-in-out infinite",
          }}>
            ↑ SWIPE UP TO OPEN ↑
          </div>
          <style>{`@keyframes swipeHintBob { 0%,100%{opacity:.85;transform:translateY(0)} 50%{opacity:1;transform:translateY(-5px)} }`}</style>
        </>
      ) : (
        <>
          <div style={{ fontFamily: "GROBOLD, Cartoonist, sans-serif", fontSize: 26, color: "#ffd700", textShadow: "2px 2px 0 #000" }}>
            You got seeds!
          </div>
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap", justifyContent: "center" }}>
            {revealedSeeds.map((seedId, i) => (
              <ItemSmallView key={i} itemId={seedId} count={1} />
            ))}
          </div>
          <div
            onClick={onClose}
            style={{
              marginTop: 8, fontFamily: "GROBOLD, Cartoonist, sans-serif", fontSize: 18,
              color: "#3a2010", background: "linear-gradient(135deg,#f5c842,#e0a800)",
              border: "3px solid #a67c00", borderRadius: 12,
              padding: "12px 40px", cursor: "pointer", userSelect: "none",
            }}
          >
            Collect!
          </div>
        </>
      )}
    </div>
  );
};

export default WoodChestOpenDialog;
