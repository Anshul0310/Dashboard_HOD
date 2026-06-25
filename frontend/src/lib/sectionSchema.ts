import type { SectionKey } from './types';

// ─── Field type definitions ───────────────────────────────────────────────
export type FieldType = 'number' | 'text' | 'textarea' | 'taglist' | 'evidence';

export interface FieldSchema {
  key: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  min?: number;
  required?: boolean;
  helpText?: string;
}

export interface SectionSchema {
  key: SectionKey;
  title: string;
  icon: string; // Lucide icon name
  fields: FieldSchema[];
}

// ─── Section Schemas ──────────────────────────────────────────────────────
export const sectionSchemas: SectionSchema[] = [
  {
    key: 'faculty',
    title: 'Faculty',
    icon: 'Users',
    fields: [
      { key: 'profCount', label: 'No. of PROF as on date', type: 'number', min: 0, required: true },
      { key: 'assocProfCount', label: 'No. of ASSOC PROF as on date', type: 'number', min: 0, required: true },
      { key: 'asstProfCount', label: 'No. of ASST PROF as on date', type: 'number', min: 0, required: true },
      { key: 'resignedLastMonth', label: 'No. of faculty resigned last month', type: 'number', min: 0, required: true },
      { key: 'studentFacultyRatio', label: 'Student Faculty ratio as on date', type: 'text', placeholder: 'e.g. 15:1', required: true },
    ],
  },
  {
    key: 'lms',
    title: 'LMS',
    icon: 'BookOpen',
    fields: [
      { key: 'lessonPlansNotInLms', label: '(A) How many lesson plans NOT in LMS', type: 'number', min: 0, required: true },
      { key: 'facultyNamesNotInLms', label: 'Names of faculty in (A) above', type: 'taglist', placeholder: 'Type name and press Enter', helpText: 'Faculty whose lesson plans are not in LMS' },
      { key: 'facultyLessThan5Items', label: 'How many faculty have posted <5 items in LMS', type: 'number', min: 0, required: true },
    ],
  },
  {
    key: 'latePunchIn',
    title: 'Late Punch In',
    icon: 'Clock',
    fields: [
      { key: 'latePunchInsLastMonth', label: 'No. of faculty punching after 09:15 last month', type: 'number', min: 0, required: true },
    ],
  },
  {
    key: 'facultyPublications',
    title: 'Faculty Publications',
    icon: 'FileText',
    fields: [
      { key: 'q1Publications', label: 'Q1 publications since 1-Jan', type: 'number', min: 0, required: true },
      { key: 'q2Publications', label: 'Q2 publications since 1-Jan', type: 'number', min: 0, required: true },
      { key: 'otherApprovedJournals', label: 'Other approved journal publications', type: 'number', min: 0, required: true },
      { key: 'conferencePapers', label: 'Conference papers published since 1-Jan', type: 'number', min: 0, required: true },
      { key: 'q1UnderPreparation', label: 'Q1 papers under preparation as on date', type: 'number', min: 0 },
      { key: 'q2UnderPreparation', label: 'Q2 papers under preparation as on date', type: 'number', min: 0 },
      { key: 'journalUnderPreparation', label: 'Journal papers under preparation as on date', type: 'number', min: 0 },
      { key: 'facultyNilPublications', label: 'No. of FACULTY with nil publications since 1-Jan', type: 'number', min: 0, required: true },
    ],
  },
  {
    key: 'studentPublications',
    title: 'Student Publications',
    icon: 'GraduationCap',
    fields: [
      { key: 'q1Publications', label: 'Q1 publications since 1-Jan', type: 'number', min: 0, required: true },
      { key: 'q2Publications', label: 'Q2 publications since 1-Jan', type: 'number', min: 0, required: true },
      { key: 'otherApprovedJournals', label: 'Other approved journal publications', type: 'number', min: 0, required: true },
      { key: 'conferencePapers', label: 'Conference papers published since 1-Jan', type: 'number', min: 0, required: true },
      { key: 'q1UnderPreparation', label: 'Q1 papers under preparation as on date', type: 'number', min: 0 },
      { key: 'q2UnderPreparation', label: 'Q2 papers under preparation as on date', type: 'number', min: 0 },
      { key: 'journalUnderPreparation', label: 'Journal papers under preparation as on date', type: 'number', min: 0 },
      { key: 'projectsWithoutPublications', label: 'No. of student projects without publications', type: 'number', min: 0, required: true },
    ],
  },
  {
    key: 'fundedProjects',
    title: 'Funded Projects',
    icon: 'Banknote',
    fields: [
      { key: 'projectsUnderExecution', label: 'No. projects in hand and under execution', type: 'number', min: 0, required: true },
      { key: 'proposalsUnderPreparation', label: 'No. proposals under preparation as on date', type: 'number', min: 0, required: true },
    ],
  },
  {
    key: 'phdGuideship',
    title: 'PhD Guideship',
    icon: 'Award',
    fields: [
      { key: 'eligibleNotRegistered', label: '(B) Faculty eligible for PhD guideship but NOT registered', type: 'number', min: 0, required: true },
      { key: 'namesEligibleNotRegistered', label: 'Names of faculty in (B)', type: 'taglist', placeholder: 'Type name and press Enter' },
      { key: 'registeredGuides', label: '(C) Teachers registered as PhD guides', type: 'number', min: 0, required: true },
      { key: 'guidesWithNilStudents', label: 'Faculty in (C) with nil PhD students', type: 'number', min: 0 },
    ],
  },
  {
    key: 'mous',
    title: 'MoUs',
    icon: 'Handshake',
    fields: [
      { key: 'activeMous', label: 'Active MoUs as on date', type: 'number', min: 0, required: true },
      { key: 'mou1Activity', label: 'MoU 1 activities in the month', type: 'textarea', placeholder: 'Describe MoU 1 activities this month' },
      { key: 'mou2Activity', label: 'MoU 2 activities in the month', type: 'textarea', placeholder: 'Describe MoU 2 activities this month' },
      { key: 'mou3Activity', label: 'MoU 3 activities in the month', type: 'textarea', placeholder: 'Describe MoU 3 activities this month' },
      { key: 'mouSummaries', label: 'One line summary per active MoU', type: 'taglist', placeholder: 'Type summary and press Enter' },
    ],
  },
  {
    key: 'fdp',
    title: 'FDP (Faculty Development Programs)',
    icon: 'TrendingUp',
    fields: [
      { key: 'facultyWithFdp', label: 'Faculty who took ≥1 FDP since 1-Jan', type: 'number', min: 0, required: true },
      { key: 'facultyNilFdp', label: 'Faculty who took NIL FDP since 1-Jan', type: 'number', min: 0, required: true },
      { key: 'totalFdpHours', label: 'Total FDP hours since 1-Jan', type: 'number', min: 0, required: true },
    ],
  },
  {
    key: 'placement',
    title: 'Placement — Graduating Batch',
    icon: 'Briefcase',
    fields: [
      { key: 'totalWithOffers', label: 'Total graduating students with job offers', type: 'number', min: 0, required: true },
      { key: 'totalWithoutOffers', label: 'Total graduating students without job offers', type: 'number', min: 0, required: true },
      { key: 'ctcAbove20L', label: 'Students with CTC > 20 lacs', type: 'number', min: 0 },
      { key: 'ctc10to20L', label: 'Students with CTC 10–20 lacs', type: 'number', min: 0 },
      { key: 'ctc6to10L', label: 'Students with CTC 6–10 lacs', type: 'number', min: 0 },
      { key: 'ctcBelow6L', label: 'Students with CTC < 6 lacs', type: 'number', min: 0 },
    ],
  },
  {
    key: 'awardsFaculty',
    title: 'Awards — Faculty',
    icon: 'Trophy',
    fields: [
      { key: 'totalAwards', label: 'Total faculty awards since 1-Jan', type: 'number', min: 0, required: true },
    ],
  },
  {
    key: 'awardsStudents',
    title: 'Awards — Students',
    icon: 'Medal',
    fields: [
      { key: 'academicHackathonAwards', label: 'Academic/hackathon awards since 1-Jan', type: 'number', min: 0, required: true },
      { key: 'sportsMusicAwards', label: 'Sports/music awards since 1-Jan', type: 'number', min: 0, required: true },
    ],
  },
  {
    key: 'consultancy',
    title: 'Consultancy',
    icon: 'Building2',
    fields: [
      { key: 'consultanciesUnderExecution', label: 'Consultancies under execution as on date', type: 'number', min: 0, required: true },
      { key: 'newConsultanciesThisMonth', label: 'New consultancies this month', type: 'number', min: 0, required: true },
    ],
  },
  {
    key: 'partialDelivery',
    title: 'Partial Delivery of Teaching by Industry (PD)',
    icon: 'Factory',
    fields: [
      { key: 'subjectsWithPd', label: 'Subjects with PD happening as on date', type: 'number', min: 0, required: true },
      { key: 'totalPdHours', label: 'Total PD hours invested since 1-Jan', type: 'number', min: 0, required: true },
      { key: 'expertsEngaging', label: 'Experts engaging in PD as on date', type: 'number', min: 0, required: true },
    ],
  },
  {
    key: 'patentsIpr',
    title: 'Patents / IPR',
    icon: 'Shield',
    fields: [
      { key: 'patentsFiled', label: 'Patents filed since 1-Jan', type: 'number', min: 0, required: true },
      { key: 'patentsPublished', label: 'Patents published since 1-Jan', type: 'number', min: 0, required: true },
      { key: 'patentsGranted', label: 'Patents granted since 1-Jan', type: 'number', min: 0, required: true },
    ],
  },
];

export const getSectionSchema = (key: SectionKey): SectionSchema | undefined =>
  sectionSchemas.find((s) => s.key === key);
