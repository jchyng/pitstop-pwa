'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { CarData, ItemWithUrgency, LogType, CarIndex, InspectCondition } from '@/types';
import { calculateUrgency } from '@/lib/urgency';
import { getMileage, setMileage, getLastLog, getLastMileage, getLastLogType, getLastInspectCondition, getLastReplaceEntry, mergeItemWithCustom, getCustomInterval, getMyCars, addMyCar, removeMyCar, getHiddenItems, hideItem, unhideItem } from '@/lib/storage';
import BottomNav from '@/components/BottomNav';
import CarCarousel from '@/components/CarCarousel';
import CategorySection from '@/components/CategorySection';
import ConsumableCard from '@/components/ConsumableCard';
import MileageSheet from '@/components/MileageSheet';
import AddCarSheet from '@/components/AddCarSheet';
import BottomSheet from '@/components/BottomSheet';
import ViewToggle from '@/components/ViewToggle';
import LoadingSpinner from '@/components/LoadingSpinner';

interface ItemWithLog extends ItemWithUrgency {
  lastLoggedDate: string | null;
  lastLoggedMileage: number | null;
  lastLogType: LogType | null;
  lastInspectCondition: InspectCondition | null;
  lastReplaceDate: string | null;
  lastReplaceMileage: number | null;
  isCustom: boolean;
}

const CATEGORIES = [
  '엔진·오일',
  '연료·증발가스',
  '공조·외부',
  '제동·냉각·변속',
  '점화·벨트',
  '타이어·배터리',
] as const;

export default function Home() {
  const router = useRouter();
  const [carCatalog, setCarCatalog] = useState<CarIndex[]>([]);
  const [myCarIds, setMyCarIds] = useState<string[]>([]);
  const [selectedCarId, setSelectedCarId] = useState('');
  const [carData, setCarData] = useState<CarData | null>(null);
  const [currentMileage, setCurrentMileage] = useState<number | null>(null);
  const [view, setView] = useState<'attention' | 'full'>('full');
  const [showMileageSheet, setShowMileageSheet] = useState(false);
  const [showAddCarSheet, setShowAddCarSheet] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [customVersion, setCustomVersion] = useState(0);
  const [hiddenVersion, setHiddenVersion] = useState(0);
  const [hiddenExpanded, setHiddenExpanded] = useState(false);

  const carList = useMemo(
    () => carCatalog.filter(c => myCarIds.includes(c.car_id)),
    [carCatalog, myCarIds],
  );

  // 커스텀 주기 / 숨기기 변경 시 대시보드 갱신
  useEffect(() => {
    const refreshCustom = () => setCustomVersion(v => v + 1);
    const refreshHidden = () => setHiddenVersion(v => v + 1);
    window.addEventListener('pitstop_custom_changed', refreshCustom);
    window.addEventListener('pitstop_hidden_changed', refreshHidden);
    return () => {
      window.removeEventListener('pitstop_custom_changed', refreshCustom);
      window.removeEventListener('pitstop_hidden_changed', refreshHidden);
    };
  }, []);

  // 카탈로그 + 내 차량 목록 로드
  useEffect(() => {
    const savedMyCarIds = getMyCars();
    fetch('/cars/index.json')
      .then(r => r.json())
      .then((catalog: CarIndex[]) => {
        setCarCatalog(catalog);
        setMyCarIds(savedMyCarIds);
        const filtered = catalog.filter(c => savedMyCarIds.includes(c.car_id));
        const savedId = localStorage.getItem('pitstop_selected_car');
        const validId = filtered.find(c => c.car_id === savedId)?.car_id ?? filtered[0]?.car_id ?? '';
        setSelectedCarId(validId);
        if (!validId) setIsLoading(false);
      });
  }, []);

  // 선택 차량 데이터 로드
  useEffect(() => {
    if (!selectedCarId) return;
    let cancelled = false;
    fetch(`/cars/${selectedCarId}.json`)
      .then(r => r.json())
      .then(data => {
        if (!cancelled) {
          setCarData(data);
          setIsLoading(false);
        }
      });

    const mileage = getMileage(selectedCarId);
    // 두 setState를 비동기 마이크로태스크로 묶어 연속 렌더링 방지
    Promise.resolve().then(() => {
      if (!cancelled) {
        setCurrentMileage(mileage);
      }
    });

    return () => { cancelled = true; };
  }, [selectedCarId]);

  const itemsWithLog = useMemo<ItemWithLog[]>(() => {
    if (!carData) return [];
    return carData.items.map(item => {
      const mergedItem = mergeItemWithCustom(selectedCarId, item);
      const lastLoggedDate = getLastLog(selectedCarId, item.id);
      const lastLoggedMileage = getLastMileage(selectedCarId, item.id);
      const lastLogType = getLastLogType(selectedCarId, item.id);
      // 마지막 기록이 교체면 점검 컨디션 무효화 (교체로 해결됨)
      const lastInspectCondition = lastLogType === 'replace' ? null : getLastInspectCondition(selectedCarId, item.id);
      const isCustom = !!getCustomInterval(selectedCarId, item.id);
      const lastReplaceEntry = item.item_type === 'inspect' ? getLastReplaceEntry(selectedCarId, item.id) : null;
      const lastReplaceDate = lastReplaceEntry?.date ?? null;
      const lastReplaceMileage = lastReplaceEntry?.mileage ?? null;
      const urgency = calculateUrgency({
        item: mergedItem,
        currentMileage,
        lastLoggedMileage,
        lastLoggedDate,
        lastInspectCondition,
      });
      return { item: mergedItem, urgency, lastLoggedDate, lastLoggedMileage, lastLogType, lastInspectCondition, lastReplaceDate, lastReplaceMileage, isCustom };
    });
  }, [carData, currentMileage, selectedCarId, customVersion]);

  const hiddenIds = useMemo(
    () => selectedCarId ? getHiddenItems(selectedCarId) : new Set<string>(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedCarId, hiddenVersion],
  );

  const visibleItems = useMemo(
    () => itemsWithLog.filter(x => !hiddenIds.has(x.item.id)),
    [itemsWithLog, hiddenIds],
  );

  const hiddenItemsList = useMemo(
    () => itemsWithLog.filter(x => hiddenIds.has(x.item.id)),
    [itemsWithLog, hiddenIds],
  );

  const overdueItems = useMemo(
    () => visibleItems.filter(x => x.urgency.status === 'overdue'),
    [visibleItems],
  );
  const cautionItems = useMemo(
    () => visibleItems.filter(x => x.urgency.status === 'caution'),
    [visibleItems],
  );
  const warningItems = useMemo(
    () => visibleItems.filter(x => x.urgency.status === 'warning'),
    [visibleItems],
  );

  const attentionItems = useMemo(() => {
    return [...overdueItems, ...cautionItems, ...warningItems].sort((a, b) => {
      const ra = a.urgency.ratio ?? Infinity;
      const rb = b.urgency.ratio ?? Infinity;
      return ra - rb;
    });
  }, [overdueItems, cautionItems, warningItems]);

  const byCategory = useMemo(() => {
    return CATEGORIES.map(cat => ({
      category: cat,
      items: visibleItems.filter(x => x.item.category === cat),
    }));
  }, [visibleItems]);

  function handleCarSelect(carId: string) {
    const nextMileage = getMileage(carId);
    setSelectedCarId(carId);
    setCurrentMileage(nextMileage);
    localStorage.setItem('pitstop_selected_car', carId);
  }

  function handleAddCar(carId: string) {
    addMyCar(carId);
    setMyCarIds(prev => prev.includes(carId) ? prev : [...prev, carId]);
    handleCarSelect(carId);
  }

  function handleDeleteCar(carId: string) {
    setDeleteTargetId(carId);
  }

  function handleConfirmDelete() {
    if (!deleteTargetId) return;
    removeMyCar(deleteTargetId);
    const nextIds = myCarIds.filter(id => id !== deleteTargetId);
    setMyCarIds(nextIds);
    if (selectedCarId === deleteTargetId) {
      const nextCar = carCatalog.find(c => nextIds.includes(c.car_id));
      const nextId = nextCar?.car_id ?? '';
      setSelectedCarId(nextId);
      if (nextId) {
        setCurrentMileage(getMileage(nextId));
        localStorage.setItem('pitstop_selected_car', nextId);
      } else {
        setCurrentMileage(null);
        localStorage.removeItem('pitstop_selected_car');
      }
    }
    setDeleteTargetId(null);
  }

  function handleMileageSave(mileage: number) {
    setMileage(selectedCarId, mileage);
    setCurrentMileage(mileage);
  }

  const overdueSorted = useMemo(
    () => [...overdueItems].sort((a, b) => (a.urgency.ratio ?? -Infinity) - (b.urgency.ratio ?? -Infinity)),
    [overdueItems],
  );
  const cautionSorted = useMemo(
    () => [...cautionItems].sort((a, b) => (a.urgency.ratio ?? -Infinity) - (b.urgency.ratio ?? -Infinity)),
    [cautionItems],
  );
  const warningSorted = useMemo(
    () => [...warningItems].sort((a, b) => (a.urgency.ratio ?? Infinity) - (b.urgency.ratio ?? Infinity)),
    [warningItems],
  );

  if (isLoading) {
    return (
      <div
        style={{
          maxWidth: 390,
          margin: '0 auto',
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--color-bg)',
        }}
      >
        <h1
          style={{
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: '-0.5px',
            userSelect: 'none',
          }}
        >
          <span style={{ color: 'var(--color-nav-active)' }}>P</span>itstop
        </h1>
        <div style={{ marginTop: 24 }}>
          <LoadingSpinner size={26} />
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: 390,
        margin: '0 auto',
        height: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--color-bg)',
        borderLeft: '1px solid transparent',
        borderRight: '1px solid transparent',
      }}
    >
      {/* Header */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '16px var(--page-pad) 12px',
        }}
        role="banner"
      >
        <h1
          style={{
            flex: 1,
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: '-0.5px',
            userSelect: 'none',
          }}
        >
          <span style={{ color: 'var(--color-nav-active)' }}>P</span>itstop
        </h1>
        {selectedCarId && (
          <button
            onClick={() => router.push('/guide')}
            aria-label="정비 주기 가이드"
            style={{
              width: 36,
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid var(--color-border)',
              borderRadius: 10,
              background: 'none',
              cursor: 'pointer',
              color: 'var(--color-text-secondary)',
            }}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <rect x="4" y="3" width="13" height="18" rx="2" stroke="currentColor" strokeWidth="1.8" />
              <path d="M8 8h6M8 12h6M8 16h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </header>

      {/* Car carousel */}
      <CarCarousel
        carList={carList}
        selectedCarId={selectedCarId}
        currentMileage={currentMileage}
        onSelect={handleCarSelect}
        onEditMileage={() => setShowMileageSheet(true)}
        onAddCar={() => setShowAddCarSheet(true)}
        onDeleteCar={handleDeleteCar}
      />

      {selectedCarId && (
        <div style={{ padding: '0 var(--page-pad)' }}>
          <ViewToggle view={view} attentionCount={attentionItems.length} onChange={setView} />
        </div>
      )}

      {/* Main content */}
      <main
        id="main-content"
        role="main"
        style={{
          flex: 1,
          padding: '0 var(--page-pad) 0',
          paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))',
          overflowY: 'auto',
        }}
      >
        {/* 차량 미등록 상태 */}
        {!selectedCarId && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '48px 0 60px',
              gap: 0,
            }}
          >
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden="true" style={{ marginBottom: 16, opacity: 0.18 }}>
              <rect x="6" y="22" width="52" height="26" rx="8" stroke="var(--color-text-primary)" strokeWidth="3" />
              <path d="M14 22l6-12h24l6 12" stroke="var(--color-text-primary)" strokeWidth="3" strokeLinejoin="round" />
              <circle cx="18" cy="48" r="6" stroke="var(--color-text-primary)" strokeWidth="3" />
              <circle cx="46" cy="48" r="6" stroke="var(--color-text-primary)" strokeWidth="3" />
              <path d="M6 34h52" stroke="var(--color-text-primary)" strokeWidth="2" strokeDasharray="4 3" />
            </svg>
            <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text-primary)', letterSpacing: '-0.3px', marginBottom: 6 }}>
              등록된 차량이 없습니다
            </p>
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 24 }}>
              내 차량을 등록하면 소모품 교체 주기를 관리할 수 있어요
            </p>
            <button
              type="button"
              onClick={() => setShowAddCarSheet(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '12px 24px',
                background: 'var(--color-nav-active)',
                color: '#fff',
                border: 'none',
                borderRadius: 999,
                fontSize: 14,
                fontWeight: 700,
                fontFamily: 'var(--font)',
                cursor: 'pointer',
                letterSpacing: '-0.2px',
              }}
            >
              + 차량 등록
            </button>
          </div>
        )}

        {/* 차량 등록 시 소모품 목록 */}
        {selectedCarId && (
          <>
            {/* View: 봐야 할 항목 */}
            {view === 'attention' && (
              <div id="view-attention" role="tabpanel" aria-label="봐야 할 항목">
                {attentionItems.length === 0 ? (
                  <p
                    style={{
                      textAlign: 'center',
                      color: 'var(--color-text-muted)',
                      fontSize: 14,
                      padding: '40px 0',
                    }}
                  >
                    {currentMileage === null
                      ? '주행거리를 입력하면 점검 항목이 표시됩니다.'
                      : '확인이 필요한 항목이 없습니다.'}
                  </p>
                ) : (
                  <>
                    {overdueSorted.length > 0 && (
                      <section aria-labelledby="attn-overdue">
                        <p
                          id="attn-overdue"
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            color: 'var(--color-overdue-sub)',
                            letterSpacing: '0.07em',
                            textTransform: 'uppercase',
                            marginBottom: 8,
                          }}
                        >
                          과기한
                        </p>
                        <ul style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 0 }} role="list">
                          {overdueSorted.map(x => (
                            <ConsumableCard
                              key={x.item.id}
                              item={x.item}
                              urgency={x.urgency}
                              currentMileage={currentMileage}
                              lastLoggedDate={x.lastLoggedDate}
                              lastLoggedMileage={x.lastLoggedMileage}
                              lastLogType={x.lastLogType}
                              lastInspectCondition={x.lastInspectCondition}
                              lastReplaceDate={x.lastReplaceDate}
                              lastReplaceMileage={x.lastReplaceMileage}
                              isCustom={x.isCustom}
                              onClick={() => router.push(`/items/${x.item.id}`)}
                              onHide={() => hideItem(selectedCarId, x.item.id)}
                            />
                          ))}
                        </ul>
                      </section>
                    )}

                    {cautionSorted.length > 0 && (
                      <section style={{ marginTop: overdueSorted.length > 0 ? 22 : 0 }} aria-labelledby="attn-caution">
                        <p
                          id="attn-caution"
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            color: 'var(--color-caution-text)',
                            letterSpacing: '0.07em',
                            textTransform: 'uppercase',
                            marginBottom: 8,
                          }}
                        >
                          주의
                        </p>
                        <ul style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 0 }} role="list">
                          {cautionSorted.map(x => (
                            <ConsumableCard
                              key={x.item.id}
                              item={x.item}
                              urgency={x.urgency}
                              currentMileage={currentMileage}
                              lastLoggedDate={x.lastLoggedDate}
                              lastLoggedMileage={x.lastLoggedMileage}
                              lastLogType={x.lastLogType}
                              lastInspectCondition={x.lastInspectCondition}
                              lastReplaceDate={x.lastReplaceDate}
                              lastReplaceMileage={x.lastReplaceMileage}
                              isCustom={x.isCustom}
                              onClick={() => router.push(`/items/${x.item.id}`)}
                              onHide={() => hideItem(selectedCarId, x.item.id)}
                            />
                          ))}
                        </ul>
                      </section>
                    )}

                    {warningSorted.length > 0 && (
                      <section style={{ marginTop: (overdueSorted.length > 0 || cautionSorted.length > 0) ? 22 : 0 }} aria-labelledby="attn-warning">
                        <p
                          id="attn-warning"
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            color: 'var(--color-warning-text)',
                            letterSpacing: '0.07em',
                            textTransform: 'uppercase',
                            marginBottom: 8,
                          }}
                        >
                          교체 임박
                        </p>
                        <ul style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 0 }} role="list">
                          {warningSorted.map(x => (
                            <ConsumableCard
                              key={x.item.id}
                              item={x.item}
                              urgency={x.urgency}
                              currentMileage={currentMileage}
                              lastLoggedDate={x.lastLoggedDate}
                              lastLoggedMileage={x.lastLoggedMileage}
                              lastLogType={x.lastLogType}
                              lastInspectCondition={x.lastInspectCondition}
                              lastReplaceDate={x.lastReplaceDate}
                              lastReplaceMileage={x.lastReplaceMileage}
                              isCustom={x.isCustom}
                              onClick={() => router.push(`/items/${x.item.id}`)}
                              onHide={() => hideItem(selectedCarId, x.item.id)}
                            />
                          ))}
                        </ul>
                      </section>
                    )}
                  </>
                )}
              </div>
            )}

            {/* View: 전체보기 */}
            {view === 'full' && (
              <div id="view-all" role="tabpanel" aria-label="전체보기" style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
                {byCategory.map(({ category, items }) => (
                  <CategorySection
                    key={category}
                    category={category}
                    items={items}
                    currentMileage={currentMileage}
                    onCardClick={(x) => router.push(`/items/${x.item.id}`)}
                    onHide={(x) => hideItem(selectedCarId, x.item.id)}
                  />
                ))}

                {/* 숨긴 항목 — 접이식 섹션 */}
                {hiddenItemsList.length > 0 && (
                  <section>
                    <button
                      type="button"
                      onClick={() => setHiddenExpanded(v => !v)}
                      aria-expanded={hiddenExpanded}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        width: '100%',
                        padding: '4px 0 8px',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontFamily: 'var(--font)',
                        textAlign: 'left',
                      }}
                    >
                      <span style={{
                        fontSize: 11.5,
                        fontWeight: 600,
                        color: 'var(--color-text-muted)',
                        letterSpacing: '0.07em',
                        textTransform: 'uppercase',
                      }}>
                        숨긴 항목
                      </span>
                      <span style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: 'var(--color-text-muted)',
                        background: 'var(--color-surface-hover)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 10,
                        padding: '1px 7px',
                      }}>
                        {hiddenItemsList.length}
                      </span>
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        aria-hidden="true"
                        style={{
                          marginLeft: 'auto',
                          color: 'var(--color-text-muted)',
                          transform: hiddenExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.2s ease',
                          flexShrink: 0,
                        }}
                      >
                        <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>

                    {hiddenExpanded && (
                      <ul style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 0 }} role="list">
                        {hiddenItemsList.map(x => (
                          <li
                            key={x.item.id}
                            style={{
                              listStyle: 'none',
                              display: 'flex',
                              alignItems: 'center',
                              padding: '10px 14px 10px 15px',
                              background: 'var(--color-surface)',
                              border: '1px solid var(--color-border)',
                              borderRadius: 'var(--radius-card)',
                              gap: 10,
                              opacity: 0.55,
                            }}
                          >
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{
                                fontSize: 15,
                                fontWeight: 600,
                                color: 'var(--color-text-primary)',
                                margin: 0,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}>
                                {x.item.name_ko}
                              </p>
                              <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: '2px 0 0' }}>
                                {x.item.category}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => unhideItem(selectedCarId, x.item.id)}
                              aria-label={`${x.item.name_ko} 다시 표시`}
                              style={{
                                width: 36,
                                height: 36,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: '1px solid var(--color-border)',
                                borderRadius: 10,
                                background: 'var(--color-bg)',
                                cursor: 'pointer',
                                color: 'var(--color-text-secondary)',
                                flexShrink: 0,
                              }}
                            >
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
                              </svg>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                )}
              </div>
            )}
          </>
        )}
      </main>

      <BottomNav activeTab="home" />

      {showMileageSheet && (
        <MileageSheet
          currentMileage={currentMileage}
          onSave={handleMileageSave}
          onClose={() => setShowMileageSheet(false)}
        />
      )}

      {showAddCarSheet && (
        <AddCarSheet
          catalog={carCatalog}
          myCarIds={myCarIds}
          onAdd={handleAddCar}
          onClose={() => setShowAddCarSheet(false)}
        />
      )}

      {deleteTargetId && (() => {
        const targetCar = carList.find(c => c.car_id === deleteTargetId);
        return (
          <BottomSheet onClose={() => setDeleteTargetId(null)} ariaLabel="차량 삭제 확인">
            <p style={{ fontSize: 17, fontWeight: 700, color: 'var(--color-text-primary)', letterSpacing: '-0.3px', marginBottom: 8 }}>
              차량을 삭제할까요?
            </p>
            <p style={{ fontSize: 14, color: 'var(--color-text-muted)', marginBottom: 28, lineHeight: 1.5 }}>
              {targetCar?.name_ko ?? ''} 차량과 관련된 정비 이력이 모두 삭제됩니다.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={() => setDeleteTargetId(null)}
                style={{
                  flex: 1,
                  padding: '14px',
                  border: '1px solid var(--color-border)',
                  borderRadius: 12,
                  background: 'var(--color-surface)',
                  fontSize: 15,
                  fontWeight: 600,
                  color: 'var(--color-text-primary)',
                  cursor: 'pointer',
                  fontFamily: 'var(--font)',
                }}
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                style={{
                  flex: 1,
                  padding: '14px',
                  border: 'none',
                  borderRadius: 12,
                  background: 'var(--color-overdue-sub)',
                  fontSize: 15,
                  fontWeight: 700,
                  color: '#fff',
                  cursor: 'pointer',
                  fontFamily: 'var(--font)',
                }}
              >
                삭제
              </button>
            </div>
          </BottomSheet>
        );
      })()}

    </div>
  );
}
