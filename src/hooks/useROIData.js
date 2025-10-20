import { useState } from "react";
import { getMultiplier } from "../utils/basic";

export const useROIData = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [roiData, setRoiData] = useState({
      commons: 0,
      uncommons: 0,
      rares: 0,
      epics: 0,
      legendaries: 0
    });
    const [farmLevel, setFarmLevel] = useState(0);
  
    const getROIData = (level = 0) => {
      setLoading(true);
      setError(null);
  
      try {
        console.log('Getting ROI data for level:', level);
  
        const commonMult = Number(getMultiplier(1, level));
        const uncommonMult = Number(getMultiplier(2, level));
        const rareMult = Number(getMultiplier(3, level));
        const epicMult = Number(getMultiplier(4, level));
        const legendaryMult = Number(getMultiplier(5, level));
  
        console.log('Multipliers:', { commonMult, uncommonMult, rareMult, epicMult, legendaryMult });
  
        // Base rates from contract constants (in parts per million)
        const baseRates = {
          commons: 273400,    // 27.34%
          uncommons: 437600,  // 43.76%
          rares: 218800,      // 21.88%
          epics: 62600,       // 6.26%
          legendaries: 7600   // 0.76%
        };
  
        // Calculate adjusted rates with multipliers (multipliers are scaled by 1000)
        const adjustedRates = {
          commons: (baseRates.commons * Number(commonMult)) / 1000000, // Convert to percentage
          uncommons: (baseRates.uncommons * Number(uncommonMult)) / 1000000,
          rares: (baseRates.rares * Number(rareMult)) / 1000000,
          epics: (baseRates.epics * Number(epicMult)) / 1000000,
          legendaries: (baseRates.legendaries * Number(legendaryMult)) / 1000000
        };
  
        console.log('Adjusted rates:', adjustedRates);
        setRoiData(adjustedRates);
        setFarmLevel(level);
      } catch (err) {
        console.error('Failed to get ROI data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
  
    return {
      roiData,
      farmLevel,
      getROIData,
      loading,
      error
    };
  };