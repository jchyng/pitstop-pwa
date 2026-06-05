import Link from 'next/link';
import { Home, FileText, Wallet } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// 설정 탭은 기능 개발 완료 전까지 네비게이션에 추가하지 않는다
type Tab = 'home' | 'log' | 'cost';

interface Props {
  activeTab: Tab;
}

const tabs: { id: Tab; label: string; href: string; Icon: LucideIcon }[] = [
  { id: 'home', label: '홈',    href: '/',     Icon: Home },
  { id: 'log',  label: '기록',  href: '/log',  Icon: FileText },
  { id: 'cost', label: '유지비', href: '/cost', Icon: Wallet },
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
            <Icon size={22} aria-hidden="true" />
            <span style={{ fontSize: 10, fontWeight: 500, lineHeight: 1 }}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
