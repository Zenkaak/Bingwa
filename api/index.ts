// Keep this entrypoint inside Vercel's function graph. The extensionless import
// is intentional: Vercel's Node builder resolves the TypeScript source tree,
// while the regular workspace build still bundles the same app for local runs.
// Keep the API entrypoint explicit for Vercel's Node function runtime.
export const config = { maxDuration: 30 };

type VercelRequest = { method?: string; url?: string };
type VercelResponse = {
  status: (code: number) => VercelResponse;
  setHeader: (name: string, value: string) => VercelResponse;
  json: (body: unknown) => unknown;
};

let appPromise: Promise<typeof import("../artifacts/api-server/src/app.js").default> | undefined;

function getApp() {
  appPromise ??= import("../artifacts/api-server/src/app.js").then(({ default: app }) => app);
  return appPromise;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const pathname = new URL(req.url ?? "/", "https://bingwa.invalid").pathname;

  // These public endpoints must remain available even if Neon is temporarily
  // unavailable. The full Express app is loaded lazily for DB-backed routes.
  if (req.method === "GET" && pathname === "/api/healthz") {
    return res.json({ status: "ok" });
  }
  const app = await getApp();
  return app(req as never, res as never);
}