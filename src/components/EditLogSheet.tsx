"use client";

import { useState } from "react";
import type { LogEntry, InspectCondition } from "@/types";
import { updateLog, deleteLog, getMileage, setMileage } from "@/lib/storage";
import BottomSheet from "@/components/BottomSheet";
import SheetHeader from "@/components/SheetHeader";
import PrimaryButton from "@/components/PrimaryButton";
import ConfirmDeleteDialog from "@/components/ConfirmDeleteDialog";
import FormField from "@/components/FormField";
import CurrencyInput from "@/components/CurrencyInput";
import { sheetInputStyle } from "@/lib/sheetStyles";

interface Props {
  entry: LogEntry;
  carId: string;
  onSave: () => void;
  onClose: () => void;
}

export default function EditLogSheet({ entry, carId, onSave, onClose }: Props) {
  const [date, setDate] = useState(entry.date);
  const [mileageStr, setMileageStr] = useState(
    entry.mileage !== null ? String(entry.mileage) : "",
  );
  const [costStr, setCostStr] = useState(entry.cost ? String(entry.cost) : "");
  const [note, setNote] = useState(entry.note ?? "");
  const [condition, setCondition] = useState<InspectCondition | undefined>(entry.condition);
  const [mileageConfirmValue, setMileageConfirmValue] = useState<number | null>(null);

  function handleSave() {
    if (!date) return;
    const km = Number(mileageStr);
    const mileage = Number.isFinite(km) && km > 0 ? km : null;
    const costNum = Number(costStr.replace(/,/g, ""));
    const cost = Number.isFinite(costNum) && costNum > 0 ? costNum : undefined;
    updateLog(carId, entry.id, {
      date,
      mileage,
      cost,
      note: note.trim() || undefined,
      condition,
    });

    const currentMileage = getMileage(carId);
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

  function handleDelete() {
    deleteLog(carId, entry.id);
    onSave();
    onClose();
  }

  const typeLabel = entry.logType === "inspect" ? "점검" : "교체";

  const CONDITION_OPTIONS: { value: InspectCondition; label: string; activeBg: string }[] = [
    { value: 'good',           label: '양호',    activeBg: 'var(--color-text-primary)' },
    { value: 'caution',        label: '주의',    activeBg: 'var(--color-urgent-text)' },
    { value: 'replace_needed', label: '교체 필요', activeBg: 'var(--color-overdue-sub)' },
  ];

  return (
    <BottomSheet onClose={onClose} ariaLabel={`${entry.itemName} 기록 수정`}>
      <SheetHeader
        onClose={onClose}
        marginBottom={16}
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span>{entry.itemName}</span>
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                padding: "3px 8px",
                borderRadius: 8,
                background: "var(--color-surface-hover)",
                color: "var(--color-text-muted)",
              }}
            >
              {typeLabel}
            </span>
          </div>
        }
      />

      {entry.logType === "inspect" && (
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 12, color: "var(--color-text-muted)", marginBottom: 8, fontWeight: 600, letterSpacing: "0.02em" }}>
            점검 결과
          </p>
          <div style={{ display: "flex", gap: 6 }}>
            {CONDITION_OPTIONS.map(opt => {
              const active = condition === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => setCondition(opt.value)}
                  style={{
                    flex: 1,
                    padding: "11px 0",
                    borderRadius: 10,
                    border: `1.5px solid ${active ? opt.activeBg : "var(--color-border)"}`,
                    background: active ? opt.activeBg : "transparent",
                    color: active ? "var(--color-bg)" : "var(--color-text-secondary)",
                    fontWeight: 600,
                    fontSize: 13,
                    cursor: "pointer",
                    fontFamily: "var(--font)",
                    transition: "all 0.12s",
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <FormField id="edit-log-date" label="날짜">
        <input id="edit-log-date" type="date" value={date} onChange={e => setDate(e.target.value)} style={sheetInputStyle} />
      </FormField>

      <FormField id="edit-log-mileage" label="주행거리 (km)">
        <input id="edit-log-mileage" type="number" value={mileageStr} onChange={e => setMileageStr(e.target.value)} placeholder="예: 50000" inputMode="numeric" style={sheetInputStyle} />
      </FormField>

      <FormField id="edit-log-cost" label="비용 (선택)">
        <CurrencyInput id="edit-log-cost" value={costStr} onChange={setCostStr} />
      </FormField>

      <FormField id="edit-log-note" label="메모 (선택)" marginBottom={24}>
        <textarea id="edit-log-note" value={note} onChange={e => setNote(e.target.value)} placeholder="예: 합성유 5W-30, 오일필터 동시 교체" rows={2} style={{ ...sheetInputStyle, resize: "none", lineHeight: 1.5 }} />
      </FormField>

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
      <ConfirmDeleteDialog onDelete={handleDelete} confirmMessage="이 기록을 삭제할까요?" />
    </BottomSheet>
  );
}
