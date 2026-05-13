'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { CarData, ItemWithUrgency, LogType } from '@/types';
import { calculateUrgency } from '@/lib/urgency';
import { getMileage, setMileage, getLastLog, getLastMileage, getLastLogType } from '@/lib/storage';
import BottomNav from '@/components/BottomNav';
import CarChip from '@/components/CarChip';
import CarHero from '@/components/CarHero';
import CategorySection from '@/components/CategorySection';
import ConsumableCard from '@/components/ConsumableCard';
import MileageSheet from '@/components/MileageSheet';
import ViewToggle from '@/components/ViewToggle';

interface CarIndex {
  car_id: string;
  name_ko: string;
  file: string;
}

interface ItemWithLog extends ItemWithUrgency {
  lastLoggedDate: string | null;
  lastLoggedMileage: number | null;
  lastLogType: LogType | null;
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
  const [carList, setCarList] = useState<CarIndex[]>([]);
  const [selectedCarId, setSelectedCarId] = useState('avante-md-gasoline');
  const [carData, setCarData] = useState<CarData | null>(null);
  const [currentMileage, setCurrentMileage] = useState<number | null>(null);
  const [view, setView] = useState<'attention' | 'full'>('full');
  const [showMileageSheet, setShowMileageSheet] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 차종 목록 로드
  useEffect(() => {
    fetch('/cars/index.json')
      .then(r => r.json())
      .then((list: CarIndex[]) => {
        setCarList(list);
        // 저장된 선택 차량 복원
        const saved = localStorage.getItem('pitstop_selected_car');
        if (saved && list.some(c => c.car_id === saved)) {
          setSelectedCarId(saved);
        }
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
        setShowMileageSheet(mileage === null);
      }
    });

    return () => { cancelled = true; };
  }, [selectedCarId]);

  const itemsWithLog = useMemo<ItemWithLog[]>(() => {
    if (!carData) return [];
    return carData.items.map(item => {
      const lastLoggedDate = getLastLog(selectedCarId, item.id);
      const lastLoggedMileage = getLastMileage(selectedCarId, item.id);
      const lastLogType = getLastLogType(selectedCarId, item.id);
      const urgency = calculateUrgency({ item, currentMileage, lastLoggedMileage, lastLoggedDate });
      return { item, urgency, lastLoggedDate, lastLoggedMileage, lastLogType };
    });
  }, [carData, currentMileage, selectedCarId]);

  const overdueItems = useMemo(
    () => itemsWithLog.filter(x => x.urgency.status === 'overdue'),
    [itemsWithLog],
  );
  const urgentItems = useMemo(
    () => itemsWithLog.filter(x => x.urgency.status === 'urgent'),
    [itemsWithLog],
  );

  const attentionItems = useMemo(() => {
    return [...overdueItems, ...urgentItems].sort((a, b) => {
      const ra = a.urgency.ratio ?? Infinity;
      const rb = b.urgency.ratio ?? Infinity;
      return ra - rb;
    });
  }, [overdueItems, urgentItems]);

  const byCategory = useMemo(() => {
    return CATEGORIES.map(cat => ({
      category: cat,
      items: itemsWithLog.filter(x => x.item.category === cat),
    }));
  }, [itemsWithLog]);

  function handleCarSelect(carId: string) {
    setSelectedCarId(carId);
    localStorage.setItem('pitstop_selected_car', carId);
  }

  function handleMileageSave(mileage: number) {
    setMileage(selectedCarId, mileage);
    setCurrentMileage(mileage);
  }

  const overdueSorted = useMemo(
    () => [...overdueItems].sort((a, b) => (a.urgency.ratio ?? -Infinity) - (b.urgency.ratio ?? -Infinity)),
    [overdueItems],
  );
  const urgentSorted = useMemo(
    () => [...urgentItems].sort((a, b) => (a.urgency.ratio ?? Infinity) - (b.urgency.ratio ?? Infinity)),
    [urgentItems],
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
        <div
          style={{
            marginTop: 24,
            width: 26,
            height: 26,
            border: '2.5px solid var(--color-border)',
            borderTop: '2.5px solid var(--color-nav-active)',
            borderRadius: '50%',
            animation: 'pitstop-spin 0.75s linear infinite',
          }}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: 390,
        margin: '0 auto',
        minHeight: '100dvh',
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
          justifyContent: 'space-between',
          padding: '16px var(--page-pad) 12px',
        }}
        role="banner"
      >
        <h1
          style={{
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: '-0.5px',
            userSelect: 'none',
          }}
        >
          <span style={{ color: 'var(--color-nav-active)' }}>P</span>itstop
        </h1>
        <CarChip
          cars={carList}
          selectedCarId={selectedCarId}
          onSelect={handleCarSelect}
        />
      </header>

      {/* Car hero */}
      <div style={{ padding: '8px var(--page-pad) 4px' }}>
        <CarHero
          carId={selectedCarId}
          carName={carData?.name_ko ?? carList.find(c => c.car_id === selectedCarId)?.name_ko ?? ''}
          currentMileage={currentMileage}
          onEditClick={() => setShowMileageSheet(true)}
        />
      </div>

      {/* Main content */}
      <main
        id="main-content"
        role="main"
        style={{
          flex: 1,
          padding: '12px var(--page-pad) 0',
          paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))',
          overflowY: 'auto',
        }}
      >
        {/* View toggle */}
        <ViewToggle
          view={view}
          attentionCount={attentionItems.length}
          onChange={setView}
        />

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
                          onClick={() => router.push(`/items/${x.item.id}`)}
                        />
                      ))}
                    </ul>
                  </section>
                )}

                {urgentSorted.length > 0 && (
                  <section style={{ marginTop: overdueSorted.length > 0 ? 22 : 0 }} aria-labelledby="attn-urgent">
                    <p
                      id="attn-urgent"
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: 'var(--color-urgent-text)',
                        letterSpacing: '0.07em',
                        textTransform: 'uppercase',
                        marginBottom: 8,
                      }}
                    >
                      교체 임박
                    </p>
                    <ul style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 0 }} role="list">
                      {urgentSorted.map(x => (
                        <ConsumableCard
                          key={x.item.id}
                          item={x.item}
                          urgency={x.urgency}
                          currentMileage={currentMileage}
                          lastLoggedDate={x.lastLoggedDate}
                          lastLoggedMileage={x.lastLoggedMileage}
                          lastLogType={x.lastLogType}
                          onClick={() => router.push(`/items/${x.item.id}`)}
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
          <div id="view-all" role="tabpanel" aria-label="전체보기">
            {byCategory.map(({ category, items }) => (
              <CategorySection
                key={category}
                category={category}
                items={items}
                currentMileage={currentMileage}
                onCardClick={(x) => router.push(`/items/${x.item.id}`)}
              />
            ))}
          </div>
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

    </div>
  );
}
