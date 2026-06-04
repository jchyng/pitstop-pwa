'use client';

import { useState } from 'react';
import type { ConsumableItem, LogType, InspectCondition } from '@/types';
import { setLastLog, setLastMileage, setLastLogType, addLog, setMileage } from '@/lib/storage';
import BottomSheet from '@/components/BottomSheet';
import SheetHeader from '@/components/SheetHeader';
import PrimaryButton from '@/components/PrimaryButton';
import FormField from '@/components/FormField';
import CurrencyInput from '@/components/CurrencyInput';
import { todayISO } from '@/lib/dateUtils';
import { sheetInputStyle } from '@/lib/sheetStyles';

const CONDITION_OPTIONS: { value: InspectCondition; label: string; tone: 'normal' | 'caution' | 'bad' }[] = [
  { value: 'good', label: '양호', tone: 'normal' },
  { value: 'caution', label: '주의', tone: 'caution' },
  { value: 'replace_needed', label: '교체 필요', tone: 'bad' },
];

interface Props {
  item: ConsumableItem;
  carId: string;
  currentMileage: number | null;
  onSave: () => void;
  onClose: () => void;
}


export default function LogSheet({ item, carId, currentMileage, onSave, onClose }: Props) {
  const isInspectItem = item.behavior !== 'replace_only';
  const [date, setDate] = useState(todayISO());
  const [mileageStr, setMileageStr] = useState(currentMileage !== null ? String(currentMileage) : '');
  const [logType, setLogType] = useState<LogType>(isInspectItem ? 'inspect' : 'replace');
  const [condition, setCondition] = useState<InspectCondition>('good');
  const [alsoReplaced, setAlsoReplaced] = useState(false);
  const [costStr, setCostStr] = useState('');
  const [note, setNote] = useState('');
  const [mileageConfirmValue, setMileageConfirmValue] = useState<number | null>(null);

  const showCondition = logType === 'inspect';
  const showSmartReplace = showCondition && condition === 'replace_needed';

  function handleSave() {
    if (!date) return;
    const km = Number(mileageStr);
    const mileage = Number.isFinite(km) && km > 0 ? km : null;
    const costNum = Number(costStr.replace(/,/g, ''));
    const cost = Number.isFinite(costNum) && costNum > 0 ? costNum : undefined;

    if (logType === 'inspect') {
      addLog(carId, {
        id: Date.now().toString(),
        itemId: item.id,
        itemName: item.name_ko,
        category: item.category,
        date,
        mileage,
        logType: 'inspect',
        condition,
        cost,
        note: note.trim() || undefined,
      });

      if (condition === 'replace_needed' && alsoReplaced) {
        // 점검 후 교체도 진행 → 교체 기록 추가, lastLogType을 replace로 설정
        addLog(carId, {
          id: (Date.now() + 1).toString(),
          itemId: item.id,
          itemName: item.name_ko,
          category: item.category,
          date,
          mileage,
          logType: 'replace',
          cost,
          note: note.trim() || undefined,
        });
        setLastLog(carId, item.id, date);
        if (mileage !== null) setLastMileage(carId, item.id, mileage);
        setLastLogType(carId, item.id, 'replace');
      } else {
        setLastLog(carId, item.id, date);
        if (mileage !== null) setLastMileage(carId, item.id, mileage);
        setLastLogType(carId, item.id, 'inspect');
      }
    } else {
      addLog(carId, {
        id: Date.now().toString(),
        itemId: item.id,
        itemName: item.name_ko,
        category: item.category,
        date,
        mileage,
        logType: 'replace',
        cost,
        note: note.trim() || undefined,
      });
      setLastLog(carId, item.id, date);
      if (mileage !== null) setLastMileage(carId, item.id, mileage);
      setLastLogType(carId, item.id, 'replace');
    }

    if (mileage !== null && currentMileage !== null && mileage > currentMileage) {
      setMileageConfirmValue(mileage);
      return;
    }

    onSave();
    onClose();
  }

  function handleMileageConfirm(update: boolean) {
    if (update && mileageConfirmValue !== null) {
      setMileage(carId, mileageConfirmValue);
    }
    setMileageConfirmValue(null);
    onSave();
    onClose();
  }

  return (
    <BottomSheet onClose={onClose} ariaLabel={`${item.name_ko} 기록`}>
      <SheetHeader title={item.name_ko} onClose={onClose} marginBottom={20} />

      {/* Tab selector (점검 항목만) */}
      {isInspectItem && (
        <div
          style={{
            display: 'flex',
            borderBottom: '1.5px solid var(--color-border)',
            marginBottom: 20,
          }}
        >
          {(['inspect', 'replace'] as LogType[]).map(type => {
            const active = logType === type;
            return (
              <button
                key={type}
                onClick={() => {
                  setLogType(type);
                  setAlsoReplaced(false);
                }}
                style={{
                  flex: 1,
                  padding: '10px 0',
                  background: 'none',
                  border: 'none',
                  borderBottom: `2.5px solid ${active ? 'var(--color-text-primary)' : 'transparent'}`,
                  marginBottom: -1.5,
                  color: active ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                  fontWeight: active ? 700 : 500,
                  fontSize: 14,
                  cursor: 'pointer',
                  fontFamily: 'var(--font)',
                  transition: 'all 0.12s',
                }}
              >
                {type === 'inspect' ? '🔍 점검 기록' : '🔧 교체 기록'}
              </button>
            );
          })}
        </div>
      )}

      {/* Condition picker (점검 탭일 때만, 날짜/주행거리보다 먼저) */}
      {showCondition && (
        <div style={{ marginBottom: 20 }}>
          <p
            style={{
              fontSize: 12,
              color: 'var(--color-text-muted)',
              marginBottom: 8,
              fontWeight: 600,
              letterSpacing: '0.02em',
            }}
          >
            점검 결과
          </p>
          <div style={{ display: 'flex', gap: 6 }}>
            {CONDITION_OPTIONS.map(opt => {
              const active = condition === opt.value;
              const activeBg =
                opt.tone === 'bad'
                  ? 'var(--color-overdue-sub)'
                  : opt.tone === 'caution'
                  ? 'var(--color-urgent-text)'
                  : 'var(--color-text-primary)';
              return (
                <button
                  key={opt.value}
                  onClick={() => {
                    setCondition(opt.value);
                    if (opt.value !== 'replace_needed') setAlsoReplaced(false);
                  }}
                  style={{
                    flex: 1,
                    padding: '11px 0',
                    borderRadius: 10,
                    border: `1.5px solid ${active ? activeBg : 'var(--color-border)'}`,
                    background: active ? activeBg : 'transparent',
                    color: active ? 'var(--color-bg)' : 'var(--color-text-secondary)',
                    fontWeight: 600,
                    fontSize: 13,
                    cursor: 'pointer',
                    fontFamily: 'var(--font)',
                    transition: 'all 0.12s',
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <FormField id="log-date" label="날짜">
        <input id="log-date" type="date" value={date} onChange={e => setDate(e.target.value)} style={sheetInputStyle} />
      </FormField>

      <FormField id="log-mileage" label="주행거리 (km)">
        <input id="log-mileage" type="number" value={mileageStr} onChange={e => setMileageStr(e.target.value)} placeholder="예: 50000" inputMode="numeric" style={sheetInputStyle} />
      </FormField>

      <FormField id="log-cost" label="비용 (선택)">
        <CurrencyInput id="log-cost" value={costStr} onChange={setCostStr} />
      </FormField>

      <FormField id="log-note" label="메모 (선택)" marginBottom={showSmartReplace ? 16 : 24}>
        <textarea id="log-note" value={note} onChange={e => setNote(e.target.value)} placeholder={logType === 'inspect' ? '예: 패드 두께 약 5mm 남음' : '예: 합성유 5W-30, 오일필터 동시 교체'} rows={2} style={{ ...sheetInputStyle, resize: 'none', lineHeight: 1.5 }} />
      </FormField>

      {/* Smart prompt: 교체 필요 시 교체도 진행했는지 */}
      {showSmartReplace && (
        <div
          style={{
            marginBottom: 20,
            padding: '14px 14px',
            borderRadius: 12,
            background: 'var(--color-urgent-bg)',
            border: '1px solid var(--color-border)',
          }}
        >
          <p
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--color-text-primary)',
              marginBottom: 10,
            }}
          >
            🔧 이번에 교체도 진행했나요?
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            {[
              { value: false, label: '아니요, 점검만' },
              { value: true, label: '네, 교체도 완료' },
            ].map(opt => {
              const active = alsoReplaced === opt.value;
              return (
                <button
                  key={String(opt.value)}
                  onClick={() => setAlsoReplaced(opt.value)}
                  style={{
                    flex: 1,
                    padding: '9px 0',
                    borderRadius: 10,
                    border: `1.5px solid ${active ? 'var(--color-text-primary)' : 'var(--color-border)'}`,
                    background: active ? 'var(--color-text-primary)' : 'transparent',
                    color: active ? 'var(--color-bg)' : 'var(--color-text-secondary)',
                    fontWeight: 600,
                    fontSize: 13,
                    cursor: 'pointer',
                    fontFamily: 'var(--font)',
                    transition: 'all 0.12s',
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {mileageConfirmValue !== null ? (
        <div
          style={{
            padding: '16px',
            borderRadius: 12,
            background: 'var(--color-surface-hover)',
            border: '1px solid var(--color-border)',
            marginBottom: 8,
          }}
        >
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 6 }}>
            현재 주행거리를 업데이트할까요?
          </p>
          <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 14, lineHeight: 1.5 }}>
            입력한 주행거리({mileageConfirmValue.toLocaleString()} km)가 현재 설정된 주행거리보다 높아요.
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => handleMileageConfirm(false)}
              style={{
                flex: 1,
                padding: '10px 0',
                borderRadius: 10,
                border: '1.5px solid var(--color-border)',
                background: 'transparent',
                color: 'var(--color-text-secondary)',
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
                fontFamily: 'var(--font)',
              }}
            >
              아니요
            </button>
            <button
              onClick={() => handleMileageConfirm(true)}
              style={{
                flex: 2,
                padding: '10px 0',
                borderRadius: 10,
                border: 'none',
                background: 'var(--color-text-primary)',
                color: 'var(--color-bg)',
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
                fontFamily: 'var(--font)',
              }}
            >
              {mileageConfirmValue.toLocaleString()} km로 업데이트
            </button>
          </div>
        </div>
      ) : (
        <PrimaryButton onClick={handleSave} disabled={!date}>저장</PrimaryButton>
      )}
    </BottomSheet>
  );
}
