import "dotenv/config";
import express from "express";
import cors from "cors";
import { authRouter } from "./routes/auth.js";
import { accountRouter } from "./routes/accounts.js";
import { dashboardRouter } from "./routes/dashboard.js";
import { signalRouter } from "./routes/signals.js";
import { opportunityRouter } from "./routes/opportunities.js";
import { requirementRouter } from "./routes/requirements.js";
import { icpRouter } from "./routes/icp.js";
import { importRouter } from "./routes/imports.js";
import { intelligenceRouter } from "./routes/intelligence.js";
import { matchRouter } from "./routes/matches.js";
import { errorHandler } from "./middleware/error.js";

const app = express();
app.use(cors({ origin: process.env.CLIENT_URL ?? "http://localhost:5173" }));
app.use(express.json({ limit: "5mb" }));

app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.use("/api/auth", authRouter);
app.use("/api/accounts", accountRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/signals", signalRouter);
app.use("/api/opportunities", opportunityRouter);
app.use("/api/requirements", requirementRouter);
app.use("/api/icp-profiles", icpRouter);
app.use("/api/imports", importRouter);
app.use("/api/intelligence", intelligenceRouter);
app.use("/api/matches", matchRouter);

app.use(errorHandler);

const port = Number(process.env.PORT ?? 4000);
app.listen(port, () => console.log(`API listening on http://localhost:${port}`));
