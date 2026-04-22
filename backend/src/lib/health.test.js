import { beforeEach, describe, expect, it, vi } from "vitest";

const query = vi.fn();
const isHorizonReachable = vi.fn();

vi.mock("./db.js", () => ({
  pool: { query },
}));

vi.mock("./stellar.js", () => ({
  isHorizonReachable,
}));

describe("probeHealth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('runs a "SELECT 1" database probe and reports both services healthy', async () => {
    query.mockResolvedValue({ rows: [{ "?column?": 1 }] });
    isHorizonReachable.mockResolvedValue(true);

    const { probeHealth } = await import("./health.js");
    const result = await probeHealth();

    expect(query).toHaveBeenCalledWith("SELECT 1");
    expect(isHorizonReachable).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      database: { ok: true, error: null },
      horizon: { ok: true, error: null },
    });
  });

  it("reports the database as unavailable when the SELECT 1 query fails", async () => {
    const dbError = new Error("db down");
    query.mockRejectedValue(dbError);
    isHorizonReachable.mockResolvedValue(true);

    const { probeHealth } = await import("./health.js");
    const result = await probeHealth();

    expect(result.database).toEqual({ ok: false, error: dbError });
    expect(result.horizon).toEqual({ ok: true, error: null });
  });
});
