type Tab = 'home' | 'log' | 'settings';

interface Props {
  activeTab: Tab;
}

const HomeIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M3 9.5L12 3L21 9.5V20C21 20.55 20.55 21 20 21H15V15H9V21H4C3.45 21 3 20.55 3 20V9.5Z" fill="currentColor" />
  </svg>
);

const LogIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="5" y="3" width="14" height="18" rx="2" stroke="currentColor" strokeWidth="1.8" fill="none" />
    <line x1="9" y1="8" x2="15" y2="8" stroke="currentColor" strokeWidth="1.6" />
    <line x1="9" y1="12" x2="15" y2="12" stroke="currentColor" strokeWidth="1.6" />
    <line x1="9" y1="16" x2="13" y2="16" stroke="currentColor" strokeWidth="1.6" />
  </svg>
);

const SettingsIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" fill="none" />
    <path
      d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
      stroke="currentColor"
      strokeWidth="1.8"
      fill="none"
    />
  </svg>
);

const tabs: { id: Tab; label: string; Icon: React.FC }[] = [
  { id: 'home',     label: '홈',  Icon: HomeIcon },
  { id: 'log',      label: '기록', Icon: LogIcon },
  { id: 'settings', label: '설정', Icon: SettingsIcon },
];

export default function BottomNav({ activeTab }: Props) {
  return (
    <nav
      role="navigation"
      aria-label="앱 하단 내비게이션"
      style={{
        position: 'fixed',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: 390,
        height: 'calc(56px + env(safe-area-inset-bottom, 0px))',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        background: 'var(--color-surface)',
        borderTop: '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'stretch',
        zIndex: 100,
      }}
    >
      {tabs.map(({ id, label, Icon }) => {
        const isActive = activeTab === id;
        const color = isActive ? 'var(--color-nav-active)' : 'var(--color-nav-inactive)';
        return (
          <button
            key={id}
            type="button"
            aria-current={isActive ? 'page' : undefined}
            aria-label={label}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3,
              minHeight: 44,
              cursor: 'pointer',
              border: 'none',
              background: 'none',
              fontFamily: 'var(--font)',
              padding: '6px 0',
              color,
              transition: 'opacity 0.15s',
            }}
          >
            <Icon />
            <span style={{ fontSize: 11, fontWeight: 500, lineHeight: 1 }}>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
