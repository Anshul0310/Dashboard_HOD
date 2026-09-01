import { Request, Response, NextFunction } from "express";

/**
 * Creates a role guard middleware that restricts access to the specified roles.
 * Usage: router.get("/route", auth, requireRole("MANAGEMENT", "COLLEGE_ADMIN"), handler)
 */
export const requireRole = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required." });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res
        .status(403)
        .json({ error: `Forbidden. Required role: ${allowedRoles.join(" or ")}.` });
      return;
    }

    next();
  };
};

/** Legacy alias — restricts to MANAGEMENT only */
export const roleGuard = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  requireRole("MANAGEMENT")(req, res, next);
};
