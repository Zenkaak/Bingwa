import { Router } from "express";
import healthRouter from "./health.js";
import dealsRouter from "./deals.js";

const router = Router();

router.get("/", (_req: any, res: any) => {
  res.json({
    name: "Black Hole Bingwa Services API",
    status: "ok",
    health: "/api/healthz",
  });
});

router.use(healthRouter);
router.use(dealsRouter);

export default router;
