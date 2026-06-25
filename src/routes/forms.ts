import { Router, Request, Response } from "express";
import { PrismaClient, Prisma } from "@prisma/client";
import { auth } from "../middleware/auth";
import { roleGuard } from "../middleware/roleGuard";

const router = Router();
const prisma = new PrismaClient();

/**
 * POST /api/forms/templates — MANAGEMENT only
 * Body: { title, schema }
 * schema must be a non-empty array.
 */
router.post(
  "/templates",
  auth,
  roleGuard,
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: "Authentication required." });
        return;
      }

      const { title, schema } = req.body;

      if (!title || typeof title !== "string" || title.trim().length === 0) {
        res.status(400).json({ error: "Title is required." });
        return;
      }

      if (!Array.isArray(schema) || schema.length === 0) {
        res
          .status(400)
          .json({ error: "Schema must be a non-empty array." });
        return;
      }

      const template = await prisma.dynamicFormTemplate.create({
        data: {
          title: title.trim(),
          schema: schema,
          createdBy: req.user.id,
        },
      });

      res.status(201).json(template);
    } catch (error) {
      console.error("Create template error:", error);
      res.status(500).json({ error: "Internal server error." });
    }
  }
);

/**
 * GET /api/forms/templates — MANAGEMENT only
 * Returns all templates.
 */
router.get(
  "/templates",
  auth,
  roleGuard,
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const templates = await prisma.dynamicFormTemplate.findMany({
        orderBy: { createdAt: "desc" },
      });

      res.json(templates);
    } catch (error) {
      console.error("Get templates error:", error);
      res.status(500).json({ error: "Internal server error." });
    }
  }
);

/**
 * GET /api/forms/active — Any authenticated user
 * Returns templates where isActive = true.
 */
router.get(
  "/active",
  auth,
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const templates = await prisma.dynamicFormTemplate.findMany({
        where: { isActive: true },
        orderBy: { createdAt: "desc" },
      });

      res.json(templates);
    } catch (error) {
      console.error("Get active templates error:", error);
      res.status(500).json({ error: "Internal server error." });
    }
  }
);

/**
 * POST /api/forms/submit — FACULTY only
 * Body: { formTemplateId, data }
 * Validates that every schema field ID exists as a key in the submitted data.
 * Catches P2002 (unique constraint violation) and returns 409.
 */
router.post(
  "/submit",
  auth,
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: "Authentication required." });
        return;
      }

      if (req.user.role !== "FACULTY") {
        res
          .status(403)
          .json({ error: "Forbidden. Only FACULTY can submit forms." });
        return;
      }

      const { formTemplateId, data } = req.body;

      if (!formTemplateId) {
        res.status(400).json({ error: "formTemplateId is required." });
        return;
      }

      if (!data || typeof data !== "object" || Array.isArray(data)) {
        res.status(400).json({ error: "data must be a non-null object." });
        return;
      }

      // Fetch the template
      const template = await prisma.dynamicFormTemplate.findUnique({
        where: { id: formTemplateId },
      });

      if (!template) {
        res.status(404).json({ error: "Form template not found." });
        return;
      }

      // Extract schema field IDs
      const schema = template.schema as Array<{ id: string; [key: string]: unknown }>;
      const schemaFieldIds = schema.map((field) => field.id);

      // Validate that every schema field ID exists as a key in the submitted data
      const submittedKeys = Object.keys(data);
      const missingFields = schemaFieldIds.filter(
        (fieldId) => !submittedKeys.includes(fieldId)
      );

      if (missingFields.length > 0) {
        res.status(400).json({
          error: "Missing required fields.",
          missingFields,
        });
        return;
      }

      // Insert into DynamicFormSubmission
      const submission = await prisma.dynamicFormSubmission.create({
        data: {
          formTemplateId,
          facultyId: req.user.id,
          data: data,
        },
      });

      res.status(201).json(submission);
    } catch (error) {
      // Catch P2002 unique constraint violation
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        res.status(409).json({
          error: "You have already submitted this form.",
        });
        return;
      }

      console.error("Form submission error:", error);
      res.status(500).json({ error: "Internal server error." });
    }
  }
);

export default router;
