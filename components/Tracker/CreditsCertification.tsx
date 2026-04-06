import {
  CustomButton,
  LeaveBalanceBoxes,
  TwoColTableLoading,
} from "@/components/index";
import { useFilter } from "@/context/FilterContext";
import { useSupabase } from "@/context/SupabaseProvider";
import type { CtoUserTypes, DocumentTypes, LeaveCreditTypes } from "@/types";
import { logError } from "@/utils/fetchApi";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";

interface PropTypes {
  requestData: DocumentTypes;
  onCertified?: (updatedData: DocumentTypes) => void;
}

interface boxes {
  type: string;
  balance: number;
}

interface CtosTypes {
  id: string;
  cto_user_id: string;
  coc: number;
  use_coc: string;
  expiration: string;
}

interface FormTypes {
  vl: string;
  sl: string;
  sc: string;
  adoption: string;
  vawc: string;
  emergency: string;
  study: string;
  soloparent: string;
  slbw: string;
  spl: string;
  rehab: string;
  paternity: string;
  maternity: string;
  wellness: string;
  cocs: CtosTypes[];
}

export default function CreditsCertification({
  requestData,
  onCertified,
}: PropTypes) {
  const { supabase, session } = useSupabase();
  const { setToast, hasAccess } = useFilter();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [documentData, setDocumentData] = useState<DocumentTypes>(requestData);
  const [refresh, setRefresh] = useState(false);

  const [creditsUsed, setCreditsUsed] = useState<boxes[] | []>([]);
  const [leaveCreditBalances, setLeaveCreditBalances] = useState<
    LeaveCreditTypes[] | []
  >([]);

  const [withPay, setWithPay] = useState(0);

  const [withoutPay, setWithoutPay] = useState(Number(documentData.leave_days));

  const {
    register,
    formState: { errors },
    reset,
    control,
    setValue,
    watch,
    handleSubmit,
  } = useForm<FormTypes>({
    mode: "onSubmit",
  });

  const { fields } = useFieldArray({
    control,
    name: "cocs",
  });

  const [
    vl,
    sl,
    sc,
    adoption,
    vawc,
    emergency,
    study,
    soloparent,
    slbw,
    spl,
    rehab,
    paternity,
    maternity,
    wellness,
    cocs,
  ] = watch([
    "vl",
    "sl",
    "sc",
    "adoption",
    "vawc",
    "emergency",
    "study",
    "soloparent",
    "slbw",
    "spl",
    "rehab",
    "paternity",
    "maternity",
    "wellness",
    "cocs",
  ]);

  // Watch the `use_coc` values
  const watchedCocs = useWatch({
    control,
    name: "cocs", // Watches the `cocs` field array
  });

  const onSubmit = async (formdata: FormTypes) => {
    if (saving) return;

    setSaving(true);
    void saveCertifications(formdata);
  };

  // update certifications of leave credits
  const saveCertifications = async (formdata: FormTypes) => {
    const newData = {
      leave_credit_use_vl:
        formdata.vl && Number(formdata.vl) > 0 ? formdata.vl : null,
      leave_credit_use_sl:
        formdata.sl && Number(formdata.sl) > 0 ? formdata.sl : null,
      leave_credit_use_sc:
        formdata.sc && Number(formdata.sc) > 0 ? formdata.sc : null,

      leave_credit_use_adoption:
        formdata.adoption && Number(formdata.adoption) > 0
          ? formdata.adoption
          : null,
      leave_credit_use_vawc:
        formdata.vawc && Number(formdata.vawc) > 0 ? formdata.vawc : null,
      leave_credit_use_emergency:
        formdata.emergency && Number(formdata.emergency) > 0
          ? formdata.emergency
          : null,
      leave_credit_use_study:
        formdata.study && Number(formdata.study) > 0 ? formdata.study : null,
      leave_credit_use_soloparent:
        formdata.soloparent && Number(formdata.soloparent) > 0
          ? formdata.soloparent
          : null,
      leave_credit_use_slbw:
        formdata.slbw && Number(formdata.slbw) > 0 ? formdata.slbw : null,
      leave_credit_use_spl:
        formdata.spl && Number(formdata.spl) > 0 ? formdata.spl : null,
      leave_credit_use_rehab:
        formdata.rehab && Number(formdata.rehab) > 0 ? formdata.rehab : null,
      leave_credit_use_paternity:
        formdata.paternity && Number(formdata.paternity) > 0
          ? formdata.paternity
          : null,
      leave_credit_use_maternity:
        formdata.maternity && Number(formdata.maternity) > 0
          ? formdata.maternity
          : null,
      leave_credit_use_wellness:
        formdata.wellness && Number(formdata.wellness) > 0
          ? formdata.wellness
          : null,
      leave_days_with_pay: withPay,
      leave_days_without_pay: withoutPay,
      certification_as_of: format(new Date(), "MMMM d, yyyy"),
      certified_by: session?.user.id,
      credits_used: creditsUsed,
    };

    try {
      const { error } = await supabase
        .from("hrm_request_trackers")
        .update(newData)
        .eq("id", documentData.id);

      if (error) {
        void logError(
          "Update leave credit used on leave",
          "hrm_request_trackers",
          JSON.stringify(newData),
          error.message,
        );
        setToast(
          "error",
          "Saving failed, please reload the page and try again.",
        );
        throw new Error(error.message);
      }

      // Prepare data for table update Leave CTO
      const updatedCtoData = formdata.cocs
        .filter(
          (field: { use_coc: string }) =>
            field.use_coc && parseFloat(field.use_coc) > 0,
        )
        .map((field: { id: string; use_coc: string }) => ({
          tracker_id: documentData.id,
          user_cto_id: field.id,
          use_coc: field.use_coc,
        }));

      await supabase
        .from("hrm_leave_coc")
        .delete()
        .eq("tracker_id", documentData.id);

      const { error: insertCtoError } = await supabase
        .from("hrm_leave_coc")
        .insert(updatedCtoData);

      if (insertCtoError) {
        void logError(
          "Update cto coc credit used on leave",
          "hrm_request_trackers",
          JSON.stringify(updatedCtoData),
          insertCtoError.message,
        );
        setToast(
          "error",
          "Saving failed, please reload the page and try again.",
        );
        throw new Error(insertCtoError.message);
      }

      // Added log to latest tracker flow
      const { data } = await supabase
        .from("hrm_tracker_flow")
        .select()
        .eq("tracker_id", documentData.id)
        .order("id", { ascending: false })
        .limit(1)
        .single();

      if (data) {
        const newData = {
          message: "Leave Credits Certified",
          tracker_flow_id: data.id,
          user_id: session?.user.id,
        };

        const { error: error2 } = await supabase
          .from("hrm_tracker_logs")
          .insert(newData)
          .eq("id", documentData.id);

        if (error2) {
          void logError(
            "Leave Credits Certified Flow Logs",
            "hrm_tracker_flow",
            "",
            error2.message,
          );
        }
      }

      // delete existing leave dates first
      const { error: deleteDatesError } = await supabase
        .from("hrm_leave_dates")
        .delete()
        .eq("tracker_id", documentData.id);

      if (deleteDatesError) {
        void logError(
          "delete Leave Days",
          "hrm_leave_dates",
          "",
          deleteDatesError.message,
        );
        setToast(
          "error",
          "Saving failed, please reload the page and try again.",
        );
        throw new Error(deleteDatesError.message);
      }

      console.log("documentData.leave_dates", documentData.leave_dates);
      // Map the dates to the required format
      const insertArray = documentData.leave_dates.map((d, index) => ({
        tracker_id: documentData.id,
        date: d.date,
        is_paid: index < Math.floor(withPay), // Mark as paid if within the withPay limit
      }));

      // Store each leave dates
      const { error: datesError } = await supabase
        .from("hrm_leave_dates")
        .insert(insertArray);

      if (datesError) {
        void logError("Leave Days", "hrm_leave_dates", "", datesError.message);
        setToast(
          "error",
          "Saving failed, please reload the page and try again.",
        );
        throw new Error(datesError.message);
      }

      // pop up the success message
      setToast("success", "Successfully saved.");

      // Notify parent with certified data so approval uses correct values
      onCertified?.({
        ...documentData,
        ...newData,
        leave_days_with_pay: String(withPay),
        leave_days_without_pay: String(withoutPay),
      } as DocumentTypes);

      setRefresh(!refresh);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  // Helper function to get original balance
  // Prioritizes saved credits_used data (for previous employees/already certified records)
  // Falls back to current leaveCreditBalances lookup
  const getOriginalBalance = (
    creditType: string,
    leaveTypeInBalances: string,
  ): number => {
    // First, check if documentData.credits_used exists and has this credit type
    // This handles cases where the record was already certified (especially for previous employees)
    if (
      documentData.credits_used &&
      Array.isArray(documentData.credits_used) &&
      documentData.credits_used.length > 0
    ) {
      const savedCredit = documentData.credits_used.find(
        (c) => c.type === creditType,
      );
      // If we found a saved credit, use its original_balance (even if it's 0)
      // This preserves the historical balance at certification time
      if (savedCredit !== undefined) {
        return savedCredit.original_balance;
      }
    }
    // Fall back to current leaveCreditBalances lookup (for new certifications)
    return (
      leaveCreditBalances.find((c) => c.type === leaveTypeInBalances)
        ?.credits ?? 0
    );
  };

  useEffect(() => {
    if (
      [
        "15 days Maternity Leave Extension for Solo Parent (with pay)",
        "7 days Additional Paternity Leave (from wife-maternity leave)",
      ].includes(requestData.leave_type)
    ) {
      setWithPay(Number(requestData.leave_days));
      setWithoutPay(0);
      return;
    }

    const balances: Array<{
      type: string;
      balance: number;
      original_balance: number;
    }> = [];
    if (Number(sl) > 0) {
      balances.push({
        type: "SL",
        balance: Number(sl),
        original_balance: getOriginalBalance("SL", "Sick Leave"),
      });
    }
    if (Number(vl) > 0) {
      balances.push({
        type: "VL",
        balance: Number(vl),
        original_balance: getOriginalBalance("VL", "Vacation Leave"),
      });
    }
    if (Number(sc) > 0) {
      balances.push({
        type: "Service Credit",
        balance: Number(sc),
        original_balance: getOriginalBalance(
          "Service Credit",
          "Service Credit",
        ),
      });
    }
    if (Number(adoption) > 0) {
      balances.push({
        type: "adoption",
        balance: Number(adoption),
        original_balance: getOriginalBalance("adoption", "Adoption Leave"),
      });
    }
    if (Number(vawc) > 0) {
      balances.push({
        type: "vawc",
        balance: Number(vawc),
        original_balance: getOriginalBalance("vawc", "10-Day VAWC Leave"),
      });
    }
    if (Number(emergency) > 0) {
      balances.push({
        type: "emergency",
        balance: Number(emergency),
        original_balance: getOriginalBalance(
          "emergency",
          "Special Emergency (Calamity) Leave",
        ),
      });
    }
    if (Number(study) > 0) {
      balances.push({
        type: "study",
        balance: Number(study),
        original_balance: getOriginalBalance("study", "Study Leave"),
      });
    }
    if (Number(soloparent) > 0) {
      balances.push({
        type: "soloparent",
        balance: Number(soloparent),
        original_balance: getOriginalBalance("soloparent", "Solo Parent Leave"),
      });
    }
    if (Number(slbw) > 0) {
      balances.push({
        type: "slbw",
        balance: Number(slbw),
        original_balance: getOriginalBalance(
          "slbw",
          "Special Leave Benefits For Women",
        ),
      });
    }
    if (Number(spl) > 0) {
      balances.push({
        type: "spl",
        balance: Number(spl),
        original_balance: getOriginalBalance("spl", "Special Privilege Leave"),
      });
    }
    if (Number(rehab) > 0) {
      balances.push({
        type: "rehab",
        balance: Number(rehab),
        original_balance: getOriginalBalance("rehab", "Rehabilitation Leave"),
      });
    }
    if (Number(paternity) > 0) {
      balances.push({
        type: "paternity",
        balance: Number(paternity),
        original_balance: getOriginalBalance("paternity", "Paternity Leave"),
      });
    }
    if (Number(maternity) > 0) {
      balances.push({
        type: "maternity",
        balance: Number(maternity),
        original_balance: getOriginalBalance("maternity", "Maternity Leave"),
      });
    }
    if (Number(wellness) > 0) {
      balances.push({
        type: "wellness",
        balance: Number(wellness),
        original_balance: getOriginalBalance("wellness", "Wellness Break"),
      });
    }

    setCreditsUsed(balances);

    let withpay = 0;
    balances.forEach((b) => {
      withpay += Number(b.balance);
    });

    const total = cocs
      ? cocs.reduce((acc, curr) => acc + (parseFloat(curr.use_coc) || 0), 0)
      : 0;

    withpay += total;

    const withoutpay = Number(documentData.leave_days) - withpay;

    setWithPay(withpay);
    setWithoutPay(withoutpay >= 0 ? withoutpay : 0);
  }, [
    vl,
    sl,
    sc,
    adoption,
    vawc,
    emergency,
    study,
    soloparent,
    slbw,
    spl,
    rehab,
    paternity,
    maternity,
    wellness,
    watchedCocs,
    cocs,
    documentData,
    leaveCreditBalances,
  ]);

  // manually set the defaultValues of use-form-hook whenever the component receives new props.
  useEffect(() => {
    reset({
      vl: documentData.leave_credit_use_vl
        ? documentData.leave_credit_use_vl
        : "",
      sl: documentData.leave_credit_use_sl
        ? documentData.leave_credit_use_sl
        : "",
      sc: documentData.leave_credit_use_sc
        ? documentData.leave_credit_use_sc
        : "",
      adoption: documentData.leave_credit_use_adoption
        ? documentData.leave_credit_use_adoption
        : "",
      vawc: documentData.leave_credit_use_vawc
        ? documentData.leave_credit_use_vawc
        : "",
      emergency: documentData.leave_credit_use_emergency
        ? documentData.leave_credit_use_emergency
        : "",
      study: documentData.leave_credit_use_study
        ? documentData.leave_credit_use_study
        : "",
      soloparent: documentData.leave_credit_use_soloparent
        ? documentData.leave_credit_use_soloparent
        : "",
      slbw: documentData.leave_credit_use_slbw
        ? documentData.leave_credit_use_slbw
        : "",
      spl: documentData.leave_credit_use_spl
        ? documentData.leave_credit_use_spl
        : "",
      rehab: documentData.leave_credit_use_rehab
        ? documentData.leave_credit_use_rehab
        : "",
      paternity: documentData.leave_credit_use_paternity
        ? documentData.leave_credit_use_paternity
        : "",
      maternity: documentData.leave_credit_use_maternity
        ? documentData.leave_credit_use_maternity
        : "",
      wellness: documentData.leave_credit_use_wellness
        ? documentData.leave_credit_use_wellness
        : "",
    });
  }, [documentData]);

  useEffect(() => {
    const fetchBalances = async () => {
      const { data } = await supabase
        .from("hrm_leave_credits")
        .select()
        .eq("user_id", documentData.creator?.id);
      setLeaveCreditBalances(data ?? []);
    };
    void fetchBalances();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("hrm_request_trackers")
          .select(
            "*,leave_cocs:hrm_leave_coc(*), leave_dates:hrm_leave_dates(*), hrm_request_tracker_stickies(*), hrm_tracker_followers(*),creator:created_by(id,firstname,lastname,middlename,gender,step_increment_leave_days,avatar_url,signature_path,hrm_offices:office_id(*),hrm_positions:position_id(name),position_type,hrm_item:item_id(actual_annual_salary,hrm_position:position_id(name))),receiver:receiver_id(id,firstname,lastname,middlename,avatar_url),approver:current_approver_id(id,firstname,lastname,middlename,avatar_url,signature_path),recommender:recommended_by(id,firstname,lastname,middlename,avatar_url,signature_path),certifier:certified_by(id,firstname,lastname,middlename,avatar_url,signature_path),finalapprover:approved_by(id,firstname,lastname,middlename,avatar_url,signature_path),hrm_remarks(*)",
            { count: "exact" },
          )
          .eq("id", requestData.id)
          .single();

        if (error) {
          throw new Error(error.message);
        }

        const d: DocumentTypes = data;
        setDocumentData(data);
      } catch (error) {
        console.error("fetch error xx", error);
      } finally {
        setLoading(false);
      }
    };
    void fetchData();
  }, [refresh]);

  useEffect(() => {
    void (async () => {
      const { data } = await supabase
        .from("hrm_cto_users")
        .select("*")
        .eq("hrm_user_id", documentData.creator?.id)
        .eq("is_approved", true)
        .gte("expiration", new Date().toISOString())
        .gt("coc", 0);
      const bal: CtosTypes[] = [];

      if (data) {
        const ctos: CtoUserTypes[] = data;
        ctos.forEach((cto) => {
          bal.push({
            id: cto.id,
            cto_user_id: cto.id,
            coc: cto.coc,
            expiration: cto.expiration,
            use_coc: "",
          });
        });
      }
      // Populate dynamic fields in the form
      const cocsValues = bal.map((item) => ({
        id: item.id,
        cto_user_id: item.id,
        coc: item.coc,
        use_coc:
          documentData.leave_cocs?.find(
            (lcoc) =>
              lcoc.user_cto_id.toString() === item.cto_user_id.toString(),
          )?.use_coc ?? "",
        expiration: item.expiration,
      }));

      setValue("cocs", cocsValues);
    })();
  }, [documentData]);

  return (
    <div className="w-full px-4">
      <div className="flex items-center">
        <div className="flex-grow bg-gray-300 h-px"></div>
        <div className="mx-4 my-4 text-gray-500 text-sm">
          Certification of leave credits
        </div>
        <div className="flex-grow bg-gray-300 h-px"></div>
      </div>
      {loading && <TwoColTableLoading />}
      {!loading && (
        <div className="app__form_field_container">
          <div className="w-full">
            {
              // Only display if leave request is not yet approved, disapproved or cancelled
              documentData.current_status !== "Approved" &&
                documentData.current_status !== "Disapproved" &&
                documentData.current_status !== "Cancelled" && (
                  <>
                    <div className="text-gray-600 text-xs">
                      Requester current balance:
                    </div>
                    <div className="mt-2">
                      <LeaveBalanceBoxes user={documentData.creator} />
                    </div>
                  </>
                )
            }
            {hasAccess("certify_leave_credits") &&
              documentData.receiver_id === session?.user.id &&
              documentData.current_status !== "Disapproved" &&
              documentData.current_status !== "Approved" &&
              documentData.current_status !== "Cancelled" && (
                <form onSubmit={handleSubmit(onSubmit)}>
                  <div className="text-gray-600 text-xs mt-4 mb-2">
                    Use the following credits for this Leave:
                  </div>
                  <div className="text-gray-600 text-xs space-y-2">
                    {documentData.creator?.position_type !== "Teaching" && (
                      <>
                        {fields.map((field, index) => (
                          <div
                            key={index}
                            className="flex space-x-2 items-center"
                          >
                            <span className="font-bold">
                              COC (Balance: {field.coc}, Exp.{" "}
                              {format(
                                new Date(field.expiration),
                                "MMM d, yyyy",
                              )}
                              ):
                            </span>
                            <input
                              {...register(`cocs.${index}.use_coc`, {
                                max: {
                                  value: field.coc,
                                  message: `Cannot exceed ${field.coc}`,
                                },
                                min: {
                                  value: 0,
                                  message: "Invalid Input",
                                },
                              })}
                              type="number"
                              step="any"
                              className="px-1 py-px border border-gray-300 outline-none text-sm w-20"
                            />
                            <input
                              {...register(`cocs.${index}.id`)}
                              value={field.cto_user_id}
                              type="hidden" // Hidden input to preserve the ID
                            />
                            {errors.cocs?.[index]?.use_coc?.message && (
                              <div className="app__error_message">
                                {errors.cocs?.[index]?.use_coc?.message}
                              </div>
                            )}
                          </div>
                        ))}
                        <div className="flex space-x-2 items-center">
                          <span className="font-bold">Vacation Leave:</span>
                          <input
                            {...register("vl", {
                              max: {
                                value:
                                  leaveCreditBalances.find(
                                    (b) => b.type === "Vacation Leave",
                                  )?.credits ?? 0,
                                message: `Cannot exceed ${
                                  leaveCreditBalances.find(
                                    (b) => b.type === "Vacation Leave",
                                  )?.credits ?? "0"
                                }`,
                              },
                              min: {
                                value: 0,
                                message: "Invalid Input",
                              },
                            })}
                            type="number"
                            step="any"
                            className="px-1 py-px border border-gray-300 outline-none text-sm w-20"
                          />
                          {errors.vl?.message && (
                            <div className="app__error_message">
                              {errors.vl.message}
                            </div>
                          )}
                        </div>
                        <div className="flex space-x-2 items-center">
                          <span className="font-bold">Sick Leave:</span>
                          <input
                            {...register("sl", {
                              max: {
                                value:
                                  leaveCreditBalances.find(
                                    (b) => b.type === "Sick Leave",
                                  )?.credits ?? 0,
                                message: `Cannot exceed ${
                                  leaveCreditBalances.find(
                                    (b) => b.type === "Sick Leave",
                                  )?.credits ?? "0"
                                }`,
                              },
                              min: {
                                value: 0,
                                message: "Invalid Input",
                              },
                            })}
                            type="number"
                            step="any"
                            className="px-1 py-px border border-gray-300 outline-none text-sm w-20"
                          />
                          {errors.sl?.message && (
                            <div className="app__error_message">
                              {errors.sl.message}
                            </div>
                          )}
                        </div>
                      </>
                    )}
                    {documentData.creator?.position_type === "Teaching" && (
                      <div className="flex space-x-2 items-center">
                        <span className="font-bold">Service Credit:</span>
                        <input
                          {...register("sc", {
                            max: {
                              value:
                                leaveCreditBalances.find(
                                  (b) => b.type === "Service Credit",
                                )?.credits ?? 0,
                              message: `Cannot exceed ${
                                leaveCreditBalances.find(
                                  (b) => b.type === "Service Credit",
                                )?.credits ?? "0"
                              }`,
                            },
                            min: {
                              value: 0,
                              message: "Invalid Input",
                            },
                          })}
                          type="number"
                          step="any"
                          className="px-1 py-px border border-gray-300 outline-none text-sm w-20"
                        />
                        {errors.sc?.message && (
                          <div className="app__error_message">
                            {errors.sc.message}
                          </div>
                        )}
                      </div>
                    )}
                    <div className="flex space-x-2 items-center">
                      <span className="font-bold">Adoption Leave:</span>
                      <input
                        {...register("adoption", {
                          max: {
                            value:
                              leaveCreditBalances.find(
                                (b) => b.type === "Adoption Leave",
                              )?.credits ?? 0,
                            message: `Cannot exceed ${
                              leaveCreditBalances.find(
                                (b) => b.type === "Adoption Leave",
                              )?.credits ?? "0"
                            }`,
                          },
                          min: {
                            value: 0,
                            message: "Invalid Input",
                          },
                        })}
                        type="number"
                        step="any"
                        className="px-1 py-px border border-gray-300 outline-none text-sm w-20"
                      />
                      {errors.adoption?.message && (
                        <div className="app__error_message">
                          {errors.adoption.message}
                        </div>
                      )}
                    </div>
                    <div className="flex space-x-2 items-center">
                      <span className="font-bold">Maternity Leave:</span>
                      <input
                        {...register("maternity", {
                          max: {
                            value:
                              leaveCreditBalances.find(
                                (b) => b.type === "Maternity Leave",
                              )?.credits ?? 0,
                            message: `Cannot exceed ${
                              leaveCreditBalances.find(
                                (b) => b.type === "Maternity Leave",
                              )?.credits ?? "0"
                            }`,
                          },
                          min: {
                            value: 0,
                            message: "Invalid Input",
                          },
                        })}
                        type="number"
                        step="any"
                        className="px-1 py-px border border-gray-300 outline-none text-sm w-20"
                      />
                      {errors.maternity?.message && (
                        <div className="app__error_message">
                          {errors.maternity.message}
                        </div>
                      )}
                    </div>
                    <div className="flex space-x-2 items-center">
                      <span className="font-bold">Wellness Break:</span>
                      <input
                        {...register("wellness", {
                          max: {
                            value:
                              leaveCreditBalances.find(
                                (b) => b.type === "Wellness Break",
                              )?.credits ?? 0,
                            message: `Cannot exceed ${
                              leaveCreditBalances.find(
                                (b) => b.type === "Wellness Break",
                              )?.credits ?? "0"
                            }`,
                          },
                          min: {
                            value: 0,
                            message: "Invalid Input",
                          },
                        })}
                        type="number"
                        step="any"
                        className="px-1 py-px border border-gray-300 outline-none text-sm w-20"
                      />
                      {errors.wellness?.message && (
                        <div className="app__error_message">
                          {errors.wellness.message}
                        </div>
                      )}
                    </div>
                    <div className="flex space-x-2 items-center">
                      <span className="font-bold">Paternity Leave:</span>
                      <input
                        {...register("paternity", {
                          max: {
                            value:
                              leaveCreditBalances.find(
                                (b) => b.type === "Paternity Leave",
                              )?.credits ?? 0,
                            message: `Cannot exceed ${
                              leaveCreditBalances.find(
                                (b) => b.type === "Paternity Leave",
                              )?.credits ?? "0"
                            }`,
                          },
                          min: {
                            value: 0,
                            message: "Invalid Input",
                          },
                        })}
                        type="number"
                        step="any"
                        className="px-1 py-px border border-gray-300 outline-none text-sm w-20"
                      />
                      {errors.paternity?.message && (
                        <div className="app__error_message">
                          {errors.paternity.message}
                        </div>
                      )}
                    </div>

                    {/* Female */}
                    {documentData.creator?.gender.toLowerCase() ===
                      "female" && (
                      <>
                        <div className="flex space-x-2 items-center">
                          <span className="font-bold">VAWC Leave:</span>
                          <input
                            {...register("vawc", {
                              max: {
                                value:
                                  leaveCreditBalances.find(
                                    (b) => b.type === "10-Day VAWC Leave",
                                  )?.credits ?? 0,
                                message: `Cannot exceed ${
                                  leaveCreditBalances.find(
                                    (b) => b.type === "10-Day VAWC Leave",
                                  )?.credits ?? "0"
                                }`,
                              },
                              min: {
                                value: 0,
                                message: "Invalid Input",
                              },
                            })}
                            type="number"
                            step="any"
                            className="px-1 py-px border border-gray-300 outline-none text-sm w-20"
                          />
                          {errors.vawc?.message && (
                            <div className="app__error_message">
                              {errors.vawc.message}
                            </div>
                          )}
                        </div>

                        <div className="flex space-x-2 items-center">
                          <span className="font-bold">
                            Special Leave Benefits for Women Leave:
                          </span>
                          <input
                            {...register("slbw", {
                              max: {
                                value:
                                  leaveCreditBalances.find(
                                    (b) =>
                                      b.type ===
                                      "Special Leave Benefits For Women",
                                  )?.credits ?? 0,
                                message: `Cannot exceed ${
                                  leaveCreditBalances.find(
                                    (b) =>
                                      b.type ===
                                      "Special Leave Benefits For Women",
                                  )?.credits ?? "0"
                                }`,
                              },
                              min: {
                                value: 0,
                                message: "Invalid Input",
                              },
                            })}
                            type="number"
                            step="any"
                            className="px-1 py-px border border-gray-300 outline-none text-sm w-20"
                          />
                          {errors.slbw?.message && (
                            <div className="app__error_message">
                              {errors.slbw.message}
                            </div>
                          )}
                        </div>
                      </>
                    )}

                    <div className="flex space-x-2 items-center">
                      <span className="font-bold">
                        Special Emergency Leave:
                      </span>
                      <input
                        {...register("emergency", {
                          max: {
                            value:
                              leaveCreditBalances.find(
                                (b) =>
                                  b.type ===
                                  "Special Emergency (Calamity) Leave",
                              )?.credits ?? 0,
                            message: `Cannot exceed ${
                              leaveCreditBalances.find(
                                (b) =>
                                  b.type ===
                                  "Special Emergency (Calamity) Leave",
                              )?.credits ?? "0"
                            }`,
                          },
                          min: {
                            value: 0,
                            message: "Invalid Input",
                          },
                        })}
                        type="number"
                        step="any"
                        className="px-1 py-px border border-gray-300 outline-none text-sm w-20"
                      />
                      {errors.emergency?.message && (
                        <div className="app__error_message">
                          {errors.emergency.message}
                        </div>
                      )}
                    </div>

                    <div className="flex space-x-2 items-center">
                      <span className="font-bold">Study Leave:</span>
                      <input
                        {...register("study", {
                          max: {
                            value:
                              leaveCreditBalances.find(
                                (b) => b.type === "Study Leave",
                              )?.credits ?? 0,
                            message: `Cannot exceed ${
                              leaveCreditBalances.find(
                                (b) => b.type === "Study Leave",
                              )?.credits ?? "0"
                            }`,
                          },
                          min: {
                            value: 0,
                            message: "Invalid Input",
                          },
                        })}
                        type="number"
                        step="any"
                        className="px-1 py-px border border-gray-300 outline-none text-sm w-20"
                      />
                      {errors.study?.message && (
                        <div className="app__error_message">
                          {errors.study.message}
                        </div>
                      )}
                    </div>
                    <div className="flex space-x-2 items-center">
                      <span className="font-bold">Solo Parent Leave:</span>
                      <input
                        {...register("soloparent", {
                          max: {
                            value:
                              leaveCreditBalances.find(
                                (b) => b.type === "Solo Parent Leave",
                              )?.credits ?? 0,
                            message: `Cannot exceed ${
                              leaveCreditBalances.find(
                                (b) => b.type === "Solo Parent Leave",
                              )?.credits ?? "0"
                            }`,
                          },
                          min: {
                            value: 0,
                            message: "Invalid Input",
                          },
                        })}
                        type="number"
                        step="any"
                        className="px-1 py-px border border-gray-300 outline-none text-sm w-20"
                      />
                      {errors.soloparent?.message && (
                        <div className="app__error_message">
                          {errors.soloparent.message}
                        </div>
                      )}
                    </div>

                    <div className="flex space-x-2 items-center">
                      <span className="font-bold">
                        Special Privilege Leave:
                      </span>
                      <input
                        {...register("spl", {
                          max: {
                            value:
                              leaveCreditBalances.find(
                                (b) => b.type === "Special Privilege Leave",
                              )?.credits ?? 0,
                            message: `Cannot exceed ${
                              leaveCreditBalances.find(
                                (b) => b.type === "Special Privilege Leave",
                              )?.credits ?? "0"
                            }`,
                          },
                          min: {
                            value: 0,
                            message: "Invalid Input",
                          },
                        })}
                        type="number"
                        step="any"
                        className="px-1 py-px border border-gray-300 outline-none text-sm w-20"
                      />
                      {errors.spl?.message && (
                        <div className="app__error_message">
                          {errors.spl.message}
                        </div>
                      )}
                    </div>

                    <div className="flex space-x-2 items-center">
                      <span className="font-bold">Rehabilitation Leave:</span>
                      <input
                        {...register("rehab", {
                          max: {
                            value:
                              leaveCreditBalances.find(
                                (b) => b.type === "Rehabilitation Leave",
                              )?.credits ?? 0,
                            message: `Cannot exceed ${
                              leaveCreditBalances.find(
                                (b) => b.type === "Rehabilitation Leave",
                              )?.credits ?? "0"
                            }`,
                          },
                          min: {
                            value: 0,
                            message: "Invalid Input",
                          },
                        })}
                        type="number"
                        step="any"
                        className="px-1 py-px border border-gray-300 outline-none text-sm w-20"
                      />
                      {errors.rehab?.message && (
                        <div className="app__error_message">
                          {errors.rehab.message}
                        </div>
                      )}
                    </div>
                  </div>

                  <CustomButton
                    containerStyles="app__btn_green mt-2"
                    title="Certify"
                    isDisabled={
                      saving || withPay > Number(documentData.leave_days)
                    }
                    btnType="submit"
                  />
                </form>
              )}
            <div className="text-gray-600 text-xs mt-4">
              Credits used for this Leave:
            </div>
            <div className="text-gray-600 text-xs mt-1 font-bold mb-2 space-y-1">
              {documentData.leave_cocs &&
                documentData.leave_cocs.length > 0 &&
                documentData.leave_cocs.map((coc, index) => (
                  <div
                    key={index}
                    className="inline-flex border border-blue-500 px-1 py-px font-semibold bg-blue-200 text-gray-900 mr-2"
                  >
                    COC: {coc.use_coc} {/* Display the current input value */}
                  </div>
                ))}
              {creditsUsed.map((credit, index) => (
                <div
                  key={index}
                  className="inline-flex border border-blue-500 px-1 py-px font-semibold bg-blue-200 text-gray-900 mr-2"
                >
                  {credit.type}: {credit.balance}
                </div>
              ))}
            </div>
            {documentData.leave_type === "Terminal/Monetization Leave" ? (
              <>
                <div className="text-gray-600 font-medium text-xs mt-4 mb-1">
                  Absence with Pay:{" "}
                  {documentData.leave_other_purpose === "xTerminal Leave" ? (
                    <span> {documentData.leave_days}</span>
                  ) : (
                    <span>0</span>
                  )}
                </div>
                <div className="text-gray-600 font-medium text-xs mt-4 mb-1">
                  Absence without Pay: 0
                </div>
                {documentData.leave_other_purpose !== "Terminal Leave" && (
                  <div className="text-gray-600 font-medium text-xs mt-4 mb-1">
                    Monetization: {documentData.leave_days} days
                  </div>
                )}
              </>
            ) : (
              <>
                {documentData.certified_by ? (
                  <>
                    <div className="text-gray-600 font-medium text-xs mt-4 mb-1">
                      Absence with Pay: {documentData.leave_days_with_pay}
                    </div>
                    <div className="text-gray-600 font-medium text-xs mt-4 mb-1">
                      Absence without Pay:{" "}
                      {documentData.leave_days_without_pay}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-gray-600 font-medium text-xs mt-4 mb-1">
                      Absence with Pay:{" "}
                      {Number.isInteger(withPay) ? withPay : withPay.toFixed(2)}
                      {withPay > Number(documentData.leave_days) && (
                        <span className="text-red-500">
                          (Exceeds to actual number of leave days)
                        </span>
                      )}
                    </div>
                    <div className="text-gray-600 font-medium text-xs mt-4 mb-1">
                      Absence without Pay:{" "}
                      {Number.isInteger(withoutPay)
                        ? withoutPay
                        : withoutPay.toFixed(2)}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
