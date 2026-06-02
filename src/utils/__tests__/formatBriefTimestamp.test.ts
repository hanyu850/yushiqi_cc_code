import { describe, expect, test } from "bun:test";
import { formatBriefTimestamp } from "../formatBriefTimestamp";

describe("formatBriefTimestamp", () => {
  // Fixed "now" for deterministic tests: 2026-04-02T14:00:00Z (Thursday)
  const now = new Date("2026-04-02T14:00:00Z");

  test("same day timestamp returns time only (contains colon)", () => {
    const result = formatBriefTimestamp("2026-04-02T10:30:00Z", now);
    expect(result).toContain(":");
    // Should NOT contain a weekday name since it's the same day
    expect(result).not.toMatch(
      /Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|星期一|星期二|星期三|星期四|星期五|星期六|星期天|星期日/
    );
  });

  test("yesterday returns weekday and time", () => {
    // 2026-04-01 is Wednesday
    const result = formatBriefTimestamp("2026-04-01T16:15:00Z", now);
    expect(result).toContain(":");
    // Weekday name should be present (English or Chinese)
    expect(result).toMatch(/Wednesday|星期三/);
  });

  test("3 days ago returns weekday and time", () => {
    // 2026-03-30 is Monday
    const result = formatBriefTimestamp("2026-03-30T09:00:00Z", now);
    expect(result).toContain(":");
    expect(result).toMatch(/Monday|星期一/);
  });

  test("6 days ago returns weekday and time (still within 6-day window)", () => {
    // 2026-03-27 is Friday
    const result = formatBriefTimestamp("2026-03-27T12:00:00Z", now);
    expect(result).toContain(":");
    expect(result).toMatch(/Friday|星期五/);
  });

  test("7+ days ago returns weekday, month, day, and time", () => {
    // 2026-03-20 is Friday, 13 days ago
    const result = formatBriefTimestamp("2026-03-20T14:30:00Z", now);
    expect(result).toContain(":");
    // Should contain month (English abbreviation or Chinese numeric)
    expect(result).toMatch(/Mar|3月/);
  });

  test("much older date returns full format with month", () => {
    const result = formatBriefTimestamp("2025-12-25T08:00:00Z", now);
    expect(result).toContain(":");
    expect(result).toMatch(/Dec|12月/);
  });

  test("invalid ISO string returns empty string", () => {
    expect(formatBriefTimestamp("not-a-date", now)).toBe("");
  });

  test("empty string returns empty string", () => {
    expect(formatBriefTimestamp("", now)).toBe("");
  });

  test("same day early morning returns time format", () => {
    const result = formatBriefTimestamp("2026-04-02T01:05:00Z", now);
    expect(result).toContain(":");
    // Should be time-only format
    expect(result.length).toBeLessThan(20);
  });

  test("uses current time as default when now is not provided", () => {
    // Just verify it returns a non-empty string for a recent timestamp
    const recent = new Date();
    recent.setMinutes(recent.getMinutes() - 5);
    const result = formatBriefTimestamp(recent.toISOString());
    expect(result).not.toBe("");
    expect(result).toContain(":");
  });
});
