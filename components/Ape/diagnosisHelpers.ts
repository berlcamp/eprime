import type { ApeDiagnosisTypes } from "@/types";

/**
 * Diagnosis entries newest first, so the most recent finding — the one the
 * employee actually needs — leads.
 *
 * diagnosis_date is a plain 'YYYY-MM-DD' date column, which compares correctly
 * as a string. Two entries can share a date (a Medical Officer may record more
 * than one on the same visit), so created_at breaks the tie and keeps the order
 * stable between the table preview and the modal.
 */
export const sortDiagnosesNewestFirst = (
  diagnoses?: ApeDiagnosisTypes[],
): ApeDiagnosisTypes[] =>
  [...(diagnoses ?? [])].sort((a, b) => {
    const byDate = b.diagnosis_date.localeCompare(a.diagnosis_date);
    if (byDate !== 0) return byDate;
    return (b.created_at ?? "").localeCompare(a.created_at ?? "");
  });
