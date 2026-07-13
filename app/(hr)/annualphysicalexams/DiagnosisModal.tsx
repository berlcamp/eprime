/* eslint-disable react-hooks/exhaustive-deps */
import MedicalHistoryView from "@/components/Ape/MedicalHistoryView";
import { CustomButton } from "@/components/index";
import { useFilter } from "@/context/FilterContext";
import { useSupabase } from "@/context/SupabaseProvider";
import { EyeIcon } from "@heroicons/react/24/solid";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

// Types
import type { ApeTypes } from "@/types";

// Redux imports
import { updateList } from "@/GlobalRedux/Features/listSlice";
import { logError } from "@/utils/fetchApi";
import { useDispatch, useSelector } from "react-redux";

interface ModalProps {
  hideModal: () => void;
  editData: ApeTypes;
}

const fitnessResults = ["Fit", "Fit with conditions", "Unfit"];

const DiagnosisModal = ({ hideModal, editData }: ModalProps) => {
  const { setToast } = useFilter();
  const { supabase, session } = useSupabase();
  const [saving, setSaving] = useState(false);
  const [attachments, setAttachments] = useState<Array<{ name: string }>>([]);

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

  const onSubmit = async (formdata: ApeTypes) => {
    if (saving) return;

    setSaving(true);

    const newData = {
      fitness_result: formdata.fitness_result,
      medical_officer_remarks: formdata.medical_officer_remarks ?? "",
      diagnosis: formdata.diagnosis ?? "",
      diagnosed_by: session?.user.id,
      diagnosed_at: new Date(),
    };

    try {
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
        setToast(
          "error",
          "Saving failed, please reload the page and try again.",
        );
        throw new Error(error.message);
      }

      // Notify the employee
      await handleNotify();

      // Update data in redux
      const items = [...globallist];
      const foundIndex = items.findIndex((x) => x.id === editData.id);
      items[foundIndex] = {
        ...items[foundIndex],
        ...newData,
        diagnosed_at: new Date().toISOString(),
      };
      dispatch(updateList(items));

      setToast("success", "Successfully saved.");
      setSaving(false);
      hideModal();
      reset();
    } catch (e) {
      console.error(e);
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
      diagnosis: editData.diagnosis ?? "",
    });
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
                  <div className="app__label_standard">Diagnosis</div>
                  <textarea
                    {...register("diagnosis", { required: true })}
                    rows={5}
                    placeholder="Enter diagnosis"
                    className="app__select_standard"
                  />
                  {errors.diagnosis && (
                    <div className="app__error_message">
                      Diagnosis is required
                    </div>
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
