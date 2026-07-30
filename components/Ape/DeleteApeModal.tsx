/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { CustomButton } from "@/components/index";
import { useFilter } from "@/context/FilterContext";
import { useSupabase } from "@/context/SupabaseProvider";
import { logError } from "@/utils/fetchApi";
import { useEffect, useRef, useState } from "react";

// Redux imports
import { updateList } from "@/GlobalRedux/Features/listSlice";
import { updateResultCounter } from "@/GlobalRedux/Features/resultsCounterSlice";
import { useDispatch, useSelector } from "react-redux";

interface ModalProps {
  hideModal: () => void;
  id: string;
  // shown in the confirmation so the deleter can see whose record this is
  employeeName?: string;
}

/**
 * Deletes an Annual Physical Exam record together with everything hanging off it.
 *
 * The shared DeleteModal only removes the row. That is not enough here: the DB
 * cascades take care of hrm_ape_diagnoses and hrm_ape_diagnosis_files, but the
 * uploaded files themselves live in the "hrm" storage bucket under two separate
 * prefixes and would be left orphaned:
 *   - annual_physical_exams/{ape_id}/     (the employee's own exam results)
 *   - ape_diagnoses/{diagnosis_id}/       (a Medical Officer's diagnosis files)
 */
const DeleteApeModal = ({ hideModal, id, employeeName }: ModalProps) => {
  const { setToast } = useFilter();
  const { supabase } = useSupabase();
  const [deleting, setDeleting] = useState(false);

  const wrapperRef = useRef<HTMLDivElement>(null);

  // Redux staff
  const globallist = useSelector((state: any) => state.list.value);
  const resultsCounter = useSelector((state: any) => state.results.value);
  const dispatch = useDispatch();

  // Collect the bucket paths of the diagnosis attachments of this exam.
  const getDiagnosisFilePaths = async (): Promise<string[]> => {
    const { data: diagnoses, error } = await supabase
      .from("hrm_ape_diagnoses")
      .select("id")
      .eq("ape_id", id);

    if (error) throw new Error(error.message);

    const diagnosisIds = (diagnoses ?? []).map((d: { id: string }) => d.id);
    if (diagnosisIds.length === 0) return [];

    const { data: files, error: error2 } = await supabase
      .from("hrm_ape_diagnosis_files")
      .select("file_path")
      .in("diagnosis_id", diagnosisIds);

    if (error2) throw new Error(error2.message);

    return (files ?? []).map((f: { file_path: string }) => f.file_path);
  };

  // Collect the bucket paths of the employee's uploaded exam results.
  const getAttachmentPaths = async (): Promise<string[]> => {
    const { data, error } = await supabase.storage
      .from("hrm")
      .list(`annual_physical_exams/${id}`, { limit: 100, offset: 0 });

    if (error) throw new Error(error.message);

    return (data ?? []).map(
      (file: { name: string }) => `annual_physical_exams/${id}/${file.name}`,
    );
  };

  const handleDelete = async () => {
    if (deleting) return;

    setDeleting(true);

    try {
      // Remove the stored files first, while the rows that point to them still
      // exist. Storage cleanup is best-effort: a failure here must not stop the
      // record itself from being deleted, so it is only logged.
      try {
        const paths = [
          ...(await getDiagnosisFilePaths()),
          ...(await getAttachmentPaths()),
        ];

        if (paths.length > 0) {
          const { error } = await supabase.storage.from("hrm").remove(paths);
          if (error) throw new Error(error.message);
        }
      } catch (e) {
        console.error("APE storage cleanup failed:", e);
      }

      // The diagnoses and their file rows go away through the DB cascade.
      const { error } = await supabase
        .from("hrm_annual_physical_exams")
        .delete()
        .eq("id", id)
        .eq("org_id", process.env.NEXT_PUBLIC_ORG_ID);

      if (error) throw new Error(error.message);

      // Update data in redux
      const items = [...globallist];
      const updatedList = items.filter((item) => item.id !== id);
      dispatch(updateList(updatedList));

      // Updating showing text in redux
      dispatch(
        updateResultCounter({
          showing: Number(resultsCounter.showing) - 1,
          results: Number(resultsCounter.results) - 1,
        }),
      );

      setToast("success", "Successfully Deleted!");
      hideModal();
    } catch (e) {
      console.error(e);
      void logError(
        "Delete APE",
        "hrm_annual_physical_exams",
        id,
        e instanceof Error ? e.message : "unknown error",
      );
      setToast("error", "Delete failed, please try again.");
    } finally {
      setDeleting(false);
    }
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      hideModal();
    }
  };

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [wrapperRef]);

  return (
    <>
      <div ref={wrapperRef} className="app__modal_wrapper">
        <div className="app__modal_wrapper2">
          <div className="app__modal_wrapper3">
            <div className="app__modal_header">
              <h5 className="app__modal_header_text">Confirm Delete</h5>
              <button
                disabled={deleting}
                onClick={hideModal}
                type="button"
                className="app__modal_header_btn"
              >
                &times;
              </button>
            </div>

            <div className="app__modal_body">
              <div className="text-gray-700 text-sm py-4 dark:text-gray-300">
                <div>
                  Are you sure you want to delete this Annual Physical Exam
                  record
                  {employeeName && employeeName.trim() !== "" ? (
                    <>
                      {" "}
                      of <span className="font-bold">{employeeName}</span>
                    </>
                  ) : (
                    ""
                  )}
                  ?
                </div>
                <div className="mt-2">
                  This also permanently deletes all its diagnoses and uploaded
                  files. This cannot be undone.
                </div>
              </div>
              <div className="app__modal_footer">
                <CustomButton
                  handleClick={handleDelete}
                  btnType="button"
                  isDisabled={deleting}
                  title={deleting ? "Deleting..." : "Delete"}
                  containerStyles="app__btn_red_large"
                />
                <CustomButton
                  handleClick={hideModal}
                  btnType="button"
                  isDisabled={deleting}
                  title="Cancel"
                  containerStyles="app__btn_gray_sm"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DeleteApeModal;
