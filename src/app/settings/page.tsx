'use client';

import BottomNav from '@/components/BottomNav';

export default function SettingsPage() {
  return (
    <div
      style={{
        maxWidth: 390,
        margin: '0 auto',
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--color-bg)',
      }}
    >
      <header style={{ padding: '20px var(--page-pad) 14px' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.5px' }}>설정</h1>
      </header>
      <main
        style={{
          flex: 1,
          padding: '0 var(--page-pad)',
          paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>설정 (준비 중)</p>
      </main>
      <BottomNav activeTab="home" />
    </div>
  );
}
