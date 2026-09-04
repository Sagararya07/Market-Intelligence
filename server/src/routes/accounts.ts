import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth, AuthRequest } from "../middleware/auth.js";
import { scoreOpportunity } from "../services/scoring.service.js";

export const accountRouter = Router();
accountRouter.use(requireAuth);

accountRouter.get("/", async (req: AuthRequest, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page ?? 1));
    const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize ?? 20)));
    const search = String(req.query.search ?? "");
    const filter = String(req.query.filter ?? "all");
    const where: any = {
      organizationId: req.user!.organizationId,
      ...(search ? { OR: [{ companyName: { contains: search, mode: "insensitive" } }, { industry: { contains: search, mode: "insensitive" } }, { city: { contains: search, mode: "insensitive" } }] } : {}),
      ...(filter === "new" ? { assessments: { none: {} } } : filter === "analyzed" ? { assessments: { some: {} } } : {})
    };
    const [items, total] = await Promise.all([
      prisma.account.findMany({ where, include: { contacts: true, signals: { orderBy: { detectedAt: "desc" }, take: 1 }, assessments: { orderBy: { evaluatedAt: "desc" }, take: 1 } }, orderBy: { updatedAt: "desc" }, skip: (page-1)*pageSize, take: pageSize }),
      prisma.account.count({ where })
    ]);
    res.json({ items, total, page, pageSize });
  } catch (e) { next(e); }
});

accountRouter.get("/:id", async (req: AuthRequest, res, next) => {
  try {
    const account = await prisma.account.findFirst({
      where: { id: req.params.id, organizationId: req.user!.organizationId },
      include: {
        contacts: true, sources: true, technologies: { include: { technology: true } },
        signals: { orderBy: { detectedAt: "desc" }, include: { classification: true } },
        buyerIntents: { orderBy: { score: "desc" } }, sellerIntents: { orderBy: { score: "desc" } },
        requirements: { orderBy: { confidence: "desc" } }, painPoints: true, growthSignals: true,
        intelligence: true, productProfile: true, assessments: { orderBy: { evaluatedAt: "desc" }, take: 5 },
        strategicIntent: true, diagnosis: { include: { dimensions: true } },
        opportunities: { orderBy: { opportunityScore: "desc" }, include: { signals: { include: { signal: true } } } },
        events: { orderBy: { eventDate: "desc" } }, evidence: { orderBy: { capturedAt: "desc" } }
      }
    });
    if (!account) return res.status(404).json({ error: "Account not found" });
    const score = await scoreOpportunity(account.id, req.user!.organizationId);
    res.json({ account, score });
  } catch (e) { next(e); }
});
