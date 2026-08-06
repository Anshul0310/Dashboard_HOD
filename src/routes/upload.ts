import { Router, Request, Response } from "express";
import multer from "multer";
import streamifier from "streamifier";
import cloudinary from "../config/cloudinary";
import fs from "fs";
import path from "path";
import { auth } from "../middleware/auth";
import { UploadApiResponse } from "cloudinary";

const router = Router();

// Allowed MIME types for proof-of-work uploads
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Configure multer with memory storage and validation
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          `Invalid file type: ${file.mimetype}. Allowed: Images (JPG, PNG, GIF, WebP), PDF, DOC, DOCX.`
        )
      );
    }
  },
});

/**
 * Uploads a buffer to Cloudinary using upload_stream.
 */
function uploadToCloudinary(buffer: Buffer): Promise<UploadApiResponse> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "evidence_uploads", // Store files in a generic evidence folder
        resource_type: "auto",      // Auto-detects if it's an image, raw file (pdf), or video
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
 * POST /api/upload
 * multipart/form-data with field "file".
 * Validates file type (images, PDF, DOC, DOCX) and size (max 10MB).
 * Returns { url: "secure_url_here", originalName: "file.pdf", mimeType: "application/pdf", size: 12345 }
 */
router.post(
  "/",
  auth,
  (req: Request, res: Response, next: Function) => {
    upload.single("file")(req, res, (err: any) => {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          res.status(400).json({
            error: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.`,
          });
          return;
        }
        res.status(400).json({ error: err.message });
        return;
      } else if (err) {
        res.status(400).json({ error: err.message });
        return;
      }
      next();
    });
  },
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: "Authentication required." });
        return;
      }

      if (!req.file) {
        res.status(400).json({ error: "File is required." });
        return;
      }

      const isCloudinaryConfigured = process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_CLOUD_NAME !== "your-cloud-name";
      
      let url = "";

      if (isCloudinaryConfigured) {
        // Stream upload to cloudinary directly from memory
        const uploadResult = await uploadToCloudinary(req.file.buffer);
        url = uploadResult.secure_url;
      } else {
        // Fallback to local file system
        const uploadsDir = path.join(process.cwd(), "uploads");
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
        const ext = path.extname(req.file.originalname);
        const filename = `${req.file.fieldname}-${uniqueSuffix}${ext}`;
        const filePath = path.join(uploadsDir, filename);
        fs.writeFileSync(filePath, req.file.buffer);
        
        url = `${req.protocol}://${req.get("host")}/uploads/${filename}`;
      }

      res.status(200).json({
        url,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
      });
    } catch (error) {
      console.error("Generic file upload error:", error);
      res.status(500).json({ error: "File upload failed." });
    }
  }
);

export default router;
