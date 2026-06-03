"use client";

import { useState } from "react";
import type { LogEntry } from "@/types";
import { updateLog, deleteLog } from "@/lib/storage";
import BottomSheet from "@/components/BottomSheet";
import SheetHeader from "@/components/SheetHeader";
import PrimaryButton from "@/components/PrimaryButton";
import ConfirmDeleteDialog from "@/components/ConfirmDeleteDialog";
import FormField from "@/components/FormField";
import CurrencyInput from "@/components/CurrencyInput";
import { CONDITION_COLORS, CONDITION_LABEL } from "@/lib/conditionColors";
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
    });
    onSave();
    onClose();
  }

  function handleDelete() {
    deleteLog(carId, entry.id);
    onSave();
    onClose();
  }

  const typeLabel = entry.logType === "inspect" ? "점검" : "교체";
  const cond = entry.condition;

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
            {cond && (
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  padding: "3px 8px",
                  borderRadius: 8,
                  background: CONDITION_COLORS[cond].bg,
                  color: CONDITION_COLORS[cond].fg,
                }}
              >
                {CONDITION_LABEL[cond]}
              </span>
            )}
          </div>
        }
      />

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

      <PrimaryButton onClick={handleSave} disabled={!date}>저장</PrimaryButton>
      <ConfirmDeleteDialog onDelete={handleDelete} confirmMessage="이 기록을 삭제할까요?" />
    </BottomSheet>
  );
}
