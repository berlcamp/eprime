import { CustomButton } from "@/components/index";
import { useFilter } from "@/context/FilterContext";
import { useSupabase } from "@/context/SupabaseProvider";
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

  useEffect(() => {
    reset({
      fitness_result: editData.fitness_result ?? "",
      diagnosis: editData.diagnosis ?? "",
    });
  }, [editData, reset]);

  return (
    <>
      <div className="app__modal_wrapper">
        <div className="app__modal_wrapper2">
          <div className="app__modal_wrapper3">
            <div className="app__modal_header">
              <h5 className="app__modal_header_text">Record Diagnosis</h5>
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
              <div className="app__form_field_container">
                <div className="w-full">
                  <div className="app__label_standard">Fitness Result</div>
                  <div>
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
                </div>
              </div>
              <div className="app__form_field_container">
                <div className="w-full">
                  <div className="app__label_standard">Diagnosis / Notes</div>
                  <div>
                    <textarea
                      {...register("diagnosis", { required: true })}
                      rows={6}
                      className="app__select_standard"
                    />
                    {errors.diagnosis && (
                      <div className="app__error_message">
                        Diagnosis is required
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="app__warning_text">
                <span className="app__warning_title">Note:</span> Once saved, the
                employee can no longer edit this record.
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

export default DiagnosisModal;
