/**
 * Database Seed Script
 *
 * Creates initial users for the HOD Dashboard:
 * - 12 HOD users (one per department)
 * - 1 MANAGEMENT user (Dean/Principal)
 * - 3 FACULTY users per department (36 total)
 *
 * Run: npx ts-node src/prisma/seed.ts
 * Default password for all users: nmit@2026
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

const DEFAULT_PASSWORD = "nmit@2026";

const departments = [
  { id: "aids", name: "Artificial Intelligence & Data Science", shortName: "AI & DS" },
  { id: "aiml", name: "Artificial Intelligence & Machine Learning", shortName: "AI & ML" },
  { id: "aero", name: "Aeronautical Engineering", shortName: "AERO" },
  { id: "civil", name: "Civil Engineering", shortName: "CIVIL" },
  { id: "csbs", name: "Computer Science & Business Systems", shortName: "CS & BS" },
  { id: "cse", name: "Computer Science & Engineering", shortName: "CSE" },
  { id: "eee", name: "Electrical & Electronics Engineering", shortName: "EEE" },
  { id: "ece", name: "Electronics & Communication Engineering", shortName: "ECE" },
  { id: "vlsi", name: "Electronics Engineering (VLSI Design & Technology)", shortName: "VLSI" },
  { id: "ise", name: "Information Science & Engineering", shortName: "ISE" },
  { id: "mech", name: "Mechanical Engineering", shortName: "MECH" },
  { id: "rai", name: "Robotics and Artificial Intelligence", shortName: "RAI" },
];

// Sample faculty names per department (3 per dept)
const facultyNames = [
  { num: 1, name: "Dr. Rajesh Kumar" },
  { num: 2, name: "Prof. Ananya Sharma" },
  { num: 3, name: "Dr. Vikram Patel" },
];

async function main() {
  console.log("🌱 Seeding database...\n");

  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  // Create HOD users for each department
  for (const dept of departments) {
    const email = `hod.${dept.id}@nmit.ac.in`;
    const name = `HOD - ${dept.shortName}`;

    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        name,
        passwordHash,
        role: "HOD",
        department: dept.id,
      },
    });

    console.log(`  ✅ HOD: ${user.email} (${dept.shortName})`);
  }

  // Create Faculty users for each department (3 per dept)
  console.log("");
  for (const dept of departments) {
    for (const fac of facultyNames) {
      const email = `faculty${fac.num}.${dept.id}@nmit.ac.in`;
      const name = `${fac.name} (${dept.shortName})`;

      const user = await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
          email,
          name,
          passwordHash,
          role: "FACULTY",
          department: dept.id,
        },
      });

      console.log(`  ✅ FACULTY: ${user.email}`);
    }
  }

  // Create Management user (Dean/Principal)
  const managementUser = await prisma.user.upsert({
    where: { email: "dean@nmit.ac.in" },
    update: {},
    create: {
      email: "dean@nmit.ac.in",
      name: "Dean - NMIT",
      passwordHash,
      role: "MANAGEMENT",
      department: "management",
    },
  });
  console.log(`\n  ✅ MANAGEMENT: ${managementUser.email}`);

  console.log("\n──────────────────────────────────────────────");
  console.log("🎉 Seed complete!\n");
  console.log("📋 Login Credentials:");
  console.log("──────────────────────────────────────────────");
  console.log(`  HOD (CSE):       hod.cse@nmit.ac.in       / ${DEFAULT_PASSWORD}`);
  console.log(`  Faculty 1 (CSE): faculty1.cse@nmit.ac.in   / ${DEFAULT_PASSWORD}`);
  console.log(`  Faculty 2 (CSE): faculty2.cse@nmit.ac.in   / ${DEFAULT_PASSWORD}`);
  console.log(`  Faculty 3 (CSE): faculty3.cse@nmit.ac.in   / ${DEFAULT_PASSWORD}`);
  console.log(`  Dean:            dean@nmit.ac.in           / ${DEFAULT_PASSWORD}`);
  console.log(`  ... and all other departments`);
  console.log("──────────────────────────────────────────────\n");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
