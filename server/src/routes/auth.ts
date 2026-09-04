import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";

export const authRouter = Router();

authRouter.post("/login", async (req, res, next) => {
  try {
    const body = z.object({ email: z.string().email(), password: z.string().min(8) }).parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: body.email } });
    if (!user || !(await bcrypt.compare(body.password, user.passwordHash))) return res.status(401).json({ error: "Invalid credentials" });
    const token = jwt.sign({ id: user.id, organizationId: user.organizationId, role: user.role }, process.env.JWT_SECRET ?? "dev-secret", { expiresIn: "8h" });
    res.json({ token, user: { id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email, role: user.role, organizationId: user.organizationId } });
  } catch (e) { next(e); }
});
