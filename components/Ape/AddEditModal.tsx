/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { CustomButton } from "@/components/index";
import { useFilter } from "@/context/FilterContext";
import { useSupabase } from "@/context/SupabaseProvider";
import { useCallback, useEffect, useState } from "react";
import { type FileWithPath, useDropzone } from "react-dropzone";
import { useForm } from "react-hook-form";

// Types
import type { ApeTypes } from "@/types";

// Redux imports
import { updateList } from "@/GlobalRedux/Features/listSlice";
import { updateResultCounter } from "@/GlobalRedux/Features/resultsCounterSlice";
import { logError } from "@/utils/fetchApi";
import { XMarkIcon } from "@heroicons/react/20/solid";
import { useDispatch, useSelector } from "react-redux";

interface ModalProps {
  hideModal: () => void;
  editData: ApeTypes | null;
  userId: string;
}

// --- Medical History form field definitions (DepEd Medical History form) ---

const presentHealthItems: Array<{ key: string; label: string }> = [
  { key: "dizziness", label: "Dizziness" },
  { key: "dyspnea", label: "Dyspnea" },
  { key: "chest_back_pain", label: "Chest/Back pain" },
  { key: "easy_fatigability", label: "Easy fatigability" },
  { key: "joint_extremity_pains", label: "Joint/extremity pains" },
  { key: "blurring_of_vision", label: "Blurring of vision" },
  { key: "wearing_eyeglasses", label: "Wearing eyeglasses" },
  { key: "vaginal_discharge_bleeding", label: "Vaginal discharge/bleeding" },
  { key: "lumps", label: "Lumps" },
  { key: "painful_urination", label: "Painful urination" },
  { key: "poor_loss_of_hearing", label: "Poor/loss of hearing" },
  { key: "syncope_fainting", label: "Syncope/fainting" },
  { key: "convulsions", label: "Convulsions" },
  { key: "malaria", label: "Malaria" },
  { key: "goiter", label: "Goiter" },
  { key: "anemia", label: "Anemia" },
];

const personalHistoryItems: Array<{ key: string; label: string }> = [
  { key: "hypertension", label: "Hypertension" },
  { key: "cardiovascular_heart_disease", label: "Cardiovascular Heart Disease" },
  { key: "diabetes_mellitus", label: "Diabetes Mellitus" },
  { key: "kidney_disease", label: "Kidney Disease" },
  { key: "cancer", label: "Cancer" },
  { key: "asthma", label: "Asthma" },
  { key: "allergy", label: "Allergy (pls. specify)" },
  { key: "surgical_operations", label: "Surgical Operations (pls. specify)" },
  { key: "last_hospitalization", label: "Last hospitalization (reason)" },
  { key: "loss_of_consciousness", label: "Loss of consciousness" },
  { key: "fracture_dislocation", label: "Fracture/Dislocation" },
  { key: "g6pd", label: "G6PD" },
  { key: "other", label: "Other (pls. specify)" },
];

const coughDurations = ["2wks", "1 month", "longer"];

const computeAge = (birthday?: string): string => {
  if (!birthday) return "";
  const dob = new Date(birthday);
  if (isNaN(dob.getTime())) return "";
  const diff = Date.now() - dob.getTime();
  const age = Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
  return age >= 0 ? String(age) : "";
};

const AddEditModal = ({ hideModal, editData, userId }: ModalProps) => {
  const { setToast } = useFilter();
  const { supabase } = useSupabase();
  const [saving, setSaving] = useState(false);
  const [employee, setEmployee] = useState<any>(null);
  const [selectedImages, setSelectedImages] = useState<any>([]);

  // Redux staff
  const globallist = useSelector((state: any) => state.list.value);
  const resultsCounter = useSelector((state: any) => state.results.value);
  const dispatch = useDispatch();

  const {
    register,
    formState: { errors },
    reset,
    handleSubmit,
  } = useForm<any>({
    mode: "onSubmit",
  });

  // --- Attachments (medical record) dropzone ---
  const onDrop = useCallback((acceptedFiles: FileWithPath[]) => {
    setSelectedImages(
      acceptedFiles.map((file) =>
        Object.assign(file, { filename: file.name }),
      ),
    );
  }, []);

  const maxSize = 5242880; // 5 MB in bytes
  const { getRootProps, getInputProps, fileRejections } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".png", ".jpg"],
      "application/pdf": [".pdf"],
      "application/msword": [".docx"],
      "application/vnd.ms-excel": [".xlsx"],
    },
    maxSize,
  });

  const deleteFile = (file: FileWithPath) => {
    setSelectedImages(
      selectedImages.filter((f: FileWithPath) => f.path !== file.path),
    );
  };

  const onSubmit = async (formdata: any) => {
    if (saving) return;
    setSaving(true);

    if (editData) {
      void handleUpdate(formdata);
    } else {
      void handleCreate(formdata);
    }
  };

  const handleUploadFiles = async (id: string) => {
    await Promise.all(
      selectedImages.map(async (file: File) => {
        const safeFileName = file.name
          .replace(/\s+/g, "_")
          .replace(/[^a-zA-Z0-9_.-]/g, "")
          .toLowerCase();

        const { error } = await supabase.storage
          .from("hrm")
          .upload(`annual_physical_exams/${id}/${safeFileName}`, file);

        if (error) {
          throw new Error(`Failed to upload ${file.name}: ${error.message}`);
        }
      }),
    );
  };

  // Notify Medical Officers that a new APE / Medical History form is ready to review.
  const handleNotify = async (fullname: string, id: string) => {
    try {
      const { data, error } = await supabase
        .from("hrm_system_access")
        .select("user_id")
        .eq("type", "medical_officer")
        .eq("org_id", process.env.NEXT_PUBLIC_ORG_ID);

      if (error) throw new Error(error.message);

      const notificationData = (data ?? []).map((item: any) => ({
        message: `${fullname} submitted an Annual Physical Exam (Medical History form). Kindly review and record a diagnosis.`,
        url: `/annualphysicalexams?ref=${id}`,
        type: "Annual Physical Exam",
        user_id: item.user_id,
        reference_table: "hrm_annual_physical_exams",
      }));

      if (notificationData.length > 0) {
        const { error: error2 } = await supabase
          .from("hrm_notifications")
          .insert(notificationData);
        if (error2) throw new Error(error2.message);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const employeeFullname = (): string => {
    const first = employee?.firstname ?? "";
    const middle = employee?.middlename ?? "";
    const last = employee?.lastname ?? "";
    return `${first} ${middle} ${last}`.replace(/\s+/g, " ").trim();
  };

  const handleCreate = async (formdata: any) => {
    const newData = {
      exam_date: formdata.exam_date,
      remarks: formdata.remarks ?? "",
      medical_history: formdata.medical_history ?? {},
      hrm_user_id: userId,
      org_id: process.env.NEXT_PUBLIC_ORG_ID,
    };

    try {
      const { data, error } = await supabase
        .from("hrm_annual_physical_exams")
        .insert(newData)
        .select();

      if (error) {
        void logError(
          "Create APE",
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

      const newId = data[0].id;

      // Upload the attached medical record file/s (if any)
      if (selectedImages.length > 0) {
        await handleUploadFiles(newId);
      }

      // Notify Medical Officers that a new form is ready for review
      await handleNotify(employeeFullname(), newId);

      // Append new data in redux
      dispatch(updateList([{ ...newData, id: newId }, ...globallist]));
      dispatch(
        updateResultCounter({
          showing: Number(resultsCounter.showing) + 1,
          results: Number(resultsCounter.results) + 1,
        }),
      );

      setToast("success", "Successfully saved.");
      setSaving(false);
      hideModal();
      reset();
    } catch (e) {
      console.error(e);
      setToast("error", "Saving failed. Please try again.");
      setSaving(false);
    }
  };

  const handleUpdate = async (formdata: any) => {
    if (!editData) return;

    const newData = {
      exam_date: formdata.exam_date,
      remarks: formdata.remarks ?? "",
      medical_history: formdata.medical_history ?? {},
    };

    try {
      const { error } = await supabase
        .from("hrm_annual_physical_exams")
        .update(newData)
        .eq("id", editData.id);

      if (error) {
        void logError(
          "Update APE",
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

      // Upload any newly attached medical record file/s
      if (selectedImages.length > 0) {
        await handleUploadFiles(editData.id);
      }

      // Update data in redux
      const items = [...globallist];
      const foundIndex = items.findIndex((x) => x.id === editData.id);
      items[foundIndex] = { ...items[foundIndex], ...newData };
      dispatch(updateList(items));

      setToast("success", "Successfully saved.");
      setSaving(false);
      hideModal();
      reset();
    } catch (e) {
      console.error(e);
      setToast("error", "Saving failed. Please try again.");
      setSaving(false);
    }
  };

  // Fetch employee basic info (used to prefill the form header)
  useEffect(() => {
    void (async () => {
      const { data } = await supabase
        .from("hrm_users")
        .select("firstname,middlename,lastname,gender,birthday")
        .eq("id", userId)
        .maybeSingle();
      setEmployee(data ?? null);
    })();
  }, [userId]);

  useEffect(() => {
    if (fileRejections.length > 0) setSelectedImages([]);
  }, [fileRejections]);

  // Set defaultValues whenever editData / employee changes.
  useEffect(() => {
    const mh = editData?.medical_history ?? {};
    const header = mh.header ?? {};

    const prefilledName =
      header.name ??
      `${employee?.firstname ?? ""} ${employee?.middlename ?? ""} ${
        employee?.lastname ?? ""
      }`
        .replace(/\s+/g, " ")
        .trim();

    reset({
      exam_date: editData ? editData.exam_date : "",
      remarks: editData ? editData.remarks : "",
      medical_history: {
        header: {
          form_date: header.form_date ?? "",
          name: prefilledName,
          date_of_birth: header.date_of_birth ?? employee?.birthday ?? "",
          age: header.age ?? computeAge(employee?.birthday),
          gender: header.gender ?? employee?.gender ?? "",
          school_district_division: header.school_district_division ?? "",
          civil_status: header.civil_status ?? "",
          position_designation: header.position_designation ?? "",
          years_in_service: header.years_in_service ?? "",
        },
        present_health: mh.present_health ?? {},
        personal_history: mh.personal_history ?? {},
        social_history: mh.social_history ?? {},
        obgyn_history: mh.obgyn_history ?? {},
      },
    });
  }, [editData, employee, reset]);

  const selectedFiles = selectedImages?.map((file: any, index: number) => (
    <div
      key={index}
      className="flex space-x-1 py-px items-center justify-start relative align-top"
    >
      <XMarkIcon
        onClick={() => deleteFile(file)}
        className="cursor-pointer w-5 h-5 text-red-400"
      />
      <span className="text-xs">{file.filename}</span>
    </div>
  ));

  return (
    <>
      <div className="app__modal_wrapper">
        <div className="app__modal_wrapper2_large">
          <div className="app__modal_wrapper3">
            <div className="app__modal_header">
              <h5 className="app__modal_header_text">
                Annual Physical Exam &mdash; Medical History
              </h5>
              <CustomButton
                containerStyles="app__btn_gray"
                title="Close"
                isDisabled={saving}
                btnType="button"
                handleClick={hideModal}
              />
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="app__modal_body">
              <div className="app__warning_text">
                <span className="app__warning_title">Note:</span> This Medical
                History form must be completed and signed by the DepEd Personnel,
                prior to the physical examination, for review by the examining
                practitioner.
              </div>

              {/* Date of Exam */}
              <div className="app__form_field_container">
                <div className="w-full">
                  <div className="app__label_standard">Date of Exam</div>
                  <input
                    {...register("exam_date", { required: true })}
                    type="date"
                    className="app__select_standard"
                  />
                  {errors.exam_date && (
                    <div className="app__error_message">
                      Date of Exam is required
                    </div>
                  )}
                </div>
              </div>

              {/* --- Header --- */}
              <div className="app__label_standard font-bold mt-2 border-b pb-1">
                Personnel Information
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <div className="app__label_standard">Date</div>
                  <input
                    {...register("medical_history.header.form_date")}
                    type="date"
                    className="app__select_standard"
                  />
                </div>
                <div>
                  <div className="app__label_standard">Name</div>
                  <input
                    {...register("medical_history.header.name")}
                    type="text"
                    className="app__select_standard"
                  />
                </div>
                <div>
                  <div className="app__label_standard">Date of Birth</div>
                  <input
                    {...register("medical_history.header.date_of_birth")}
                    type="date"
                    className="app__select_standard"
                  />
                </div>
                <div>
                  <div className="app__label_standard">Age</div>
                  <input
                    {...register("medical_history.header.age")}
                    type="text"
                    className="app__select_standard"
                  />
                </div>
                <div>
                  <div className="app__label_standard">Gender</div>
                  <input
                    {...register("medical_history.header.gender")}
                    type="text"
                    className="app__select_standard"
                  />
                </div>
                <div>
                  <div className="app__label_standard">Civil Status</div>
                  <input
                    {...register("medical_history.header.civil_status")}
                    type="text"
                    className="app__select_standard"
                  />
                </div>
                <div>
                  <div className="app__label_standard">
                    School/District/Division
                  </div>
                  <input
                    {...register(
                      "medical_history.header.school_district_division",
                    )}
                    type="text"
                    className="app__select_standard"
                  />
                </div>
                <div>
                  <div className="app__label_standard">Position/Designation</div>
                  <input
                    {...register("medical_history.header.position_designation")}
                    type="text"
                    className="app__select_standard"
                  />
                </div>
                <div>
                  <div className="app__label_standard">Years in Service</div>
                  <input
                    {...register("medical_history.header.years_in_service")}
                    type="text"
                    className="app__select_standard"
                  />
                </div>
              </div>

              {/* --- Present Health Status --- */}
              <div className="app__label_standard font-bold mt-4 border-b pb-1">
                Present Health Status (pls. check)
              </div>

              {/* Cough (with duration) */}
              <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-xs py-1">
                <span className="w-52 font-medium">Cough</span>
                {coughDurations.map((d) => (
                  <label key={d} className="flex items-center gap-x-1">
                    <input
                      type="radio"
                      value={d}
                      {...register("medical_history.present_health.cough")}
                    />
                    {d}
                  </label>
                ))}
                <label className="flex items-center gap-x-1">
                  <input
                    type="radio"
                    value=""
                    {...register("medical_history.present_health.cough")}
                  />
                  None
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                {presentHealthItems.map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between text-xs py-1 border-b border-dashed"
                  >
                    <span className="font-medium">{item.label}</span>
                    <div className="flex items-center gap-x-3">
                      <label className="flex items-center gap-x-1">
                        <input
                          type="radio"
                          value="yes"
                          {...register(
                            `medical_history.present_health.${item.key}`,
                          )}
                        />
                        Y
                      </label>
                      <label className="flex items-center gap-x-1">
                        <input
                          type="radio"
                          value="no"
                          {...register(
                            `medical_history.present_health.${item.key}`,
                          )}
                        />
                        N
                      </label>
                    </div>
                  </div>
                ))}
              </div>

              <div className="app__form_field_container mt-2">
                <div className="w-full">
                  <div className="app__label_standard">
                    Others (pls. specify)
                  </div>
                  <input
                    {...register("medical_history.present_health.others")}
                    type="text"
                    className="app__select_standard"
                  />
                </div>
              </div>
              <div className="app__form_field_container">
                <div className="w-full">
                  <div className="app__label_standard">
                    Present Medication taken (pls. specify)
                  </div>
                  <input
                    {...register(
                      "medical_history.present_health.present_medication",
                    )}
                    type="text"
                    className="app__select_standard"
                  />
                </div>
              </div>

              {/* --- Personal History --- */}
              <div className="app__label_standard font-bold mt-4 border-b pb-1">
                Personal History (pls. check)
              </div>
              <div className="space-y-1">
                {personalHistoryItems.map((item) => (
                  <div
                    key={item.key}
                    className="grid grid-cols-1 md:grid-cols-12 items-center gap-2 text-xs py-1 border-b border-dashed"
                  >
                    <span className="md:col-span-4 font-medium">
                      {item.label}
                    </span>
                    <div className="md:col-span-3 flex items-center gap-x-3">
                      <label className="flex items-center gap-x-1">
                        <input
                          type="radio"
                          value="yes"
                          {...register(
                            `medical_history.personal_history.${item.key}.value`,
                          )}
                        />
                        Y
                      </label>
                      <label className="flex items-center gap-x-1">
                        <input
                          type="radio"
                          value="no"
                          {...register(
                            `medical_history.personal_history.${item.key}.value`,
                          )}
                        />
                        N
                      </label>
                    </div>
                    <input
                      {...register(
                        `medical_history.personal_history.${item.key}.remarks`,
                      )}
                      type="text"
                      placeholder="Remarks"
                      className="md:col-span-5 app__input_noborder border rounded px-2 py-1 text-xs bg-white dark:bg-gray-800"
                    />
                  </div>
                ))}
              </div>

              {/* --- Social History --- */}
              <div className="app__label_standard font-bold mt-4 border-b pb-1">
                Social History
              </div>
              <div className="text-xs space-y-2">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                  <span className="w-16 font-medium">Smoking</span>
                  <label className="flex items-center gap-x-1">
                    <input
                      type="radio"
                      value="yes"
                      {...register("medical_history.social_history.smoking")}
                    />
                    Y
                  </label>
                  <label className="flex items-center gap-x-1">
                    <input
                      type="radio"
                      value="no"
                      {...register("medical_history.social_history.smoking")}
                    />
                    N
                  </label>
                  <input
                    {...register(
                      "medical_history.social_history.smoking_age_started",
                    )}
                    type="text"
                    placeholder="Age started"
                    className="border rounded px-2 py-1 bg-white dark:bg-gray-800"
                  />
                  <input
                    {...register(
                      "medical_history.social_history.smoking_sticks_per_day",
                    )}
                    type="text"
                    placeholder="Sticks/packs per day"
                    className="border rounded px-2 py-1 bg-white dark:bg-gray-800"
                  />
                  <input
                    {...register(
                      "medical_history.social_history.smoking_packs_per_year",
                    )}
                    type="text"
                    placeholder="Packs per year"
                    className="border rounded px-2 py-1 bg-white dark:bg-gray-800"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                  <span className="w-16 font-medium">Alcohol</span>
                  <label className="flex items-center gap-x-1">
                    <input
                      type="radio"
                      value="yes"
                      {...register("medical_history.social_history.alcohol")}
                    />
                    Y
                  </label>
                  <label className="flex items-center gap-x-1">
                    <input
                      type="radio"
                      value="no"
                      {...register("medical_history.social_history.alcohol")}
                    />
                    N
                  </label>
                  <input
                    {...register(
                      "medical_history.social_history.alcohol_how_often",
                    )}
                    type="text"
                    placeholder="How often"
                    className="border rounded px-2 py-1 bg-white dark:bg-gray-800"
                  />
                </div>
                <div className="app__form_field_container">
                  <div className="w-full">
                    <div className="app__label_standard">Food preference</div>
                    <input
                      {...register(
                        "medical_history.social_history.food_preference",
                      )}
                      type="text"
                      className="app__select_standard"
                    />
                  </div>
                </div>
                <div className="app__form_field_container">
                  <div className="w-full">
                    <div className="app__label_standard">Other Remarks</div>
                    <textarea
                      {...register(
                        "medical_history.social_history.other_remarks",
                      )}
                      rows={2}
                      className="app__select_standard"
                    />
                  </div>
                </div>
              </div>

              {/* --- OB Gyn History --- */}
              <div className="app__label_standard font-bold mt-4 border-b pb-1">
                OB Gyn History (Female Teachers)
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <div className="app__label_standard">Menopause</div>
                  <input
                    {...register("medical_history.obgyn_history.menopause")}
                    type="text"
                    className="app__select_standard"
                  />
                </div>
                <div>
                  <div className="app__label_standard">Cycle</div>
                  <input
                    {...register("medical_history.obgyn_history.cycle")}
                    type="text"
                    className="app__select_standard"
                  />
                </div>
                <div>
                  <div className="app__label_standard">Duration</div>
                  <input
                    {...register("medical_history.obgyn_history.duration")}
                    type="text"
                    className="app__select_standard"
                  />
                </div>
                <div>
                  <div className="app__label_standard">Dysmenorrhea</div>
                  <input
                    {...register("medical_history.obgyn_history.dysmenorrhea")}
                    type="text"
                    className="app__select_standard"
                  />
                </div>
              </div>

              {/* Remarks */}
              <div className="app__form_field_container mt-4">
                <div className="w-full">
                  <div className="app__label_standard">Remarks (optional)</div>
                  <textarea
                    {...register("remarks")}
                    rows={3}
                    className="app__select_standard"
                  />
                </div>
              </div>

              {/* --- Attachment: medical record --- */}
              <div className="app__label_standard font-bold mt-4 border-b pb-1">
                Medical Record Attachment
              </div>
              <div className="w-full">
                <div
                  {...getRootProps()}
                  className="border border-dashed bg-gray-100 text-gray-600 px-4 py-6 cursor-pointer"
                >
                  <input {...getInputProps()} />
                  <p className="text-sm text-gray-500">
                    Drag and drop the medical record file/s here, or click to
                    select files (image, PDF, DOC, or Excel; max 5MB each).
                  </p>
                </div>
                {fileRejections.length === 0 && selectedImages.length > 0 && (
                  <div className="py-3">
                    <div className="text-xs font-medium mb-2">
                      Files to upload:
                    </div>
                    {selectedFiles}
                  </div>
                )}
                {fileRejections.length > 0 && (
                  <div className="py-3">
                    <p className="text-red-500 text-xs">
                      File rejected. Please make sure its an image, PDF, DOC, or
                      Excel file and less than 5MB.
                    </p>
                  </div>
                )}
                {editData && (
                  <div className="text-xs text-gray-500 mt-1">
                    Tip: You can also manage previously uploaded files using the{" "}
                    <span className="font-bold">Attachments</span> button on the
                    record.
                  </div>
                )}
              </div>

              <div className="app__modal_footer">
                <CustomButton
                  btnType="submit"
                  isDisabled={saving}
                  title={saving ? "Saving..." : "Save"}
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

export default AddEditModal;
