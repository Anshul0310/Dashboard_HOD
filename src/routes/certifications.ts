import { Router, Request, Response } from "express";
import multer from "multer";
import streamifier from "streamifier";
import { PrismaClient } from "@prisma/client";
import cloudinary from "../config/cloudinary";
import { auth } from "../middleware/auth";
import { UploadApiResponse } from "cloudinary";

const router = Router();
const prisma = new PrismaClient();

// Configure multer with memory storage
const upload = multer({ storage: multer.memoryStorage() });

/**
 * Uploads a buffer to Cloudinary using upload_stream, wrapped in a Promise.
 */
function uploadToCloudinary(buffer: Buffer): Promise<UploadApiResponse> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "certifications",
        resource_type: "auto",
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else if (result) {
          resolve(result);
        } else {
          reject(new Error("Cloudinary upload returned no result."));
        }
      }
    );

    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
}

/**
 * POST /api/certifications/upload
 * multipart/form-data with field "certificate" (file) and "title" (text).
 * Streams the file buffer to Cloudinary, saves the record, returns it.
 */
router.post(
  "/upload",
  auth,
  upload.single("certificate"),
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: "Authentication required." });
        return;
      }

      if (!req.file) {
        res.status(400).json({ error: "Certificate file is required." });
        return;
      }

      const { title } = req.body;

      if (!title || typeof title !== "string" || title.trim().length === 0) {
        res.status(400).json({ error: "Title is required." });
        return;
      }

      // Upload to Cloudinary
      const uploadResult = await uploadToCloudinary(req.file.buffer);

      // Save to database
      const certification = await prisma.certification.create({
        data: {
          facultyId: req.user.id,
          title: title.trim(),
          documentUrl: uploadResult.secure_url,
        },
      });

      res.status(201).json(certification);
    } catch (error) {
      console.error("Certification upload error:", error);
      res.status(500).json({ error: "Internal server error." });
    }
  }
);

export default router;
