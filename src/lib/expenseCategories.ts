import type { ExpenseCategory } from '@/types';

export interface ExpenseCategoryMeta {
  value: ExpenseCategory;
  label: string;
  emoji: string;
  isAnnual: boolean;
}

export const EXPENSE_CATEGORIES: ExpenseCategoryMeta[] = [
  { value: 'insurance', label: '자동차 보험', emoji: '🛡️', isAnnual: true  },
  { value: 'tax',       label: '자동차세',    emoji: '🏛️', isAnnual: true  },
  { value: 'fuel',      label: '주유비',      emoji: '⛽',  isAnnual: false },
  { value: 'other',     label: '기타',        emoji: '📦', isAnnual: false },
];

export const EXPENSE_CATEGORY_MAP = Object.fromEntries(
  EXPENSE_CATEGORIES.map(c => [c.value, c])
) as Record<ExpenseCategory, ExpenseCategoryMeta>;
