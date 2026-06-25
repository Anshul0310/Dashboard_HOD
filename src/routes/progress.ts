import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { auth } from "../middleware/auth";
import { getWeekStart, isSubmissionWindowClosed } from "../utils/week";

const router = Router();
const prisma = new PrismaClient();

/**
 * POST /api/progress
 * Body: { courseId, percentage, additionalMetrics? }
 * Business rule: REJECT if current server time is past Sunday 23:59
 * of the active week. Derive weekStartDate as the Monday of the current week.
 * Upsert the WeeklyProgress record (match on courseId + facultyId + weekStartDate).
 */
router.post("/", auth, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required." });
      return;
    }

    const { courseId, percentage, additionalMetrics } = req.body;

    if (!courseId || percentage === undefined || percentage === null) {
      res
        .status(400)
        .json({ error: "courseId and percentage are required." });
      return;
    }

    if (typeof percentage !== "number" || percentage < 0 || percentage > 100) {
      res
        .status(400)
        .json({ error: "percentage must be a number between 0 and 100." });
      return;
    }

    // Check if submission window is closed
    if (isSubmissionWindowClosed()) {
      res.status(403).json({ error: "Submission window closed" });
      return;
    }

    const weekStartDate = getWeekStart(new Date());

    // Check if the record for this week is locked
    const existingProgress = await prisma.weeklyProgress.findFirst({
      where: {
        courseId,
        facultyId: req.user.id,
        weekStartDate,
      },
    });

    if (existingProgress?.isLocked) {
      res
        .status(403)
        .json({ error: "This week's progress has been locked and cannot be modified." });
      return;
    }

    // Upsert the WeeklyProgress record
    const progress = await prisma.weeklyProgress.upsert({
      where: existingProgress
        ? { id: existingProgress.id }
        : { id: "non-existent-id" },
      update: {
        percentageCompleted: percentage,
        additionalMetrics: additionalMetrics ?? undefined,
      },
      create: {
        courseId,
        facultyId: req.user.id,
        weekStartDate,
        percentageCompleted: percentage,
        additionalMetrics: additionalMetrics ?? undefined,
      },
    });

    res.status(200).json(progress);
  } catch (error) {
    console.error("Progress submission error:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

/**
 * GET /api/progress/my-courses
 * Returns all courses for the authenticated user with their latest WeeklyProgress entry.
 */
router.get(
  "/my-courses",
  auth,
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: "Authentication required." });
        return;
      }

      const courses = await prisma.course.findMany({
        where: { facultyId: req.user.id },
        include: {
          progresses: {
            orderBy: { weekStartDate: "desc" },
            take: 1,
          },
        },
      });

      const result = courses.map((course) => ({
        ...course,
        latestProgress: course.progresses[0] || null,
        progresses: undefined,
      }));

      res.json(result);
    } catch (error) {
      console.error("My courses error:", error);
      res.status(500).json({ error: "Internal server error." });
    }
  }
);

export default router;
