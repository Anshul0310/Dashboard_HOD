import { User } from "@prisma/client";

export const emailService = {
  sendReminder(user: User): void {
    console.log(
      `[EMAIL STUB] Reminder sent to ${user.name} (${user.email}): ` +
        `You have not submitted your weekly progress for this week.`
    );
  },
};
