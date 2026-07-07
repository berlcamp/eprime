import { CustomButton } from "@/components/index";
import { useFilter } from "@/context/FilterContext";
import { useSupabase } from "@/context/SupabaseProvider";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

// Types
import type { ApeTypes } from "@/types";

// Redux imports
import { updateList } from "@/GlobalRedux/Features/listSlice";
import { updateResultCounter } from "@/GlobalRedux/Features/resultsCounterSlice";
import { logError } from "@/utils/fetchApi";
import { useDispatch, useSelector } from "react-redux";

interface ModalProps {
  hideModal: () => void;
  editData: ApeTypes | null;
  userId: string;
}

const AddEditModal = ({ hideModal, editData, userId }: ModalProps) => {
  const { setToast } = useFilter();
  const { supabase } = useSupabase();
  const [saving, setSaving] = useState(false);

  // Redux staff
  const globallist = useSelector((state: any) => state.list.value);
  const resultsCounter = useSelector((state: any) => state.results.value);
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

    if (editData) {
      void handleUpdate(formdata);
    } else {
      void handleCreate(formdata);
    }
  };

  const handleCreate = async (formdata: ApeTypes) => {
    const newData = {
      exam_date: formdata.exam_date,
      remarks: formdata.remarks ?? "",
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

      // Append new data in redux
      const updatedData = {
        ...newData,
        id: newId,
      };
      dispatch(updateList([updatedData, ...globallist]));

      // Updating showing text in redux
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
      setSaving(false);
    }
  };

  const handleUpdate = async (formdata: ApeTypes) => {
    if (!editData) return;

    const newData = {
      exam_date: formdata.exam_date,
      remarks: formdata.remarks ?? "",
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
      setSaving(false);
    }
  };

  // manually set the defaultValues of use-form-hook whenever the component receives new props.
  useEffect(() => {
    reset({
      exam_date: editData ? editData.exam_date : "",
      remarks: editData ? editData.remarks : "",
    });
  }, [editData, reset]);

  return (
    <>
      <div className="app__modal_wrapper">
        <div className="app__modal_wrapper2">
          <div className="app__modal_wrapper3">
            <div className="app__modal_header">
              <h5 className="app__modal_header_text">
                Annual Physical Exam Details
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
              <div className="app__form_field_container">
                <div className="w-full">
                  <div className="app__label_standard">Date of Exam</div>
                  <div>
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
              </div>
              <div className="app__form_field_container">
                <div className="w-full">
                  <div className="app__label_standard">Remarks (optional)</div>
                  <div>
                    <textarea
                      {...register("remarks")}
                      rows={4}
                      className="app__select_standard"
                    />
                  </div>
                </div>
              </div>
              <div className="app__warning_text">
                <span className="app__warning_title">Note:</span> After saving,
                click <span className="font-bold">Attachments</span> on the
                record to upload your physical exam result file/s.
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
