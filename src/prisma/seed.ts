/**
 * Database Seed Script
 *
 * Creates initial users and demo data for the HOD Dashboard:
 * - 2 departments: CSBS and Mechanical Engineering
 * - 1 HOD per department (2 total)
 * - 25–30 FACULTY per department (55 total)
 * - 1 MANAGEMENT user (Dean/Principal)
 * - 100–150 FacultyKpiSubmission records with realistic data
 * - 2 KpiSubmission records (department-level) with populated section data
 *
 * Run: npx tsx src/prisma/seed.ts
 * Default password for all users: nmit@2026
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

const DEFAULT_PASSWORD = "nmit@2026";

const departments = [
  { id: "csbs", name: "Computer Science & Business Systems", shortName: "CSBS" },
  { id: "mech", name: "Mechanical Engineering", shortName: "MECH" },
];

// Realistic Indian faculty names — 30 per department
const csbsFacultyNames = [
  "Dr. Rajesh Kumar", "Prof. Ananya Sharma", "Dr. Vikram Patel", "Dr. Priya Desai",
  "Prof. Suresh Naidu", "Dr. Meera Krishnamurthy", "Prof. Anil Kulkarni", "Dr. Deepa Rao",
  "Prof. Mahesh Bhat", "Dr. Kavitha Srinivasan", "Prof. Ravi Shankar", "Dr. Sunitha Hegde",
  "Prof. Ganesh Prasad", "Dr. Lakshmi Venkatesh", "Prof. Ashwin Gowda", "Dr. Smitha Nair",
  "Prof. Karthik Murthy", "Dr. Divya Ramesh", "Prof. Harish Kumar", "Dr. Pooja Acharya",
  "Prof. Nagesh Babu", "Dr. Rekha Shetty", "Prof. Prashanth Reddy", "Dr. Aruna Kumari",
  "Prof. Sanjay Mohan", "Dr. Bhavani Shankar", "Dr. Tanuja Kamath", "Prof. Vinod Patil",
  "Dr. Nithya Devi", "Prof. Raghavendra Iyengar",
];

const mechFacultyNames = [
  "Dr. Ramesh Chandra", "Prof. Shivakumar Gowda", "Dr. Manjunath Hegde", "Prof. Sunil Joshi",
  "Dr. Sridhar Rao", "Prof. Girish Babu", "Dr. Naveen Kumar", "Prof. Prakash Shetty",
  "Dr. Venkatesh Murthy", "Prof. Sachin Patil", "Dr. Umesh Bhat", "Prof. Mohan Das",
  "Dr. Kiran Rao", "Prof. Rajendra Prasad", "Dr. Manoj Kumar", "Prof. Anand Sharma",
  "Dr. Pavan Gowda", "Prof. Dinesh Hegde", "Dr. Vinay Kumar", "Prof. Jagadish Shetty",
  "Dr. Santosh Naidu", "Prof. Harsha Reddy", "Dr. Arun Patil", "Prof. Deepak Joshi",
  "Dr. Sudheer Kumar", "Prof. Guru Prasad", "Dr. Basavaraj Patil", "Prof. Ranjith Kumar",
  "Dr. Veeresh Gowda", "Prof. Chandrashekar Murthy",
];

// Activity categories with realistic titles, descriptions, and point ranges
const activityCategories = [
  {
    section: "myPublications",
    titles: [
      "Machine Learning-Based Approach for Smart Grid Optimization",
      "Deep Neural Network for Real-Time Image Classification",
      "Blockchain-Enabled Supply Chain Transparency System",
      "IoT-Driven Predictive Maintenance Framework",
      "Natural Language Processing for Regional Language Translation",
      "Hybrid Cloud Computing Architecture for Edge Devices",
      "Quantum Computing Algorithms for Optimization Problems",
      "Computer Vision System for Automated Quality Inspection",
      "Federated Learning Framework for Healthcare Data Privacy",
      "Explainable AI for Credit Risk Assessment",
      "Reinforcement Learning for Autonomous Vehicle Navigation",
      "Thermal Analysis of Composite Materials under Fatigue Loading",
      "FEA-Based Design Optimization of Automotive Suspension",
      "Experimental Study on Heat Transfer in Micro-Channels",
      "CFD Simulation of Turbulent Flow in Gas Turbines",
    ],
    fields: {
      q1Publications: () => randInt(0, 3),
      q2Publications: () => randInt(0, 4),
      conferencePapers: () => randInt(0, 5),
      otherApprovedJournals: () => randInt(0, 2),
    },
  },
  {
    section: "myFdp",
    titles: [
      "FDP on Advanced Python Programming and Data Analytics",
      "Workshop on Machine Learning with TensorFlow",
      "FDP on Outcome-Based Education Framework",
      "Five-Day FDP on Cloud Computing and AWS Services",
      "Workshop on Research Methodology and Paper Writing",
      "FDP on Cyber Security and Ethical Hacking",
      "Three-Day FDP on Industry 4.0 Technologies",
      "Workshop on IoT using Raspberry Pi and Arduino",
      "FDP on Design Thinking and Innovation",
      "Hands-on Workshop on 3D Printing Technologies",
    ],
    fields: {
      fdpAttended: () => randInt(1, 4),
      fdpHours: () => randInt(8, 40),
    },
  },
  {
    section: "myPatents",
    titles: [
      "Smart Irrigation System Using IoT Sensors",
      "AI-Based Disease Detection in Agricultural Crops",
      "Automated Sorting Machine Using Computer Vision",
      "Novel Heat Exchanger Design for Solar Thermal Systems",
      "Wearable Health Monitoring Device for Elderly Care",
      "Biodegradable Packaging Material from Agricultural Waste",
    ],
    fields: {
      patentsFiled: () => randInt(0, 2),
      patentsPublished: () => randInt(0, 1),
      patentsGranted: () => randInt(0, 1),
    },
  },
  {
    section: "myConsultancy",
    titles: [
      "Industrial Automation Consultancy for Bosch Ltd",
      "AI Model Development for Infosys Healthcare Division",
      "Web Application Development for Karnataka State Gov",
      "Structural Analysis Consultancy for L&T Construction",
      "Data Analytics Solution for Wipro Technologies",
      "CAD/CAM Training Program for Toyota Kirloskar",
    ],
    fields: {
      consultanciesUnderExecution: () => randInt(0, 2),
      newConsultanciesThisMonth: () => randInt(0, 1),
    },
  },
  {
    section: "myMous",
    titles: [
      "MoU with Infosys for Industry-Academia Collaboration",
      "MoU with ISRO for Student Research Internships",
      "MoU with Bosch India for Skill Development Program",
      "MoU with HAL Bangalore for Practical Training",
      "MoU with TCS for Campus Connect Program",
      "MoU with DRDO for Defence Research Projects",
    ],
    fields: {
      activeMous: () => randInt(1, 3),
      mouDescription: () => "Industry collaboration for student projects and faculty research.",
    },
  },
  {
    section: "myAwards",
    titles: [
      "Best Paper Award at IEEE International Conference",
      "Outstanding Faculty Award — NMIT Annual Day",
      "Best Researcher Award — VTU Research Symposium",
      "Innovation Award at National Hackathon",
      "Best Teacher Award — Student Council Nomination",
    ],
    fields: {
      totalAwards: () => randInt(0, 3),
    },
  },
  {
    section: "myStudentPublications",
    titles: [
      "Student Research Paper on Smart Waste Management System",
      "UG Project Paper: AI-Driven Campus Security System",
      "Student Conference Paper on Drone-Based Crop Monitoring",
      "Capstone Project Paper: Electric Vehicle Battery Management",
    ],
    fields: {
      q1Publications: () => randInt(0, 2),
      q2Publications: () => randInt(0, 3),
      conferencePapers: () => randInt(0, 4),
    },
  },
  {
    section: "myFundedProjects",
    titles: [
      "AICTE-Funded Project on Smart City Infrastructure",
      "DST-SERB Project on Renewable Energy Systems",
      "VGST-Funded Research on Water Quality Monitoring",
      "KSCST Student Project Grant — IoT Based Solution",
    ],
    fields: {
      projectsUnderExecution: () => randInt(0, 2),
      proposalsUnderPreparation: () => randInt(0, 2),
    },
  },
  {
    section: "myPartialDelivery",
    titles: [
      "Industry Expert Sessions by TCS Engineers",
      "Guest Lecture Series from Wipro Senior Architects",
      "HAL Practical Training Sessions for Students",
      "Bosch Industry Expert Lab Sessions",
    ],
    fields: {
      subjectsWithPd: () => randInt(0, 3),
      totalPdHours: () => randInt(0, 20),
    },
  },
  {
    section: "myPhdGuideship",
    titles: [
      "PhD Guidance in Machine Learning and Data Science",
      "PhD Research Supervision in Thermal Engineering",
      "PhD Guidance in IoT and Embedded Systems",
      "PhD Supervision in Composite Materials",
    ],
    fields: {
      registeredAsGuide: () => randInt(0, 1),
      phdStudentsGuiding: () => randInt(0, 3),
    },
  },
];

// Statuses with realistic distribution
const STATUS_DISTRIBUTION = [
  "APPROVED", "APPROVED", "APPROVED", "APPROVED", "APPROVED",
  "SUBMITTED", "SUBMITTED", "SUBMITTED",
  "REJECTED",
  "DRAFT",
];

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generatePeriodIds(): string[] {
  const now = new Date();
  const periods: string[] = [];
  for (let i = 3; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const month = d.getMonth() + 1;
    const year = d.getFullYear();
    periods.push(`${year}-${String(month).padStart(2, "0")}`);
  }
  return periods;
}

function generateFacultyKpiData(): Record<string, Record<string, unknown>> {
  const data: Record<string, Record<string, unknown>> = {};
  
  // Pick 3–6 random categories for this submission
  const shuffled = [...activityCategories].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, randInt(3, 6));
  
  for (const cat of selected) {
    const sectionData: Record<string, unknown> = {};
    for (const [key, generator] of Object.entries(cat.fields)) {
      sectionData[key] = (generator as () => unknown)();
    }
    // Add a random activity title as description
    sectionData.activityTitle = pickRandom(cat.titles);
    data[cat.section] = sectionData;
  }

  return data;
}

function generateDeptKpiData(totalFaculty: number): Record<string, unknown> {
  const profCount = randInt(3, 6);
  const assocProfCount = randInt(5, 10);
  const asstProfCount = totalFaculty - profCount - assocProfCount;

  return {
    faculty: {
      profCount,
      assocProfCount,
      asstProfCount: Math.max(asstProfCount, 5),
      resignedLastMonth: randInt(0, 2),
      studentFacultyRatio: `${randInt(12, 20)}:1`,
    },
    lms: {
      lessonPlansNotInLms: randInt(0, 5),
      facultyNamesNotInLms: [],
      facultyLessThan5Items: randInt(1, 8),
    },
    latePunchIn: {
      latePunchInsLastMonth: randInt(2, 12),
    },
    facultyPublications: {
      q1Publications: randInt(3, 12),
      q2Publications: randInt(5, 15),
      otherApprovedJournals: randInt(2, 8),
      conferencePapers: randInt(5, 20),
      q1UnderPreparation: randInt(2, 8),
      q2UnderPreparation: randInt(1, 6),
      journalUnderPreparation: randInt(1, 5),
      facultyNilPublications: randInt(3, 10),
    },
    studentPublications: {
      q1Publications: randInt(1, 5),
      q2Publications: randInt(2, 8),
      otherApprovedJournals: randInt(1, 4),
      conferencePapers: randInt(3, 12),
      q1UnderPreparation: randInt(1, 4),
      q2UnderPreparation: randInt(1, 3),
      journalUnderPreparation: randInt(0, 3),
      projectsWithoutPublications: randInt(5, 20),
    },
    fundedProjects: {
      projectsUnderExecution: randInt(2, 8),
      proposalsUnderPreparation: randInt(1, 5),
    },
    phdGuideship: {
      eligibleNotRegistered: randInt(1, 5),
      namesEligibleNotRegistered: [],
      registeredGuides: randInt(5, 12),
      guidesWithNilStudents: randInt(1, 4),
    },
    mous: {
      activeMous: randInt(3, 8),
      mou1Activity: "Industry training partnership with Infosys — 15 students placed in internship program",
      mou2Activity: "Joint research with IISc Bangalore — 2 papers under preparation",
      mou3Activity: "Skill development program with TCS — Monthly workshops conducted",
      mouSummaries: [
        "Infosys — Campus Connect & Internship Program",
        "IISc Bangalore — Joint Research Collaboration",
        "TCS — Skill Development Workshops",
      ],
    },
    fdp: {
      facultyWithFdp: randInt(10, 22),
      facultyNilFdp: randInt(3, 10),
      totalFdpHours: randInt(100, 400),
    },
    placement: {
      totalWithOffers: randInt(45, 85),
      totalWithoutOffers: randInt(5, 25),
      ctcAbove20L: randInt(3, 12),
      ctc10to20L: randInt(10, 25),
      ctc6to10L: randInt(15, 30),
      ctcBelow6L: randInt(5, 15),
    },
    awardsFaculty: {
      totalAwards: randInt(3, 10),
    },
    awardsStudents: {
      academicHackathonAwards: randInt(5, 18),
      sportsMusicAwards: randInt(3, 12),
    },
    consultancy: {
      consultanciesUnderExecution: randInt(2, 6),
      newConsultanciesThisMonth: randInt(0, 3),
    },
    partialDelivery: {
      subjectsWithPd: randInt(3, 8),
      totalPdHours: randInt(20, 80),
      expertsEngaging: randInt(3, 10),
    },
    patentsIpr: {
      patentsFiled: randInt(2, 8),
      patentsPublished: randInt(1, 5),
      patentsGranted: randInt(0, 3),
    },
  };
}

function generateAllSectionStatuses(): Record<string, string> {
  const sections = [
    "faculty", "lms", "latePunchIn", "facultyPublications",
    "studentPublications", "fundedProjects", "phdGuideship", "mous",
    "fdp", "placement", "awardsFaculty", "awardsStudents",
    "consultancy", "partialDelivery", "patentsIpr",
  ];
  const statuses: Record<string, string> = {};
  for (const s of sections) {
    statuses[s] = "completed";
  }
  return statuses;
}

async function main() {
  console.log("🌱 Seeding database...\n");
  console.log("🗑️  Clearing existing data...\n");

  // Clear all existing data in correct order (respecting foreign keys)
  await prisma.dynamicFormSubmission.deleteMany();
  await prisma.dynamicFormTemplate.deleteMany();
  await prisma.weeklyProgress.deleteMany();
  await prisma.course.deleteMany();
  await prisma.certification.deleteMany();
  await prisma.facultyKpiSubmission.deleteMany();
  await prisma.kpiSubmission.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  // ──────────────── Create Users ────────────────

  const createdUsers: Record<string, { id: string; department: string; name: string }> = {};

  // Create HOD users for each department
  for (const dept of departments) {
    const email = `hod.${dept.id}@nmit.ac.in`;
    const name = `HOD - ${dept.shortName}`;

    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        role: "HOD",
        department: dept.id,
      },
    });

    createdUsers[email] = { id: user.id, department: dept.id, name };
    console.log(`  ✅ HOD: ${user.email} (${dept.shortName})`);
  }

  // Create Faculty users — CSBS (30 faculty)
  console.log("");
  const csbsFacultyIds: string[] = [];
  for (let i = 0; i < csbsFacultyNames.length; i++) {
    const email = `faculty${i + 1}.csbs@nmit.ac.in`;
    const name = csbsFacultyNames[i];

    const user = await prisma.user.create({
      data: { email, name, passwordHash, role: "FACULTY", department: "csbs" },
    });

    csbsFacultyIds.push(user.id);
    createdUsers[email] = { id: user.id, department: "csbs", name };
    console.log(`  ✅ FACULTY: ${user.email} — ${name}`);
  }

  // Create Faculty users — MECH (30 faculty)
  console.log("");
  const mechFacultyIds: string[] = [];
  for (let i = 0; i < mechFacultyNames.length; i++) {
    const email = `faculty${i + 1}.mech@nmit.ac.in`;
    const name = mechFacultyNames[i];

    const user = await prisma.user.create({
      data: { email, name, passwordHash, role: "FACULTY", department: "mech" },
    });

    mechFacultyIds.push(user.id);
    createdUsers[email] = { id: user.id, department: "mech", name };
    console.log(`  ✅ FACULTY: ${user.email} — ${name}`);
  }

  // Create Management user (Dean/Principal)
  const managementUser = await prisma.user.create({
    data: {
      email: "dean@nmit.ac.in",
      name: "Dean - NMIT",
      passwordHash,
      role: "MANAGEMENT",
      department: "management",
    },
  });
  console.log(`\n  ✅ MANAGEMENT: ${managementUser.email}`);

  // ──────────────── Create Department-Level KPI Submissions ────────────────

  console.log("\n📊 Creating department KPI submissions...\n");

  const periodIds = generatePeriodIds();
  const latestPeriod = periodIds[periodIds.length - 1];

  for (const dept of departments) {
    const hodEmail = `hod.${dept.id}@nmit.ac.in`;
    const hodUser = createdUsers[hodEmail];
    const totalFaculty = dept.id === "csbs" ? csbsFacultyNames.length : mechFacultyNames.length;

    // Create submissions for the latest 2 periods
    for (const periodId of [periodIds[periodIds.length - 2], latestPeriod]) {
      const kpiData = generateDeptKpiData(totalFaculty);
      const sectionStatuses = generateAllSectionStatuses();

      await prisma.kpiSubmission.create({
        data: {
          periodId,
          department: dept.id,
          data: JSON.stringify(kpiData),
          sectionStatuses: JSON.stringify(sectionStatuses),
          submittedById: hodUser.id,
          submittedAt: new Date(),
        },
      });

      console.log(`  ✅ Dept KPI: ${dept.shortName} — ${periodId}`);
    }
  }

  // ──────────────── Create Faculty KPI Submissions ────────────────

  console.log("\n📝 Creating faculty KPI submissions...\n");

  let totalSubmissions = 0;

  const allFaculty = [
    ...csbsFacultyIds.map(id => ({ id, department: "csbs" })),
    ...mechFacultyIds.map(id => ({ id, department: "mech" })),
  ];

  // Create submissions spread across periods, targeting 100-150 total
  for (const fac of allFaculty) {
    // Each faculty member gets 1–3 submissions across different periods
    const numSubmissions = randInt(1, 3);
    const shuffledPeriods = [...periodIds].sort(() => Math.random() - 0.5);
    const selectedPeriods = shuffledPeriods.slice(0, numSubmissions);

    for (const periodId of selectedPeriods) {
      const status = pickRandom(STATUS_DISTRIBUTION);
      const data = generateFacultyKpiData();

      const hodEmail = `hod.${fac.department}@nmit.ac.in`;
      const hodUser = createdUsers[hodEmail];

      const submittedAt = status !== "DRAFT" ? randomDate(periodId) : null;
      const reviewedAt = (status === "APPROVED" || status === "REJECTED") ? randomDate(periodId, 2) : null;

      await prisma.facultyKpiSubmission.create({
        data: {
          periodId,
          department: fac.department,
          facultyId: fac.id,
          data: JSON.stringify(data),
          status,
          submittedAt,
          reviewedById: reviewedAt ? hodUser.id : null,
          reviewedAt,
          reviewNote: status === "REJECTED"
            ? pickRandom([
                "Please update the publication count with latest data.",
                "MoU details are incomplete. Please resubmit.",
                "FDP hours seem incorrect. Please verify and resubmit.",
                "Missing evidence for consultancy work.",
              ])
            : status === "APPROVED"
            ? pickRandom([
                "Good work! All data verified.",
                "Approved. Excellent contributions this month.",
                null,
              ])
            : null,
        },
      });

      totalSubmissions++;
    }
  }

  console.log(`  ✅ Created ${totalSubmissions} faculty KPI submissions\n`);

  // ──────────────── Summary ────────────────

  const userCount = await prisma.user.count();
  const kpiCount = await prisma.kpiSubmission.count();
  const facultyKpiCount = await prisma.facultyKpiSubmission.count();

  console.log("──────────────────────────────────────────────");
  console.log("🎉 Seed complete!\n");
  console.log("📋 Summary:");
  console.log("──────────────────────────────────────────────");
  console.log(`  Total users:            ${userCount}`);
  console.log(`  Departments:            ${departments.length} (CSBS, MECH)`);
  console.log(`  HODs:                   ${departments.length}`);
  console.log(`  Faculty (CSBS):         ${csbsFacultyNames.length}`);
  console.log(`  Faculty (MECH):         ${mechFacultyNames.length}`);
  console.log(`  Management:             1`);
  console.log(`  Dept KPI Submissions:   ${kpiCount}`);
  console.log(`  Faculty KPI Submissions:${facultyKpiCount}`);
  console.log("");
  console.log("📋 Login Credentials:");
  console.log("──────────────────────────────────────────────");
  console.log(`  HOD (CSBS):      hod.csbs@nmit.ac.in       / ${DEFAULT_PASSWORD}`);
  console.log(`  HOD (MECH):      hod.mech@nmit.ac.in       / ${DEFAULT_PASSWORD}`);
  console.log(`  Faculty 1 (CSBS): faculty1.csbs@nmit.ac.in  / ${DEFAULT_PASSWORD}`);
  console.log(`  Faculty 1 (MECH): faculty1.mech@nmit.ac.in  / ${DEFAULT_PASSWORD}`);
  console.log(`  Dean:            dean@nmit.ac.in            / ${DEFAULT_PASSWORD}`);
  console.log("──────────────────────────────────────────────\n");
}

function randomDate(periodId: string, addDays = 0): Date {
  const [year, month] = periodId.split("-").map(Number);
  const day = randInt(1, 28) + addDays;
  const hour = randInt(8, 18);
  return new Date(year, month - 1, Math.min(day, 28), hour, randInt(0, 59));
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
