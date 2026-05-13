'use client';

import { useRef, useState, useEffect } from 'react';
import type { CarIndex } from '@/types';
import { getMileage } from '@/lib/storage';

interface Props {
  carList: CarIndex[];
  selectedCarId: string;
  currentMileage: number | null;
  onSelect: (carId: string) => void;
  onEditMileage: () => void;
  onAddCar: () => void;
}

function getCarImagePath(carId: string): string {
  const base = carId.replace(/-(?:gasoline|diesel)$/, '');
  return `/cars/images/${base}.png`;
}

const CAR_IMAGE_TUNING: Record<string, { scale: number; offsetX: number; offsetY: number }> = {
  'avante-md-gasoline': { scale: 0.97, offsetX: 0, offsetY: 1 },
  'grandeur-hg-gasoline': { scale: 0.95, offsetX: 0, offsetY: 2 },
  'rexton-sports-khan-diesel': { scale: 0.95, offsetX: 0, offsetY: 3 },
};

function getCarImageTuning(carId: string) {
  return CAR_IMAGE_TUNING[carId] ?? { scale: 1, offsetX: 0, offsetY: 2 };
}

function PencilIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function CarCarousel({ carList, selectedCarId, currentMileage, onSelect, onEditMileage, onAddCar }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // carList가 채워진 시점에 이미 올바른 인덱스로 초기화 (lazy init)
  const [activeIndex, setActiveIndex] = useState(() => {
    if (carList.length === 0) return 0;
    const idx = carList.findIndex(c => c.car_id === selectedCarId);
    return idx < 0 ? 0 : idx;
  });

  // 마운트 시 selectedCarId 카드로 초기 스크롤 (애니메이션 없음, setState 생략)
  useEffect(() => {
    if (!scrollRef.current || carList.length === 0) return;
    const idx = carList.findIndex(c => c.car_id === selectedCarId);
    const targetIdx = idx < 0 ? 0 : idx;
    if (targetIdx === 0) return;
    const card = cardRefs.current[targetIdx];
    if (!card) return;
    const el = scrollRef.current;
    el.scrollLeft = card.offsetLeft - (el.clientWidth - card.offsetWidth) / 2;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carList]);

  function handleScroll() {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const el = scrollRef.current;
      if (!el) return;
      const containerCenter = el.getBoundingClientRect().left + el.clientWidth / 2;
      let closestIdx = 0;
      let closestDist = Infinity;
      cardRefs.current.forEach((card, i) => {
        if (!card) return;
        const dist = Math.abs(card.getBoundingClientRect().left + card.offsetWidth / 2 - containerCenter);
        if (dist < closestDist) { closestDist = dist; closestIdx = i; }
      });
      setActiveIndex(closestIdx);
      if (closestIdx < carList.length) {
        const car = carList[closestIdx];
        if (car.car_id !== selectedCarId) onSelect(car.car_id);
      }
    }, 120);
  }

  function scrollToIndex(idx: number) {
    const card = cardRefs.current[idx];
    if (!card || !scrollRef.current) return;
    const el = scrollRef.current;
    el.scrollTo({ left: card.offsetLeft - (el.clientWidth - card.offsetWidth) / 2, behavior: 'smooth' });
  }

  function selectCard(idx: number, carId: string) {
    setActiveIndex(idx);
    onSelect(carId);
    scrollToIndex(idx);
  }

  if (carList.length === 0) return null;

  // 총 카드 수 = 차량 + Add Car 1개
  const totalCards = carList.length + 1;

  return (
    <div style={{ paddingBottom: 4 }}>
      {/* 스크롤 트랙 */}
      <div
        ref={scrollRef}
        className="car-carousel-track"
        role="region"
        aria-label="차량 선택 슬라이더"
        onScroll={handleScroll}
        style={{
          display: 'flex',
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
          gap: 12,
          padding: '8px 20px',
          position: 'relative',
          msOverflowStyle: 'none',
          scrollbarWidth: 'none',
        }}
      >
        {/* 차량 카드 */}
        {carList.map((car, i) => {
          const isActive = activeIndex === i;
          const cardMileage = isActive ? currentMileage : getMileage(car.car_id);
          const actionLabel = cardMileage === null ? '입력' : '수정';
          const imageTuning = getCarImageTuning(car.car_id);
          return (
            <div
              key={car.car_id}
              ref={el => { cardRefs.current[i] = el; }}
              role="button"
              tabIndex={isActive ? 0 : -1}
              aria-label={car.name_ko}
              aria-pressed={isActive}
              onClick={() => { selectCard(i, car.car_id); }}
              onKeyDown={e => {
                if (e.key === 'ArrowRight') scrollToIndex(Math.min(i + 1, totalCards - 1));
                if (e.key === 'ArrowLeft') scrollToIndex(Math.max(i - 1, 0));
              }}
              style={{
                flexShrink: 0,
                width: 'calc(100% - 40px)',
                scrollSnapAlign: 'center',
                overflow: 'hidden',
                minHeight: 168,
                padding: '20px 18px 18px',
                display: 'flex',
                flexDirection: 'column',
                gap: 0,
                background: 'var(--color-surface)',
                borderRadius: 20,
                border: isActive ? '2px solid rgba(17, 17, 17, 0.78)' : '1px solid var(--color-border)',
                boxShadow: isActive ? '0 8px 22px rgba(17,17,17,0.08)' : '0 6px 16px rgba(17,17,17,0.04)',
                opacity: isActive ? 1 : 0.74,
                transform: isActive ? 'scale(1)' : 'scale(0.985)',
                transition: 'opacity 0.2s ease, transform 0.2s ease, border 0.2s ease, box-shadow 0.2s ease',
                cursor: 'pointer',
                userSelect: 'none',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', minHeight: 128 }}>
                <p style={{
                  maxWidth: '100%',
                  minHeight: 46,
                  fontSize: 17,
                  fontWeight: 700,
                  color: 'var(--color-text-primary)',
                  lineHeight: 1.35,
                  letterSpacing: '-0.3px',
                  fontFamily: 'var(--font)',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}>
                  {car.name_ko}
                </p>

                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 10, marginTop: 'auto' }}>
                  <div style={{ flex: '1 1 auto', minWidth: 0, paddingRight: 4 }}>
                    <p style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: 'var(--color-text-secondary)',
                      lineHeight: 1.2,
                      letterSpacing: '-0.01em',
                      fontFamily: 'var(--font)',
                    }}>
                      주행거리
                    </p>

                    <div style={{ display: 'flex', alignItems: cardMileage !== null ? 'flex-end' : 'center', flexWrap: 'wrap', columnGap: 8, rowGap: 8, marginTop: 8 }}>
                      {cardMileage !== null ? (
                        <p
                          aria-label={`현재 주행거리 ${cardMileage.toLocaleString()}킬로미터`}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'flex-end',
                            gap: 4,
                            fontSize: 'clamp(28px, 8vw, 34px)',
                            fontWeight: 700,
                            color: 'var(--color-text-primary)',
                            lineHeight: 1,
                            letterSpacing: '-0.9px',
                            fontVariantNumeric: 'tabular-nums',
                            fontFamily: 'var(--font)',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {cardMileage.toLocaleString()}
                          <span style={{ display: 'inline-block', fontSize: 'clamp(14px, 3.8vw, 16px)', fontWeight: 600, letterSpacing: 0, color: 'var(--color-text-secondary)' }}>
                            km
                          </span>
                        </p>
                      ) : (
                        <p
                          aria-label="주행거리 미입력"
                          style={{
                            fontSize: 'clamp(26px, 7vw, 30px)',
                            fontWeight: 700,
                            color: 'var(--color-text-primary)',
                            lineHeight: 1,
                            letterSpacing: '-0.7px',
                            fontFamily: 'var(--font)',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          미입력
                        </p>
                      )}

                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          if (!isActive) {
                            selectCard(i, car.car_id);
                            return;
                          }
                          onEditMileage();
                        }}
                        aria-label={cardMileage === null ? '주행거리 입력' : '주행거리 수정'}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                          padding: '7px 11px',
                          border: `1px solid ${isActive ? 'rgba(17, 17, 17, 0.12)' : 'var(--color-border)'}`,
                          borderRadius: 999,
                          background: isActive ? 'rgba(248, 250, 252, 0.92)' : 'transparent',
                          cursor: 'pointer',
                          color: isActive ? 'var(--color-text-secondary)' : 'var(--color-text-muted)',
                          fontFamily: 'var(--font)',
                          fontSize: 12,
                          fontWeight: 600,
                          lineHeight: 1,
                          whiteSpace: 'nowrap',
                          flexShrink: 0,
                        }}
                      >
                        <PencilIcon />
                        {actionLabel}
                      </button>
                    </div>
                  </div>

                  <div style={{
                    flex: '0 0 clamp(118px, 33vw, 144px)',
                    width: 'clamp(118px, 33vw, 144px)',
                    height: 'clamp(72px, 21vw, 86px)',
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'flex-end',
                  }}>
                    <img
                      src={getCarImagePath(car.car_id)}
                      alt=""
                      onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        objectPosition: 'right bottom',
                        flexShrink: 0,
                        pointerEvents: 'none',
                        userSelect: 'none',
                        transform: `translate(${imageTuning.offsetX}px, ${imageTuning.offsetY}px) scale(${imageTuning.scale})`,
                        transformOrigin: 'right bottom',
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* 차량 추가 카드 */}
        <div
          ref={el => { cardRefs.current[carList.length] = el; }}
          role="button"
          tabIndex={activeIndex === carList.length ? 0 : -1}
          aria-label="차량 추가"
          onClick={onAddCar}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') onAddCar();
            if (e.key === 'ArrowLeft') scrollToIndex(carList.length - 1);
          }}
          style={{
            flexShrink: 0,
            width: 'calc(100% - 40px)',
            scrollSnapAlign: 'center',
            minHeight: 160,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            background: 'var(--color-surface)',
            borderRadius: 20,
            border: '2px dashed var(--color-border)',
            opacity: activeIndex === carList.length ? 1 : 0.6,
            transform: activeIndex === carList.length ? 'scale(1)' : 'scale(0.985)',
            transition: 'opacity 0.2s ease, transform 0.2s ease',
            cursor: 'pointer',
            userSelect: 'none',
          }}
        >
          <div style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            border: '2px dashed var(--color-text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-text-muted)',
            fontSize: 22,
            fontWeight: 300,
            lineHeight: 1,
          }}>
            +
          </div>
          <p style={{
            fontSize: 14,
            fontWeight: 500,
            color: 'var(--color-text-muted)',
            fontFamily: 'var(--font)',
          }}>
            차량 추가
          </p>
        </div>
      </div>

      {/* 도트 인디케이터 */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 5, paddingTop: 6 }}>
        {carList.map((_, i) => (
          <div
            key={i}
            style={{
              width: activeIndex === i ? 18 : 6,
              height: 6,
              borderRadius: 3,
              background: activeIndex === i ? 'var(--color-text-primary)' : 'var(--color-border)',
              transition: 'width 0.2s ease, background 0.2s ease',
            }}
          />
        ))}
      </div>
    </div>
  );
}
