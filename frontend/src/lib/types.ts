// ─── Role & Auth ───────────────────────────────────────────────────────────
export type UserRole = 'hod' | 'management' | 'faculty';

// ─── Period ────────────────────────────────────────────────────────────────
export interface KpiPeriod {
  id: string;          // e.g. "2026-06"
  month: number;       // 1-12
  year: number;
  label: string;       // e.g. "June 2026"
}

// ─── Section Status ────────────────────────────────────────────────────────
export type SectionStatus = 'not_started' | 'in_progress' | 'completed';

export type SectionKey =
  | 'faculty'
  | 'lms'
  | 'latePunchIn'
  | 'facultyPublications'
  | 'studentPublications'
  | 'fundedProjects'
  | 'phdGuideship'
  | 'mous'
  | 'fdp'
  | 'placement'
  | 'awardsFaculty'
  | 'awardsStudents'
  | 'consultancy'
  | 'partialDelivery'
  | 'patentsIpr';

// ─── KPI Section Data Types ───────────────────────────────────────────────

export interface FacultySection {
  profCount: number;
  assocProfCount: number;
  asstProfCount: number;
  resignedLastMonth: number;
  studentFacultyRatio: string; // e.g. "15:1"
}

export interface LmsSection {
  lessonPlansNotInLms: number;
  facultyNamesNotInLms: string[];
  facultyLessThan5Items: number;
}

export interface LatePunchInSection {
  latePunchInsLastMonth: number;
}

export interface FacultyPublicationsSection {
  q1Publications: number;
  q2Publications: number;
  otherApprovedJournals: number;
  conferencePapers: number;
  q1UnderPreparation: number;
  q2UnderPreparation: number;
  journalUnderPreparation: number;
  facultyNilPublications: number;
}

export interface StudentPublicationsSection {
  q1Publications: number;
  q2Publications: number;
  otherApprovedJournals: number;
  conferencePapers: number;
  q1UnderPreparation: number;
  q2UnderPreparation: number;
  journalUnderPreparation: number;
  projectsWithoutPublications: number;
}

export interface FundedProjectsSection {
  projectsUnderExecution: number;
  proposalsUnderPreparation: number;
}

export interface PhdGuideshipSection {
  eligibleNotRegistered: number;
  namesEligibleNotRegistered: string[];
  registeredGuides: number;
  guidesWithNilStudents: number;
}

export interface MousSection {
  activeMous: number;
  mou1Activity: string;
  mou2Activity: string;
  mou3Activity: string;
  mouSummaries: string[];
}

export interface FdpSection {
  facultyWithFdp: number;
  facultyNilFdp: number;
  totalFdpHours: number;
}

export interface PlacementSection {
  totalWithOffers: number;
  totalWithoutOffers: number;
  ctcAbove20L: number;
  ctc10to20L: number;
  ctc6to10L: number;
  ctcBelow6L: number;
}

export interface AwardsFacultySection {
  totalAwards: number;
}

export interface AwardsStudentsSection {
  academicHackathonAwards: number;
  sportsMusicAwards: number;
}

export interface ConsultancySection {
  consultanciesUnderExecution: number;
  newConsultanciesThisMonth: number;
}

export interface PartialDeliverySection {
  subjectsWithPd: number;
  totalPdHours: number;
  expertsEngaging: number;
}

export interface PatentsIprSection {
  patentsFiled: number;
  patentsPublished: number;
  patentsGranted: number;
}

// ─── Unified KPI Data ─────────────────────────────────────────────────────
export interface KpiData {
  faculty: FacultySection;
  lms: LmsSection;
  latePunchIn: LatePunchInSection;
  facultyPublications: FacultyPublicationsSection;
  studentPublications: StudentPublicationsSection;
  fundedProjects: FundedProjectsSection;
  phdGuideship: PhdGuideshipSection;
  mous: MousSection;
  fdp: FdpSection;
  placement: PlacementSection;
  awardsFaculty: AwardsFacultySection;
  awardsStudents: AwardsStudentsSection;
  consultancy: ConsultancySection;
  partialDelivery: PartialDeliverySection;
  patentsIpr: PatentsIprSection;
}

// ─── Submission ───────────────────────────────────────────────────────────
export interface KpiSubmission {
  periodId: string;
  data: KpiData;
  sectionStatuses: Record<SectionKey, SectionStatus>;
  lastUpdated: string; // ISO datetime
  submittedAt?: string; // ISO datetime, set when all sections submitted
}

// ─── Notifications ────────────────────────────────────────────────────────
export type NotificationSeverity = 'info' | 'warning' | 'error';

export interface Notification {
  id: string;
  type: 'kpi_reminder' | 'compliance' | 'research' | 'system';
  message: string;
  severity: NotificationSeverity;
  timestamp: string; // ISO datetime
  read: boolean;
}

// ─── Power BI Embed ───────────────────────────────────────────────────────
export interface EmbedConfig {
  type: 'report';
  id: string;          // reportId
  embedUrl: string;
  accessToken: string;
  tokenType: number;   // models.TokenType.Embed = 1
  settings: {
    panes: {
      filters: { visible: boolean };
      pageNavigation: { visible: boolean };
    };
    background: number; // models.BackgroundType.Transparent = 2
  };
}

// ─── Derived / Summary Metrics ────────────────────────────────────────────
export interface KpiSummaryMetrics {
  totalFaculty: number;
  lmsCompliancePercent: number;
  onTimePunchInPercent: number;
  activeMous: number;
  patentsFiledYtd: number;
  placementOfferRatePercent: number;
}

export interface TrendData {
  value: number;
  previousValue: number;
  direction: 'up' | 'down' | 'neutral';
  changePercent: number;
}
