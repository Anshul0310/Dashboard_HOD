import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

/**
 * Simple API key auth for Power BI endpoints.
 * Power BI can't send JWT tokens, so we use a query param key.
 */
function checkApiKey(req: Request, res: Response): boolean {
  const key = req.query.key as string;
  const expectedKey = process.env.POWERBI_API_KEY || "nmit-powerbi-data-key-2026";

  if (!key || key !== expectedKey) {
    res.status(401).json({ error: "Invalid or missing API key. Pass ?key=YOUR_KEY" });
    return false;
  }
  return true;
}

/**
 * GET /api/powerbi/kpi-data
 * Returns all KPI submissions as a flat JSON array.
 * Each row = one department + one period, with all 15 sections flattened.
 *
 * Power BI can connect to this as a Web data source:
 *   http://localhost:3000/api/powerbi/kpi-data?key=YOUR_API_KEY
 */
router.get("/kpi-data", async (req: Request, res: Response): Promise<void> => {
  if (!checkApiKey(req, res)) return;

  try {
    const submissions = await prisma.kpiSubmission.findMany({
      orderBy: [{ department: "asc" }, { periodId: "desc" }],
      include: {
        submittedBy: {
          select: { name: true, email: true },
        },
      },
    });

    const rows = submissions.map((s) => {
      const data = JSON.parse(s.data) as Record<string, Record<string, unknown>>;
      const statuses = JSON.parse(s.sectionStatuses) as Record<string, string>;

      // Flatten all section data into a single row
      const flat: Record<string, unknown> = {
        // Meta
        id: s.id,
        periodId: s.periodId,
        department: s.department,
        submittedByName: s.submittedBy?.name || "",
        submittedByEmail: s.submittedBy?.email || "",
        submittedAt: s.submittedAt?.toISOString() || null,
        lastUpdated: s.lastUpdated.toISOString(),
        createdAt: s.createdAt.toISOString(),
      };

      // Flatten each section's data with a prefix
      const sectionKeys = [
        "faculty", "lms", "latePunchIn", "facultyPublications",
        "studentPublications", "fundedProjects", "phdGuideship", "mous",
        "fdp", "placement", "awardsFaculty", "awardsStudents",
        "consultancy", "partialDelivery", "patentsIpr",
      ];

      for (const sectionKey of sectionKeys) {
        const sectionData = data[sectionKey] as Record<string, unknown> | undefined;
        flat[`${sectionKey}_status`] = statuses[sectionKey] || "not_started";

        if (sectionData && typeof sectionData === "object") {
          for (const [fieldKey, fieldValue] of Object.entries(sectionData)) {
            // Arrays are joined as comma-separated strings for Power BI
            const val = Array.isArray(fieldValue) ? fieldValue.join(", ") : fieldValue;
            flat[`${sectionKey}_${fieldKey}`] = val;
          }
        }
      }

      return flat;
    });

    res.json(rows);
  } catch (error) {
    console.error("Power BI data export error:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

/**
 * GET /api/powerbi/kpi-data.csv
 * Same data as /kpi-data but in CSV format.
 * Power BI Desktop can import this directly.
 */
router.get("/kpi-data.csv", async (req: Request, res: Response): Promise<void> => {
  if (!checkApiKey(req, res)) return;

  try {
    const submissions = await prisma.kpiSubmission.findMany({
      orderBy: [{ department: "asc" }, { periodId: "desc" }],
      include: {
        submittedBy: {
          select: { name: true, email: true },
        },
      },
    });

    if (submissions.length === 0) {
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=kpi-data.csv");
      res.send("No data available\n");
      return;
    }

    // Build rows same as JSON endpoint
    const rows = submissions.map((s) => {
      const data = JSON.parse(s.data) as Record<string, Record<string, unknown>>;
      const statuses = JSON.parse(s.sectionStatuses) as Record<string, string>;
      const flat: Record<string, unknown> = {
        id: s.id,
        periodId: s.periodId,
        department: s.department,
        submittedByName: s.submittedBy?.name || "",
        submittedByEmail: s.submittedBy?.email || "",
        submittedAt: s.submittedAt?.toISOString() || "",
        lastUpdated: s.lastUpdated.toISOString(),
        createdAt: s.createdAt.toISOString(),
      };

      const sectionKeys = [
        "faculty", "lms", "latePunchIn", "facultyPublications",
        "studentPublications", "fundedProjects", "phdGuideship", "mous",
        "fdp", "placement", "awardsFaculty", "awardsStudents",
        "consultancy", "partialDelivery", "patentsIpr",
      ];

      for (const sectionKey of sectionKeys) {
        const sectionData = data[sectionKey] as Record<string, unknown> | undefined;
        flat[`${sectionKey}_status`] = statuses[sectionKey] || "not_started";
        if (sectionData && typeof sectionData === "object") {
          for (const [fieldKey, fieldValue] of Object.entries(sectionData)) {
            const val = Array.isArray(fieldValue) ? fieldValue.join("; ") : fieldValue;
            flat[`${sectionKey}_${fieldKey}`] = val;
          }
        }
      }

      return flat;
    });

    // Collect all unique column keys across all rows
    const allKeys = new Set<string>();
    for (const row of rows) {
      for (const key of Object.keys(row)) {
        allKeys.add(key);
      }
    }
    const headers = Array.from(allKeys);

    // Build CSV
    const escapeCsv = (val: unknown): string => {
      if (val === null || val === undefined) return "";
      const str = String(val);
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const csvLines = [headers.join(",")];
    for (const row of rows) {
      csvLines.push(headers.map((h) => escapeCsv(row[h])).join(","));
    }

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=kpi-data.csv");
    res.send(csvLines.join("\n"));
  } catch (error) {
    console.error("Power BI CSV export error:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

/**
 * GET /api/powerbi/summary
 * Returns a high-level summary of all departments for the latest period.
 * Useful for Power BI summary dashboards.
 */
router.get("/summary", async (req: Request, res: Response): Promise<void> => {
  if (!checkApiKey(req, res)) return;

  try {
    // Get the latest period that has submissions
    const latestSubmission = await prisma.kpiSubmission.findFirst({
      orderBy: { periodId: "desc" },
      select: { periodId: true },
    });

    if (!latestSubmission) {
      res.json({ period: null, departments: [] });
      return;
    }

    const submissions = await prisma.kpiSubmission.findMany({
      where: { periodId: latestSubmission.periodId },
      orderBy: { department: "asc" },
    });

    const summaries = submissions.map((s) => {
      const data = JSON.parse(s.data) as Record<string, Record<string, unknown>>;
      const statuses = JSON.parse(s.sectionStatuses) as Record<string, string>;

      // Calculate completion percentage
      const totalSections = Object.keys(statuses).length || 15;
      const completedSections = Object.values(statuses).filter((v) => v === "completed").length;
      const completionPercent = Math.round((completedSections / totalSections) * 100);

      // Extract key metrics
      const faculty = data.faculty as Record<string, number> | undefined;
      const placement = data.placement as Record<string, number> | undefined;
      const publications = data.facultyPublications as Record<string, number> | undefined;
      const patents = data.patentsIpr as Record<string, number> | undefined;

      return {
        department: s.department,
        periodId: s.periodId,
        completionPercent,
        completedSections,
        totalSections,
        totalFaculty: (faculty?.profCount || 0) + (faculty?.assocProfCount || 0) + (faculty?.asstProfCount || 0),
        totalPublications: (publications?.q1Publications || 0) + (publications?.q2Publications || 0) + (publications?.conferencePapers || 0),
        placementRate: placement?.totalWithOffers && (placement.totalWithOffers + (placement?.totalWithoutOffers || 0)) > 0
          ? Math.round((placement.totalWithOffers / (placement.totalWithOffers + (placement?.totalWithoutOffers || 0))) * 100)
          : 0,
        patentsFiled: patents?.patentsFiled || 0,
        lastUpdated: s.lastUpdated.toISOString(),
      };
    });

    res.json({
      period: latestSubmission.periodId,
      departments: summaries,
    });
  } catch (error) {
    console.error("Power BI summary error:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

export default router;
