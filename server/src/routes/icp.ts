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

icpRouter.get("/:id", async (req: AuthRequest, res, next) => {
  try {
    const item = await prisma.icpProfile.findFirst({
      where: { id: req.params.id, organizationId: req.user!.organizationId },
      include: { rules: true }
    });
    if (!item) return res.status(404).json({ error: "Profile not found" });
    res.json(item);
  } catch (e) { next(e); }
});

icpRouter.put("/:id", async (req: AuthRequest, res, next) => {
  try {
    const { name, description, isActive, rules = [] } = req.body;
    
    // We will delete existing rules and recreate them to keep it simple
    await prisma.icpRule.deleteMany({
      where: { icpProfileId: req.params.id, icpProfile: { organizationId: req.user!.organizationId } }
    });
    
    const item = await prisma.icpProfile.update({
      where: { id: req.params.id, organizationId: req.user!.organizationId },
      data: { name, description, isActive, rules: { create: rules } },
      include: { rules: true }
    });
    res.json(item);
  } catch (e) { next(e); }
});

icpRouter.delete("/:id", async (req: AuthRequest, res, next) => {
  try {
    await prisma.icpProfile.delete({
      where: { id: req.params.id, organizationId: req.user!.organizationId }
    });
    res.status(204).send();
  } catch (e) { next(e); }
});

