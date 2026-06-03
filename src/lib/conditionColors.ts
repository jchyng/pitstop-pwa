import type { InspectCondition } from '@/types';

export const CONDITION_COLORS: Record<InspectCondition, { bg: string; fg: string }> = {
  good:          { bg: 'var(--color-normal-bg)',  fg: 'var(--color-normal-text)' },
  caution:       { bg: 'var(--color-urgent-bg)',  fg: 'var(--color-urgent-text)' },
  replace_needed:{ bg: 'var(--color-urgent-bg)',  fg: 'var(--color-overdue-sub)' },
};

export const CONDITION_LABEL: Record<InspectCondition, string> = {
  good:          '양호',
  caution:       '주의',
  replace_needed:'교체 필요',
};
