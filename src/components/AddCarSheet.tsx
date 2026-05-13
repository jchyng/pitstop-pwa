'use client';

import { useState, useMemo } from 'react';
import type { CarIndex } from '@/types';
import BottomSheet from '@/components/BottomSheet';

const FUEL_LABEL: Record<string, string> = {
  gasoline: '가솔린',
  diesel: '디젤',
  lpg: 'LPG',
  hev: 'HEV',
  ev: 'EV',
};

const BRANDS = ['현대', '기아', 'KGM'] as const;

type Step = 1 | 2 | 3 | 4;

interface Props {
  catalog: CarIndex[];
  myCarIds: string[];
  onAdd: (carId: string) => void;
  onClose: () => void;
}

function ChevronLeft() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

export default function AddCarSheet({ catalog, myCarIds, onAdd, onClose }: Props) {
  const [step, setStep] = useState<Step>(1);
  const [brand, setBrand] = useState<string | null>(null);
  const [modelName, setModelName] = useState<string | null>(null);
  const [model, setModel] = useState<string | null>(null);
  const [fuel, setFuel] = useState<string | null>(null);
  const [modelSearch, setModelSearch] = useState('');

  const modelNamesForBrand = useMemo(
    () => brand ? [...new Set(catalog.filter(c => c.brand === brand).map(c => c.model_name))] : [],
    [catalog, brand],
  );

  const modelsForModelName = useMemo(
    () => (brand && modelName)
      ? [...new Set(catalog.filter(c => c.brand === brand && c.model_name === modelName).map(c => c.model))]
      : [],
    [catalog, brand, modelName],
  );

  const fuelsForModel = useMemo(
    () => (brand && modelName && model)
      ? catalog.filter(c => c.brand === brand && c.model_name === modelName && c.model === model).map(c => c.fuel)
      : [],
    [catalog, brand, modelName, model],
  );

  const selectedCar = useMemo(
    () => (brand && modelName && model && fuel)
      ? (catalog.find(c => c.brand === brand && c.model_name === modelName && c.model === model && c.fuel === fuel) ?? null)
      : null,
    [catalog, brand, modelName, model, fuel],
  );

  function selectBrand(b: string) {
    setBrand(b); setModelName(null); setModel(null); setFuel(null); setModelSearch('');
    setStep(2);
  }

  function selectModelName(mn: string) {
    setModelName(mn); setModel(null); setFuel(null);
    setStep(3);
  }

  function selectModel(m: string) {
    setModel(m); setFuel(null);
    setStep(4);
  }

  function goBack() {
    if (step === 2) { setBrand(null); setModelSearch(''); setStep(1); }
    else if (step === 3) { setModelName(null); setStep(2); }
    else if (step === 4) { setModel(null); setFuel(null); setStep(3); }
  }

  function handleAdd() {
    if (!selectedCar) return;
    onAdd(selectedCar.car_id);
    onClose();
  }

  const stepTitle = step === 1 ? '브랜드 선택' : step === 2 ? '차종 선택' : step === 3 ? '세대 선택' : '연료 선택';

  // 세대(model)가 선택되면 model_name은 model에 포함되므로 생략
  const breadcrumb = model
    ? [brand, model].filter(Boolean).join(' · ')
    : [brand, modelName].filter(Boolean).join(' · ');

  return (
    <BottomSheet onClose={onClose} ariaLabel="차량 등록">
      {/* 헤더 */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {step > 1 && (
            <button
              type="button"
              onClick={goBack}
              aria-label="이전 단계"
              style={{
                background: 'none',
                border: 'none',
                padding: '4px 8px 4px 0',
                cursor: 'pointer',
                color: 'var(--color-text-secondary)',
                display: 'flex',
                alignItems: 'center',
                flexShrink: 0,
              }}
            >
              <ChevronLeft />
            </button>
          )}
          <p style={{ fontSize: 17, fontWeight: 700, color: 'var(--color-text-primary)', letterSpacing: '-0.3px' }}>
            {stepTitle}
          </p>
        </div>
        {breadcrumb && (
          <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4, paddingLeft: step > 1 ? 26 : 0 }}>
            {breadcrumb}
          </p>
        )}
      </div>

      {/* Step 1: 브랜드 */}
      {step === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {BRANDS.map(b => {
            const hasModels = catalog.some(c => c.brand === b);
            return (
              <button
                key={b}
                type="button"
                onClick={() => hasModels && selectBrand(b)}
                disabled={!hasModels}
                style={{
                  padding: '14px 16px',
                  border: '1px solid var(--color-border)',
                  borderRadius: 12,
                  background: 'var(--color-surface)',
                  cursor: hasModels ? 'pointer' : 'default',
                  textAlign: 'left',
                  fontSize: 15,
                  fontWeight: 600,
                  color: hasModels ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                  fontFamily: 'var(--font)',
                  opacity: hasModels ? 1 : 0.4,
                }}
              >
                {b}
                {!hasModels && (
                  <span style={{ fontSize: 12, fontWeight: 400, marginLeft: 8 }}>준비 중</span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Step 2: 차종(모델명) */}
      {step === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input
            type="search"
            placeholder="차종 검색"
            value={modelSearch}
            onChange={e => setModelSearch(e.target.value)}
            autoFocus
            style={{
              width: '100%',
              padding: '10px 14px',
              border: '1px solid var(--color-border)',
              borderRadius: 10,
              background: 'var(--color-surface)',
              fontSize: 15,
              color: 'var(--color-text-primary)',
              fontFamily: 'var(--font)',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          <div style={{ maxHeight: 320, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {modelNamesForBrand.filter(mn => mn.includes(modelSearch)).map(mn => {
            const carsForModelName = catalog.filter(c => c.brand === brand && c.model_name === mn);
            const allAdded = carsForModelName.every(c => myCarIds.includes(c.car_id));
            return (
              <button
                key={mn}
                type="button"
                onClick={() => !allAdded && selectModelName(mn)}
                disabled={allAdded}
                style={{
                  padding: '14px 16px',
                  border: '1px solid var(--color-border)',
                  borderRadius: 12,
                  background: 'var(--color-surface)',
                  cursor: allAdded ? 'default' : 'pointer',
                  textAlign: 'left',
                  fontSize: 15,
                  fontWeight: 600,
                  color: allAdded ? 'var(--color-text-muted)' : 'var(--color-text-primary)',
                  fontFamily: 'var(--font)',
                  opacity: allAdded ? 0.4 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span>{mn}</span>
                {allAdded && <span style={{ fontSize: 12, fontWeight: 400 }}>추가됨</span>}
              </button>
            );
          })}
          {modelNamesForBrand.filter(mn => mn.includes(modelSearch)).length === 0 && (
            <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 14, padding: '20px 0' }}>
              검색 결과가 없습니다
            </p>
          )}
          </div>
        </div>
      )}

      {/* Step 3: 세대 */}
      {step === 3 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {modelsForModelName.map(m => {
            const carsForModel = catalog.filter(c => c.brand === brand && c.model_name === modelName && c.model === m);
            const allAdded = carsForModel.every(c => myCarIds.includes(c.car_id));
            return (
              <button
                key={m}
                type="button"
                onClick={() => !allAdded && selectModel(m)}
                disabled={allAdded}
                style={{
                  padding: '14px 16px',
                  border: '1px solid var(--color-border)',
                  borderRadius: 12,
                  background: 'var(--color-surface)',
                  cursor: allAdded ? 'default' : 'pointer',
                  textAlign: 'left',
                  fontSize: 15,
                  fontWeight: 600,
                  color: allAdded ? 'var(--color-text-muted)' : 'var(--color-text-primary)',
                  fontFamily: 'var(--font)',
                  opacity: allAdded ? 0.4 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span>{m}</span>
                {allAdded && <span style={{ fontSize: 12, fontWeight: 400 }}>추가됨</span>}
              </button>
            );
          })}
        </div>
      )}

      {/* Step 4: 연료 */}
      {step === 4 && (
        <>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 24 }}>
            {fuelsForModel.map(f => {
              const carForFuel = catalog.find(c => c.brand === brand && c.model_name === modelName && c.model === model && c.fuel === f);
              const alreadyAdded = carForFuel ? myCarIds.includes(carForFuel.car_id) : false;
              const isSelected = fuel === f;
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => !alreadyAdded && setFuel(f)}
                  disabled={alreadyAdded}
                  style={{
                    padding: '10px 20px',
                    border: `1.5px solid ${isSelected ? 'var(--color-nav-active)' : 'var(--color-border)'}`,
                    borderRadius: 999,
                    background: isSelected ? 'var(--color-nav-active)' : 'var(--color-surface)',
                    cursor: alreadyAdded ? 'default' : 'pointer',
                    fontSize: 14,
                    fontWeight: 600,
                    color: isSelected ? '#fff' : alreadyAdded ? 'var(--color-text-muted)' : 'var(--color-text-primary)',
                    fontFamily: 'var(--font)',
                    opacity: alreadyAdded ? 0.4 : 1,
                    transition: 'all 0.15s',
                  }}
                >
                  {FUEL_LABEL[f] ?? f}
                  {alreadyAdded && ' (추가됨)'}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={handleAdd}
            disabled={!selectedCar}
            style={{
              width: '100%',
              padding: '14px',
              border: 'none',
              borderRadius: 12,
              background: selectedCar ? 'var(--color-nav-active)' : 'var(--color-border)',
              color: selectedCar ? '#fff' : 'var(--color-text-muted)',
              fontSize: 15,
              fontWeight: 700,
              cursor: selectedCar ? 'pointer' : 'default',
              fontFamily: 'var(--font)',
              transition: 'all 0.15s',
            }}
          >
            {selectedCar ? `${selectedCar.name_ko} 등록하기` : '연료를 선택해주세요'}
          </button>
        </>
      )}
    </BottomSheet>
  );
}
