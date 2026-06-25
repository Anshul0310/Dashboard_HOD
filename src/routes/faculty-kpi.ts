import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { auth } from "../middleware/auth";

const router = Router();
const prisma = new PrismaClient();

/**
 * POST /api/faculty-kpi/submissions
 * Faculty submits/saves their personal KPI data for a period.
 * Upserts based on periodId + facultyId.
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

      const { periodId, data, submit } = req.body;

      if (!periodId || !data) {
        res.status(400).json({ error: "periodId and data are required." });
        return;
      }

      const status = submit ? "SUBMITTED" : "DRAFT";

      const submission = await prisma.facultyKpiSubmission.upsert({
        where: {
          periodId_facultyId: {
            periodId,
            facultyId: req.user.id,
          },
        },
        update: {
          data: JSON.stringify(data),
          status,
          submittedAt: submit ? new Date() : undefined,
        },
        create: {
          periodId,
          department: req.user.department,
          facultyId: req.user.id,
          data: JSON.stringify(data),
          status,
          submittedAt: submit ? new Date() : undefined,
        },
      });

      res.json({
        ...submission,
        data: JSON.parse(submission.data),
      });
    } catch (error) {
      console.error("Faculty KPI save error:", error);
      res.status(500).json({ error: "Internal server error." });
    }
  }
);

/**
 * GET /api/faculty-kpi/submissions/my
 * Faculty views their own submissions across all periods.
 */
router.get(
  "/submissions/my",
  auth,
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: "Authentication required." });
        return;
      }

      const submissions = await prisma.facultyKpiSubmission.findMany({
        where: { facultyId: req.user.id },
        orderBy: { periodId: "desc" },
      });

      const parsed = submissions.map((s) => ({
        ...s,
        data: JSON.parse(s.data),
      }));

      res.json(parsed);
    } catch (error) {
      console.error("Faculty KPI list error:", error);
      res.status(500).json({ error: "Internal server error." });
    }
  }
);

/**
 * GET /api/faculty-kpi/submissions/my/:periodId
 * Faculty views their submission for a specific period.
 */
router.get(
  "/submissions/my/:periodId",
  auth,
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: "Authentication required." });
        return;
      }

      const { periodId } = req.params;

      const submission = await prisma.facultyKpiSubmission.findUnique({
        where: {
          periodId_facultyId: {
            periodId,
            facultyId: req.user.id,
          },
        },
      });

      if (!submission) {
        res.status(404).json({ error: "No submission found." });
        return;
      }

      res.json({
        ...submission,
        data: JSON.parse(submission.data),
      });
    } catch (error) {
      console.error("Faculty KPI get error:", error);
      res.status(500).json({ error: "Internal server error." });
    }
  }
);

/**
 * GET /api/faculty-kpi/department
 * HOD views all faculty submissions for their department.
 * Query params: ?periodId=2026-06&status=SUBMITTED
 */
router.get(
  "/department",
  auth,
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: "Authentication required." });
        return;
      }

      if (req.user.role !== "HOD" && req.user.role !== "MANAGEMENT") {
        res.status(403).json({ error: "Only HOD/Management can view department submissions." });
        return;
      }

      const department = req.user.role === "HOD" ? req.user.department : (req.query.department as string || undefined);
      const periodId = req.query.periodId as string || undefined;
      const status = req.query.status as string || undefined;

      const where: Record<string, unknown> = {};
      if (department) where.department = department;
      if (periodId) where.periodId = periodId;
      if (status) where.status = status;

      const submissions = await prisma.facultyKpiSubmission.findMany({
        where,
        orderBy: [{ status: "asc" }, { lastUpdated: "desc" }],
        include: {
          faculty: {
            select: { id: true, name: true, email: true, department: true },
          },
          reviewedBy: {
            select: { id: true, name: true },
          },
        },
      });

      const parsed = submissions.map((s) => ({
        ...s,
        data: JSON.parse(s.data),
      }));

      res.json(parsed);
    } catch (error) {
      console.error("Department submissions error:", error);
      res.status(500).json({ error: "Internal server error." });
    }
  }
);

/**
 * PATCH /api/faculty-kpi/submissions/:id/review
 * HOD approves or rejects a faculty submission.
 * Body: { action: "APPROVED" | "REJECTED", reviewNote?: string }
 */
router.patch(
  "/submissions/:id/review",
  auth,
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: "Authentication required." });
        return;
      }

      if (req.user.role !== "HOD") {
        res.status(403).json({ error: "Only HOD can review submissions." });
        return;
      }

      const { id } = req.params;
      const { action, reviewNote } = req.body;

      if (!action || !["APPROVED", "REJECTED"].includes(action)) {
        res.status(400).json({ error: "action must be 'APPROVED' or 'REJECTED'." });
        return;
      }

      // Verify the submission exists and belongs to HOD's department
      const submission = await prisma.facultyKpiSubmission.findUnique({
        where: { id },
      });

      if (!submission) {
        res.status(404).json({ error: "Submission not found." });
        return;
      }

      if (submission.department !== req.user.department) {
        res.status(403).json({ error: "You can only review submissions from your department." });
        return;
      }

      if (submission.status !== "SUBMITTED") {
        res.status(400).json({ error: "Only SUBMITTED submissions can be reviewed." });
        return;
      }

      const updated = await prisma.facultyKpiSubmission.update({
        where: { id },
        data: {
          status: action,
          reviewedById: req.user.id,
          reviewNote: reviewNote || null,
          reviewedAt: new Date(),
        },
        include: {
          faculty: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      res.json({
        ...updated,
        data: JSON.parse(updated.data),
      });
    } catch (error) {
      console.error("Review submission error:", error);
      res.status(500).json({ error: "Internal server error." });
    }
  }
);

/**
 * GET /api/faculty-kpi/department-summary
 * HOD gets aggregated counts of approved faculty data for their dept.
 * This can be used to auto-fill the department KPI report.
 */
router.get(
  "/department-summary",
  auth,
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: "Authentication required." });
        return;
      }

      if (req.user.role !== "HOD") {
        res.status(403).json({ error: "Only HOD can view department summary." });
        return;
      }

      const periodId = req.query.periodId as string;
      if (!periodId) {
        res.status(400).json({ error: "periodId is required." });
        return;
      }

      const approvedSubmissions = await prisma.facultyKpiSubmission.findMany({
        where: {
          department: req.user.department,
          periodId,
          status: "APPROVED",
        },
        include: {
          faculty: {
            select: { name: true },
          },
        },
      });

      // Aggregate the data from all approved submissions
      const allData = approvedSubmissions.map((s) => ({
        facultyName: s.faculty.name,
        data: JSON.parse(s.data),
      }));

      // Summary stats
      const stats = {
        totalFaculty: approvedSubmissions.length,
        submitted: await prisma.facultyKpiSubmission.count({
          where: { department: req.user.department, periodId, status: "SUBMITTED" },
        }),
        approved: approvedSubmissions.length,
        rejected: await prisma.facultyKpiSubmission.count({
          where: { department: req.user.department, periodId, status: "REJECTED" },
        }),
        draft: await prisma.facultyKpiSubmission.count({
          where: { department: req.user.department, periodId, status: "DRAFT" },
        }),
      };

      res.json({
        periodId,
        department: req.user.department,
        stats,
        submissions: allData,
      });
    } catch (error) {
      console.error("Department summary error:", error);
      res.status(500).json({ error: "Internal server error." });
    }
  }
);

export default router;
