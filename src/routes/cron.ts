import { Router } from "express";
import { runFridayReminder, runSundayLock } from "../services/cron";

const router = Router();

// Middleware to secure cron endpoints
function requireCronSecret(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization;
  if (!process.env.CRON_SECRET) {
    console.warn("CRON_SECRET is not set. Cron endpoints are open!");
    return next();
  }

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized cron request" });
  }

  next();
}

router.get("/friday-reminder", requireCronSecret, async (req, res) => {
  try {
    await runFridayReminder();
    res.status(200).json({ success: true, message: "Friday reminder executed" });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get("/sunday-lock", requireCronSecret, async (req, res) => {
  try {
    await runSundayLock();
    res.status(200).json({ success: true, message: "Sunday lock executed" });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
