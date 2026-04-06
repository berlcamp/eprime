import {
  CustomButton,
  LeaveBalanceBoxes,
  SearchUserInput,
} from "@/components/index";
import { useFilter } from "@/context/FilterContext";
import { useSupabase } from "@/context/SupabaseProvider";
import { generateReferenceCode } from "@/utils/text-helper";
import { useCallback, useEffect, useState } from "react";
import "react-calendar/dist/Calendar.css";
import { useFieldArray, useForm } from "react-hook-form";

// Types
import type {
  Employee,
  LeaveCreditTypes,
  LeaveTypes,
  SalaryGradeTypes,
} from "@/types";

// Redux imports
import { updateList } from "@/GlobalRedux/Features/listSlice";
import { updateResultCounter } from "@/GlobalRedux/Features/resultsCounterSlice";
import { leaveTypes } from "@/constants";
import { fetchSalaryGrades, logError } from "@/utils/fetchApi";
import { XMarkIcon } from "@heroicons/react/20/solid";
import { eachDayOfInterval, format } from "date-fns";
import { useDropzone, type FileWithPath } from "react-dropzone";
import { useDispatch, useSelector } from "react-redux";

interface ModalProps {
  hideModal: () => void;
}

const LeaveForm = ({ hideModal }: ModalProps) => {
  const { setToast } = useFilter();
  const { supabase, session, systemUsers } = useSupabase();
  const [salaryGrades, setSalaryGrades] = useState<SalaryGradeTypes[] | []>([]);
  const [monetizationAmount, setMonetizationAmount] = useState("");

  const [withPay, setWithPay] = useState(0);
  const [withoutPay, setWithoutPay] = useState(0);

  const [leaveCreditBalances, setLeaveCreditBalances] = useState<
    LeaveCreditTypes[] | []
  >([]);

  const [balances, setBalances] = useState<{
    type: string;
    balance: string;
    original_balance: number;
  }>();

  const [selectedImages, setSelectedImages] = useState<any>([]);
  const [saving, setSaving] = useState(false);

  const [approverError, setApproverError] = useState("");

  // selected approver
  const [user, setUser] = useState<Employee | null>(null);

  const currentUser: Employee = systemUsers.find(
    (user: Employee) => user.id === session?.user.id
  );

  // Redux staff
  const globallist = useSelector((state: any) => state.list.value);
  const resultsCounter = useSelector((state: any) => state.results.value);
  const dispatch = useDispatch();

  const onDrop = useCallback((acceptedFiles: FileWithPath[]) => {
    setSelectedImages(
      acceptedFiles.map((file) =>
        Object.assign(file, {
          filename: file.name,
        })
      )
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

  const {
    register,
    formState: { errors },
    reset,
    watch,
    setValue,
    getValues,
    control,
    handleSubmit,
  } = useForm<LeaveTypes>({
    mode: "onSubmit",
    defaultValues: {
      leave_dates: [
        {
          date: "",
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "leave_dates",
  });

  const watchedType = watch("type") || "";
  const watchedDateType = watch("date_type");
  const watchedWeeked = watch("weekend");
  const watchedOtherPurpose = watch("other_purpose") || "";
  const watchedDays = watch("days") || "";
  const watchedLeaveFrom = watch("leave_from");
  const watchedLeaveTo = watch("leave_to");
  const watchedLeaveDates = watch("leave_dates") || [];

  const onSubmit = async (formdata: LeaveTypes) => {
    if (!user) {
      setApproverError("This field is required");
    }
    await handleCreate(formdata);
  };

  const handleCreate = async (formdata: LeaveTypes) => {
    if (!user) return;

    setSaving(true);

    const refCode = generateReferenceCode();

    try {
      const creditsUsed = {
        leave_credit_use_vl:
          balances?.type === "Vacation Leave" ? balances?.balance : null,
        leave_credit_use_sl:
          balances?.type === "Sick Leave" ? balances?.balance : null,
        leave_credit_use_sc:
          balances?.type === "Service Credit" ? balances?.balance : null,
        leave_credit_use_adoption:
          balances?.type === "Adoption Leave" ? balances?.balance : null,
        leave_credit_use_vawc:
          balances?.type === "10-Day VAWC Leave" ? balances?.balance : null,
        leave_credit_use_emergency:
          balances?.type === "Special Emergency (Calamity) Leave"
            ? balances?.balance
            : null,
        leave_credit_use_study:
          balances?.type === "Study Leave" ? balances?.balance : null,
        leave_credit_use_soloparent:
          balances?.type === "Solo Parent Leave" ? balances?.balance : null,
        leave_credit_use_slbw:
          balances?.type === "Special Leave Benefits For Women"
            ? balances?.balance
            : null,
        leave_credit_use_spl:
          balances?.type === "Special Privilege Leave"
            ? balances?.balance
            : null,
        leave_credit_use_rehab:
          balances?.type === "Rehabilitation Leave" ? balances?.balance : null,
        leave_credit_use_paternity:
          balances?.type === "Paternity Leave" ? balances?.balance : null,
        leave_credit_use_maternity:
          balances?.type === "Maternity Leave" ? balances?.balance : null,
        leave_credit_use_wellness:
          balances?.type === "Wellness Break" ? balances?.balance : null,
        leave_days_with_pay: withPay,
        leave_days_without_pay: withoutPay,
        credits_used: [balances],
      };

      const newData = {
        ...creditsUsed,
        type: "Leave",
        reference_code: refCode,
        leave_type: formdata.type,
        leave_location: formdata.location,
        leave_specify_location: formdata.specify_location,
        leave_hospitalization: formdata.hospitalization,
        leave_illness: formdata.illness,
        leave_women_illness: formdata.women_illness,
        leave_study_purpose: formdata.study_purpose,
        leave_other_purpose: formdata.other_purpose,
        leave_others_specify: formdata.others_specify,
        leave_reason: formdata.reason,
        leave_days: formdata.days,
        leave_from: formdata.leave_from,
        leave_to: formdata.leave_to,
        leave_commutation: formdata.commutation,
        created_by: session?.user.id,
        current_approver_id: session?.user.id,
        receiver_id: user.id,
        current_status: "For Verification",
        current_tracker: "Forwarded",
      };

      const { data, error }: { data: any; error: any } = await supabase
        .from("hrm_request_trackers")
        .insert(newData)
        .select();

      if (error) {
        void logError(
          "Create Leave Request",
          "hrm_request_trackers",
          JSON.stringify(newData),
          error.message
        );
        setToast(
          "error",
          "Saving failed, please reload the page and try again."
        );
        throw new Error(error.message);
      }

      // Generate an array of all dates in the range zzz
      if (watchedOtherPurpose !== "Monetization of Leave Credits") {
        let dateRange = [];
        if (formdata.leave_from !== "" && formdata.leave_to !== "") {
          // dateRange = eachDayOfInterval({
          //   start: new Date(formdata.leave_from),
          //   end: new Date(formdata.leave_to)
          // })
          dateRange = eachDayOfInterval({
            start: new Date(formdata.leave_from),
            end: new Date(formdata.leave_to),
          }).filter(
            (date) =>
              watchedWeeked || (date.getDay() !== 0 && date.getDay() !== 6)
          ); // Exclude weekends if watchedWeeked is false
        } else {
          dateRange = formdata.leave_dates
            .filter((item) => item.date) // Ensure the date is valid (not blank)
            .map((item) => new Date(item.date))
            .sort((a, b) => a.getTime() - b.getTime());
        }

        // Map the dates to the required format
        const insertArray = dateRange.map((date, index) => ({
          tracker_id: data[0].id,
          date: format(date, "yyyy-MM-dd"),
          is_paid: index < Math.floor(withPay), // Mark as paid if within the withPay limit
        }));

        // Store each leave dates
        const { error: datesError } = await supabase
          .from("hrm_leave_dates")
          .insert(insertArray);

        if (datesError) {
          void logError(
            "Leave Days",
            "hrm_leave_dates",
            "",
            datesError.message
          );
          setToast(
            "error",
            "Saving failed, please reload the page and try again."
          );
          throw new Error(datesError.message);
        }
      }

      const { error: error2 } = await supabase.from("hrm_tracker_flow").insert([
        {
          tracker_id: data[0].id,
          user_id: currentUser.id,
          status: "For Verification",
        },
        {
          tracker_id: data[0].id,
          user_id: currentUser.id,
          receiver_id: user.id,
          status: "Forwarded",
        },
      ]);

      if (error2) {
        void logError(
          "Create Leave Request Tracker Flow",
          "hrm_tracker_flow",
          JSON.stringify({
            tracker_id: data[0].id,
            user_id: currentUser.id,
            status: "For Verification",
          }),
          error2.message
        );
        setToast(
          "error",
          "Saving failed, please reload the page and try again."
        );
        throw new Error(error2.message);
      }

      // Upload files
      await handleUploadFiles(data[0].id);

      // Notify receiver
      void handleNotifyReceiver(data[0].id, user.id, refCode);

      // Append new data in redux
      const updatedData = {
        id: data[0].id,
        creator: currentUser,
        approver: currentUser,
        receiver: user,
        created_at: data[0].created_at,
        document_tracker_stickies: [],
        ...newData,
      };
      dispatch(updateList([updatedData, ...globallist]));

      // Updating showing text in redux
      dispatch(
        updateResultCounter({
          showing: Number(resultsCounter.showing) + 1,
          results: Number(resultsCounter.results) + 1,
        })
      );

      // pop up the success message
      setToast("success", "Successfully saved.");
      setApproverError("");

      // reset all form fields
      reset();

      hideModal();
    } catch (error) {
      console.error("error", error);
    }

    setSaving(false);
  };

  useEffect(() => {
    if (watchedOtherPurpose !== "") {
      const salary = salaryGrades.find(
        (s) =>
          s.grade.toString() === currentUser.salary_grade.toString() &&
          s.step.toString() === currentUser.salary_step.toString()
      );
      if (salary) {
        const moneyValue =
          Number(salary.salary) * Number(watchedDays) * 0.0478087;
        //
        setMonetizationAmount(
          moneyValue.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })
        );
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedOtherPurpose, watchedDays, watchedType]);

  useEffect(() => {
    if (watchedLeaveFrom && watchedLeaveTo) {
      const startDate = new Date(watchedLeaveFrom);
      const endDate = new Date(watchedLeaveTo);

      if (
        !isNaN(startDate.getTime()) &&
        !isNaN(endDate.getTime()) &&
        endDate >= startDate
      ) {
        let totalDays = 0;
        let currentDate = new Date(startDate);

        while (currentDate <= endDate) {
          const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 6 = Saturday

          if (watchedWeeked || (dayOfWeek !== 0 && dayOfWeek !== 6)) {
            totalDays++;
          }

          currentDate = new Date(currentDate.getTime() + 86400000); // Add 1 day (1000 * 60 * 60 * 24)
        }

        setValue("days", totalDays.toString());
      } else {
        setValue("days", ""); // Reset totalDays if leave_to is before leave_from
      }
    }
  }, [watchedLeaveFrom, watchedLeaveTo, watchedWeeked]);

  useEffect(() => {
    // reset date values
    setValue("leave_from", "");
    setValue("leave_to", "");
    setValue("leave_dates", [
      {
        date: "",
      },
    ]);

    if (
      [
        "Maternity Leave",
        "Adoption Leave",
        "Special Leave Benefits For Women",
        "Rehabilitation Leave",
        "Study Leave",
      ].includes(watchedType)
    ) {
      setValue("date_type", "Date Range");
      setValue("weekend", true);
    } else {
      setValue("weekend", false);
    }
  }, [watchedType]);

  useEffect(() => {
    setValue("days", watchedLeaveDates.length.toString());
  }, [watchedLeaveDates]);

  const handleNotifyReceiver = async (
    trackerId: string,
    receiverId: string,
    refCode: string
  ) => {
    //
    try {
      // insert to notifications
      const { error: error3 } = await supabase
        .from("hrm_notifications")
        .insert({
          message: `New Leave Request #${refCode} has been forwarded to you for recommendation/approval.`,
          url: `/tracker/${refCode}`,
          type: "Forwarded",
          user_id: receiverId,
          request_tracker_id: trackerId,
          reference_table: "hrm_request_trackers",
        });

      if (error3) {
        throw new Error(error3.message);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUploadFiles = async (id: string) => {
    // Upload attachments
    await Promise.all(
      selectedImages.map(async (file: File) => {
        const { error } = await supabase.storage
          .from("hrm_documents")
          .upload(`requests/${id}/${file.name}`, file);
        if (error) console.log(error);
      })
    );
  };

  const deleteFile = (file: FileWithPath) => {
    const files = selectedImages.filter(
      (f: FileWithPath) => f.path !== file.path
    );
    setSelectedImages(files);
  };

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

  const handleSelectedUsers = (selectedUsers: Employee[]) => {
    if (selectedUsers.length > 0) {
      setUser(selectedUsers[0]);
    } else {
      setUser(null);
    }
  };

  const handleAddDate = () => {
    append({ date: "" }); // Add a blank date
  };

  useEffect(() => {
    if (fileRejections.length > 0) {
      setSelectedImages([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileRejections]);

  useEffect(() => {
    if (
      [
        "15 days Maternity Leave Extension for Solo Parent (with pay)",
        "7 days Additional Paternity Leave (from wife-maternity leave)",
      ].includes(watchedType)
    ) {
      setWithPay(Number(watchedDays));
      setWithoutPay(0);
      return;
    }

    if (
      ["30 days Maternity Leave Extension (without pay)"].includes(watchedType)
    ) {
      setWithPay(0);
      setWithoutPay(Number(watchedDays));
      return;
    }

    let type = watchedType;
    if (
      currentUser.position_type === "Teaching" &&
      ["Sick Leave"].includes(watchedType)
    ) {
      type = "Service Credit";
    }

    if (
      watchedType === "Mandatory/Forced Leave" &&
      currentUser.position_type !== "Teaching"
    ) {
      type = "Vacation Leave";
    }

    const origBal =
      leaveCreditBalances.find((c) => c.type === type)?.credits ?? 0;
    const balance = origBal >= Number(watchedDays) ? watchedDays : Math.max(0, origBal);

    setBalances({
      type,
      balance: balance.toString(),
      original_balance: origBal,
    });

    const withpayAmount =
      origBal >= Number(watchedDays)
        ? Number(watchedDays)
        : Math.max(0, origBal);
    const withoutpayAmount = Number(watchedDays) - withpayAmount;

    setWithPay(withpayAmount);
    setWithoutPay(withoutpayAmount);
  }, [watchedType, watchedDays]);

  useEffect(() => {
    const fetchSalaryGradesData = async () => {
      const result = await fetchSalaryGrades(999, 0);
      setSalaryGrades(result.data.length > 0 ? result.data : []);
    };
    const fetchBalances = async () => {
      const { data } = await supabase
        .from("hrm_leave_credits")
        .select()
        .eq("user_id", session?.user.id);
      setLeaveCreditBalances(data ?? []);
    };

    void fetchBalances();
    void fetchSalaryGradesData();
  }, []);

  // Disable fields if condition is met
  const isDisabled = [
    "Maternity Leave",
    "Adoption Leave",
    "Special Leave Benefits For Women",
    "Rehabilitation Leave",
    "Study Leave",
  ].includes(watchedType);

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="">
        <div className="flex flex-col lg:flex-row w-full items-start justify-between text-xs dark:text-gray-400">
          {/* Begin First Column */}
          <div className="w-full px-4">
            <div className="app__form_field_container">
              <div className="w-full">
                <div className="app__label_standard">Leave Type</div>
                <div>
                  <select
                    {...register("type", { required: true })}
                    className="app__select_standard"
                  >
                    <option value="">Choose</option>
                    {leaveTypes.map((item, index) => (
                      <option key={index} value={item}>
                        {item === "Vacation Leave"
                          ? "Vacation/Personal Leave"
                          : item === "Mandatory/Force Leave" ||
                            item === "Mandatory/Forced Leave"
                          ? "Mandatory/Forced Leave"
                          : item}
                      </option>
                    ))}
                  </select>
                  {errors.type && (
                    <div className="app__error_message">Type is required</div>
                  )}
                </div>
              </div>
            </div>
            {(watchedType === "Solo Parent Leave" ||
              watchedType === "Special Privilege Leave") && (
              <>
                <div className="app__form_field_container">
                  <div className="w-full">
                    <div className="app__label_standard">Reason</div>
                    <div>
                      <input
                        {...register("reason", { required: true })}
                        className="app__select_standard"
                      />
                      {errors.reason && (
                        <div className="app__error_message">
                          Reason is required
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
            {(watchedType === "Vacation Leave" ||
              watchedType === "Special Privilege Leave") && (
              <>
                <div className="app__form_field_container">
                  <div className="w-full">
                    <div className="app__label_standard">
                      In case of Vacation/Special Privilege Leave:
                    </div>
                    <div>
                      <select
                        {...register("location", { required: true })}
                        className="app__select_standard"
                      >
                        <option value="">Choose</option>
                        <option value="Within the Philippines">
                          Within the Philippines
                        </option>
                        <option value="Abroad">Abroad</option>
                      </select>
                      {errors.location && (
                        <div className="app__error_message">
                          Location is required
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="app__form_field_container">
                  <div className="w-full">
                    <div className="app__label_standard">Specify location</div>
                    <div>
                      <input
                        {...register("specify_location", { required: true })}
                        type="text"
                        className="app__select_standard"
                      />
                      {errors.specify_location && (
                        <div className="app__error_message">
                          Location is required
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}

            {watchedType === "Sick Leave" && (
              <>
                <div className="app__form_field_container">
                  <div className="w-full">
                    <div className="app__label_standard">
                      In case of Sick Leave
                    </div>
                    <div>
                      <select
                        {...register("hospitalization", { required: true })}
                        className="app__select_standard"
                      >
                        <option value="">Choose</option>
                        <option value="In Hospital">In Hospital</option>
                        <option value="Out Patient">Out Patient</option>
                      </select>
                      {errors.hospitalization && (
                        <div className="app__error_message">
                          This is required
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="app__form_field_container">
                  <div className="w-full">
                    <div className="app__label_standard">Specify illness</div>
                    <div>
                      <input
                        {...register("illness", { required: true })}
                        type="text"
                        className="app__select_standard"
                      />
                      {errors.illness && (
                        <div className="app__error_message">
                          Please specify illness
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
            {watchedType === "Special Leave Benefits for Women" && (
              <>
                <div className="app__form_field_container">
                  <div className="w-full">
                    <div className="app__label_standard">
                      In case of Special Leave Benefits for Women, specify
                      illness
                    </div>
                    <div>
                      <input
                        {...register("women_illness", { required: true })}
                        type="text"
                        className="app__select_standard"
                      />
                      {errors.women_illness && (
                        <div className="app__error_message">
                          Please specify illness
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
            {watchedType === "Study Leave" && (
              <div className="app__form_field_container">
                <div className="w-full">
                  <div className="app__label_standard">
                    In case of Study Leave
                  </div>
                  <div>
                    <select
                      {...register("study_purpose", { required: true })}
                      className="app__select_standard"
                    >
                      <option value="">Choose</option>
                      <option value="Completion of Masters Degree">
                        Completion of Masters Degree
                      </option>
                      <option value="BAR/Board Examination Review">
                        BAR/Board Examination Review
                      </option>
                    </select>
                    {errors.study_purpose && (
                      <div className="app__error_message">
                        Purpose is required
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            {watchedType === "Terminal/Monetization Leave" && (
              <>
                <div className="app__form_field_container">
                  <div className="w-full">
                    <div className="app__label_standard">Other Purpose</div>
                    <div>
                      <select
                        {...register("other_purpose", { required: true })}
                        className="app__select_standard"
                      >
                        <option value="">Choose</option>
                        <option value="Monetization of Leave Credits">
                          Monetization of Leave Credits
                        </option>
                        <option value="Terminal Leave">Terminal Leave</option>
                      </select>
                      {errors.other_purpose && (
                        <div className="app__error_message">
                          Purpose is required
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                {watchedType === "Terminal/Monetization Leave" &&
                  watchedOtherPurpose === "Monetization of Leave Credits" && (
                    <div className="app__form_field_container">
                      <LeaveBalanceBoxes user={currentUser} />
                    </div>
                  )}
              </>
            )}

            {watchedType === "Others" && (
              <>
                <div className="app__form_field_container">
                  <div className="w-full">
                    <div className="app__label_standard">Please Specify</div>
                    <div>
                      <input
                        {...register("others_specify", {
                          required: true,
                        })}
                        type="text"
                        className="app__select_standard"
                      />
                      {errors.others_specify && (
                        <div className="app__error_message">Please specify</div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}

            {watchedType === "Terminal/Monetization Leave" &&
              watchedOtherPurpose === "Monetization of Leave Credits" && (
                <div className="">
                  <div className="app__label_standard mb-0!">
                    Money Value:{" "}
                    <span className="font-bold text-green-700">
                      P {monetizationAmount}
                    </span>
                  </div>
                  <div>
                    <span className="italic text-xs">
                      (Actual amount may vary, please refer to HR for actual
                      Amount)
                    </span>
                  </div>
                </div>
              )}
          </div>
          {/* End First Column */}
          {/* Begin Second Column */}
          <div className="w-full px-4">
            {watchedOtherPurpose !== "Monetization of Leave Credits" && (
              <div className="app__form_field_container">
                <div className="w-full">
                  <div className="app__label_standard">Inclusive Date/s</div>
                  <div className="w-full">
                    <div className="mt-3 flex items-start justify-start space-x-2 text-sm">
                      <label className="space-x-2">
                        <input
                          type="radio"
                          value="Custom Dates"
                          disabled={isDisabled}
                          {...register("date_type")}
                        />
                        <span>Custom Dates</span>
                      </label>

                      <label className="space-x-2">
                        <input
                          type="radio"
                          value="Date Range"
                          disabled={isDisabled}
                          {...register("date_type")}
                        />
                        <span>Date Range</span>
                      </label>
                    </div>
                  </div>
                  <div className="mt-2">
                    {watchedDateType === "Custom Dates" && (
                      <>
                        {fields.map((_q, index) => (
                          <div
                            key={index}
                            className="app__form_field_container"
                          >
                            <div>
                              <div className="flex items-center justify-start space-x-2">
                                <input
                                  type="date"
                                  className="app__input_standard"
                                  {...register(`leave_dates.${index}.date`, {
                                    required: true,
                                  })}
                                />
                                {fields.length > 1 && (
                                  <button
                                    type="button"
                                    className="app__btn_red_xs"
                                    onClick={() => remove(index)}
                                  >
                                    Remove
                                  </button>
                                )}
                              </div>
                              {errors.leave_dates?.[index]?.date && (
                                <div className="app__error_message">
                                  Date is required
                                </div>
                              )}
                            </div>
                          </div>
                        ))}

                        <button
                          type="button"
                          className="app__btn_blue_xs"
                          onClick={handleAddDate}
                        >
                          Add Date
                        </button>
                      </>
                    )}
                    {watchedDateType === "Date Range" && (
                      <div className="w-full">
                        <div className="flex space-x-2">
                          <input
                            {...register("leave_from", { required: true })}
                            type="date"
                            className="app__input_standard"
                          />
                          <input
                            {...register("leave_to", { required: true })}
                            type="date"
                            className="app__input_standard"
                          />
                        </div>
                        <div className="app__label_standard">
                          <label className="flex items-center space-x-1">
                            <input
                              {...register("weekend")}
                              disabled={isDisabled}
                              type="checkbox"
                              className=""
                            />
                            <span>Include weekend</span>
                          </label>

                          {errors.leave_from && (
                            <div className="app__error_message">
                              Date (From) is required
                            </div>
                          )}
                          {errors.leave_to && (
                            <div className="app__error_message">
                              Date (To) is required
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            <div className="app__form_field_container">
              <div className="w-full">
                <div className="app__label_standard">
                  Total Days:{" "}
                  <span className="font-bold text-black">
                    {getValues("days")}
                  </span>
                </div>
                <div>
                  {watchedOtherPurpose !== "Monetization of Leave Credits" ? (
                    <input
                      {...register("days", { required: true })}
                      type="hidden"
                      className="app__select_standard"
                    />
                  ) : (
                    <input
                      {...register("days", { required: true })}
                      type="text"
                      className="app__select_standard"
                    />
                  )}
                  {errors.days && (
                    <div className="app__error_message">
                      Please choose dates to get Total Days
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="app__form_field_container">
              <div className="w-full">
                <div className="app__label_standard">Commutation</div>
                <div>
                  <select
                    {...register("commutation")}
                    className="app__select_standard"
                  >
                    <option value="Not Requested">Not Requested</option>
                    <option value="Requested">Requested</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="app__form_field_container">
              <div className="w-full">
                <div className="app__label_standard">Attachment</div>
                <div
                  {...getRootProps()}
                  className="cursor-pointer border-2 border-dashed border-gray-300 bg-gray-100 text-gray-600 px-4 py-10"
                >
                  <input {...getInputProps()} />
                  <p className="text-xs">
                    Drag and drop some files here, or click to select files
                  </p>
                </div>
                {fileRejections.length === 0 && selectedImages.length > 0 && (
                  <div className="py-4">
                    <div className="text-xs font-medium mb-2">
                      Files to upload:
                    </div>
                    {selectedFiles}
                  </div>
                )}
                {fileRejections.length > 0 && (
                  <div className="py-4">
                    <p className="text-red-500 text-xs">
                      File rejected. Please make sure its an image, PDF, DOC, or
                      Excel file and less than 5MB.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* End Second Column */}
        </div>
        <hr className="my-6" />
        <div className="w-full lg:w-1/2 px-4">
          <div className="app__form_field_container">
            <div className="w-full">
              <div className="app__label_standard">
                Submit for Recommendation/Approval To
              </div>
              <SearchUserInput
                isMultiple={false}
                excludedIds={session ? [session.user.id] : []}
                handleSelectedUsers={handleSelectedUsers}
              />
              {approverError !== "" && (
                <div className="app__error_message">{approverError}</div>
              )}
            </div>
          </div>
        </div>
        <hr className="my-6 mx-4" />
        <div className="w-full px-4">
          <div className="app__label_standard">
            <label className="flex items-center space-x-1">
              <input
                {...register("confirmed", { required: true })}
                type="checkbox"
                className=""
              />
              <span className="font-normal text-xs">
                By checking this box, you acknowledge that all information is
                accurate and cannot be modified after submission.
              </span>
            </label>
            {errors.confirmed && (
              <div className="app__error_message">Confirmation is required</div>
            )}
          </div>
        </div>
        <div className="app__modal_footer px-4">
          <CustomButton
            btnType="submit"
            isDisabled={saving}
            title={saving ? "Saving..." : "Submit"}
            containerStyles="app__btn_green"
          />
        </div>
      </form>
    </>
  );
};

export default LeaveForm;
