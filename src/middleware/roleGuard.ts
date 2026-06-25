import { Request, Response, NextFunction } from "express";

export const roleGuard = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({ error: "Authentication required." });
    return;
  }

  if (req.user.role !== "MANAGEMENT") {
    res
      .status(403)
      .json({ error: "Forbidden. MANAGEMENT role required." });
    return;
  }

  next();
};
