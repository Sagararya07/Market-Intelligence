import { Request, Response, NextFunction } from "express";
export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  console.error(err);
  res.status(err.statusCode ?? 500).json({ error: err.statusCode ? err.message : "Internal server error" });
}
