import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

export type AuthRequest = Request & { user?: { id: string; organizationId: string; role: string } };

import { prisma } from "../lib/prisma.js";

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Authentication required" });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET ?? "dev-secret") as any;
    prisma.user.findUnique({ where: { id: payload.id } }).then(user => {
      if (!user) return res.status(401).json({ error: "User no longer exists" });
      req.user = payload;
      next();
    }).catch(err => {
      res.status(500).json({ error: "Database error during auth" });
    });
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
