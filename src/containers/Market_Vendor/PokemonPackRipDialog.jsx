import React, { useState, useRef, useEffect } from "react";
import BaseButton from "../../components/buttons/BaseButton";
import { ALL_ITEMS, IMAGE_URL_CROP } from "../../constants/item_data";
import { ONE_SEED_HEIGHT, ONE_SEED_WIDTH } from "../../constants/item_seed";

const PokemonPackRipDialog = ({ rollingInfo, onClose, onBack, onBuyAgain }) => {
  const [ripProgress, setRipProgress] = useState(0);
  const [isRipped, setIsRipped] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [revealedIndex, setRevealedIndex] = useState(0);
  const isDragging = useRef(false);
  const startX = useRef(0);

  const isReadyToRip = rollingInfo.isComplete && !rollingInfo.isFallback;

  const handlePointerDown = (e) => {
    if (!isReadyToRip || isRipped) return;
    isDragging.current = true;
    let clientX = e.clientX;
    if (clientX === undefined && e.touches) clientX = e.touches[0].clientX;
    startX.current = clientX;
  };

  const handlePointerMove = (e) => {
    if (!isDragging.current || isRipped) return;
    let currentX = e.clientX;
    if (currentX === undefined && e.touches) currentX = e.touches[0].clientX;
    if (currentX === undefined) return;
    
    const diff = currentX - startX.current;
    
    // Calculate swipe distance to rip (Left to Right)
    const progress = Math.max(0, Math.min(100, (diff / 150) * 100));
    setRipProgress(progress);

    if (progress >= 100) {
      setIsRipped(true);
      isDragging.current = false;
      setTimeout(() => setShowSummary(true), 1500); // 1.5s for explosion animation
    }
  };

  const handlePointerUp = () => {
    if (isDragging.current) {
      isDragging.current = false;
      if (ripProgress < 100) {
        setRipProgress(0); // Snap back if they let go too early
      }
    }
  };

  useEffect(() => {
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("touchend", handlePointerUp);
    window.addEventListener("touchmove", handlePointerMove);
    return () => {
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("touchend", handlePointerUp);
      window.removeEventListener("touchmove", handlePointerMove);
    };
  }, [ripProgress, isReadyToRip, isRipped]);

  const handleNextCard = () => {
    if (revealedIndex < rollingInfo.revealedSeeds.length) {
      setRevealedIndex(prev => prev + 1);
    }
  };

  const revealedSeeds = rollingInfo.revealedSeeds || [];

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.95)', zIndex: 100000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace' }}>
      
      {!showSummary ? (
        <div style={{ position: 'relative', width: '250px', height: '350px', userSelect: 'none', touchAction: 'none', cursor: isReadyToRip ? 'grab' : 'wait' }} onPointerDown={handlePointerDown} onTouchStart={handlePointerDown}>
          {!isReadyToRip && (
            <div style={{ position: 'absolute', top: '-60px', left: '-50px', right: '-50px', textAlign: 'center', color: '#00bfff', fontSize: '16px', fontWeight: 'bold', animation: 'pulse 1.5s infinite' }}>
              Receiving Oracle Randomness...
              <style>{`@keyframes pulse { 0% { opacity: 0.6; } 50% { opacity: 1; } 100% { opacity: 0.6; } }`}</style>
            </div>
          )}
          {isReadyToRip && !isRipped && (
            <div style={{ position: 'absolute', top: '-40px', left: 0, width: '100%', textAlign: 'center', color: '#00ff41', fontSize: '18px', fontWeight: 'bold', animation: 'bounce 1s infinite' }}>
              Swipe to Rip! --&gt;
              <style>{`@keyframes bounce { 0%, 100% { transform: translateX(0); } 50% { transform: translateX(10px); } }`}</style>
            </div>
          )}

          {/* Pack Background */}
          <div style={{ position: 'absolute', width: '100%', height: '100%', backgroundColor: '#a67c52', borderRadius: '12px', border: '4px solid #5a402a', boxShadow: '0 10px 25px rgba(0,0,0,0.8)', overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <img src="/images/items/seeds.png" alt="Seeds" style={{ width: '100px', filter: 'drop-shadow(0px 4px 4px rgba(0,0,0,0.5))' }} />
            <div style={{ textAlign: 'center', color: '#fff', fontSize: '28px', fontWeight: 'bold', marginTop: '20px', textShadow: '2px 2px 0 #000' }}>SEED PACK</div>
            <div style={{ textAlign: 'center', color: '#ffea00', marginTop: '10px', fontSize: '16px', fontWeight: 'bold' }}>Tier {rollingInfo.id}</div>
          </div>

          {/* Magic Glow escaping the torn pack */}
          {isReadyToRip && ripProgress > 0 && (
            <div style={{
              position: 'absolute', top: 0, left: 0,
              width: `${ripProgress}%`, height: '25%',
              boxShadow: '0 0 50px 20px rgba(255, 234, 0, 1), inset 0 0 20px 10px rgba(255, 255, 255, 1)',
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              zIndex: 9,
              borderTopLeftRadius: '12px',
              pointerEvents: 'none',
              opacity: ripProgress / 100
            }} />
          )}

          {/* Foil Rip Effect */}
          {isReadyToRip && (
            <div style={{ 
              position: 'absolute', top: 0, left: 0, width: '100%', height: '25%', backgroundColor: '#8a623e', borderBottom: '3px dashed rgba(255,255,255,0.5)',
              transformOrigin: 'top right',
              transform: `rotate(${ripProgress * 0.5}deg) translateX(${ripProgress * 1.5}px)`,
              opacity: 1 - (ripProgress / 100),
              zIndex: 10
            }} />
          )}

          {/* Seeds Bursting Out Animation */}
          {isRipped && revealedSeeds.map((seedId, idx) => {
             const angle = (Math.PI * 2 * idx) / revealedSeeds.length;
             const tx = Math.cos(angle) * 200;
             const ty = Math.sin(angle) * 200 - 100;
             return (
               <div key={idx} style={{
                 position: 'absolute', top: '50%', left: '50%', width: '60px', height: '60px', marginLeft: '-30px', marginTop: '-30px', backgroundColor: '#1f1610', borderRadius: '8px', border: '2px solid #00ff41', animation: `burstOut 1s forwards cubic-bezier(0.175, 0.885, 0.32, 1.275)`, animationDelay: `${idx * 0.1}s`, opacity: 0, zIndex: 5, '--tx': `${tx}px`, '--ty': `${ty}px`
               }}>
                 <style>{`@keyframes burstOut { 0% { transform: translate(0, 0) scale(0.5); opacity: 1; } 100% { transform: translate(var(--tx), var(--ty)) scale(1.5) rotate(720deg); opacity: 0; } }`}</style>
               </div>
             );
          })}
        </div>
      ) : (
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }} onClick={handleNextCard}>
          {revealedIndex < revealedSeeds.length ? (
             <div style={{ textAlign: 'center', animation: 'popIn 0.3s ease-out' }}>
               <style>{`@keyframes popIn { from { transform: scale(0.5); opacity: 0; } to { transform: scale(1); opacity: 1; } }`}</style>
               <h2 style={{ color: '#fff', marginBottom: '30px' }}>Card {revealedIndex + 1} of {revealedSeeds.length}</h2>
               <div style={{ width: '300px', height: '450px', backgroundColor: '#1f1610', border: '6px solid #a67c52', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px', boxShadow: '0 0 30px rgba(0, 255, 65, 0.4)', cursor: 'pointer' }}>
                  <div style={{ alignSelf: 'flex-start', color: '#ffea00', fontWeight: 'bold', fontSize: '20px', marginBottom: '20px' }}>{ALL_ITEMS[revealedSeeds[revealedIndex]]?.label || "Mysterious Seed"}</div>
                  <div style={{ width: '200px', height: '200px', backgroundColor: '#000', borderRadius: '12px', border: '4px solid #5a402a', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '30px', overflow: 'hidden' }}>
                    {ALL_ITEMS[revealedSeeds[revealedIndex]]?.image ? ( ALL_ITEMS[revealedSeeds[revealedIndex]].image.includes('crop') ? ( <div style={{ width: `${ONE_SEED_WIDTH}px`, height: `${ONE_SEED_HEIGHT}px`, backgroundImage: `url(${ALL_ITEMS[revealedSeeds[revealedIndex]].image})`, backgroundPosition: `-${5 * ONE_SEED_WIDTH}px -${(ALL_ITEMS[revealedSeeds[revealedIndex]].pos || 0) * ONE_SEED_HEIGHT}px`, transform: 'scale(3)', backgroundRepeat: 'no-repeat' }} /> ) : ALL_ITEMS[revealedSeeds[revealedIndex]].image.includes('seeds') ? ( <div className="item-icon item-icon-seeds" style={{ transform: 'scale(3)', backgroundPositionY: ALL_ITEMS[revealedSeeds[revealedIndex]].pos ? `-${ALL_ITEMS[revealedSeeds[revealedIndex]].pos * ONE_SEED_HEIGHT * 0.308}px` : 0 }}></div> ) : ( <img src={ALL_ITEMS[revealedSeeds[revealedIndex]].image} alt="Seed" style={{ width: '80%', height: '80%', objectFit: 'contain' }} /> ) ) : ( <span style={{ fontSize: '40px' }}>?</span> )}
                    
                    {/* Produce Preview Badge */}
                    <div style={{ position: 'absolute', bottom: '10px', right: '10px', width: '50px', height: '50px', backgroundColor: 'rgba(0,0,0,0.8)', borderRadius: '50%', border: '2px solid #00ff41', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 4px 8px rgba(0,0,0,0.5)' }} title="Grows into this produce!">
                      <div style={{ width: `${ONE_SEED_WIDTH}px`, height: `${ONE_SEED_HEIGHT}px`, backgroundImage: `url(${IMAGE_URL_CROP || '/images/farm/crop.png'})`, backgroundPosition: `-${5 * ONE_SEED_WIDTH}px -${(ALL_ITEMS[revealedSeeds[revealedIndex]]?.pos || 0) * ONE_SEED_HEIGHT}px`, transform: 'scale(1.3)', backgroundRepeat: 'no-repeat' }} />
                    </div>
                  </div>
                  <div style={{ width: '100%', height: '2px', backgroundColor: '#5a402a', marginBottom: '20px' }} />
                  <p style={{ color: '#aaa', fontSize: '14px', textAlign: 'center', fontStyle: 'italic', padding: '0 10px', lineHeight: '1.5' }}>{ALL_ITEMS[revealedSeeds[revealedIndex]]?.description || "A powerful seed ready to be planted on your farm. Nurture it to see what grows!"}</p>
               </div>
               <p style={{ color: '#00ff41', marginTop: '30px', animation: 'pulse 1s infinite' }}>Click anywhere for next card...</p>
             </div>
          ) : (
             <div style={{ backgroundColor: '#2c221a', border: '4px solid #a67c52', borderRadius: '16px', padding: '30px', textAlign: 'center', width: '80%', maxWidth: '600px', animation: 'popIn 0.3s ease-out' }}>
               <h2 style={{ color: '#00ff41', fontSize: '32px', margin: '0 0 20px 0', textShadow: '2px 2px 0 #000' }}>ALL SEEDS REVEALED!</h2>
               <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', justifyContent: 'center', marginBottom: '30px', maxHeight: '400px', overflowY: 'auto', padding: '10px' }}>
                 {revealedSeeds.map((seedId, idx) => {
                   const itemData = ALL_ITEMS[seedId] || { label: "Unknown" };
                   return ( <div key={idx} style={{ width: '100px', backgroundColor: 'rgba(0,0,0,0.6)', border: '2px solid #5a402a', borderRadius: '8px', padding: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}> <div style={{ width: '40px', height: '40px', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '5px' }}> {itemData.image && itemData.image.includes('crop') ? ( <div style={{ width: `${ONE_SEED_WIDTH}px`, height: `${ONE_SEED_HEIGHT}px`, backgroundImage: `url(${itemData.image})`, backgroundPosition: `-${5 * ONE_SEED_WIDTH}px -${(itemData.pos || 0) * ONE_SEED_HEIGHT}px`, transform: 'scale(0.8)', backgroundRepeat: 'no-repeat' }} /> ) : itemData.image && itemData.image.includes('seeds') ? ( <div className="item-icon item-icon-seeds" style={{ transform: 'scale(0.8)', backgroundPositionY: itemData.pos ? `-${itemData.pos * ONE_SEED_HEIGHT * 0.308}px` : 0 }}></div> ) : ( <img src={itemData.image} alt={itemData.label} style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> )} </div> <div style={{ position: 'absolute', top: '5px', right: '5px', width: '20px', height: '20px', backgroundColor: 'rgba(0,0,0,0.8)', borderRadius: '50%', border: '1px solid #00ff41', display: 'flex', justifyContent: 'center', alignItems: 'center' }}> <div style={{ width: `${ONE_SEED_WIDTH}px`, height: `${ONE_SEED_HEIGHT}px`, backgroundImage: `url(${IMAGE_URL_CROP || '/images/farm/crop.png'})`, backgroundPosition: `-${5 * ONE_SEED_WIDTH}px -${(itemData.pos || 0) * ONE_SEED_HEIGHT}px`, transform: 'scale(0.5)', backgroundRepeat: 'no-repeat' }} /> </div> <div style={{ color: '#fff', fontSize: '10px', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>{itemData.label}</div> </div> );
                 })}
               </div>
               <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }} onClick={(e) => e.stopPropagation()}>
                 <BaseButton label="Done" onClick={onClose} />
                 <BaseButton label="Buy Another" onClick={onBuyAgain} />
               </div>
             </div>
          )}
        </div>
      )}
    </div>
  );
};
export default PokemonPackRipDialog;