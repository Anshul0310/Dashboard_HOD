import { PrismaClient } from "@prisma/client";
import { getWeekStart } from "../utils/week";
import { emailService } from "./email";

const prisma = new PrismaClient();

/**
 * Job 1 — Friday Reminder
 * Finds all FACULTY users who have NOT submitted a WeeklyProgress entry
 * for the current week and sends them a reminder.
 */
export async function runFridayReminder(): Promise<void> {
  console.log("[CRON] Friday Reminder job started.");

  try {
    const weekStartDate = getWeekStart(new Date());

    // Find all FACULTY users who do NOT have a WeeklyProgress entry for this week
    const facultyWithoutProgress = await prisma.user.findMany({
      where: {
        role: "FACULTY",
        progresses: {
          none: {
            weekStartDate: weekStartDate,
          },
        },
      },
    });

    console.log(
      `[CRON] Found ${facultyWithoutProgress.length} faculty without progress this week.`
    );

    for (const user of facultyWithoutProgress) {
      emailService.sendReminder(user);
    }
  } catch (error) {
    console.error("[CRON] Friday Reminder job failed:", error);
    throw error;
  }
}

/**
 * Job 2 — Sunday Lock
 * Locks all WeeklyProgress entries for the current week.
 */
export async function runSundayLock(): Promise<void> {
  console.log("[CRON] Sunday Lock job started.");

  try {
    const weekStartDate = getWeekStart(new Date());

    const result = await prisma.weeklyProgress.updateMany({
      where: {
        weekStartDate: weekStartDate,
      },
      data: {
        isLocked: true,
      },
    });

    console.log(
      `[CRON] Locked ${result.count} WeeklyProgress records for week starting ${weekStartDate.toISOString()}.`
    );
  } catch (error) {
    console.error("[CRON] Sunday Lock job failed:", error);
    throw error;
  }
}
