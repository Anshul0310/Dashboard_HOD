/**
 * Faculty-Specific KPI Schema
 *
 * These schemas are for INDIVIDUAL faculty members to fill out their
 * own personal data. The HOD's compile engine will then aggregate
 * these individual answers into the department-level format.
 *
 * Key design decisions:
 * - Only sections relevant to an individual are shown.
 * - Questions are rephrased from "Department total" to "Your personal".
 * - Department-level sections (Faculty headcount, LMS, Late Punch-In,
 *   Placement, Student Awards) are filled directly by the HOD.
 */

import type { FieldType } from './sectionSchema';

// ─── Faculty Section Keys ─────────────────────────────────────────────────
// These are a subset of the full department sections, plus some faculty-only ones.
export type FacultySectionKey =
  | 'myPublications'
  | 'myStudentPublications'
  | 'myFundedProjects'
  | 'myPhdGuideship'
  | 'myMous'
  | 'myFdp'
  | 'myAwards'
  | 'myConsultancy'
  | 'myPartialDelivery'
  | 'myPatents';

export interface FacultyFieldSchema {
  key: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  min?: number;
  required?: boolean;
  helpText?: string;
  /** Which department-level section.field this maps to during compile */
  mapsTo?: {
    deptSection: string;
    deptField: string;
    aggregation: 'sum' | 'count_nonzero' | 'concat' | 'merge_tags' | 'count_zero';
  };
}

export interface FacultySectionSchema {
  key: FacultySectionKey;
  title: string;
  icon: string;
  description: string;
  fields: FacultyFieldSchema[];
}

// ─── Faculty Schemas ──────────────────────────────────────────────────────
export const facultySectionSchemas: FacultySectionSchema[] = [
  {
    key: 'myPublications',
    title: 'My Publications',
    icon: 'FileText',
    description: 'Your personal research publications this year.',
    fields: [
      { key: 'q1Publications', label: 'Your Q1 journal publications since 1-Jan', type: 'number', min: 0, required: true,
        mapsTo: { deptSection: 'facultyPublications', deptField: 'q1Publications', aggregation: 'sum' } },
      { key: 'q2Publications', label: 'Your Q2 journal publications since 1-Jan', type: 'number', min: 0, required: true,
        mapsTo: { deptSection: 'facultyPublications', deptField: 'q2Publications', aggregation: 'sum' } },
      { key: 'otherApprovedJournals', label: 'Other approved journal publications', type: 'number', min: 0,
        mapsTo: { deptSection: 'facultyPublications', deptField: 'otherApprovedJournals', aggregation: 'sum' } },
      { key: 'conferencePapers', label: 'Conference papers you have published since 1-Jan', type: 'number', min: 0,
        mapsTo: { deptSection: 'facultyPublications', deptField: 'conferencePapers', aggregation: 'sum' } },
      { key: 'q1UnderPreparation', label: 'Q1 papers you have under preparation', type: 'number', min: 0,
        mapsTo: { deptSection: 'facultyPublications', deptField: 'q1UnderPreparation', aggregation: 'sum' } },
      { key: 'q2UnderPreparation', label: 'Q2 papers you have under preparation', type: 'number', min: 0,
        mapsTo: { deptSection: 'facultyPublications', deptField: 'q2UnderPreparation', aggregation: 'sum' } },
      { key: 'journalUnderPreparation', label: 'Journal papers under preparation', type: 'number', min: 0,
        mapsTo: { deptSection: 'facultyPublications', deptField: 'journalUnderPreparation', aggregation: 'sum' } },
      { key: 'sectionEvidence', label: 'Evidence / Proof of Work', type: 'evidence', helpText: 'Attach files or links as proof for your publications' },
    ],
  },
  {
    key: 'myStudentPublications',
    title: 'My Student Publications',
    icon: 'GraduationCap',
    description: 'Publications by students you are mentoring.',
    fields: [
      { key: 'q1Publications', label: 'Q1 student publications (under your guidance)', type: 'number', min: 0,
        mapsTo: { deptSection: 'studentPublications', deptField: 'q1Publications', aggregation: 'sum' } },
      { key: 'q2Publications', label: 'Q2 student publications (under your guidance)', type: 'number', min: 0,
        mapsTo: { deptSection: 'studentPublications', deptField: 'q2Publications', aggregation: 'sum' } },
      { key: 'otherApprovedJournals', label: 'Other approved journal student publications', type: 'number', min: 0,
        mapsTo: { deptSection: 'studentPublications', deptField: 'otherApprovedJournals', aggregation: 'sum' } },
      { key: 'conferencePapers', label: 'Student conference papers published', type: 'number', min: 0,
        mapsTo: { deptSection: 'studentPublications', deptField: 'conferencePapers', aggregation: 'sum' } },
      { key: 'projectsWithoutPublications', label: 'Student projects without publications', type: 'number', min: 0,
        mapsTo: { deptSection: 'studentPublications', deptField: 'projectsWithoutPublications', aggregation: 'sum' } },
      { key: 'sectionEvidence', label: 'Evidence / Proof of Work', type: 'evidence', helpText: 'Attach files or links as proof for your student publications' },
    ],
  },
  {
    key: 'myFundedProjects',
    title: 'My Funded Projects',
    icon: 'Banknote',
    description: 'Your funded research projects.',
    fields: [
      { key: 'projectsUnderExecution', label: 'Your projects in hand and under execution', type: 'number', min: 0, required: true,
        mapsTo: { deptSection: 'fundedProjects', deptField: 'projectsUnderExecution', aggregation: 'sum' } },
      { key: 'proposalsUnderPreparation', label: 'Your proposals under preparation', type: 'number', min: 0,
        mapsTo: { deptSection: 'fundedProjects', deptField: 'proposalsUnderPreparation', aggregation: 'sum' } },
      { key: 'sectionEvidence', label: 'Evidence / Proof of Work', type: 'evidence', helpText: 'Attach grant letters or proposal documents' },
    ],
  },
  {
    key: 'myPhdGuideship',
    title: 'My PhD Guideship',
    icon: 'Award',
    description: 'Your PhD registration and student supervision status.',
    fields: [
      { key: 'isEligibleForPhd', label: 'Are you eligible for PhD guideship?', type: 'text', placeholder: 'Yes / No', required: true,
        helpText: 'Answer Yes or No' },
      { key: 'isRegisteredAsGuide', label: 'Are you registered as a PhD guide?', type: 'text', placeholder: 'Yes / No', required: true },
      { key: 'phdStudentsCount', label: 'How many PhD students are you currently guiding?', type: 'number', min: 0,
        helpText: 'Enter 0 if none' },
      { key: 'sectionEvidence', label: 'Evidence / Proof of Work', type: 'evidence', helpText: 'Attach guide registration or student list' },
    ],
  },
  {
    key: 'myMous',
    title: 'My MoU Activities',
    icon: 'Handshake',
    description: 'MoU activities you participated in this month.',
    fields: [
      { key: 'mouActivities', label: 'MoU activities you were involved in this month', type: 'textarea',
        placeholder: 'Describe the MoU activities you participated in...',
        mapsTo: { deptSection: 'mous', deptField: 'mou1Activity', aggregation: 'concat' } },
      { key: 'mouSummary', label: 'One-line summary of each MoU you are part of', type: 'taglist',
        placeholder: 'Type summary and press Enter',
        mapsTo: { deptSection: 'mous', deptField: 'mouSummaries', aggregation: 'merge_tags' } },
      { key: 'sectionEvidence', label: 'Evidence / Proof of Work', type: 'evidence', helpText: 'Attach MoU documents or activity photos' },
    ],
  },
  {
    key: 'myFdp',
    title: 'My FDP (Faculty Development)',
    icon: 'TrendingUp',
    description: 'Your Faculty Development Program participation.',
    fields: [
      { key: 'fdpHoursCompleted', label: 'Total FDP hours you have completed since 1-Jan', type: 'number', min: 0, required: true,
        helpText: 'e.g. if you attended 3 FDPs of 4 hours each = 12 hours',
        mapsTo: { deptSection: 'fdp', deptField: 'totalFdpHours', aggregation: 'sum' } },
      { key: 'fdpProgramsAttended', label: 'Number of FDP programs attended since 1-Jan', type: 'number', min: 0, required: true },
      { key: 'sectionEvidence', label: 'Evidence / Proof of Work', type: 'evidence', helpText: 'Attach FDP completion certificates' },
    ],
  },
  {
    key: 'myAwards',
    title: 'My Awards',
    icon: 'Trophy',
    description: 'Awards and recognitions you have received.',
    fields: [
      { key: 'awardsCount', label: 'Total awards/recognitions you received since 1-Jan', type: 'number', min: 0, required: true,
        mapsTo: { deptSection: 'awardsFaculty', deptField: 'totalAwards', aggregation: 'sum' } },
      { key: 'awardDetails', label: 'Details of your awards', type: 'textarea',
        placeholder: 'Name of award, awarding body, date...' },
      { key: 'sectionEvidence', label: 'Evidence / Proof of Work', type: 'evidence', helpText: 'Attach award certificates or photos' },
    ],
  },
  {
    key: 'myConsultancy',
    title: 'My Consultancy',
    icon: 'Building2',
    description: 'Your consultancy work and projects.',
    fields: [
      { key: 'consultanciesUnderExecution', label: 'Your consultancies currently under execution', type: 'number', min: 0, required: true,
        mapsTo: { deptSection: 'consultancy', deptField: 'consultanciesUnderExecution', aggregation: 'sum' } },
      { key: 'newConsultanciesThisMonth', label: 'New consultancies you started this month', type: 'number', min: 0,
        mapsTo: { deptSection: 'consultancy', deptField: 'newConsultanciesThisMonth', aggregation: 'sum' } },
      { key: 'sectionEvidence', label: 'Evidence / Proof of Work', type: 'evidence', helpText: 'Attach consultancy agreements or reports' },
    ],
  },
  {
    key: 'myPartialDelivery',
    title: 'My Industry Teaching (PD)',
    icon: 'Factory',
    description: 'Industry experts involved in your courses.',
    fields: [
      { key: 'subjectsWithPd', label: 'Your subjects where industry PD is happening', type: 'number', min: 0, required: true,
        mapsTo: { deptSection: 'partialDelivery', deptField: 'subjectsWithPd', aggregation: 'sum' } },
      { key: 'totalPdHours', label: 'Total PD hours in your subjects since 1-Jan', type: 'number', min: 0,
        mapsTo: { deptSection: 'partialDelivery', deptField: 'totalPdHours', aggregation: 'sum' } },
      { key: 'expertsEngaging', label: 'No. of industry experts engaging in your subjects', type: 'number', min: 0,
        mapsTo: { deptSection: 'partialDelivery', deptField: 'expertsEngaging', aggregation: 'sum' } },
      { key: 'sectionEvidence', label: 'Evidence / Proof of Work', type: 'evidence', helpText: 'Attach expert lecture photos or schedules' },
    ],
  },
  {
    key: 'myPatents',
    title: 'My Patents / IPR',
    icon: 'Shield',
    description: 'Patents you have filed, published, or been granted.',
    fields: [
      { key: 'patentsFiled', label: 'Patents you have filed since 1-Jan', type: 'number', min: 0, required: true,
        mapsTo: { deptSection: 'patentsIpr', deptField: 'patentsFiled', aggregation: 'sum' } },
      { key: 'patentsPublished', label: 'Patents you have published since 1-Jan', type: 'number', min: 0,
        mapsTo: { deptSection: 'patentsIpr', deptField: 'patentsPublished', aggregation: 'sum' } },
      { key: 'patentsGranted', label: 'Patents granted to you since 1-Jan', type: 'number', min: 0,
        mapsTo: { deptSection: 'patentsIpr', deptField: 'patentsGranted', aggregation: 'sum' } },
      { key: 'sectionEvidence', label: 'Evidence / Proof of Work', type: 'evidence', helpText: 'Attach patent certificates or application receipts' },
    ],
  },
];

/** Empty faculty data object for initializing forms */
export const emptyFacultyData: Record<string, Record<string, unknown>> = {};
for (const section of facultySectionSchemas) {
  emptyFacultyData[section.key] = {};
  for (const field of section.fields) {
    if (field.type === 'number') emptyFacultyData[section.key][field.key] = 0;
    else if (field.type === 'taglist' || field.type === 'evidence') emptyFacultyData[section.key][field.key] = [];
    else emptyFacultyData[section.key][field.key] = '';
  }
}

export const getFacultySectionSchema = (key: FacultySectionKey): FacultySectionSchema | undefined =>
  facultySectionSchemas.find((s) => s.key === key);
