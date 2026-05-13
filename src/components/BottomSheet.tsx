'use client';

import { useRef, useState } from 'react';

interface Props {
  onClose: () => void;
  ariaLabel: string;
  children: React.ReactNode;
}

export default function BottomSheet({ onClose, ariaLabel, children }: Props) {
  const [translateY, setTranslateY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startYRef = useRef(0);

  function handleTouchStart(e: React.TouchEvent) {
    startYRef.current = e.touches[0].clientY;
    setDragging(true);
  }

  function handleTouchMove(e: React.TouchEvent) {
    const delta = e.touches[0].clientY - startYRef.current;
    if (delta > 0) setTranslateY(delta);
  }

  function handleTouchEnd() {
    setDragging(false);
    if (translateY > 80) {
      onClose();
    } else {
      setTranslateY(0);
    }
  }

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.45)',
          zIndex: 100,
        }}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          position: 'fixed',
          bottom: 0,
          left: '50%',
          transform: `translateX(-50%) translateY(${translateY}px)`,
          transition: dragging ? 'none' : 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          width: '100%',
          maxWidth: 390,
          background: 'var(--color-surface)',
          borderRadius: '20px 20px 0 0',
          zIndex: 101,
          padding: '20px var(--page-pad)',
          paddingBottom: 'calc(28px + env(safe-area-inset-bottom, 0px))',
        }}
      >
        {/* Handle bar */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16, cursor: 'grab' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--color-border)' }} />
        </div>

        {children}
      </div>
    </>
  );
}
