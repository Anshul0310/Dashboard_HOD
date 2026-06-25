import { Router, Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

/**
 * POST /api/auth/login
 * Body: { email, password }
 * Returns: { token: JWT({ id, role }) }
 */
router.post("/login", async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required." });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      res.status(401).json({ error: "Invalid email or password." });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      res.status(401).json({ error: "Invalid email or password." });
      return;
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      res.status(500).json({ error: "JWT secret not configured." });
      return;
    }

    const token = jwt.sign({ id: user.id, role: user.role }, secret, {
      expiresIn: "24h",
    });

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

/**
 * GET /api/auth/me
 * Returns the current user info from the JWT token.
 * Used by the frontend to verify/restore sessions.
 */
router.get("/me", async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ error: "No token provided." });
      return;
    }

    const token = authHeader.split(" ")[1];
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      res.status(500).json({ error: "JWT secret not configured." });
      return;
    }

    const decoded = jwt.verify(token, secret) as { id: string; role: string };
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user) {
      res.status(401).json({ error: "User not found." });
      return;
    }

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
    });
  } catch {
    res.status(401).json({ error: "Invalid or expired token." });
  }
});

/**
 * POST /api/auth/register
 * Body: { email, password, name, role, department }
 * Creates a new user. Only accessible by MANAGEMENT role users.
 */
router.post("/register", async (req: Request, res: Response): Promise<void> => {
  try {
    // Check authorization
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const secret = process.env.JWT_SECRET;
      if (secret) {
        try {
          const decoded = jwt.verify(token, secret) as { id: string; role: string };
          const adminUser = await prisma.user.findUnique({ where: { id: decoded.id } });
          if (!adminUser || adminUser.role !== "MANAGEMENT") {
            res.status(403).json({ error: "Only management users can register new accounts." });
            return;
          }
        } catch {
          res.status(401).json({ error: "Invalid token." });
          return;
        }
      }
    } else {
      // Allow unauthenticated registration only if no users exist (initial setup)
      const userCount = await prisma.user.count();
      if (userCount > 0) {
        res.status(401).json({ error: "Authentication required to register new users." });
        return;
      }
    }

    const { email, password, name, role, department } = req.body;

    if (!email || !password || !name || !department) {
      res.status(400).json({ error: "email, password, name, and department are required." });
      return;
    }

    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ error: "A user with this email already exists." });
      return;
    }

    const validRoles = ["HOD", "FACULTY", "MANAGEMENT"];
    const userRole = validRoles.includes(role) ? role : "FACULTY";

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { email, passwordHash, name, role: userRole, department },
    });

    res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

export default router;
