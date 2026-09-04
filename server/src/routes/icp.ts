import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth, AuthRequest } from "../middleware/auth.js";

export const icpRouter = Router();
icpRouter.use(requireAuth);

icpRouter.get("/", async (req: AuthRequest, res, next) => {
  try {
    const items = await prisma.icpProfile.findMany({ where: { organizationId: req.user!.organizationId }, include: { rules: true }, orderBy: { createdAt: "desc" } });
    res.json({ items });
  } catch (e) { next(e); }
});

icpRouter.post("/", async (req: AuthRequest, res, next) => {
  try {
    const { name, description, rules = [] } = req.body;
    const item = await prisma.icpProfile.create({ data: { organizationId: req.user!.organizationId, name, description, rules: { create: rules } }, include: { rules: true } });
    res.status(201).json(item);
  } catch (e) { next(e); }
});
