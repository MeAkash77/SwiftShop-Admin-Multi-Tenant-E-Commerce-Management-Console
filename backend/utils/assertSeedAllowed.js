/**
 * Protect destructive/demo seed scripts.
 * - Allowed in non-production by default (local development).
 * - In production / Vercel, requires explicit ALLOW_SEED=1.
 */
export function assertSeedAllowed(scriptName = "seed") {
  const allow = String(process.env.ALLOW_SEED || "").trim() === "1";
  const isProd =
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL === "1" ||
    String(process.env.SEED_TARGET || "").toLowerCase() === "production";

  if (isProd && !allow) {
    console.error(`
Refused to run ${scriptId} against a production-like environment.

Seeding is a development operation. To run intentionally:
  ALLOW_SEED=1 npm run seed:catalog

Do not wire seed scripts into Vercel build / CD jobs.
`);
    process.exit(1);
  }

  if (allow && isProd) {
    console.warn(
      `[${scriptId}] ALLOW_SEED=1 — running against production-like env. Proceed carefully.`
    );
  }
}
