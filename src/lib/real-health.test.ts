import { describe, expect, it } from "vitest";
import { classify, validateReading } from "./ranges";
import { estimateBpm } from "./ppg";
import { guessMapping, mapRows, parseCsv } from "./csv-import";

describe("urgent thresholds", () => {
  it("oxygen below 90% is urgent", () => { expect(classify("spo2", 89)).toBe("urgent"); expect(classify("spo2", 97)).toBe("ok"); });
  it("very high blood pressure is urgent", () => { expect(classify("bp", 182, 95)).toBe("urgent"); expect(classify("bp", 150, 121)).toBe("urgent"); expect(classify("bp", 118, 76)).toBe("ok"); });
  it("high fever is urgent", () => expect(classify("temp", 39.6)).toBe("urgent"));
});

describe("typo checks", () => {
  it("rejects a heart rate of 800", () => expect(validateReading("hr", 800)).not.toBeNull());
  it("accepts a normal heart rate", () => expect(validateReading("hr", 72)).toBeNull());
  it("rejects blood pressure with bottom above top", () => expect(validateReading("bp", 80, 120)).not.toBeNull());
});

describe("camera pulse", () => {
  it("recovers 72 bpm from a clean signal", () => {
    const fps = 30; const s = Array.from({ length: fps * 20 }, (_, i) => 100 + Math.sin((2 * Math.PI * 1.2 * i) / fps) + i * 0.01);
    const r = estimateBpm(s, fps)!;
    expect(Math.abs(r.bpm - 72)).toBeLessThanOrEqual(2);
    expect(r.quality).toBeGreaterThan(0.7);
  });
  it("needs at least 8 seconds", () => expect(estimateBpm([1, 2, 3], 30)).toBeNull());
});

describe("file import", () => {
  it("maps columns and skips impossible values", () => {
    const rows = parseCsv("Date,Heart Rate,Blood Pressure\n2026-11-01T08:00:00Z,70,120/80\n2026-11-02T08:00:00Z,900,118/76\n");
    const m = guessMapping(rows[0]!);
    const { readings, skipped } = mapRows(rows.slice(1), m);
    expect(readings).toHaveLength(3);
    expect(skipped).toBe(1);
    expect(readings.find((r) => r.kind === "bp")).toMatchObject({ value: 120, value2: 80 });
  });
});
