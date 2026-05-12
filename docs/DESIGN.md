# Pitstop Design System

Extracted from main-dashboard finalized HTML (2026-05-11). Use these tokens in all future screens.

---

## Color Palette

### Base
| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--color-bg` | `#ffffff` | `#111111` | Page background |
| `--color-surface` | `#ffffff` | `#1e1e1e` | Card / nav background |
| `--color-surface-hover` | `#f9fafb` | `#272727` | Hover state |
| `--color-border` | `#e8e8e8` | `#333333` | Card borders, dividers |

### Text
| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--color-text-primary` | `#111111` | `#f3f3f3` | Headings, card names |
| `--color-text-secondary` | `#6b7280` | `#a0a0a0` | Subtitles, km remaining (normal) |
| `--color-text-muted` | `#9ca3af` | `#666666` | Section labels, nav inactive |

### Status
| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--color-urgent-bg` | `#fee2e2` | `#3d1515` | 위급 chip background |
| `--color-urgent-text` | `#ef4444` | `#f87171` | 위급 chip text, km remaining |
| `--color-overdue-bg` | `#dc2626` | `#b91c1c` | 과기한 chip background (solid red — same family as 위급, solid fill = more severe) |
| `--color-overdue-text` | `#ffffff` | `#ffffff` | 과기한 chip text |
| `--color-overdue-sub` | `#b91c1c` | `#f87171` | 과기한 card subtitle text |
| `--color-normal-bg` | `#dcfce7` | `#0d2b19` | 정상 chip background |
| `--color-normal-text` | `#16a34a` | `#4ade80` | 정상 chip text |

### Alerts
| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--color-alert-bg` | `#fef2f2` | `#2d1515` | Alert banner background |
| `--color-alert-border` | `#fecaca` | `#7f1d1d` | Alert banner border |
| `--color-alert-text` | `#dc2626` | `#f87171` | Alert banner text |

### Navigation
| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--color-nav-active` | `#ef4444` | `#f87171` | Active tab, home icon |
| `--color-nav-inactive` | `#9ca3af` | `#555555` | Inactive tabs |

---

## Typography

- **Font family:** `'Noto Sans KR'`, `-apple-system`, `BlinkMacSystemFont`, `'Segoe UI'`, `sans-serif`
- **Load:** `https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;600;700&display=swap`

| Role | Size | Weight | Usage |
|------|------|--------|-------|
| App logo | 24px | 700 | "Pitstop" header |
| Card name | 17px | 600 | Consumable item name |
| Card subtitle | 13px | 400 | km remaining / status reason |
| Status chip | 13px | 600 | 위급 / 과기한 / 정상 |
| Section label | 11.5px | 600 | "소모품 현황" uppercase |
| Alert text | 14px | 500 | Alert banner message |
| Car chip | 13px | 500 | "아반떼 CN7 | 45,230km" |
| Nav label | 11px | 500 | 홈 / 기록 / 설정 |

---

## Spacing

- **Page padding:** `16px` horizontal
- **Header:** `20px` top, `14px` bottom
- **Card padding:** `15px` vertical, `16px` horizontal
- **Card gap:** `8px`
- **Alert margin-bottom:** `20px`
- **Section label margin-bottom:** `10px`

---

## Components

### Card
```css
border: 1px solid var(--color-border);
border-radius: 12px;
box-shadow: 0 1px 3px rgba(0,0,0,0.08);
min-height: 72px;
```

### Status chip
```css
border-radius: 20px;
padding: 6px 14px;
min-width: 58px;
min-height: 36px;
```

### Alert banner
```css
border: 1px solid var(--color-alert-border);
border-radius: 10px;
padding: 12px 14px;
```

### Bottom navigation
```css
height: calc(56px + env(safe-area-inset-bottom, 0px));
border-top: 1px solid var(--color-border);
```
Touch target minimum: `44px`

### Car chip (header)
```css
border: 1.5px solid var(--color-border);
border-radius: 24px;
padding: 8px 12px;
min-height: 44px;
```

---

## Layout

- **Max width:** `390px` (centered, mobile-first PWA)
- **Bottom padding:** `80px + env(safe-area-inset-bottom)` for fixed nav clearance
- **Breakpoints:** 768px adds left/right border to app container

---

## Status Semantics

| Status | Korean | Color key | Condition |
|--------|--------|-----------|-----------|
| Normal | 정상 | `--color-normal-*` | Life > threshold |
| Urgent | 위급 | `--color-urgent-*` | Life ≤ 20% or ≤ 30 days |
| Overdue | 과기한 | `--color-overdue-*` | Past replacement interval |

Subtitle text color mirrors chip status:
- 정상 → `--color-text-secondary`
- 위급 → `--color-urgent-text`
- 과기한 → `#b91c1c` (light) / `#f87171` (dark)
