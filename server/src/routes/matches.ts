import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth, AuthRequest } from "../middleware/auth.js";

export const matchRouter = Router();
matchRouter.use(requireAuth);

matchRouter.get("/", async (req: AuthRequest, res, next) => {
  try {
    // In our simplified logic, matches belong to the buyer organization. We find matches where the buyer organization matches.
    const items = await prisma.opportunityMatch.findMany({
      where: { buyerAccount: { organizationId: req.user!.organizationId } },
      include: { buyerAccount: true, sellerAccount: true, buyerRequirement: true },
      orderBy: { matchScore: "desc" },
      take: 200
    });
    res.json({ items });
  } catch (e) {
    next(e);
  }
});
