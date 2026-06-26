import { Router, Request, Response } from "express";
import multer from "multer";
import streamifier from "streamifier";
import cloudinary from "../config/cloudinary";
import fs from "fs";
import path from "path";
import { auth } from "../middleware/auth";
import { UploadApiResponse } from "cloudinary";

const router = Router();

// Configure multer with memory storage
const upload = multer({ storage: multer.memoryStorage() });

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
 * Returns { url: "secure_url_here" }
 */
router.post(
  "/",
  auth,
  upload.single("file"),
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

      res.status(200).json({ url });
    } catch (error) {
      console.error("Generic file upload error:", error);
      res.status(500).json({ error: "File upload failed." });
    }
  }
);

export default router;
