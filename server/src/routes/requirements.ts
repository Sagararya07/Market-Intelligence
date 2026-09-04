import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth, AuthRequest } from "../middleware/auth.js";

export const requirementRouter = Router();
requirementRouter.use(requireAuth);
requirementRouter.get("/", async (req: AuthRequest, res, next) => {
  try {
    const items = await prisma.requirement.findMany({ where: { account: { organizationId: req.user!.organizationId } }, include: { account: true, contact: true }, orderBy: { confidence: "desc" }, take: 200 });
    res.json({ items });
  } catch (e) { next(e); }
});
