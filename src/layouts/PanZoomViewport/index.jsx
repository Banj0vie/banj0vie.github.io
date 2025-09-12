import React, { useCallback, useEffect, useRef, useState } from "react";
import "./style.css";
import TooltipButton from "../../components/buttons/TooltipButton";
import GameMenu from "../GameMenu";
import { isWalletConnected } from "../../utils/basic";
import AuthPage from "../AuthPage";

const defaultHotspots = [
  { id: "gold", label: "GOLD", x: 210, y: 110, delay: 0 },
  { id: "angler", label: "ANGLER", x: 70, y: 260, delay: 0.2 },
  { id: "gold-chest", label: "GOLD CHEST", x: 500, y: 160, delay: 0.4 },
  { id: "gardener", label: "GARDENER", x: 720, y: 100, delay: 0.6 },
  { id: "referrals", label: "REFERRALS", x: 600, y: 240, delay: 0.8 },
];

const PanZoomViewport = ({
  backgroundSrc,
  hotspots = defaultHotspots,
  dialogs = [],
  width,
  height,
  hideMenu = false,
  children,
}) => {
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

  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

  const setScaleAroundPoint = useCallback(
    (nextScale, clientX, clientY) => {
      if (activeModal) return;
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
    if (activeModal) return;
    e.preventDefault();
    const zoomIntensity = 0.0012;
    const factor = Math.exp(-e.deltaY * zoomIntensity);
    const desired = clamp(scale * factor, 0.2, 6);
    setScaleAroundPoint(desired, e.clientX, e.clientY);
  };

  const onPointerDown = (e) => {
    if (activeModal) return;
    const target = e.target;
    if (target && target.closest && target.closest('[data-hotspot="true"]')) {
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
    const handleEsc = (e) => {
      if (e.key === "Escape") setActiveModal(null);
    };
    window.addEventListener("pointerup", handleUp);
    window.addEventListener("pointercancel", handleUp);
    window.addEventListener("keydown", handleEsc);
    return () => {
      window.removeEventListener("pointerup", handleUp);
      window.removeEventListener("pointercancel", handleUp);
      window.removeEventListener("keydown", handleEsc);
    };
  }, [endPan]);

  const normalizeSize = (v) => {
    if (v === undefined || v === null || v === false || v === true)
      return undefined;
    return typeof v === "number" ? `${v}px` : v;
  };

  const layerInlineStyle = {
    transform: `translate(${tx}px, ${ty}px) scale(${scale})`,
    ...(normalizeSize(width) ? { width: normalizeSize(width) } : {}),
    ...(normalizeSize(height) ? { height: normalizeSize(height) } : {}),
  };

  return isWalletConnected() ? (
    <div className="panzoom-root">
      {!hideMenu && <GameMenu />}
      <div
        ref={containerRef}
        className="panzoom-viewport"
        style={{ touchAction: "none" }}
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onDoubleClick={onDoubleClick}
      >
        <div className="panzoom-layer" style={layerInlineStyle}>
          {backgroundSrc && (
            <img
              className="img-scene"
              src={backgroundSrc}
              alt="Scene"
              draggable={false}
              onDragStart={(e) => e.preventDefault()}
            />
          )}

          {hotspots.map((h) => (
            <TooltipButton
              key={h.id}
              data-hotspot="true"
              className="map-btn"
              label={h.label}
              style={{ left: h.x, top: h.y, animationDelay: `${h.delay}s` }}
              onClick={() =>
                setActiveModal(dialogs.find((d) => d.id === h.id) || dialogs[0])
              }
            />
          ))}
          <div className="panzoom-children">{children}</div>
        </div>
      </div>
      {activeModal && (
        <activeModal.component
          onClose={() => setActiveModal(null)}
          label={activeModal.label}
          header={activeModal.header}
          actions={activeModal.actions}
        />
      )}
    </div>
  ) : (
    <AuthPage></AuthPage>
  );
};

export default PanZoomViewport;
