import { pool } from "./db.js";
import { isHorizonReachable } from "./stellar.js";

export async function probeHealth({ db = pool, horizonProbe = isHorizonReachable } = {}) {
  const [dbResult, horizonResult] = await Promise.allSettled([
    db.query("SELECT 1"),
    horizonProbe(),
  ]);

  return {
    database: {
      ok: dbResult.status === "fulfilled",
      error: dbResult.status === "rejected" ? dbResult.reason : null,
    },
    horizon: {
      ok: horizonResult.status === "fulfilled" && horizonResult.value === true,
      error: horizonResult.status === "rejected" ? horizonResult.reason : null,
    },
  };
}
