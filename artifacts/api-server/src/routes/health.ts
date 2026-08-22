import { Router } from "express";
import { HealthCheckResponse } from "../schemas.js";

const router = Router();

router.get("/healthz", (_req: unknown, res: { json: (body: unknown) => unknown }) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
});

export default router;
