import { describe, expect, test } from "vitest";

import { adjustForQuietHours, computeDueCareTasks, parseISODateToMs } from "./care";

describe("parseISODateToMs", () => {
  test("returns null for empty input", () => {
    expect(parseISODateToMs("")).toBeNull();
    expect(parseISODateToMs("   ")).toBeNull();
  });

  test("parses YYYY-MM-DD to local midnight", () => {
    const ms = parseISODateToMs("2026-05-12");
    expect(ms).not.toBeNull();
    const d = new Date(ms!);
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(4);
    expect(d.getDate()).toBe(12);
    expect(d.getHours()).toBe(0);
    expect(d.getMinutes()).toBe(0);
  });
});

describe("adjustForQuietHours", () => {
  test("keeps time when quiet hours disabled", () => {
    const base = new Date(2026, 4, 12, 23, 10).getTime();
    expect(adjustForQuietHours(base, false)).toBe(base);
  });

  test("moves 23:10 to next 08:00 when quiet hours enabled", () => {
    const base = new Date(2026, 4, 12, 23, 10).getTime();
    const adjusted = adjustForQuietHours(base, true);
    const d = new Date(adjusted);
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(4);
    expect(d.getDate()).toBe(13);
    expect(d.getHours()).toBe(8);
    expect(d.getMinutes()).toBe(0);
  });
});

describe("computeDueCareTasks", () => {
  test("returns due tasks and respects snooze", () => {
    const now = new Date(2026, 4, 12, 12, 0).getTime();
    const hour = 3600 * 1000;
    const plants = [
      {
        id: "p1",
        name: "Fern",
        wateringEnabled: true,
        mistingEnabled: true,
        lastWatered: now - 5 * hour,
        lastMisted: now - 5 * hour,
        wateringIntervalMs: 4 * hour,
        mistingIntervalMs: 4 * hour,
        snooze: { waterUntil: null, mistUntil: now + hour },
      },
    ];

    const tasks = computeDueCareTasks(plants, now);
    expect(tasks).toHaveLength(1);
    expect(tasks[0]?.plantId).toBe("p1");
    expect(tasks[0]?.type).toBe("water");
  });
});

