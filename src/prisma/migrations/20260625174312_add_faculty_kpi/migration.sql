-- CreateTable
CREATE TABLE "FacultyKpiSubmission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "periodId" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "facultyId" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "reviewedById" TEXT,
    "reviewNote" TEXT,
    "submittedAt" DATETIME,
    "reviewedAt" DATETIME,
    "lastUpdated" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FacultyKpiSubmission_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "FacultyKpiSubmission_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "FacultyKpiSubmission_periodId_facultyId_key" ON "FacultyKpiSubmission"("periodId", "facultyId");
