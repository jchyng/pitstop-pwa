'use client';

import { useState, useEffect, useMemo } from 'react';
import BottomNav from '@/components/BottomNav';
import PageHeader from '@/components/PageHeader';
import ExpenseSheet from '@/components/ExpenseSheet';
import EditExpenseSheet from '@/components/EditExpenseSheet';
import EditLogSheet from '@/components/EditLogSheet';
import { getExpenses, getLogs, getMyCars } from '@/lib/storage';
import { EXPENSE_CATEGORY_MAP } from '@/lib/expenseCategories';
import { groupByMonth } from '@/lib/itemUtils';
import type { ExpenseEntry, LogEntry, CarIndex } from '@/types';
import CarPickerSheet from '@/components/CarPickerSheet';

const DISPLAY_CATS = [
  { key: 'maintenance', label: '정비·수리', emoji: '🔧' },
  { key: 'insurance',   label: '자동차 보험', emoji: '🛡️' },
  { key: 'tax',         label: '자동차세',   emoji: '🏛️' },
  { key: 'fuel',        label: '주유비',     emoji: '⛽' },
  { key: 'other',       label: '기타',       emoji: '📦' },
];

interface DisplayItem {
  id: string;
  date: string;
  emoji: string;
  label: string;
  amount: number;
  type: 'expense' | 'log';
  rawExpense?: ExpenseEntry;
  rawLog?: LogEntry;
}

export default function CostPage() {
  const [carId, setCarId] = useState<string>('');
  const [carName, setCarName] = useState('');
  const [carList, setCarList] = useState<CarIndex[]>([]);
  const [expenses, setExpenses] = useState<ExpenseEntry[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [showCarPicker, setShowCarPicker] = useState(false);
  const [editExpense, setEditExpense] = useState<ExpenseEntry | null>(null);
  const [editLog, setEditLog] = useState<LogEntry | null>(null);

  useEffect(() => {
    const savedId = localStorage.getItem('pitstop_selected_car') ?? '';
    const myCarIds = getMyCars();
    fetch('/cars/index.json')
      .then(r => r.json())
      .then((idx: CarIndex[]) => {
        const myCars = idx.filter(c => myCarIds.includes(c.car_id));
        setCarList(myCars);
        const id = myCars.find(c => c.car_id === savedId)?.car_id ?? myCars[0]?.car_id ?? '';
        setCarId(id);
        const car = myCars.find(c => c.car_id === id);
        if (car) setCarName(car.name_ko);
        if (id) {
          setExpenses(getExpenses(id));
          setLogs(getLogs(id));
        }
      })
      .catch(() => {});
  }, []);

  function handleCarSelect(id: string) {
    const car = carList.find(c => c.car_id === id);
    if (!car) return;
    localStorage.setItem('pitstop_selected_car', id);
    setCarId(id);
    setCarName(car.name_ko);
    setExpenses(getExpenses(id));
    setLogs(getLogs(id));
  }

  function refresh() {
    if (!carId) return;
    setExpenses(getExpenses(carId));
    setLogs(getLogs(carId));
  }

  const yearExpenses = useMemo(
    () => expenses.filter(e => e.date.startsWith(String(selectedYear))),
    [expenses, selectedYear],
  );

  const yearLogs = useMemo(
    () => logs.filter(l => l.cost && l.cost > 0 && l.date.startsWith(String(selectedYear))),
    [logs, selectedYear],
  );

  const summary = useMemo(() => {
    const maintenance = yearLogs.reduce((s, l) => s + (l.cost ?? 0), 0);
    const other = yearExpenses.reduce((s, e) => s + e.amount, 0);
    return { maintenance, other, total: maintenance + other };
  }, [yearExpenses, yearLogs]);

  const catTotals = useMemo(() => {
    const map: Record<string, number> = {};
    for (const l of yearLogs) {
      map.maintenance = (map.maintenance ?? 0) + (l.cost ?? 0);
    }
    for (const e of yearExpenses) {
      map[e.category] = (map[e.category] ?? 0) + e.amount;
    }
    return map;
  }, [yearExpenses, yearLogs]);

  const displayItems = useMemo((): DisplayItem[] => {
    const items: DisplayItem[] = [
      ...yearExpenses.map(e => ({
        id: `exp_${e.id}`,
        date: e.date,
        emoji: EXPENSE_CATEGORY_MAP[e.category].emoji,
        label: EXPENSE_CATEGORY_MAP[e.category].label,
        amount: e.amount,
        type: 'expense' as const,
        rawExpense: e,
      })),
      ...yearLogs.map(l => ({
        id: `log_${l.id}`,
        date: l.date,
        emoji: '🔧',
        label: l.itemName,
        amount: l.cost ?? 0,
        type: 'log' as const,
        rawLog: l,
      })),
    ];
    return items.sort((a, b) => b.date.localeCompare(a.date));
  }, [yearExpenses, yearLogs]);

  const grouped = useMemo(() => groupByMonth(displayItems), [displayItems]);

  const availableYears = useMemo(() => {
    const years = new Set<number>();
    expenses.forEach(e => years.add(Number(e.date.slice(0, 4))));
    logs.filter(l => l.cost && l.cost > 0).forEach(l => years.add(Number(l.date.slice(0, 4))));
    years.add(new Date().getFullYear());
    return [...years].sort((a, b) => b - a);
  }, [expenses, logs]);

  const maxCat = Math.max(...Object.values(catTotals), 1);
  const fmt = (n: number) => n.toLocaleString('ko-KR');

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
      <PageHeader
        title="유지비"
        carLabel={carName || undefined}
        onCarClick={carList.length > 1 ? () => setShowCarPicker(true) : undefined}
        sticky
      />

      <main
        style={{
          flex: 1,
          padding: '0 var(--page-pad)',
          paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))',
        }}
      >
        {!carId ? (
          <div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '24px 0 20px' }}>
              <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text-primary)', margin: 0 }}>
                아직 등록된 차량이 없어요
              </p>
              <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: 0, textAlign: 'center' }}>
                홈 화면에서 차량을 등록하면 유지비를 기록할 수 있어요
              </p>
            </div>
            <div aria-hidden="true" style={{ opacity: 0.3, pointerEvents: 'none', userSelect: 'none' }}>
              {/* Ghost year selector */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, marginBottom: 16 }}>
                <span style={{ fontSize: 18, color: 'var(--color-text-muted)', padding: '4px 8px' }}>‹</span>
                <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text-primary)' }}>2025</span>
                <span style={{ fontSize: 18, color: 'var(--color-text-muted)', padding: '4px 8px' }}>›</span>
              </div>
              {/* Ghost summary card */}
              <div style={{ borderRadius: 16, background: 'var(--color-surface)', border: '1px solid var(--color-border)', padding: '18px 20px', marginBottom: 16 }}>
                <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 6, fontWeight: 500 }}>2025년 총 유지비</p>
                <p style={{ fontSize: 28, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 8, letterSpacing: '-0.5px' }}>178,000원</p>
                <p style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>정비·수리 143,000 · 그 외 35,000</p>
              </div>
              {/* Ghost category bars */}
              <div style={{ borderRadius: 16, background: 'var(--color-surface)', border: '1px solid var(--color-border)', padding: '16px 20px', marginBottom: 16 }}>
                {([
                  { emoji: '🔧', label: '정비·수리', pct: 80, amount: '143,000원' },
                  { emoji: '⛽', label: '주유비', pct: 20, amount: '35,000원' },
                ] as { emoji: string; label: string; pct: number; amount: string }[]).map(c => (
                  <div key={c.label} style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ width: 90, fontSize: 13, color: 'var(--color-text-primary)', flexShrink: 0 }}>
                      {c.emoji} {c.label}
                    </span>
                    <div style={{ flex: 1, height: 8, borderRadius: 4, background: 'var(--color-border)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${c.pct}%`, borderRadius: 4, background: 'var(--color-nav-active)' }} />
                    </div>
                    <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', width: 80, textAlign: 'right', flexShrink: 0 }}>
                      {c.amount}
                    </span>
                  </div>
                ))}
              </div>
              {/* Ghost timeline */}
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 12 }}>상세 내역</p>
              {([
                { month: '2025/11', items: [
                  { emoji: '🔧', label: '엔진오일 교체', date: '11/12', amount: '65,000원' },
                  { emoji: '🔩', label: '에어필터 교체', date: '11/12', amount: '18,000원' },
                ]},
                { month: '2025/09', items: [
                  { emoji: '🚗', label: '브레이크패드 교체', date: '09/04', amount: '95,000원' },
                ]},
              ] as { month: string; items: { emoji: string; label: string; date: string; amount: string }[] }[]).map(group => (
                <div key={group.month} style={{ marginBottom: 8 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', padding: '6px 0', marginBottom: 2 }}>
                    {group.month}
                  </p>
                  {group.items.map((item, idx) => (
                    <div key={idx} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 0', borderBottom: '1px solid var(--color-border)' }}>
                      <span style={{ fontSize: 20, lineHeight: 1, flexShrink: 0 }}>{item.emoji}</span>
                      <span style={{ flex: 1, fontSize: 14, color: 'var(--color-text-primary)', fontWeight: 500 }}>{item.label}</span>
                      <span style={{ fontSize: 12, color: 'var(--color-text-muted)', flexShrink: 0 }}>{item.date}</span>
                      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)', flexShrink: 0, minWidth: 80, textAlign: 'right' }}>{item.amount}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Year selector */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 16,
                marginBottom: 16,
              }}
            >
              <button
                onClick={() => setSelectedYear(y => y - 1)}
                aria-label="이전 연도"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--color-text-secondary)',
                  fontSize: 24,
                  lineHeight: 1,
                  padding: '8px 12px',
                }}
              >
                ‹
              </button>
              <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text-primary)', minWidth: 60, textAlign: 'center' }}>
                {selectedYear}
              </span>
              <button
                onClick={() => setSelectedYear(y => y + 1)}
                disabled={selectedYear >= new Date().getFullYear()}
                aria-label="다음 연도"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: selectedYear >= new Date().getFullYear() ? 'default' : 'pointer',
                  color: 'var(--color-text-secondary)',
                  fontSize: 24,
                  lineHeight: 1,
                  padding: '8px 12px',
                  opacity: selectedYear >= new Date().getFullYear() ? 0.25 : 1,
                }}
              >
                ›
              </button>
            </div>

            {/* Summary card */}
            <div
              style={{
                borderRadius: 16,
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                padding: '18px 20px',
                marginBottom: 16,
              }}
            >
              <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 6, fontWeight: 500 }}>
                {selectedYear}년 총 유지비
              </p>
              <p style={{ fontSize: 28, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 8, letterSpacing: '-0.5px' }}>
                {fmt(summary.total)}원
              </p>
              {summary.total > 0 && (
                <p style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                  정비·수리 {fmt(summary.maintenance)} · 그 외 {fmt(summary.other)}
                </p>
              )}
            </div>

            {/* Category breakdown */}
            {summary.total > 0 && (
              <div
                style={{
                  borderRadius: 16,
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  padding: '16px 20px',
                  marginBottom: 16,
                }}
              >
                {DISPLAY_CATS.filter(c => (catTotals[c.key] ?? 0) > 0).map(c => {
                  const amt = catTotals[c.key] ?? 0;
                  const pct = Math.round((amt / maxCat) * 100);
                  return (
                    <div key={c.key} style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ width: 90, fontSize: 13, color: 'var(--color-text-primary)', flexShrink: 0 }}>
                        {c.emoji} {c.label}
                      </span>
                      <div style={{ flex: 1, height: 8, borderRadius: 4, background: 'var(--color-border)', overflow: 'hidden' }}>
                        <div
                          style={{
                            height: '100%',
                            width: `${pct}%`,
                            borderRadius: 4,
                            background: 'var(--color-nav-active)',
                            transition: 'width 0.3s ease',
                          }}
                        />
                      </div>
                      <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', width: 80, textAlign: 'right', flexShrink: 0 }}>
                        {fmt(amt)}원
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Timeline */}
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 12 }}>상세 내역</p>

            {grouped.length === 0 ? (
              <div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '24px 0 20px' }}>
                  <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text-primary)', margin: 0 }}>
                    아직 지출 기록이 없어요
                  </p>
                  <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: 0 }}>
                    아래 버튼으로 첫 지출을 기록해보세요
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', letterSpacing: '0.06em' }}>예시</span>
                  <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
                </div>
                <div aria-hidden="true" style={{ opacity: 0.3, pointerEvents: 'none', userSelect: 'none' }}>
                  {([
                    { month: '2025/11', items: [
                      { emoji: '🔧', label: '엔진오일 교체', date: '11/12', amount: '65,000원' },
                      { emoji: '🔩', label: '에어필터 교체', date: '11/12', amount: '18,000원' },
                    ]},
                    { month: '2025/09', items: [
                      { emoji: '🚗', label: '브레이크패드 교체', date: '09/04', amount: '95,000원' },
                    ]},
                  ] as { month: string; items: { emoji: string; label: string; date: string; amount: string }[] }[]).map(group => (
                    <div key={group.month} style={{ marginBottom: 8 }}>
                      <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', padding: '6px 0', marginBottom: 2 }}>
                        {group.month}
                      </p>
                      {group.items.map((item, idx) => (
                        <div
                          key={idx}
                          style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            padding: '12px 0',
                            borderBottom: '1px solid var(--color-border)',
                          }}
                        >
                          <span style={{ fontSize: 20, lineHeight: 1, flexShrink: 0 }}>{item.emoji}</span>
                          <span style={{ flex: 1, fontSize: 14, color: 'var(--color-text-primary)', fontWeight: 500 }}>
                            {item.label}
                          </span>
                          <span style={{ fontSize: 12, color: 'var(--color-text-muted)', flexShrink: 0 }}>
                            {item.date}
                          </span>
                          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)', flexShrink: 0, minWidth: 80, textAlign: 'right' }}>
                            {item.amount}
                          </span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              grouped.map(([month, items]) => (
                <div key={month} style={{ marginBottom: 8 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', padding: '6px 0', marginBottom: 2 }}>
                    {month}
                  </p>
                  {items.map(item => (
                    <button
                      key={item.id}
                      onClick={() => {
                        if (item.type === 'expense' && item.rawExpense) setEditExpense(item.rawExpense);
                        if (item.type === 'log' && item.rawLog) setEditLog(item.rawLog);
                      }}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '12px 0',
                        background: 'none',
                        border: 'none',
                        borderBottom: '1px solid var(--color-border)',
                        cursor: 'pointer',
                        fontFamily: 'var(--font)',
                        textAlign: 'left',
                      }}
                    >
                      <span style={{ fontSize: 20, lineHeight: 1, flexShrink: 0 }}>{item.emoji}</span>
                      <span style={{ flex: 1, fontSize: 14, color: 'var(--color-text-primary)', fontWeight: 500 }}>
                        {item.label}
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--color-text-muted)', flexShrink: 0 }}>
                        {item.date.slice(5).replace('-', '/')}
                      </span>
                      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)', flexShrink: 0, minWidth: 80, textAlign: 'right' }}>
                        {fmt(item.amount)}원
                      </span>
                    </button>
                  ))}
                </div>
              ))
            )}
          </>
        )}
      </main>

      {/* Add button */}
      {carId && (
        <div
          style={{
            position: 'fixed',
            bottom: 'calc(56px + env(safe-area-inset-bottom, 0px) + 12px)',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 'calc(100% - 32px)',
            maxWidth: 358,
            zIndex: 90,
          }}
        >
          <button
            onClick={() => setShowAddSheet(true)}
            style={{
              width: '100%',
              padding: '14px 0',
              borderRadius: 12,
              border: 'none',
              background: 'var(--color-text-primary)',
              color: 'var(--color-bg)',
              fontSize: 15,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'var(--font)',
              boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
            }}
          >
            + 지출 추가
          </button>
        </div>
      )}

      <BottomNav activeTab="cost" />

      {showAddSheet && (
        <ExpenseSheet
          carId={carId}
          onSave={refresh}
          onClose={() => setShowAddSheet(false)}
        />
      )}

      {editExpense && (
        <EditExpenseSheet
          entry={editExpense}
          carId={carId}
          onSave={refresh}
          onClose={() => setEditExpense(null)}
        />
      )}

      {editLog && (
        <EditLogSheet
          entry={editLog}
          carId={carId}
          onSave={refresh}
          onClose={() => setEditLog(null)}
        />
      )}

      {showCarPicker && (
        <CarPickerSheet
          carList={carList}
          selectedCarId={carId}
          onSelect={handleCarSelect}
          onClose={() => setShowCarPicker(false)}
        />
      )}
    </div>
  );
}
