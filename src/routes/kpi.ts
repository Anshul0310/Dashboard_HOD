import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { auth } from "../middleware/auth";

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/kpi/periods
 * Returns available KPI periods (generated list — current month + 5 prior).
 */
router.get("/periods", auth, async (_req: Request, res: Response): Promise<void> => {
  try {
    const now = new Date();
    const periods = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const month = d.getMonth() + 1;
      const year = d.getFullYear();
      const id = `${year}-${String(month).padStart(2, "0")}`;
      const label = d.toLocaleString("en-US", { month: "long", year: "numeric" });
      periods.push({ id, month, year, label });
    }
    res.json(periods);
  } catch (error) {
    console.error("Get periods error:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

/**
 * GET /api/kpi/submissions
 * Query params: ?department=<deptId>
 * HOD: only their department. MANAGEMENT: any department.
 * Returns all submissions for the department.
 */
router.get(
  "/submissions",
  auth,
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: "Authentication required." });
        return;
      }

      const department = (typeof req.query.department === 'string' ? req.query.department : undefined) || req.user.department;

      // HOD can only access their own department
      if (req.user.role === "HOD" && department !== req.user.department) {
        res.status(403).json({ error: "You can only access your own department." });
        return;
      }

      const submissions = await prisma.kpiSubmission.findMany({
        where: { department },
        orderBy: { periodId: "desc" },
        include: {
          submittedBy: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      // Parse JSON strings back to objects for the frontend
      const parsed = submissions.map((s) => ({
        ...s,
        data: JSON.parse(s.data),
        sectionStatuses: JSON.parse(s.sectionStatuses),
      }));

      res.json(parsed);
    } catch (error) {
      console.error("Get KPI submissions error:", error);
      res.status(500).json({ error: "Internal server error." });
    }
  }
);

/**
 * GET /api/kpi/submissions/:periodId
 * Query params: ?department=<deptId>
 * Returns a single KPI submission for the given period + department.
 */
router.get(
  "/submissions/:periodId",
  auth,
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: "Authentication required." });
        return;
      }

      const { periodId: rawPeriodId } = req.params;
      const periodId = Array.isArray(rawPeriodId) ? rawPeriodId[0] : rawPeriodId;
      const department = (typeof req.query.department === 'string' ? req.query.department : undefined) || req.user.department;

      if (req.user.role === "HOD" && department !== req.user.department) {
        res.status(403).json({ error: "You can only access your own department." });
        return;
      }

      const submission = await prisma.kpiSubmission.findUnique({
        where: {
          periodId_department: { periodId, department },
        },
        include: {
          submittedBy: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      if (!submission) {
        res.status(404).json({ error: "No submission found for this period." });
        return;
      }

      res.json({
        ...submission,
        data: JSON.parse(submission.data),
        sectionStatuses: JSON.parse(submission.sectionStatuses),
      });
    } catch (error) {
      console.error("Get KPI submission error:", error);
      res.status(500).json({ error: "Internal server error." });
    }
  }
);

/**
 * POST /api/kpi/submissions
 * Body: { periodId, department, data, sectionStatuses, submittedAt? }
 * Upserts a KPI submission (saves a draft or final submission).
 * Only HOD can create/update submissions for their own department.
 */
router.post(
  "/submissions",
  auth,
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: "Authentication required." });
        return;
      }

      // Only HOD can submit KPI data
      if (req.user.role !== "HOD") {
        res.status(403).json({ error: "Only HOD can submit KPI data." });
        return;
      }

      const { periodId, department, data, sectionStatuses, submittedAt } = req.body;

      if (!periodId || !department || !data || !sectionStatuses) {
        res.status(400).json({
          error: "periodId, department, data, and sectionStatuses are required.",
        });
        return;
      }

      // HOD can only submit for their own department
      if (department !== req.user.department) {
        res.status(403).json({
          error: "You can only submit KPI data for your own department.",
        });
        return;
      }

      const submission = await prisma.kpiSubmission.upsert({
        where: {
          periodId_department: { periodId, department },
        },
        update: {
          data: JSON.stringify(data),
          sectionStatuses: JSON.stringify(sectionStatuses),
          submittedAt: submittedAt ? new Date(submittedAt) : undefined,
        },
        create: {
          periodId,
          department,
          data: JSON.stringify(data),
          sectionStatuses: JSON.stringify(sectionStatuses),
          submittedById: req.user.id,
          submittedAt: submittedAt ? new Date(submittedAt) : undefined,
        },
      });

      res.status(200).json({
        ...submission,
        data: JSON.parse(submission.data),
        sectionStatuses: JSON.parse(submission.sectionStatuses),
      });
    } catch (error) {
      console.error("Save KPI submission error:", error);
      res.status(500).json({ error: "Internal server error." });
    }
  }
);

/**
 * PATCH /api/kpi/submissions/:periodId/section
 * Body: { department, sectionKey, values }
 * Saves a single section of a KPI submission.
 * Creates the submission if it doesn't exist yet.
 */
router.patch(
  "/submissions/:periodId/section",
  auth,
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: "Authentication required." });
        return;
      }

      if (req.user.role !== "HOD") {
        res.status(403).json({ error: "Only HOD can update KPI data." });
        return;
      }

      const { periodId: rawPeriodId } = req.params;
      const periodId = Array.isArray(rawPeriodId) ? rawPeriodId[0] : rawPeriodId;
      const { department, sectionKey, values } = req.body;

      if (!department || !sectionKey || values === undefined) {
        res.status(400).json({
          error: "department, sectionKey, and values are required.",
        });
        return;
      }

      if (department !== req.user.department) {
        res.status(403).json({
          error: "You can only update KPI data for your own department.",
        });
        return;
      }

      // Try to find existing submission
      const existing = await prisma.kpiSubmission.findUnique({
        where: {
          periodId_department: { periodId, department },
        },
      });

      if (existing) {
        // Update the specific section in the existing data
        const existingData = JSON.parse(existing.data) as Record<string, unknown>;
        const existingStatuses = JSON.parse(existing.sectionStatuses) as Record<string, string>;

        existingData[sectionKey] = {
          ...(existingData[sectionKey] as Record<string, unknown> || {}),
          ...values,
        };
        existingStatuses[sectionKey] = "completed";

        const updated = await prisma.kpiSubmission.update({
          where: { id: existing.id },
          data: {
            data: JSON.stringify(existingData),
            sectionStatuses: JSON.stringify(existingStatuses),
          },
        });

        res.json({
          ...updated,
          data: JSON.parse(updated.data),
          sectionStatuses: JSON.parse(updated.sectionStatuses),
        });
      } else {
        // Create a new submission with just this section
        const newData: Record<string, unknown> = { [sectionKey]: values };
        const newStatuses: Record<string, string> = { [sectionKey]: "completed" };

        const created = await prisma.kpiSubmission.create({
          data: {
            periodId,
            department,
            data: JSON.stringify(newData),
            sectionStatuses: JSON.stringify(newStatuses),
            submittedById: req.user.id,
          },
        });

        res.status(201).json({
          ...created,
          data: JSON.parse(created.data),
          sectionStatuses: JSON.parse(created.sectionStatuses),
        });
      }
    } catch (error) {
      console.error("Save KPI section error:", error);
      res.status(500).json({ error: "Internal server error." });
    }
  }
);

/**
 * GET /api/kpi/dashboard/overview
 * Query params: ?department=<deptId>
 * Returns aggregated dashboard data for management view.
 */
router.get(
  "/dashboard/overview",
  auth,
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: "Authentication required." });
        return;
      }

      const department = typeof req.query.department === 'string' ? req.query.department : undefined;

      // Build where clause
      const where = department ? { department } : {};

      const submissions = await prisma.kpiSubmission.findMany({
        where,
        orderBy: { periodId: "desc" },
        take: 12, // Last 12 months max
        include: {
          submittedBy: {
            select: { id: true, name: true },
          },
        },
      });

      // Parse JSON strings
      const parsed = submissions.map((s) => ({
        ...s,
        data: JSON.parse(s.data),
        sectionStatuses: JSON.parse(s.sectionStatuses),
      }));

      // Get distinct departments that have submitted
      const departments = await prisma.kpiSubmission.findMany({
        select: { department: true },
        distinct: ["department"],
      });

      res.json({
        submissions: parsed,
        departments: departments.map((d) => d.department),
        totalSubmissions: submissions.length,
      });
    } catch (error) {
      console.error("Dashboard overview error:", error);
      res.status(500).json({ error: "Internal server error." });
    }
  }
);

export default router;
