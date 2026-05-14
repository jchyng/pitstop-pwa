import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { calculateUrgency } from './urgency';
import type { ConsumableItem } from '@/types';

// 기준 날짜: 2026-05-12
const TODAY = '2026-05-12';

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(TODAY));
});

afterEach(() => {
  vi.useRealTimers();
});

const engineOil: ConsumableItem = {
  id: 'engine-oil',
  name_ko: '엔진오일',
  category: '엔진·오일',
  behavior: 'replace_only',
  interval_km: 10000,
  max_km: 11000,
  interval_months: 12,
  urgency_threshold_km: 1000,
  urgency_threshold_days: 30,
};

// 시간 기준만 있는 항목 (냉각수)
const coolant: ConsumableItem = {
  id: 'coolant',
  name_ko: '냉각수',
  category: '제동·냉각·변속',
  behavior: 'replace_only',
  interval_km: null,
  max_km: null,
  interval_months: 24,
  urgency_threshold_km: null,
  urgency_threshold_days: 60,
};

// 점검형 항목 (브레이크패드)
const brakePad: ConsumableItem = {
  id: 'brake-pad-front',
  name_ko: '브레이크패드 (전방)',
  category: '제동·냉각·변속',
  behavior: 'inspect_only',
  interval_km: 10000,
  max_km: null,
  interval_months: null,
  urgency_threshold_km: 2000,
  urgency_threshold_days: null,
};

describe('calculateUrgency', () => {
  describe('unknown — 기록 없음', () => {
    it('currentMileage도 lastLoggedDate도 null이면 unknown', () => {
      const result = calculateUrgency({
        item: engineOil,
        currentMileage: null,
        lastLoggedMileage: null,
        lastLoggedDate: null,
      });
      expect(result.status).toBe('unknown');
      expect(result.ratio).toBeNull();
      expect(result.displayText).toBe('미기록');
    });
  });

  describe('미기록 → 0km 기준 계산', () => {
    it('lastLoggedMileage가 null이면 0km 기준으로 km 남음 계산', () => {
      // 현재 5000km, 교체 기록 없음(0km 기준) → 남은 거리 = 10000 - 5000 = 5000km
      const result = calculateUrgency({
        item: engineOil,
        currentMileage: 5000,
        lastLoggedMileage: null,
        lastLoggedDate: null,
      });
      expect(result.status).toBe('ok');
      expect(result.displayText).toBe('5,000 km 남음');
    });

    it('lastLoggedMileage가 null이고 주행거리가 interval 크게 초과면 overdue', () => {
      // 현재 50000km, 교체 기록 없음(0km 기준) → 40000km 초과 → 20% 훨씬 넘어 overdue
      const result = calculateUrgency({
        item: engineOil,
        currentMileage: 50000,
        lastLoggedMileage: null,
        lastLoggedDate: null,
      });
      expect(result.status).toBe('overdue');
      expect(result.displayText).toMatch(/km 초과/);
    });
  });

  describe('overdue — 많이 초과 (인터벌의 20% 이상)', () => {
    it('km 20% 이상 초과 시 overdue', () => {
      // 마지막 정비 40000, 현재 52500 → 12500km 주행 → 2500km 초과(25%) → overdue
      // km_ratio = (10000-12500)/1000 = -2.5, caution_boundary = -2 → overdue
      const result = calculateUrgency({
        item: engineOil,
        currentMileage: 52500,
        lastLoggedMileage: 40000,
        lastLoggedDate: '2025-05-01',
      });
      expect(result.status).toBe('overdue');
      expect(result.ratio).not.toBeNull();
      expect(result.ratio!).toBeLessThan(-2);
      expect(result.displayText).toMatch(/km 초과/);
    });

    it('날짜 20% 이상 초과 시 overdue (시간 기준 항목)', () => {
      // 냉각수: 24개월(720일) 주기, 900일 전 교환 → 180일 초과(25%) → overdue
      // days_ratio = (720-900)/60 = -3, caution_boundary = -2.4 → overdue
      const logged = new Date(TODAY);
      logged.setDate(logged.getDate() - 900);
      const result = calculateUrgency({
        item: coolant,
        currentMileage: null,
        lastLoggedMileage: null,
        lastLoggedDate: logged.toISOString().slice(0, 10),
      });
      expect(result.status).toBe('overdue');
      expect(result.displayText).toMatch(/개월 초과/);
    });
  });

  describe('caution — 약간 초과 (인터벌의 0~20%)', () => {
    it('km 약간 초과 시 caution', () => {
      // 마지막 정비 40000, 현재 51500 → 11500km 주행 → 1500km 초과(15%)
      // km_ratio = (10000-11500)/1000 = -1.5, caution_boundary = -2 → caution
      const result = calculateUrgency({
        item: engineOil,
        currentMileage: 51500,
        lastLoggedMileage: 40000,
        lastLoggedDate: '2025-05-01',
      });
      expect(result.status).toBe('caution');
      expect(result.ratio).toBeCloseTo(-1.5);
    });

    it('날짜 약간 초과 시 caution (시간 기준 항목)', () => {
      // 냉각수: 720일 주기, 800일 전 교환 → 80일 초과(11%)
      // days_ratio = (720-800)/60 = -1.33, caution_boundary = -2.4 → caution
      const logged = new Date(TODAY);
      logged.setDate(logged.getDate() - 800);
      const result = calculateUrgency({
        item: coolant,
        currentMileage: null,
        lastLoggedMileage: null,
        lastLoggedDate: logged.toISOString().slice(0, 10),
      });
      expect(result.status).toBe('caution');
    });
  });

  describe('warning — 임박 (0 < ratio ≤ 1)', () => {
    it('km 위급 구간 (0 < ratio ≤ 1)', () => {
      // 마지막 정비 40000, 현재 49500 → 9500km 주행 → km 남음 500 → ratio = 500/1000 = 0.5
      const result = calculateUrgency({
        item: engineOil,
        currentMileage: 49500,
        lastLoggedMileage: 40000,
        lastLoggedDate: '2025-06-01',
      });
      expect(result.status).toBe('warning');
      expect(result.ratio).toBeCloseTo(0.5);
      expect(result.displayText).toMatch(/km 남음/);
    });

    it('날짜 위급 구간 (시간 기준 항목)', () => {
      // 냉각수: 24개월(720일) 주기, 690일 전 교환 → days_remaining = 30 → ratio = 30/60 = 0.5
      const logged = new Date(TODAY);
      logged.setDate(logged.getDate() - 690);
      const result = calculateUrgency({
        item: coolant,
        currentMileage: null,
        lastLoggedMileage: null,
        lastLoggedDate: logged.toISOString().slice(0, 10),
      });
      expect(result.status).toBe('warning');
      expect(result.ratio).toBeCloseTo(0.5);
    });
  });

  describe('ok — 정상', () => {
    it('km 여유 있을 때 ok', () => {
      // 마지막 정비 40000, 현재 45000 → 5000km 주행 → km 남음 5000 → ratio = 5
      const result = calculateUrgency({
        item: engineOil,
        currentMileage: 45000,
        lastLoggedMileage: 40000,
        lastLoggedDate: '2025-11-01',
      });
      expect(result.status).toBe('ok');
      expect(result.ratio).toBeGreaterThan(1);
      expect(result.displayText).toMatch(/km 남음/);
    });

    it('시간 기준 항목도 여유 있을 때 ok', () => {
      // 냉각수: 6개월(180일) 전 교환 → days_remaining = 540 → ratio = 9
      const logged = new Date(TODAY);
      logged.setDate(logged.getDate() - 180);
      const result = calculateUrgency({
        item: coolant,
        currentMileage: null,
        lastLoggedMileage: null,
        lastLoggedDate: logged.toISOString().slice(0, 10),
      });
      expect(result.status).toBe('ok');
      expect(result.ratio).toBeGreaterThan(1);
    });
  });

  describe('min(ratio) — km/시간 중 작은 값 사용', () => {
    it('km ratio가 더 작으면 km 기준으로 상태 결정', () => {
      // km: 9500/10000 주행 → 남음 500 → ratio 0.5 (warning)
      // 날짜: 1개월 전 교환 → 11개월 남음 → ratio ≫ 1 (ok)
      const logged = new Date(TODAY);
      logged.setDate(logged.getDate() - 30);
      const result = calculateUrgency({
        item: engineOil,
        currentMileage: 49500,
        lastLoggedMileage: 40000,
        lastLoggedDate: logged.toISOString().slice(0, 10),
      });
      expect(result.status).toBe('warning');
      expect(result.ratio).toBeCloseTo(0.5);
    });
  });

  describe('inspect 항목 + condition 보정', () => {
    it("'good'이면 원래 ratio 유지", () => {
      // 5000km 전 점검, 현재 5000km 주행 → 남은 km 5000 → ratio = 5000/2000 = 2.5
      const result = calculateUrgency({
        item: brakePad,
        currentMileage: 5000,
        lastLoggedMileage: 0,
        lastLoggedDate: '2025-05-01',
        lastInspectCondition: 'good',
      });
      expect(result.status).toBe('ok');
      expect(result.ratio).toBeCloseTo(2.5);
    });

    it("'caution'이면 ratio×0.5로 단축돼 warning으로", () => {
      // 8000km → 남은 2000 → ratio 1 → caution 압축 → 0.5 → warning
      const urgentCase = calculateUrgency({
        item: brakePad,
        currentMileage: 8000,
        lastLoggedMileage: 0,
        lastLoggedDate: '2025-05-01',
        lastInspectCondition: 'caution',
      });
      expect(urgentCase.ratio).toBeCloseTo(0.5);
      expect(urgentCase.status).toBe('warning');
    });

    it("'replace_needed'면 즉시 overdue (ratio=-1, displayText='교체 필요')", () => {
      const result = calculateUrgency({
        item: brakePad,
        currentMileage: 1000,
        lastLoggedMileage: 0,
        lastLoggedDate: '2026-05-01',
        lastInspectCondition: 'replace_needed',
      });
      expect(result.status).toBe('overdue');
      expect(result.ratio).toBe(-1);
      expect(result.displayText).toBe('교체 필요');
    });

    it('replace 항목에는 condition 보정이 적용되지 않음', () => {
      // engineOil은 behavior === 'replace_only'
      // caution을 넘겨도 ratio는 그대로 (원본 ratio = 5000/1000 = 5)
      const result = calculateUrgency({
        item: engineOil,
        currentMileage: 45000,
        lastLoggedMileage: 40000,
        lastLoggedDate: '2025-11-01',
        lastInspectCondition: 'caution',
      });
      expect(result.status).toBe('ok');
      expect(result.ratio).toBeGreaterThan(1);
    });
  });
});
