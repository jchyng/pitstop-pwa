import Link from 'next/link';

type Tab = 'home' | 'log';

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


const tabs: { id: Tab; label: string; href: string; Icon: React.FC }[] = [
  { id: 'home', label: '홈',  href: '/',    Icon: HomeIcon },
  { id: 'log',  label: '기록', href: '/log', Icon: LogIcon },
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
      {tabs.map(({ id, label, href, Icon }) => {
        const isActive = activeTab === id;
        const color = isActive ? 'var(--color-nav-active)' : 'var(--color-nav-inactive)';
        return (
          <Link
            key={id}
            href={href}
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
              textDecoration: 'none',
              transition: 'opacity 0.15s',
            }}
          >
            <Icon />
            <span style={{ fontSize: 11, fontWeight: 500, lineHeight: 1 }}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
