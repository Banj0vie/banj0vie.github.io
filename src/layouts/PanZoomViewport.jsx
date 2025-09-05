import React, { useCallback, useEffect, useRef, useState } from "react";

export default function PanZoomViewport() {
  const buttonAnimCss = `
    @keyframes mapFloat { 0% { transform: translateY(0); } 50% { transform: translateY(-4px); } 100% { transform: translateY(0); } }
    .map-btn { animation: mapFloat 1.8s ease-in-out infinite; will-change: transform; }
  `;
  const containerRef = useRef(null);

  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);
  const [scale, setScale] = useState(1);
  const [activeModal, setActiveModal] = useState(null);

  const panState = useRef({
    active: false,
    startX: 0,
    startY: 0,
    startTx: 0,
    startTy: 0,
  });

  // Hotspot coordinates in image pixels (top/left anchors)
  const hotspots = [
    { id: 'gold', label: 'GOLD', x: 210, y: 110, delay: 0 },
    { id: 'angler', label: 'ANGLER', x: 70, y: 260, delay: 0.2 },
    { id: 'gold-chest', label: 'GOLD CHEST', x: 500, y: 160, delay: 0.4 },
    { id: 'gardener', label: 'GARDENER', x: 720, y: 100, delay: 0.6 },
    { id: 'referrals', label: 'REFERRALS', x: 600, y: 240, delay: 0.8 },
  ];

  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

  const setScaleAroundPoint = useCallback(
    (nextScale, clientX, clientY) => {
      if (activeModal) return; // disable zoom when modal open
      const el = containerRef.current;
      if (!el) {
        setScale(nextScale);
        return;
      }
      const rect = el.getBoundingClientRect();
      const px = clientX - rect.left;
      const py = clientY - rect.top;

      const s = scale;
      const sPrime = nextScale;
      const newTx = px - (sPrime / s) * (px - tx);
      const newTy = py - (sPrime / s) * (py - ty);

      setTx(newTx);
      setTy(newTy);
      setScale(sPrime);
    },
    [scale, tx, ty, activeModal]
  );

  const onWheel = (e) => {
    if (activeModal) return; // block scroll zoom over backdrop too
    e.preventDefault();
    const zoomIntensity = 0.0012;
    const factor = Math.exp(-e.deltaY * zoomIntensity);
    const desired = clamp(scale * factor, 0.2, 6);
    setScaleAroundPoint(desired, e.clientX, e.clientY);
  };

  const onPointerDown = (e) => {
    if (activeModal) return; // ignore panning when modal open
    // If starting on a hotspot button, let the click go through
    const target = e.target;
    if (target && target.closest && target.closest('[data-hotspot="true"]')) {
      return;
    }
    // Only start panning if click is on the pan surface (image/layer)
    if (!(target && target.closest && target.closest('[data-pan-surface="true"]'))) {
      return;
    }
    e.preventDefault();
    if (e.button !== 0 && e.pointerType === "mouse") return;
    e.currentTarget?.setPointerCapture?.(e.pointerId);
    panState.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      startTx: tx,
      startTy: ty,
    };
  };

  const onPointerMove = (e) => {
    if (activeModal) return;
    if (!panState.current.active) return;
    const dx = e.clientX - panState.current.startX;
    const dy = e.clientY - panState.current.startY;
    setTx(panState.current.startTx + dx);
    setTy(panState.current.startTy + dy);
  };

  const endPan = useCallback(() => {
    panState.current.active = false;
  }, []);

  const onDoubleClick = () => {
    if (activeModal) return;
    setTx(0);
    setTy(0);
    setScale(1);
  };

  useEffect(() => {
    const handleUp = () => endPan();
    const handleEsc = (e) => { if (e.key === 'Escape') setActiveModal(null); };
    window.addEventListener("pointerup", handleUp);
    window.addEventListener("pointercancel", handleUp);
    window.addEventListener("keydown", handleEsc);
    return () => {
      window.removeEventListener("pointerup", handleUp);
      window.removeEventListener("pointercancel", handleUp);
      window.removeEventListener("keydown", handleEsc);
    };
  }, [endPan]);

  const uiStyles = {
    root: { position: 'fixed', inset: 0, width: '100vw', height: '100vh', userSelect: 'none', background: '#fff' },
    toolbar: { position: 'fixed', top: 8, left: 8, display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.9)', padding: 6, borderRadius: 10, border: '1px solid #e5e7eb', zIndex: 10 },
    hint: { fontSize: 12, color: '#4b5563', marginRight: 8 },
    btn: { padding: '4px 8px', borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12, cursor: 'pointer', background: '#fff' },
    percent: { minWidth: 64, textAlign: 'center', fontSize: 12 },
    viewport: { position: 'fixed', inset: 0, overflow: 'hidden', cursor: 'grab' },
    layer: { position: 'absolute', top: 0, left: 0, willChange: 'transform', transformOrigin: '0 0' },
    hotspotBtn: { position: 'absolute', padding: '4px 8px', background: '#f97316', color: '#fff', fontSize: 12, borderRadius: 6, cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.25)' },
    backdrop: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 20 },
    modal: { width: 640, maxWidth: '90vw', background: '#2b2b2b', color: '#fff', borderRadius: 12, border: '2px solid #6b7280', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', padding: 16, position: 'relative' },
    close: { position: 'absolute', top: 8, right: 8, background: '#ef4444', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 10px', cursor: 'pointer' },
    modalHeader: { fontWeight: 700, textAlign: 'center', marginBottom: 12, fontSize: 18 },
    modalBody: { background: '#3f3f46', borderRadius: 8, padding: 12, minHeight: 160 },
  };

  return (
    <div style={uiStyles.root}>
      <style>{buttonAnimCss}</style>

      <div style={uiStyles.toolbar}>
        <span style={uiStyles.hint}>Drag to pan • Scroll to zoom • Double-click to reset</span>
        <button style={uiStyles.btn} onClick={() => setScale(clamp(scale * 0.9, 0.2, 6))}>−</button>
        <div style={uiStyles.percent}>{Math.round(scale * 100)}%</div>
        <button style={uiStyles.btn} onClick={() => setScale(clamp(scale * 1.1, 0.2, 6))}>+</button>
        <button style={uiStyles.btn} onClick={() => { setTx(0); setTy(0); setScale(1); }}>Reset</button>
      </div>

      <div
        ref={containerRef}
        style={{ ...uiStyles.viewport, touchAction: 'none' }}
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onDoubleClick={onDoubleClick}
      >
        <div
          data-pan-surface="true"
          style={{
            ...uiStyles.layer,
            transform: `translate(${tx}px, ${ty}px) scale(${scale})`,
          }}
        >
          <img src="/house_new.png" alt="House Scene" draggable={false} onDragStart={(e) => e.preventDefault()} style={{ display: 'block', userSelect: 'none', pointerEvents: 'none' }} />

          {hotspots.map((h) => (
            <button
              key={h.id}
              data-hotspot="true"
              className="map-btn"
              style={{
                ...uiStyles.hotspotBtn,
                left: h.x,
                top: h.y,
                animationDelay: `${h.delay}s`,
              }}
              onClick={() => setActiveModal(h)}
            >
              {h.label}
            </button>
          ))}
        </div>
      </div>

      {activeModal && (
        <div style={uiStyles.backdrop} onClick={() => setActiveModal(null)}>
          <div style={uiStyles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={uiStyles.modalHeader}>{activeModal.label}</div>
            <button style={uiStyles.close} onClick={() => setActiveModal(null)}>X</button>
            <div style={uiStyles.modalBody}>
              {/* Replace with real content per hotspot */}
              <div>Items Dropped</div>
              <div style={{ marginTop: 12 }}>Chest Status</div>
              <div style={{ marginTop: 12 }}>Next Chest In</div>
              <div style={{ marginTop: 12 }}>Already Claimed</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 