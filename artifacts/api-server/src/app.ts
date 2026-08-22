import express from "express";
import cors from "cors";
import { pinoHttp } from "pino-http";
import router from "./routes/index.js";
import { logger } from "./lib/logger.js";

const app = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Vercel and browser health checks commonly request the service root.
// Keep the API discoverable instead of exposing Express's "Cannot GET /".
app.get("/", (_req: any, res: any) => {
  res.json({
    name: "Black Hole Bingwa Services API",
    status: "ok",
    health: "/api/healthz",
  });
});

app.use("/api", router);

export default app;
