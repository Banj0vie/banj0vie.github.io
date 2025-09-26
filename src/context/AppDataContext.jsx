import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { useAgwEthersAndService } from '../hooks/useContractBase';
import { useEquipmentRegistry } from '../hooks/useContracts';

const AppDataContext = createContext(null);

export const AppDataProvider = ({ children }) => {
  const { account, contractService } = useAgwEthersAndService();
  const { getAvatars, getTokenBoostPpm } = useEquipmentRegistry();

  const cacheRef = useRef({
    profile: { value: null, at: 0 },
    locked: { value: null, at: 0 },
    avatars: { value: null, at: 0 },
    boost: { value: null, at: 0 },
  });
  const ttlMs = 30000; // 30s

  const getProfileCached = useCallback(async () => {
    if (!account || !contractService) return null;
    const c = cacheRef.current.profile;
    if (c.value && (Date.now() - c.at) < ttlMs) return c.value;
    const value = await contractService.getProfile(account);
    cacheRef.current.profile = { value, at: Date.now() };
    return value;
  }, [account, contractService]);

  const getLockedCached = useCallback(async () => {
    if (!account || !contractService) return 0n;
    const c = cacheRef.current.locked;
    if (c.value !== null && (Date.now() - c.at) < ttlMs) return c.value;
    const value = await contractService.getLockedGameToken(account);
    cacheRef.current.locked = { value, at: Date.now() };
    return value;
  }, [account, contractService]);

  const getAvatarsCached = useCallback(async () => {
    if (!account || !getAvatars) return null;
    const c = cacheRef.current.avatars;
    if (c.value && (Date.now() - c.at) < ttlMs) return c.value;
    const value = await getAvatars(account);
    cacheRef.current.avatars = { value, at: Date.now() };
    return value;
  }, [account, getAvatars]);

  const getBoostCached = useCallback(async () => {
    if (!account || !getTokenBoostPpm) return 0;
    const c = cacheRef.current.boost;
    if (c.value !== null && (Date.now() - c.at) < ttlMs) return c.value;
    const value = await getTokenBoostPpm(account);
    cacheRef.current.boost = { value, at: Date.now() };
    return value;
  }, [account, getTokenBoostPpm]);

  const value = useMemo(() => ({
    getProfileCached,
    getLockedCached,
    getAvatarsCached,
    getBoostCached,
    invalidate(key) {
      if (!key) return;
      if (cacheRef.current[key]) cacheRef.current[key] = { value: null, at: 0 };
    }
  }), [getProfileCached, getLockedCached, getAvatarsCached, getBoostCached]);

  return (
    <AppDataContext.Provider value={value}>
      {children}
    </AppDataContext.Provider>
  );
};

export const useAppData = () => {
  const ctx = useContext(AppDataContext);
  return ctx || {};
};


