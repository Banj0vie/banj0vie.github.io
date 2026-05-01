import { useEffect, useRef, useState } from 'react';
import { supabase, supabaseEnabled } from '../lib/supabase';

const SYNCED_KEYS = [
  'sandbox_username',
  'sandbox_pfp',
  'sandbox_level',
  'sandbox_xp',
  'sandbox_honey',
  'sandbox_gold',
  'sandbox_gems',
  'sandbox_inventory',
  'sandbox_crops',
  'sandbox_water_state',
  'sandbox_plot_prep',
  'sandbox_completed_quests',
  'sandbox_read_quests',
  'sandbox_discarded_quests',
  'sandbox_tutorial_step',
  'sandbox_tutorial_complete',
  'sandbox_tut_page',
  'sandbox_tut_market',
  'sandbox_tut_market_page',
  'sandbox_dock_build_start',
  'sandbox_dock_repaired',
  'sandbox_dock_unlocked',
  'sandbox_skipped_pfp_select',
  'sandbox_pack_inventory',
  'sandbox_pack_history',
  'sandbox_seed_inventory',
  'sandbox_tools',
  'sandbox_potions',
  'sandbox_settings',
];

const snapshot = () => {
  const out = {};
  for (const key of SYNCED_KEYS) {
    const v = localStorage.getItem(key);
    if (v !== null) out[key] = v;
  }
  return out;
};

const hydrate = (state) => {
  if (!state || typeof state !== 'object') return;
  for (const [key, value] of Object.entries(state)) {
    if (typeof value === 'string') localStorage.setItem(key, value);
  }
};

export const useCloudSync = () => {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | loading | synced | error
  const flushTimer = useRef(null);
  const lastFlushed = useRef('');

  useEffect(() => {
    if (!supabaseEnabled()) return;
    let cancelled = false;

    const init = async () => {
      const { data } = await supabase.auth.getSession();
      let session = data.session;
      if (!session) {
        const { data: anon } = await supabase.auth.signInAnonymously();
        session = anon.session;
      }
      if (cancelled) return;
      setUser(session?.user || null);
    };
    init();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  // Initial hydrate from cloud, then begin syncing local -> cloud
  useEffect(() => {
    if (!user || !supabaseEnabled()) return;
    let cancelled = false;
    setStatus('loading');

    (async () => {
      const { data, error } = await supabase
        .from('players')
        .select('state')
        .eq('user_id', user.id)
        .maybeSingle();
      if (cancelled) return;
      if (error) {
        setStatus('error');
        return;
      }
      if (data?.state) {
        hydrate(data.state);
        window.dispatchEvent(new CustomEvent('cloudHydrated'));
      }
      lastFlushed.current = JSON.stringify(snapshot());
      setStatus('synced');
    })();

    return () => { cancelled = true; };
  }, [user?.id]);

  // Debounced push of local changes to cloud
  useEffect(() => {
    if (!user || !supabaseEnabled() || status !== 'synced') return;

    const flush = async () => {
      const state = snapshot();
      const serialized = JSON.stringify(state);
      if (serialized === lastFlushed.current) return;
      lastFlushed.current = serialized;
      await supabase.from('players').upsert({
        user_id: user.id,
        state,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });
    };

    const schedule = () => {
      if (flushTimer.current) clearTimeout(flushTimer.current);
      flushTimer.current = setTimeout(flush, 2000);
    };

    const onStorage = () => schedule();
    window.addEventListener('storage', onStorage);
    // Also react to in-tab events the game already dispatches
    const events = [
      'sandboxHoneyChanged', 'goldChanged', 'gemsChanged', 'xpChanged',
      'inventoryChanged', 'tutorialStepChanged', 'questsChanged',
    ];
    events.forEach(e => window.addEventListener(e, schedule));

    // Periodic safety flush every 30s
    const id = setInterval(schedule, 30000);

    return () => {
      window.removeEventListener('storage', onStorage);
      events.forEach(e => window.removeEventListener(e, schedule));
      clearInterval(id);
      if (flushTimer.current) clearTimeout(flushTimer.current);
    };
  }, [user?.id, status]);

  return { user, status };
};
