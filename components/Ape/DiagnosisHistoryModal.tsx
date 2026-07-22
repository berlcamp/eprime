"use client";

import { CustomButton } from "@/components/index";
import { format } from "date-fns";

import type { ApeTypes } from "@/types";
import DiagnosisFileLinks from "./DiagnosisFileLinks";
import { sortDiagnosesNewestFirst } from "./diagnosisHelpers";

interface ModalProps {
  hideModal: () => void;
  editData: ApeTypes;
}

// Read-only diagnosis history for one Annual Physical Exam record, shown to the
// employee from their profile. The Diagnosis column can only fit a preview, so
// the full timeline lives here: every entry a Medical Officer recorded for this
// exam, newest first, with whoever recorded it and any files they attached.
export default function DiagnosisHistoryModal({
  hideModal,
  editData,
}: ModalProps) {
  const entries = sortDiagnosesNewestFirst(editData.hrm_ape_diagnoses);

  return (
    <div className="app__modal_wrapper">
      <div className="app__modal_wrapper2_large">
        <div className="app__modal_wrapper3">
          <div className="app__modal_header">
            <h5 className="app__modal_header_text">Diagnosis History</h5>
            <CustomButton
              containerStyles="app__btn_gray"
              title="Close"
              btnType="button"
              handleClick={hideModal}
            />
          </div>

          <div className="app__modal_body space-y-3">
            {/* Which exam these diagnoses belong to */}
            <div className="rounded-lg border border-gray-200 dark:border-gray-600 p-3 bg-white dark:bg-gray-800">
              <div className="text-[10px] uppercase tracking-wide text-gray-400">
                Annual Physical Exam
              </div>
              <div className="text-base font-semibold text-gray-800 dark:text-gray-100">
                {editData.exam_date
                  ? format(new Date(editData.exam_date), "MMMM d, yyyy")
                  : "—"}
              </div>
              {editData.fitness_result && (
                <div className="mt-1 text-xs text-gray-500 dark:text-gray-300">
                  Fitness Result:{" "}
                  <span className="font-semibold">
                    {editData.fitness_result}
                  </span>
                </div>
              )}
            </div>

            {/* The timeline */}
            <div className="rounded-lg border border-gray-200 dark:border-gray-600 p-3 bg-white dark:bg-gray-800">
              <div className="text-xs font-bold uppercase tracking-wide text-gray-600 dark:text-gray-200 mb-2">
                Diagnosis Entries
              </div>

              {entries.length === 0 ? (
                // Records diagnosed before the history table existed kept their
                // note on the parent row instead.
                editData.diagnosis ? (
                  <div className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-200">
                    {editData.diagnosis}
                  </div>
                ) : (
                  <div className="text-xs text-gray-500 italic">
                    No diagnosis has been recorded for this record yet.
                  </div>
                )
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-600">
                  {entries.map((entry) => {
                    const doctor = `${
                      entry.diagnosed_by_user?.firstname ?? ""
                    } ${entry.diagnosed_by_user?.middlename ?? ""} ${
                      entry.diagnosed_by_user?.lastname ?? ""
                    }`
                      .replace(/\s+/g, " ")
                      .trim();

                    return (
                      <div key={entry.id} className="py-3 first:pt-0 last:pb-0">
                        <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                          <div className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                            {format(
                              new Date(entry.diagnosis_date),
                              "MMMM d, yyyy",
                            )}
                          </div>
                          {doctor && (
                            <div className="text-xs capitalize text-gray-500 dark:text-gray-400">
                              {doctor}
                            </div>
                          )}
                        </div>
                        <div className="mt-1 whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-200">
                          {entry.diagnosis}
                        </div>
                        <DiagnosisFileLinks
                          files={entry.hrm_ape_diagnosis_files}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
