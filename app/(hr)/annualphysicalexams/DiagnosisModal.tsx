/* eslint-disable react-hooks/exhaustive-deps */
import MedicalHistoryView from "@/components/Ape/MedicalHistoryView";
import { CustomButton } from "@/components/index";
import { useFilter } from "@/context/FilterContext";
import { useSupabase } from "@/context/SupabaseProvider";
import { EyeIcon } from "@heroicons/react/24/solid";
import { TrashIcon } from "@heroicons/react/20/solid";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

// Types
import type { ApeDiagnosisTypes, ApeTypes } from "@/types";

// Redux imports
import { updateList } from "@/GlobalRedux/Features/listSlice";
import { logError } from "@/utils/fetchApi";
import { useDispatch, useSelector } from "react-redux";

interface ModalProps {
  hideModal: () => void;
  editData: ApeTypes;
}

const fitnessResults = ["Fit", "Fit with conditions", "Unfit"];

// A diagnosis entry being edited in the modal. Entries without an id are new
// (not yet saved to hrm_ape_diagnoses).
interface DiagnosisEntry {
  id?: string;
  diagnosis: string;
  diagnosis_date: string;
  diagnosed_by_user?: ApeDiagnosisTypes["diagnosed_by_user"];
}

const DiagnosisModal = ({ hideModal, editData }: ModalProps) => {
  const { setToast } = useFilter();
  const { supabase, session } = useSupabase();
  const [saving, setSaving] = useState(false);
  const [attachments, setAttachments] = useState<Array<{ name: string }>>([]);

  // Diagnosis history (multiple entries, each with its own date)
  const [diagnoses, setDiagnoses] = useState<DiagnosisEntry[]>([]);
  const [removedIds, setRemovedIds] = useState<string[]>([]);
  const [newDiagnosis, setNewDiagnosis] = useState("");
  const [newDiagnosisDate, setNewDiagnosisDate] = useState(
    format(new Date(), "yyyy-MM-dd"),
  );
  const [diagnosisError, setDiagnosisError] = useState("");

  // Redux staff
  const globallist = useSelector((state: any) => state.list.value);
  const dispatch = useDispatch();

  const {
    register,
    formState: { errors },
    reset,
    handleSubmit,
  } = useForm<ApeTypes>({
    mode: "onSubmit",
  });

  const handleAddDiagnosis = () => {
    if (newDiagnosis.trim() === "") {
      setDiagnosisError("Enter a diagnosis before adding.");
      return;
    }
    if (newDiagnosisDate === "") {
      setDiagnosisError("Choose a date for this diagnosis.");
      return;
    }

    setDiagnoses([
      ...diagnoses,
      { diagnosis: newDiagnosis.trim(), diagnosis_date: newDiagnosisDate },
    ]);
    setNewDiagnosis("");
    setNewDiagnosisDate(format(new Date(), "yyyy-MM-dd"));
    setDiagnosisError("");
  };

  const handleRemoveDiagnosis = (index: number) => {
    const entry = diagnoses[index];
    if (entry.id) {
      setRemovedIds([...removedIds, entry.id]);
    }
    setDiagnoses(diagnoses.filter((_, i) => i !== index));
  };

  const onSubmit = async (formdata: ApeTypes) => {
    if (saving) return;

    if (diagnoses.length === 0) {
      setDiagnosisError("Add at least one diagnosis.");
      return;
    }

    setSaving(true);

    // Latest entry (by date) is mirrored to the legacy diagnosis column so older
    // views/exports keep working.
    const sorted = [...diagnoses].sort((a, b) =>
      a.diagnosis_date.localeCompare(b.diagnosis_date),
    );
    const latest = sorted[sorted.length - 1];

    const newData = {
      fitness_result: formdata.fitness_result,
      medical_officer_remarks: formdata.medical_officer_remarks ?? "",
      diagnosis: latest.diagnosis,
      diagnosed_by: session?.user.id,
      diagnosed_at: new Date(),
    };

    try {
      // Remove deleted diagnosis entries
      if (removedIds.length > 0) {
        const { error } = await supabase
          .from("hrm_ape_diagnoses")
          .delete()
          .in("id", removedIds);
        if (error) throw new Error(error.message);
      }

      // Insert newly added diagnosis entries
      const newEntries = diagnoses.filter((d) => !d.id);
      let insertedEntries: ApeDiagnosisTypes[] = [];
      if (newEntries.length > 0) {
        const { data, error } = await supabase
          .from("hrm_ape_diagnoses")
          .insert(
            newEntries.map((d) => ({
              org_id: process.env.NEXT_PUBLIC_ORG_ID,
              ape_id: editData.id,
              diagnosis: d.diagnosis,
              diagnosis_date: d.diagnosis_date,
              diagnosed_by: session?.user.id,
            })),
          )
          .select(
            "id,ape_id,diagnosis,diagnosis_date,diagnosed_by,diagnosed_by_user:diagnosed_by(id,firstname,middlename,lastname)",
          );
        if (error) {
          void logError(
            "Diagnose APE",
            "hrm_ape_diagnoses",
            JSON.stringify(newEntries),
            error.message,
          );
          throw new Error(error.message);
        }
        insertedEntries = (data ?? []) as unknown as ApeDiagnosisTypes[];
      }

      const { error } = await supabase
        .from("hrm_annual_physical_exams")
        .update(newData)
        .eq("id", editData.id);

      if (error) {
        void logError(
          "Diagnose APE",
          "hrm_annual_physical_exams",
          JSON.stringify(newData),
          error.message,
        );
        throw new Error(error.message);
      }

      // Notify the employee
      await handleNotify();

      // Rebuild the full diagnosis history for redux (kept entries + new inserts)
      const keptEntries = (editData.hrm_ape_diagnoses ?? []).filter(
        (d) => !removedIds.includes(d.id),
      );
      const updatedDiagnoses = [...keptEntries, ...insertedEntries].sort(
        (a, b) => a.diagnosis_date.localeCompare(b.diagnosis_date),
      );

      // Update data in redux
      const items = [...globallist];
      const foundIndex = items.findIndex((x) => x.id === editData.id);
      items[foundIndex] = {
        ...items[foundIndex],
        ...newData,
        diagnosed_at: new Date().toISOString(),
        hrm_ape_diagnoses: updatedDiagnoses,
      };
      dispatch(updateList(items));

      setToast("success", "Successfully saved.");
      setSaving(false);
      hideModal();
      reset();
    } catch (e) {
      console.error(e);
      setToast("error", "Saving failed, please reload the page and try again.");
      setSaving(false);
    }
  };

  const handleNotify = async () => {
    try {
      const notificationData = {
        message:
          "A Medical Officer has recorded a diagnosis for your Annual Physical Exam.",
        url: `/profile/${editData.hrm_user_id}?page=ape`,
        type: "Annual Physical Exam",
        user_id: editData.hrm_user_id,
        reference_table: "hrm_annual_physical_exams",
      };

      const { error } = await supabase
        .from("hrm_notifications")
        .insert(notificationData);

      if (error) throw new Error(error.message);
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch the list of uploaded medical record files for this record.
  const fetchAttachments = async () => {
    const { data, error } = await supabase.storage
      .from("hrm")
      .list(`annual_physical_exams/${editData.id}`, {
        limit: 100,
        offset: 0,
        sortBy: { column: "name", order: "asc" },
      });

    if (error) {
      console.error("Error fetching attachments:", error.message);
      setAttachments([]);
      return;
    }

    setAttachments(data ?? []);
  };

  // Open the attachment in a new browser tab for viewing (no forced download).
  const handleViewFile = async (file: string) => {
    const { data, error } = await supabase.storage
      .from("hrm")
      .createSignedUrl(`annual_physical_exams/${editData.id}/${file}`, 300);

    if (error || !data?.signedUrl) {
      setToast("error", "Unable to open the file. Please try again.");
      return;
    }

    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  };

  useEffect(() => {
    void fetchAttachments();
    reset({
      fitness_result: editData.fitness_result ?? "",
      medical_officer_remarks: editData.medical_officer_remarks ?? "",
    });
    setDiagnoses(
      [...(editData.hrm_ape_diagnoses ?? [])]
        .sort((a, b) => a.diagnosis_date.localeCompare(b.diagnosis_date))
        .map((d) => ({
          id: d.id,
          diagnosis: d.diagnosis,
          diagnosis_date: d.diagnosis_date,
          diagnosed_by_user: d.diagnosed_by_user,
        })),
    );
    setRemovedIds([]);
    setNewDiagnosis("");
    setNewDiagnosisDate(format(new Date(), "yyyy-MM-dd"));
    setDiagnosisError("");
  }, [editData, reset]);

  return (
    <>
      <div className="app__modal_wrapper">
        <div className="app__modal_wrapper2_large">
          <div className="app__modal_wrapper3">
            <div className="app__modal_header">
              <h5 className="app__modal_header_text">Review &amp; Diagnose</h5>
              <CustomButton
                containerStyles="app__btn_gray"
                title="Close"
                isDisabled={saving}
                btnType="button"
                handleClick={hideModal}
              />
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="app__modal_body">
              <div className="app__form_field_container">
                <div className="w-full">
                  <div className="app__label_standard">Employee</div>
                  <div className="text-sm font-medium capitalize">
                    {editData.hrm_users?.firstname}{" "}
                    {editData.hrm_users?.middlename}{" "}
                    {editData.hrm_users?.lastname}
                  </div>
                </div>
              </div>

              {/* Uploaded medical record file/s (view in browser) */}
              <div className="app__form_field_container">
                <div className="w-full">
                  <div className="app__label_standard mb-1">
                    Medical Record Attachment/s
                  </div>
                  {attachments.length === 0 ? (
                    <div className="text-xs text-gray-500 italic">
                      No files were uploaded for this record.
                    </div>
                  ) : (
                    <div className="flex flex-col gap-y-1">
                      {attachments.map((file) => (
                        <button
                          key={file.name}
                          type="button"
                          onClick={async () => await handleViewFile(file.name)}
                          className="flex items-center gap-x-2 text-blue-600 hover:underline text-xs w-fit"
                          title="View in browser"
                        >
                          <EyeIcon className="w-4 h-4" />
                          <span className="break-all text-left">
                            {file.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Employee-completed Medical History form (read-only) */}
              <div className="app__form_field_container">
                <div className="w-full">
                  <div className="app__label_standard mb-1">
                    Medical History (submitted by employee)
                  </div>
                  <MedicalHistoryView
                    medicalHistory={editData.medical_history}
                  />
                </div>
              </div>

              {/* --- Medical Officer Assessment --- */}
              <div className="mt-4 border rounded-md p-3 bg-blue-50 dark:bg-gray-700 space-y-3">
                <div className="text-sm font-bold text-gray-700 dark:text-gray-200">
                  Medical Officer Assessment
                </div>

                <div className="w-full">
                  <div className="app__label_standard">Diagnosis History</div>

                  {diagnoses.length === 0 ? (
                    <div className="text-xs text-gray-500 italic mb-2">
                      No diagnosis recorded yet. Add one below.
                    </div>
                  ) : (
                    <div className="flex flex-col gap-y-2 mb-2">
                      {diagnoses.map((entry, index) => (
                        <div
                          key={entry.id ?? `new-${index}`}
                          className="flex items-start justify-between gap-x-2 border rounded-md bg-white dark:bg-gray-800 p-2"
                        >
                          <div className="flex-1">
                            <div className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                              {format(
                                new Date(entry.diagnosis_date),
                                "MMM d, yyyy",
                              )}
                              {entry.diagnosed_by_user && (
                                <span className="font-normal capitalize">
                                  {" "}
                                  &middot; {entry.diagnosed_by_user.firstname}{" "}
                                  {entry.diagnosed_by_user.lastname}
                                </span>
                              )}
                              {!entry.id && (
                                <span className="ml-2 text-[10px] uppercase text-green-600 font-bold">
                                  New
                                </span>
                              )}
                            </div>
                            <div className="text-sm whitespace-pre-wrap">
                              {entry.diagnosis}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveDiagnosis(index)}
                            className="text-red-500 hover:text-red-700 shrink-0"
                            title="Remove this diagnosis"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add new diagnosis entry */}
                  <div className="border rounded-md bg-white dark:bg-gray-800 p-2 space-y-2">
                    <div className="app__label_standard">Add Diagnosis</div>
                    <div className="flex flex-col md:flex-row gap-2">
                      <input
                        type="date"
                        value={newDiagnosisDate}
                        onChange={(e) => setNewDiagnosisDate(e.target.value)}
                        className="app__select_standard md:w-44"
                      />
                      <textarea
                        value={newDiagnosis}
                        onChange={(e) => setNewDiagnosis(e.target.value)}
                        rows={2}
                        placeholder="Enter diagnosis"
                        className="app__select_standard flex-1"
                      />
                      <CustomButton
                        containerStyles="app__btn_blue md:self-start"
                        title="Add"
                        btnType="button"
                        handleClick={handleAddDiagnosis}
                      />
                    </div>
                  </div>
                  {diagnosisError !== "" && (
                    <div className="app__error_message">{diagnosisError}</div>
                  )}
                </div>

                <div className="w-full">
                  <div className="app__label_standard">Fitness Result</div>
                  <select
                    {...register("fitness_result", { required: true })}
                    className="app__select_standard"
                  >
                    <option value="">Select</option>
                    {fitnessResults.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                  {errors.fitness_result && (
                    <div className="app__error_message">
                      Fitness Result is required
                    </div>
                  )}
                </div>

                <div className="w-full">
                  <div className="app__label_standard">Remarks</div>
                  <textarea
                    {...register("medical_officer_remarks")}
                    rows={3}
                    placeholder="Additional remarks (optional)"
                    className="app__select_standard"
                  />
                </div>
              </div>

              <div className="app__warning_text mt-3">
                <span className="app__warning_title">Note:</span> Once saved, the
                employee can no longer edit this record.
              </div>
              <div className="app__modal_footer">
                <CustomButton
                  btnType="submit"
                  isDisabled={saving}
                  title={saving ? "Saving..." : "Save Diagnosis"}
                  containerStyles="app__btn_green"
                />
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default DiagnosisModal;
