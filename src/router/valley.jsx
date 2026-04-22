import React, { useState, useEffect } from "react";
import PanZoomViewport from "../layouts/PanZoomViewport";
import { VALLEY_HOTSPOTS, VALLEY_VIEWPORT } from "../constants/scene_valley";
import AdminPanel from "./index";
import WeatherOverlay from "../components/WeatherOverlay";

const Valley = () => {
  const { width, height } = VALLEY_VIEWPORT;
  const hotspots = VALLEY_HOTSPOTS;
  const [tutorialStep, setTutorialStep] = useState(() => parseInt(localStorage.getItem('sandbox_tutorial_step') || '0', 10));
  const [valTutPage, setValTutPage] = useState(() => parseInt(localStorage.getItem('sandbox_dock_tut_page') || '0', 10));

  useEffect(() => {
    const stepHandler = () => setTutorialStep(parseInt(localStorage.getItem('sandbox_tutorial_step') || '0', 10));
    window.addEventListener('tutorialStepChanged', stepHandler);
    return () => window.removeEventListener('tutorialStepChanged', stepHandler);
  }, []);

  const advanceTutorial = () => {
    const nextStep = tutorialStep + 1;
    setTutorialStep(nextStep);
    localStorage.setItem('sandbox_tutorial_step', nextStep.toString());
  };

  return (
    <>
      <WeatherOverlay />
      <PanZoomViewport
        backgroundSrc="/images/backgrounds/valley.webp"
        hotspots={hotspots}
        dialogs={[]}
        width={width}
        height={height}
        isBig
        initialScale={Math.min(window.innerWidth / width, window.innerHeight / height)}
      />
      <AdminPanel />

      {valTutPage === 23 && (
        <div style={{ position: 'fixed', right: '20px', bottom: '70px', zIndex: 100001 }}>
          <div style={{ position: 'relative', width: '490px' }}>
            <img src="/images/tutorial/tutp23.png" alt="Tutorial" style={{ width: '490px', objectFit: 'contain', display: 'block' }} />
            <div className="tut-arrow" style={{ width: '120px', height: '120px', top: 'calc(50% + 55px)' }} onClick={() => {
              localStorage.removeItem('sandbox_dock_tut_page');
              localStorage.setItem('sandbox_tutorial_step', '32');
              window.dispatchEvent(new CustomEvent('tutorialStepChanged'));
              window.location.href = '/farm';
            }}>
              <img src="/images/tutorial/returntofarm.png" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
          </div>
        </div>
      )}

      {(tutorialStep === 25 || tutorialStep === 26) && valTutPage === 0 && (
        <>
          <style>{`
            a[href*="/farm"], a[href*="/house"], a[href*="/valley"], a[href*="/market"], a[href*="/tavern"] { pointer-events: none !important; }
            @keyframes farmIconPulse { 0%, 100% { transform: scale(1.1); } 50% { transform: scale(1); } }
            ${tutorialStep === 26 ? `a[href*="/farm"] { animation: farmIconPulse 1.5s infinite !important; position: relative; z-index: 100001; pointer-events: auto !important; }` : ''}
          `}</style>
          <div style={{ position: 'fixed', right: '0px', bottom: '0px', zIndex: 100000 }}>
            <div style={{ position: 'relative', width: '666px' }}>
              <img src="/images/tutorial/sirbeetextbox.png" alt="Tutorial" style={{ width: '666px', objectFit: 'contain' }} />
              <div style={{ position: 'absolute', top: 'calc(10% + 45px)', left: '22%', right: '10%', bottom: '22%', display: 'flex', alignItems: 'flex-start' }}>
                {tutorialStep === 25 && (
                  <p style={{ fontFamily: 'Cartoonist', fontSize: '11px', color: '#3b1f0a', lineHeight: '1.5', margin: 0 }}>
                    Now lets get a good look of the whole valley! This is where you can see everything — your farm, the market, the tavern, and all the other locations spread across the land.
                  </p>
                )}
                {tutorialStep === 26 && (
                  <p style={{ fontFamily: 'Cartoonist', fontSize: '11px', color: '#3b1f0a', lineHeight: '1.5', margin: 0 }}>
                    Alright now lets go learn how to craft, gather resources and more!
                  </p>
                )}
              </div>
              {tutorialStep === 25 && (
                <div className="tut-arrow" onClick={advanceTutorial}>
                  <img src="/images/tutorial/next.png" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default Valley;
