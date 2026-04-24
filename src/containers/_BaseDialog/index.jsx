import React, { useEffect, useRef } from 'react';
import './style.css';

const BaseDialog = ({ className = "", title, onClose, children, header = null, headerWidth = 210, headerOffset = 0 }) => {
  const titleRef = useRef(null);
  const clickAudioRef = useRef(null);

  useEffect(() => {
    const adjustFontSize = () => {
      if (!titleRef.current) return;
      
      const titleElement = titleRef.current;
      
      // Wait for element to be rendered
      requestAnimationFrame(() => {
        const containerWidth = titleElement.offsetWidth;
        if (containerWidth === 0) return; // Element not yet rendered
        
        const maxFontSize = 32; // 2rem = 32px
        let fontSize = maxFontSize;
        
        // Create a temporary span to measure text width
        const tempSpan = document.createElement('span');
        tempSpan.style.visibility = 'hidden';
        tempSpan.style.position = 'absolute';
        tempSpan.style.whiteSpace = 'nowrap';
        tempSpan.style.fontSize = `${fontSize}px`;
        tempSpan.style.fontWeight = '700';
        tempSpan.style.fontFamily = getComputedStyle(titleElement).fontFamily;
        tempSpan.textContent = title || '';
        document.body.appendChild(tempSpan);
        
        const textWidth = tempSpan.offsetWidth;
        document.body.removeChild(tempSpan);
        
        // If text is wider than container, reduce font size
        if (textWidth > containerWidth) {
          fontSize = (containerWidth / textWidth) * maxFontSize;
          // Ensure minimum font size
          fontSize = Math.max(fontSize, 12);
        }
        
        titleElement.style.fontSize = `${fontSize}px`;
      });
    };

    // Adjust on mount and when title changes with a small delay to ensure DOM is ready
    const timeoutId = setTimeout(adjustFontSize, 0);
    
    // Also adjust on window resize
    window.addEventListener('resize', adjustFontSize);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', adjustFontSize);
    };
  }, [title]);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('dialogOpenChanged', { detail: { open: true } }));
    return () => window.dispatchEvent(new CustomEvent('dialogOpenChanged', { detail: { open: false } }));
  }, []);

  useEffect(() => {
    if (!clickAudioRef.current) {
      clickAudioRef.current = new Audio("/sounds/ButtonHover.wav");
      clickAudioRef.current.preload = "auto";
    }
  }, []);

  return (
    <div className={`${className} modal-backdrop`} onClick={onClose}>
      <div className="modal-wrapper">
        <img className="modal-header-bg" src="/images/dialog/top-back.png" alt="background" />
        <div
          className="modal"
          onClick={(e) => e.stopPropagation()}
        >
          <img className="modal-left-top-image" src="/images/dialog/left-top.png" alt="left-top-image" />
          <img className="modal-bottom-center-image" src="/images/dialog/bottom-center.png" alt="bottom-center-image" />
          <img className="modal-bottom-center-emerald" src="/images/dialog/bottom-center-emerald.png" alt="bottom-center-emerald-image" />
          <div className="modal-body">
            {children}
            <div className="modal-header">
              <img className="modal-header-image" src="/images/dialog/top-baseheader.png" alt="header" />
              {header && <img style={{ width: headerWidth, marginTop: headerOffset }} className="modal-header-additional-image" src={header} alt="header" />}
              <img className="modal-header-label-scroll" src="/images/dialog/label-scroll.png" alt="header" />
              <span ref={titleRef} className="modal-header-title">{title}</span>
            </div>
            <div
              className="modal-close"
              onClick={(event) => {
                const audio = clickAudioRef.current;
                if (audio) {
                  audio.currentTime = 0;
                  audio.play().catch(() => {});
                }
                if (onClose) onClose(event);
              }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BaseDialog;
