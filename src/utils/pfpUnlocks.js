export const unlockPfp = (id) => {
  const current = JSON.parse(localStorage.getItem('sandbox_unlocked_pfps') || '[]');
  if (!current.includes(id)) {
    current.push(id);
    localStorage.setItem('sandbox_unlocked_pfps', JSON.stringify(current));
    window.dispatchEvent(new CustomEvent('pfpEarned', { detail: id }));
  }
};

export const claimPfp = (id) => {
  const claimed = JSON.parse(localStorage.getItem('sandbox_claimed_pfps') || '[]');
  if (!claimed.includes(id)) {
    claimed.push(id);
    localStorage.setItem('sandbox_claimed_pfps', JSON.stringify(claimed));
    const unseen = JSON.parse(localStorage.getItem('sandbox_unseen_pfps') || '[]');
    if (!unseen.includes(id)) {
      unseen.push(id);
      localStorage.setItem('sandbox_unseen_pfps', JSON.stringify(unseen));
    }
    window.dispatchEvent(new CustomEvent('pfpUnlocked', { detail: id }));
  }
};

export const trackGemSpend = (amount) => {
  if (amount <= 0) return;
  const prev = parseInt(localStorage.getItem('sandbox_total_gems_spent') || '0', 10);
  const next = prev + amount;
  localStorage.setItem('sandbox_total_gems_spent', String(next));
  if (next >= 1000) unlockPfp('spendingfirstgem');
};
