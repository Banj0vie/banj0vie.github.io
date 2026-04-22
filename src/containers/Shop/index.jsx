import React, { useState, useEffect } from "react";
import "./style.css";
import BaseButton from "../../components/buttons/BaseButton";

const getGold = () => parseInt(localStorage.getItem('sandbox_gold') || '0', 10);
const getGems = () => parseInt(localStorage.getItem('sandbox_gems') || '0', 10);

const GOLD_ITEMS = [
  { id: "night_watch",    name: "Night Watcher",         desc: "Place on your farm. Guards crops from wilting overnight.",           cost: 800,  emoji: "🕯️",  tag: "STATUE"   },
  { id: "scarecrow",      name: "Scarecrow",             desc: "Place on your farm. Boosts all crop yields by 2%.",                  cost: 600,  emoji: "🪶",  tag: "STATUE"   },
  { id: "tower_potato",   name: "Potato Tower",          desc: "Speed tower. Grows potatoes 5% faster.",                            cost: 450,  emoji: "🥔",  tag: "TOWER"    },
  { id: "tower_carrot",   name: "Carrot Tower",          desc: "Speed tower. Grows carrots 5% faster.",                             cost: 450,  emoji: "🥕",  tag: "TOWER"    },
  { id: "tower_tomato",   name: "Tomato Tower",          desc: "Speed tower. Grows tomatoes 5% faster.",                            cost: 450,  emoji: "🍅",  tag: "TOWER"    },
  { id: "tower_corn",     name: "Corn Tower",            desc: "Speed tower. Grows corn 5% faster.",                                cost: 450,  emoji: "🌽",  tag: "TOWER"    },
  { id: "rain_barrel",    name: "Rain Barrel",           desc: "Reduces watering need. Crops stay hydrated one extra day.",         cost: 350,  emoji: "🪣",  tag: "STATUE"   },
  { id: "compost_bin",    name: "Compost Bin",           desc: "Passively generates fertilizer each day.",                          cost: 500,  emoji: "♻️",  tag: "STATUE"   },
  { id: "lucky_shoe",     name: "Lucky Horseshoe",       desc: "2% chance to double any harvest.",                                  cost: 700,  emoji: "🧲",  tag: "STATUE"   },
  { id: "stone_idol",     name: "Stone Idol",            desc: "All crop sales earn 3% bonus gold.",                                cost: 900,  emoji: "🗿",  tag: "STATUE"   },
  { id: "barn_owl",       name: "Barn Owl",              desc: "Boosts fishing XP earned by 5%.",                                   cost: 650,  emoji: "🦉",  tag: "STATUE"   },
  { id: "almanac",        name: "Farmers Almanac",       desc: "Reveals tomorrow's best crop to plant for bonus gold.",             cost: 400,  emoji: "📖",  tag: "ONE-TIME" },
];

const GEM_PACKS = [
  { id: "gems_80",   gems: 80,   price: "$0.99",  bonus: "",          emoji: "💎",  popular: false },
  { id: "gems_200",  gems: 200,  price: "$1.99",  bonus: "",          emoji: "💎",  popular: false },
  { id: "gems_550",  gems: 550,  price: "$4.99",  bonus: "+50 bonus", emoji: "💎",  popular: true  },
  { id: "gems_1200", gems: 1200, price: "$9.99",  bonus: "+200 bonus",emoji: "💎",  popular: false },
  { id: "gems_2600", gems: 2600, price: "$19.99", bonus: "+600 bonus",emoji: "💎",  popular: false },
  { id: "gems_7200", gems: 7200, price: "$49.99", bonus: "+2200 bonus",emoji: "💎", popular: false },
];

const TABS = ["Gold Shop", "Gem Shop"];

const Shop = ({ onClose, initialTab = 0 }) => {
  const [tab, setTab] = useState(initialTab);
  const [gold, setGold] = useState(getGold);
  const [gems, setGems] = useState(getGems);
  const [feedback, setFeedback] = useState({});

  useEffect(() => {
    const onGold = () => setGold(getGold());
    const onGems = () => setGems(getGems());
    window.addEventListener('sandboxGoldChanged', onGold);
    window.addEventListener('sandboxGemsChanged', onGems);
    return () => {
      window.removeEventListener('sandboxGoldChanged', onGold);
      window.removeEventListener('sandboxGemsChanged', onGems);
    };
  }, []);

  const showFeedback = (id, msg, isError) => {
    setFeedback(f => ({ ...f, [id]: { msg, isError } }));
    setTimeout(() => setFeedback(f => { const n = { ...f }; delete n[id]; return n; }), 2000);
  };

  const buy = (item) => {
    if (gold < item.cost) { showFeedback(item.id, "Not enough Gold!", true); return; }
    const newGold = gold - item.cost;
    localStorage.setItem('sandbox_gold', String(newGold));
    window.dispatchEvent(new CustomEvent('sandboxGoldChanged'));
    setGold(newGold);

    const STATUE_IDS = ["night_watch", "scarecrow", "tower_potato", "tower_carrot", "tower_tomato", "tower_corn", "rain_barrel", "compost_bin", "lucky_shoe", "stone_idol", "barn_owl", "almanac"];
    if (STATUE_IDS.includes(item.id)) {
      localStorage.setItem(`sandbox_owned_${item.id}`, 'true');
      window.dispatchEvent(new CustomEvent('sandboxStatueChanged', { detail: item.id }));
    }

    showFeedback(item.id, "Purchased!", false);
  };

  return (
    <div className="shop-overlay" onClick={onClose}>
      <div className="shop-panel" onClick={e => e.stopPropagation()}>

        <div className="shop-header">
          <span className="shop-title">Shop</span>
          <div className="shop-balances">
            <span className="shop-balance-pill gold">🪙 {gold} Gold</span>
            <span className="shop-balance-pill gem"><img src="/images/profile_bar/diamond.png" alt="" style={{ width: '16px', height: '16px', objectFit: 'contain', verticalAlign: 'middle', marginRight: '4px' }} />{gems} Gems</span>
          </div>
          <button className="shop-close" onClick={onClose}>✕</button>
        </div>

        <div className="shop-tabs">
          {TABS.map((t, i) => (
            <button key={i} className={`shop-tab ${tab === i ? 'active' : ''}`} onClick={() => setTab(i)}>
              {i === 0 ? '🪙' : <img src="/images/profile_bar/diamond.png" alt="" style={{ width: '14px', height: '14px', objectFit: 'contain', verticalAlign: 'middle' }} />} {t}
            </button>
          ))}
        </div>

        {tab === 0 ? (
          <div className="shop-grid">
            {GOLD_ITEMS.map(item => {
              const fb = feedback[item.id];
              const canAfford = gold >= item.cost;
              return (
                <div key={item.id} className={`shop-item ${!canAfford ? 'shop-item-cant-afford' : ''}`}>
                  <div className="shop-item-tag">{item.tag}</div>
                  <div className="shop-item-emoji">{item.emoji}</div>
                  <div className="shop-item-name">{item.name}</div>
                  <div className="shop-item-desc">{item.desc}</div>
                  {fb && <div className={`shop-item-feedback ${fb.isError ? 'error' : 'success'}`}>{fb.msg}</div>}
                  <BaseButton
                    label={`🪙 ${item.cost}`}
                    small
                    disabled={!canAfford}
                    onClick={() => buy(item)}
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <div className="gem-shop">
            <div className="gem-shop-subtitle">Support the game and get <img src="/images/profile_bar/diamond.png" alt="" style={{ width: '16px', height: '16px', objectFit: 'contain', verticalAlign: 'middle' }} /> Gems!</div>
            <div className="gem-pack-grid">
              {GEM_PACKS.map(pack => (
                <div key={pack.id} className={`gem-pack ${pack.popular ? 'gem-pack-popular' : ''}`}>
                  {pack.popular && <div className="gem-pack-popular-label">BEST VALUE</div>}
                  <div className="gem-pack-icon"><img src="/images/profile_bar/diamond.png" alt="Gems" style={{ width: '48px', height: '48px', objectFit: 'contain' }} /></div>
                  <div className="gem-pack-amount">{pack.gems.toLocaleString()}</div>
                  {pack.bonus && <div className="gem-pack-bonus">{pack.bonus}</div>}
                  <div className="gem-pack-price">{pack.price}</div>
                  <BaseButton label="Buy" small onClick={() => {}} />
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Shop;
