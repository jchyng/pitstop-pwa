"use client";

import { useState } from "react";
import type { LogEntry, InspectCondition } from "@/types";
import { updateLog, deleteLog } from "@/lib/storage";
import BottomSheet from "@/components/BottomSheet";

interface Props {
  entry: LogEntry;
  carId: string;
  onSave: () => void;
  onClose: () => void;
}

const sheetInputStyle: React.CSSProperties = {
  width: "100%",
  padding: "11px 12px",
  border: "1px solid var(--color-border)",
  borderRadius: 10,
  fontSize: 15,
  background: "var(--color-surface-hover)",
  color: "var(--color-text-primary)",
  fontFamily: "var(--font)",
  outline: "none",
  boxSizing: "border-box",
};

const conditionLabel: Record<InspectCondition, string> = {
  good: "양호",
  caution: "주의",
  replace_needed: "교체 필요",
};

const conditionColors: Record<InspectCondition, { bg: string; fg: string }> = {
  good: { bg: "var(--color-normal-bg)", fg: "var(--color-normal-text)" },
  caution: { bg: "var(--color-urgent-bg)", fg: "var(--color-urgent-text)" },
  replace_needed: {
    bg: "var(--color-urgent-bg)",
    fg: "var(--color-overdue-sub)",
  },
};

export default function EditLogSheet({ entry, carId, onSave, onClose }: Props) {
  const [date, setDate] = useState(entry.date);
  const [mileageStr, setMileageStr] = useState(
    entry.mileage !== null ? String(entry.mileage) : "",
  );
  const [note, setNote] = useState(entry.note ?? "");
  const [confirmDelete, setConfirmDelete] = useState(false);

  function handleSave() {
    if (!date) return;
    const km = Number(mileageStr);
    const mileage = Number.isFinite(km) && km > 0 ? km : null;
    updateLog(carId, entry.id, {
      date,
      mileage,
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
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <p
            style={{
              fontSize: 17,
              fontWeight: 700,
              color: "var(--color-text-primary)",
            }}
          >
            {entry.itemName}
          </p>
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
                background: conditionColors[cond].bg,
                color: conditionColors[cond].fg,
              }}
            >
              {conditionLabel[cond]}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          aria-label="닫기"
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: 22,
            lineHeight: 1,
            color: "var(--color-text-muted)",
            padding: "0 2px",
            fontFamily: "var(--font)",
          }}
        >
          ×
        </button>
      </div>

      {/* Date */}
      <div style={{ marginBottom: 14 }}>
        <label
          htmlFor="edit-log-date"
          style={{
            display: "block",
            fontSize: 12,
            color: "var(--color-text-muted)",
            marginBottom: 6,
            fontWeight: 500,
          }}
        >
          날짜
        </label>
        <input
          id="edit-log-date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          style={sheetInputStyle}
        />
      </div>

      {/* Mileage */}
      <div style={{ marginBottom: 14 }}>
        <label
          htmlFor="edit-log-mileage"
          style={{
            display: "block",
            fontSize: 12,
            color: "var(--color-text-muted)",
            marginBottom: 6,
            fontWeight: 500,
          }}
        >
          주행거리 (km)
        </label>
        <input
          id="edit-log-mileage"
          type="number"
          value={mileageStr}
          onChange={(e) => setMileageStr(e.target.value)}
          placeholder="예: 50000"
          inputMode="numeric"
          style={sheetInputStyle}
        />
      </div>

      {/* Note */}
      <div style={{ marginBottom: 24 }}>
        <label
          htmlFor="edit-log-note"
          style={{
            display: "block",
            fontSize: 12,
            color: "var(--color-text-muted)",
            marginBottom: 6,
            fontWeight: 500,
          }}
        >
          메모 (선택)
        </label>
        <textarea
          id="edit-log-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="예: 합성유 5W-30, 오일필터 동시 교체"
          rows={2}
          style={{ ...sheetInputStyle, resize: "none", lineHeight: 1.5 }}
        />
      </div>

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={!date}
        style={{
          width: "100%",
          padding: "15px 0",
          borderRadius: 12,
          border: "none",
          background: date
            ? "var(--color-text-primary)"
            : "var(--color-border)",
          color: date ? "var(--color-bg)" : "var(--color-text-muted)",
          fontSize: 16,
          fontWeight: 700,
          cursor: date ? "pointer" : "default",
          fontFamily: "var(--font)",
          transition: "background 0.12s",
        }}
      >
        저장
      </button>

      {/* Delete */}
      {!confirmDelete ? (
        <button
          onClick={() => setConfirmDelete(true)}
          style={{
            width: "100%",
            marginTop: 10,
            padding: "12px 0",
            borderRadius: 12,
            border: "1.5px solid var(--color-border)",
            background: "transparent",
            color: "var(--color-overdue-sub)",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "var(--font)",
          }}
        >
          삭제
        </button>
      ) : (
        <div
          style={{
            marginTop: 10,
            padding: "14px",
            borderRadius: 12,
            border: "1.5px solid var(--color-overdue-sub)",
            background: "var(--color-urgent-bg)",
          }}
        >
          <p
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "var(--color-text-primary)",
              marginBottom: 10,
              textAlign: "center",
            }}
          >
            이 기록을 삭제할까요?
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => setConfirmDelete(false)}
              style={{
                flex: 1,
                padding: "10px 0",
                borderRadius: 10,
                border: "1.5px solid var(--color-border)",
                background: "transparent",
                color: "var(--color-text-secondary)",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "var(--font)",
              }}
            >
              취소
            </button>
            <button
              onClick={handleDelete}
              style={{
                flex: 1,
                padding: "10px 0",
                borderRadius: 10,
                border: "none",
                background: "var(--color-overdue-sub)",
                color: "#fff",
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "var(--font)",
              }}
            >
              삭제
            </button>
          </div>
        </div>
      )}
    </BottomSheet>
  );
}
