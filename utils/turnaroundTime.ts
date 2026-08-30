import { differenceInCalendarDays } from "date-fns";

// The nine stages of a ranking, in the order they happen. stage_key is stored
// in hrm_ranking_stage_dates, so these keys are part of the data -- renaming
// one orphans every manual date saved against it.
export const STAGES = [
  {
    key: "vacancy_posting",
    label: "Posting of Job Vacancy / Item Posting",
    source: "Portal posting window set on the ranking",
  },
  {
    key: "application_proper",
    label: "Application Proper",
    source: "First to last application received",
  },
  {
    key: "hr_screening",
    label: "Screening / Evaluation of Documents (HR)",
    source: "First to last applicant evaluated",
  },
  {
    key: "ier_posting",
    label: "IER Posting",
    source: "When IER was published to the portal",
  },
  {
    key: "deliberation",
    label: "Deliberation / Ranking Proper",
    source: "First to last committee points cast",
  },
  {
    key: "ranklist_posting",
    label: "Posting of Ranking Results",
    source: "When the rank list was published to the portal",
  },
  {
    key: "ranking_closing",
    label: "Closing of Ranking / Approval of CAR-RQA",
    source: "When the ranking was set to Closed",
  },
  {
    key: "rqa_posting",
    label: "Posting of CAR-RQA",
    source: "When the CAR-RQA was published to the portal",
  },
  {
    key: "appointment",
    label: "Placement / Appointment",
    source: "First to last applicant appointed",
  },
] as const;

export type StageKey = (typeof STAGES)[number]["key"];

export interface StageOverride {
  date_from: string | null;
  date_to: string | null;
}

// Everything the report needs, already narrowed to one ranking.
export interface TurnaroundSource {
  displayOnPortalFrom: string | null;
  displayOnPortalUntil: string | null;
  ierPostedAt: string | null;
  ranklistPostedAt: string | null;
  rqaPostedAt: string | null;
  closedAt: string | null;
  applicationDates: Array<string | null>;
  evaluationDates: Array<string | null>;
  appointmentDates: Array<string | null>;
  deliberationStartDates: Array<string | null>;
  deliberationEndDates: Array<string | null>;
  overrides: Partial<Record<StageKey, StageOverride>>;
}

export interface ResolvedStage {
  key: StageKey;
  label: string;
  source: string;
  from: Date | null;
  to: Date | null;
  // True when `to` was borrowed from the next stage that has a date, rather
  // than being a real end date of this stage.
  toIsInferred: boolean;
  days: number | null;
  isManual: boolean;
}

const toDate = (value: string | null | undefined): Date | null => {
  if (!value) return null;
  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
};

const earliest = (values: Array<string | null>): Date | null => {
  const dates = values.map(toDate).filter((d): d is Date => d !== null);
  if (dates.length === 0) return null;
  return dates.reduce((a, b) => (a < b ? a : b));
};

const latest = (values: Array<string | null>): Date | null => {
  const dates = values.map(toDate).filter((d): d is Date => d !== null);
  if (dates.length === 0) return null;
  return dates.reduce((a, b) => (a > b ? a : b));
};

// Inclusive, the way a turnaround report counts: a stage that starts and ends
// on the same day took one day, not zero.
export const inclusiveDays = (from: Date | null, to: Date | null) => {
  if (!from || !to) return null;
  const days = differenceInCalendarDays(to, from) + 1;
  return days < 0 ? null : days;
};

// What the app recorded on its own, before any manual correction.
const derivedDates = (
  key: StageKey,
  source: TurnaroundSource,
): { from: Date | null; to: Date | null } => {
  switch (key) {
    case "vacancy_posting":
      return {
        from: toDate(source.displayOnPortalFrom),
        to: toDate(source.displayOnPortalUntil),
      };
    case "application_proper":
      return {
        from: earliest(source.applicationDates),
        to: latest(source.applicationDates),
      };
    case "hr_screening":
      return {
        from: earliest(source.evaluationDates),
        to: latest(source.evaluationDates),
      };
    case "ier_posting":
      return { from: toDate(source.ierPostedAt), to: null };
    case "deliberation":
      return {
        from: earliest(source.deliberationStartDates),
        to: latest([
          ...source.deliberationEndDates,
          ...source.deliberationStartDates,
        ]),
      };
    case "ranklist_posting":
      return { from: toDate(source.ranklistPostedAt), to: null };
    case "ranking_closing":
      return { from: toDate(source.closedAt), to: null };
    case "rqa_posting":
      return { from: toDate(source.rqaPostedAt), to: null };
    case "appointment":
      return {
        from: earliest(source.appointmentDates),
        to: latest(source.appointmentDates),
      };
  }
};

/**
 * Resolves the nine stages for one ranking.
 *
 * A manual date in hrm_ranking_stage_dates always wins over the date the app
 * recorded, field by field -- setting only a start keeps the derived end.
 *
 * Milestone stages (the postings, the closing) have no end date of their own,
 * so their end is taken from the start of the next stage that has one: the
 * stage lasted until the next thing happened. Those ends are marked
 * `toIsInferred` so the report can show them as approximate.
 */
export const resolveTurnaroundStages = (
  source: TurnaroundSource,
): ResolvedStage[] => {
  const stages = STAGES.map((stage) => {
    const derived = derivedDates(stage.key, source);
    const override = source.overrides[stage.key];

    const manualFrom = toDate(override?.date_from);
    const manualTo = toDate(override?.date_to);

    return {
      key: stage.key,
      label: stage.label,
      source: stage.source,
      from: manualFrom ?? derived.from,
      to: manualTo ?? derived.to,
      toIsInferred: false,
      days: null as number | null,
      isManual: Boolean(manualFrom ?? manualTo),
    };
  });

  // Borrow the end of a milestone stage from whatever happened next.
  stages.forEach((stage, index) => {
    if (!stage.from || stage.to) return;
    const next = stages.slice(index + 1).find((s) => s.from);
    if (!next?.from) return;
    stage.to = next.from;
    stage.toIsInferred = true;
  });

  stages.forEach((stage) => {
    stage.days = inclusiveDays(stage.from, stage.to);
  });

  return stages;
};

/**
 * Total turnaround: the whole span from the earliest stage that happened to
 * the latest, inclusive. Returns null until at least one stage has both ends.
 */
export const totalTurnaroundDays = (stages: ResolvedStage[]) => {
  const starts = stages.map((s) => s.from).filter((d): d is Date => d !== null);
  const ends = stages.map((s) => s.to).filter((d): d is Date => d !== null);
  if (starts.length === 0 || ends.length === 0) return null;

  const first = starts.reduce((a, b) => (a < b ? a : b));
  const last = ends.reduce((a, b) => (a > b ? a : b));
  return inclusiveDays(first, last);
};
