import React, { useState, useEffect, useRef } from 'react';
import './style.css';
import BoostNFTSelector from '../BoostNFTSelector';
import CardImgView from '../../../components/boxes/CardImgView';
import { ID_SEEDS } from '../../../constants/app_ids';
import { ALL_ITEMS } from '../../../constants/item_data';

const NFTBox = ({ avatar, loading, slotIndex, onAvatarChange, allAvatars = [] }) => {
    const [nftData, setNftData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showSelector, setShowSelector] = useState(false);
    const [showLevelStats, setShowLevelStats] = useState(false);
    const [activeDetailPanel, setActiveDetailPanel] = useState(null);
    const hoverAudioRef = useRef(null);
    const clickAudioRef = useRef(null);

    useEffect(() => {
        const fetchNFTData = async () => {
            if (!avatar || avatar.isEmpty || loading) {
                setIsLoading(false);
                return;
            }

            try {
                setIsLoading(true);

                // Instead of fetching from blockchain, read directly from the avatar object passed down
                const metadata = avatar.nft;
                
                if (metadata && metadata.name) {
                    setNftData({
                        tokenId: avatar.tokenId,
                        name: metadata.name,
                        image: metadata.image,
                        boost: (metadata.boostPercentage || 0).toFixed(2)
                    });
                } else {
                    // Fallback data
                    setNftData({
                        tokenId: avatar.tokenId,
                        name: `Character #${avatar.tokenId}`,
                        boost: '0.00'
                    });
                }
            } catch (error) {
                console.error('Failed to fetch NFT data:', error);
                // Fallback data
                setNftData({
                    tokenId: avatar.tokenId,
                    name: `Character #${avatar.tokenId}`,
                    boost: '0.00'
                });
            } finally {
                setIsLoading(false);
            }
        };

        fetchNFTData();
    }, [avatar, loading]);

    useEffect(() => {
        if (!hoverAudioRef.current) {
            hoverAudioRef.current = new Audio("/sounds/ButtonHover.wav");
            hoverAudioRef.current.preload = "auto";
        }
        if (!clickAudioRef.current) {
            clickAudioRef.current = new Audio("/sounds/ButtonClick.wav");
            clickAudioRef.current.preload = "auto";
        }
    }, []);

    const handleClick = () => {
        const audio = clickAudioRef.current;
        if (audio) {
            audio.currentTime = 0;
            audio.play().catch(() => {});
        }
        setShowSelector(true);
    };

    const handleNFTSelect = (selectedNFT) => {
        // Update the avatar data
        setNftData({
            tokenId: selectedNFT.tokenId,
            name: selectedNFT.name,
            image: selectedNFT.image,
            boost: selectedNFT.boostPercentage.toFixed(2)
        });

        // Notify parent component
        if (onAvatarChange) {
            onAvatarChange(slotIndex, selectedNFT);
        }
    };

    if (loading || isLoading) {
        return <div className="nft-box">
            <CardImgView className="nft-card">
                <div className="loading-placeholder">
                    <div className="loading-spinner"></div>
                </div>
            </CardImgView>
            <div className="name">
                Loading...
            </div>
        </div>
    }

    return (
        <>
            <div
                className="nft-box clickable"
                onClick={handleClick}
                onMouseEnter={() => {
                    const audio = hoverAudioRef.current;
                    if (!audio) return;
                    audio.currentTime = 0;
                    audio.play().catch(() => {});
                }}
            >
                <CardImgView className="nft-card">
                    {!avatar || avatar.isEmpty ? (
                        <img src="/images/avatars/avatar-left-placeholder.png" alt="empty slot"></img>
                    ) : (
                        <img
                            src={nftData?.image || `/images/avatars/character-${avatar.tokenId}.png`}
                            alt={`Character ${avatar.tokenId}`}
                            onError={(e) => {
                                // Fallback to placeholder if specific character image doesn't exist
                                e.target.src = "/images/avatars/avatar-left-placeholder.png";
                            }}
                        />
                    )}
                </CardImgView>
                <div className="name">
                    {!avatar || avatar.isEmpty ? 'EMPTY' : (nftData ? nftData.name : `Character #${avatar.tokenId}`)}
                </div>
            </div>

            {(!avatar || avatar.isEmpty) ? null : (
               <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginTop: '8px', fontSize: '12px', fontFamily: 'monospace', fontWeight: 'bold' }}>
                 <div 
                   style={{ color: '#00bfff', cursor: 'pointer', transition: 'color 0.2s' }}
                   onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                   onMouseLeave={e => e.currentTarget.style.color = '#00bfff'}
                   onClick={(e) => {
                       e.stopPropagation();
                       setShowLevelStats(true);
                   }}
                 >
                   [LEVEL]
                 </div>
                 <div 
                   style={{ color: '#ff4444', cursor: 'pointer', transition: 'color 0.2s' }}
                   onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                   onMouseLeave={e => e.currentTarget.style.color = '#ff4444'}
                   onClick={(e) => {
                       e.stopPropagation();
                       const sandboxAvatars = JSON.parse(localStorage.getItem('sandbox_avatars') || '{}');
                       delete sandboxAvatars[slotIndex];
                       localStorage.setItem('sandbox_avatars', JSON.stringify(sandboxAvatars));
                       setNftData(null);
                       if (onAvatarChange) onAvatarChange(slotIndex, null);
                       window.dispatchEvent(new CustomEvent('avatarsUpdated'));
                   }}
                 >
                   [UNEQUIP]
                 </div>
               </div>
            )}

            {showLevelStats && (
                <div 
                  style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 100000, display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'default' }}
                  onClick={(e) => { e.stopPropagation(); setShowLevelStats(false); setActiveDetailPanel(null); }}
                >
                  <div 
                    style={{ backgroundColor: '#2c221a', border: '4px solid #a67c52', borderRadius: '16px', padding: '30px', minWidth: '320px', color: '#fff', fontFamily: 'monospace', boxShadow: '0 10px 25px rgba(0,0,0,0.8)', animation: 'popIn 0.3s ease-out' }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <style>{`@keyframes popIn { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }`}</style>
                    
                    {!activeDetailPanel ? (
                      <>
                        <h2 style={{ color: '#ffea00', margin: '0 0 20px 0', textAlign: 'center', fontSize: '24px', borderBottom: '2px solid #5a402a', paddingBottom: '10px' }}>{nftData?.name || "Worker"} Stats</h2>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '18px' }}>
                          <div onClick={() => setActiveDetailPanel('worker')} style={{ display: 'flex', justifyContent: 'space-between', backgroundColor: 'rgba(0,0,0,0.3)', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', transition: 'background-color 0.2s' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.3)'}><span style={{ color: '#ccc' }}>Worker Level:</span> <span style={{ color: '#00ff41', fontWeight: 'bold' }}>1 ℹ️</span></div>
                          <div onClick={() => setActiveDetailPanel('farming')} style={{ display: 'flex', justifyContent: 'space-between', backgroundColor: 'rgba(0,0,0,0.3)', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', transition: 'background-color 0.2s' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.3)'}><span style={{ color: '#ccc' }}>Farming Level:</span> <span style={{ color: '#00ff41', fontWeight: 'bold' }}>1 ℹ️</span></div>
                          <div onClick={() => setActiveDetailPanel('fishing')} style={{ display: 'flex', justifyContent: 'space-between', backgroundColor: 'rgba(0,0,0,0.3)', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', transition: 'background-color 0.2s' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.3)'}><span style={{ color: '#ccc' }}>Fishing Level:</span> <span style={{ color: '#00ff41', fontWeight: 'bold' }}>1 ℹ️</span></div>
                          <div onClick={() => setActiveDetailPanel('mining')} style={{ display: 'flex', justifyContent: 'space-between', backgroundColor: 'rgba(0,0,0,0.3)', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', transition: 'background-color 0.2s' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.3)'}><span style={{ color: '#ccc' }}>Mining Level:</span> <span style={{ color: '#00ff41', fontWeight: 'bold' }}>1 ℹ️</span></div>
                          <div onClick={() => setActiveDetailPanel('lumber')} style={{ display: 'flex', justifyContent: 'space-between', backgroundColor: 'rgba(0,0,0,0.3)', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', transition: 'background-color 0.2s' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.3)'}><span style={{ color: '#ccc' }}>Lumber Level:</span> <span style={{ color: '#00ff41', fontWeight: 'bold' }}>1 ℹ️</span></div>
                          <div onClick={() => setActiveDetailPanel('crafting')} style={{ display: 'flex', justifyContent: 'space-between', backgroundColor: 'rgba(0,0,0,0.3)', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', transition: 'background-color 0.2s' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.3)'}><span style={{ color: '#ccc' }}>Crafting Level:</span> <span style={{ color: '#00ff41', fontWeight: 'bold' }}>1 ℹ️</span></div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '25px' }}>
                          <button 
                            onClick={() => setShowLevelStats(false)}
                            style={{ padding: '10px 20px', backgroundColor: '#5a402a', color: '#fff', border: '1px solid #a67c52', borderRadius: '8px', cursor: 'pointer', fontFamily: 'monospace', fontWeight: 'bold', fontSize: '16px', transition: 'background-color 0.2s' }}
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#7a5a3a'}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#5a402a'}
                          >
                            CLOSE
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        {activeDetailPanel === 'worker' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxWidth: '350px' }}>
                            <h2 style={{ color: '#00ff41', margin: '0 0 10px 0', borderBottom: '1px solid #5a402a', paddingBottom: '10px' }}>Worker Level - 1</h2>
                            <p style={{ margin: 0, lineHeight: '1.5' }}>A Level 1 Worker Bee provides a base {nftData?.boost || 5}% Harvest Bonus and can assist in basic tasks around the farm.</p>
                            
                            <div style={{ backgroundColor: 'rgba(0,0,0,0.3)', padding: '15px', borderRadius: '8px', border: '1px solid #5a402a' }}>
                              <h4 style={{ color: '#ffea00', margin: '0 0 10px 0' }}>Requirements for Level 2 (Max Lvl 10):</h4>
                              <ul style={{ margin: 0, paddingLeft: '20px', color: '#ccc', lineHeight: '1.8', textAlign: 'left' }}>
                                <li>20 Wood Logs</li>
                                <li>10 Stones</li>
                                <li>10 Pumpkin Seeds</li>
                              </ul>
                            </div>
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
                              <button 
                                onClick={() => {
                                  const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
                                  const pumpkinSeedId = ID_SEEDS?.PUMPKIN || Object.values(ALL_ITEMS).find(i => i?.label?.toLowerCase().includes('pumpkin seed'))?.id || 131846;
                                  
                                  const woodCount = sandboxLoot[9993] || 0;
                                  const stoneCount = sandboxLoot[9994] || 0;
                                  const pumpkinSeedCount = sandboxLoot[pumpkinSeedId] || 0;

                                  if (woodCount >= 20 && stoneCount >= 10 && pumpkinSeedCount >= 10) {
                                    sandboxLoot[9993] -= 20;
                                    sandboxLoot[9994] -= 10;
                                    sandboxLoot[pumpkinSeedId] -= 10;
                                    localStorage.setItem('sandbox_loot', JSON.stringify(sandboxLoot));
                                    alert("Worker successfully leveled up to Level 2! (More logic coming soon)");
                                  } else {
                                    alert(`Not enough materials! You have: ${woodCount}/20 Wood, ${stoneCount}/10 Stone, ${pumpkinSeedCount}/10 Pumpkin Seeds.`);
                                  }
                                }}
                                style={{ padding: '10px 20px', backgroundColor: '#00ff41', color: '#000', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'monospace', fontWeight: 'bold' }}
                              >
                                LEVEL UP
                              </button>
                              <button 
                                onClick={() => setActiveDetailPanel(null)}
                                style={{ padding: '10px 20px', backgroundColor: '#5a402a', color: '#fff', border: '1px solid #a67c52', borderRadius: '8px', cursor: 'pointer', fontFamily: 'monospace', fontWeight: 'bold' }}
                              >
                                BACK
                              </button>
                            </div>
                          </div>
                        )}
                        
                        {activeDetailPanel === 'fishing' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxWidth: '350px' }}>
                            <h2 style={{ color: '#00bfff', margin: '0 0 10px 0', borderBottom: '1px solid #5a402a', paddingBottom: '10px' }}>Fishing Level - 1 <span style={{fontSize: '14px', color: '#aaa'}}>(Max 50)</span></h2>
                            
                            <p style={{ margin: 0, lineHeight: '1.5', color: '#ccc' }}>Each fishing level makes the fish move slower and makes them easier to catch!</p>
                            
                            <div style={{ backgroundColor: 'rgba(0,0,0,0.3)', padding: '15px', borderRadius: '8px', border: '1px solid #5a402a', marginTop: '10px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span style={{ color: '#ffea00', fontWeight: 'bold' }}>Level 1 &rarr; 2</span>
                                <span style={{ color: '#00ff41' }}>10 / 100 XP</span>
                              </div>
                              <div style={{ width: '100%', height: '16px', backgroundColor: '#111', borderRadius: '8px', overflow: 'hidden', border: '1px solid #444' }}>
                                <div style={{ width: '10%', height: '100%', backgroundColor: '#00bfff', boxShadow: '0 0 10px #00bfff' }}></div>
                              </div>
                              <p style={{ fontSize: '12px', color: '#aaa', margin: '10px 0 0 0', textAlign: 'center', fontStyle: 'italic' }}>Catch better fish to earn more XP!</p>
                            </div>
                            
                            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
                              <button 
                                onClick={() => setActiveDetailPanel(null)}
                                style={{ padding: '10px 20px', backgroundColor: '#5a402a', color: '#fff', border: '1px solid #a67c52', borderRadius: '8px', cursor: 'pointer', fontFamily: 'monospace', fontWeight: 'bold' }}
                              >
                                BACK
                              </button>
                            </div>
                          </div>
                        )}
                        
                        {['farming', 'mining', 'lumber', 'crafting'].includes(activeDetailPanel) && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', textAlign: 'center', maxWidth: '350px' }}>
                            <h2 style={{ color: '#ffea00', margin: '0 0 10px 0', borderBottom: '1px solid #5a402a', paddingBottom: '10px' }}>{activeDetailPanel.charAt(0).toUpperCase() + activeDetailPanel.slice(1)} Level - 1</h2>
                            <p style={{ margin: '20px 0', color: '#ccc', fontStyle: 'italic' }}>More details and leveling perks coming soon...</p>
                            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
                              <button 
                                onClick={() => setActiveDetailPanel(null)}
                                style={{ padding: '10px 20px', backgroundColor: '#5a402a', color: '#fff', border: '1px solid #a67c52', borderRadius: '8px', cursor: 'pointer', fontFamily: 'monospace', fontWeight: 'bold' }}
                              >
                                BACK
                              </button>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
            )}

            {showSelector && (
                <BoostNFTSelector
                    onClose={() => setShowSelector(false)}
                    onSelect={handleNFTSelect}
                    slotIndex={slotIndex}
                    equippedAvatars={allAvatars}
                />
            )}
        </>
    )
}

export default NFTBox;