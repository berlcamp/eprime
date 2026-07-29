/* eslint-disable @typescript-eslint/prefer-nullish-coalescing */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
"use client";
import TwoColTableLoading from "@/components/Loading/TwoColTableLoading";
import { useSupabase } from "@/context/SupabaseProvider";
import { PaperClipIcon } from "@heroicons/react/24/solid";
import { eachDayOfInterval, format } from "date-fns";
import { useCallback, useEffect, useRef, useState } from "react";
import { type FileWithPath, useDropzone } from "react-dropzone";
import Remarks from "./Remarks/Remarks";

import { updateList } from "@/GlobalRedux/Features/listSlice";
import { recount } from "@/GlobalRedux/Features/recountSlice";
import {
  ConfirmModal,
  CustomButton,
  SearchUserInput,
  StatusFlow,
  UserBlock,
} from "@/components/index";
import { useFilter } from "@/context/FilterContext";
import type {
  AttachmentTypes,
  DocumentTypes,
  Employee,
  LeaveCreditTypes,
  namesType,
} from "@/types";
import { logError } from "@/utils/fetchApi";
import {
  BellAlertIcon,
  BellSlashIcon,
  StarIcon,
  XMarkIcon,
} from "@heroicons/react/20/solid";
import { useDispatch, useSelector } from "react-redux";
import { Tooltip } from "react-tooltip";
import { LWOP_SERVICE_RECORD_MIN_DAYS, superAdmins } from "@/constants";
import AddStickyModal from "./AddStickyModal";
import CreditsCertification from "./CreditsCertification";

interface ModalProps {
  hideModal: () => void;
  refresh: () => void;
  documentData: DocumentTypes;
}

function Attachment({ id, file }: { id: string; file: string }) {
  const [downloading, setDownloading] = useState(false);

  const { supabase } = useSupabase();

  const handleDownloadFile = async (file: string) => {
    if (downloading) return;

    setDownloading(true);

    try {
      const { data, error } = await supabase.storage
        .from("hrm_documents")
        .download(`requests/${id}/${file}`);

      if (error) {
        console.error("File download error:", error.message);
        return;
      }

      if (!data) {
        console.error("Downloaded file data is null");
        return;
      }

      const url = URL.createObjectURL(data);

      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", file);
      document.body.appendChild(link);
      link.click();
      link.remove();

      // Cleanup
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Unexpected error downloading file:", err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div
      onClick={() => handleDownloadFile(file)}
      className={`flex space-x-2 items-center ${
        downloading ? "" : "cursor-pointer"
      }`}
    >
      <PaperClipIcon className="w-4 h-4 text-blue-700 " />
      <span className="text-blue-700 font-medium text-[10px]">
        {file}
        {downloading ? " downloading..." : ""}
      </span>
    </div>
  );
}

export default function DetailsModal({
  hideModal,
  documentData: originalData,
  refresh,
}: ModalProps) {
  const [documentData, setDocumentData] = useState<DocumentTypes>(originalData);
  const [attachments, setAttachments] = useState<AttachmentTypes[] | []>([]);
  const [loadingReplies, setLoadingReplies] = useState(false);

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [updateStatusFlow, setUpdateStatusFlow] = useState(false);
  const [selectedItem, setSelectedItem] = useState<DocumentTypes | null>(null);
  const [showAddStickyModal, setShowAddStickyModal] = useState(false);
  const [hideStickyButton, setHideStickyButton] = useState(false);
  const [hideFollowButton, setHideFollowButton] = useState(false);

  const [showConfirmModal, setShowConfirmModal] = useState("");
  const [confirmMessage, setConfirmMessage] = useState("");

  // Revert Approval preview (super admin only)
  const [loadingRevertPreview, setLoadingRevertPreview] = useState(false);
  const [revertPreview, setRevertPreview] = useState<{
    credits: Array<{
      type: string;
      restore: number;
      currentBalance: number;
      newBalance: number;
    }>;
    coc: { restore: number; currentCoc: number; newCoc: number } | null;
    leaveDaysWithoutPay: number;
  } | null>(null);

  // Forward to this user
  const [selectedUser, setSelectedUser] = useState<namesType | null>(null);

  const [selectedImages, setSelectedImages] = useState<any>([]);
  const { systemUsers, session, supabase } = useSupabase();

  const { setToast, hasAccess } = useFilter();

  // superAdmin: edit date range (leave and other request types)
  const [showEditLeaveDates, setShowEditLeaveDates] = useState(false);
  const [leaveFrom, setLeaveFrom] = useState("");
  const [leaveTo, setLeaveTo] = useState("");
  const [includeWeekend, setIncludeWeekend] = useState(false);
  const [savingLeaveDates, setSavingLeaveDates] = useState(false);
  const [showEditDates, setShowEditDates] = useState(false);
  const [editDateFrom, setEditDateFrom] = useState("");
  const [editDateTo, setEditDateTo] = useState("");
  const [savingDates, setSavingDates] = useState(false);
  const isSuperAdmin = superAdmins.includes(session?.user.email ?? "");

  const wrapperRef = useRef<HTMLDivElement>(null);

  const user: Employee = systemUsers.find(
    (user: Employee) => user.id === session?.user.id,
  );

  // Redux staff
  const globallist = useSelector((state: any) => state.list.value);
  const dispatch = useDispatch();

  const handleCertified = useCallback((updatedData: DocumentTypes) => {
    setDocumentData(updatedData);
  }, []);

  const handleFollow = async () => {
    try {
      const { error } = await supabase.from("hrm_tracker_followers").insert({
        tracker_id: documentData.id,
        user_id: user.id,
      });
      if (error) throw new Error(error.message);

      setToast("success", "Successfully Followed.");
      setHideFollowButton(true);

      dispatch(recount());
    } catch (e) {
      console.error(e);
    }
  };

  const handleUnfollow = async () => {
    try {
      const { error } = await supabase
        .from("hrm_tracker_followers")
        .delete()
        .eq("tracker_id", documentData.id)
        .eq("user_id", user.id);

      if (error) throw new Error(error.message);

      setToast("success", "Successfully Unfollowed.");
      setHideFollowButton(false);

      dispatch(recount());
    } catch (e) {
      console.error(e);
    }
  };

  const handleNotify = async (document: DocumentTypes, actionType: string) => {
    //
    try {
      const userIds: string[] = [];

      // Followers
      const { data: followers } = await supabase
        .from("hrm_tracker_followers")
        .select("user_id")
        .eq("tracker_id", document.id);

      if (followers) {
        followers.forEach((user) => {
          userIds.push(user.user_id.toString());
        });
      }

      // Notify the origin
      userIds.push(document.created_by);

      // Notify the receiver if status is forwarded
      if (actionType === "Forwarded") {
        userIds.push(document.receiver_id);
      }

      // Remove the duplicated IDs
      const uniqueIds = userIds.reduce(
        (accumulator: string[], currentValue: string) => {
          if (!accumulator.includes(currentValue)) {
            accumulator.push(currentValue);
          }
          return accumulator;
        },
        [],
      );

      const notificationData: any[] = [];

      const message =
        actionType === "Forwarded"
          ? `The ${document.type} Request #${document.reference_code} has been forwarded to you for verification/approval.`
          : `The status of ${document.type} request #${document.reference_code} has been changed to ${actionType}.`;

      uniqueIds.forEach((userId) => {
        notificationData.push({
          message,
          url: `/tracker/${document.reference_code}`,
          type: actionType,
          user_id: userId,
          request_tracker_id: document.id,
          reference_table: "hrm_request_trackers",
        });
      });

      if (notificationData.length > 0) {
        // insert to notifications
        const { error: error3 } = await supabase
          .from("hrm_notifications")
          .insert(notificationData);

        if (error3) {
          throw new Error(error3.message);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // display confirm modal
  const HandleConfirm = (action: string) => {
    if (saving) return;

    if (action === "Recommend Approval") {
      setConfirmMessage(
        "Are you sure you want to recommend this for approval?",
      );
    }
    if (action === "Approve") {
      setConfirmMessage("Are you sure you want to Approve this?");
    }
    if (action === "For Reverification") {
      setConfirmMessage(
        'Are you sure you want to change this to "For Reverification?"',
      );
    }
    if (action === "Disapprove") {
      setConfirmMessage("Are you sure you want to Disapprove this?");
    }
    if (action === "Cancel") {
      setConfirmMessage("Are you sure you want to Cancel this request?");
    }
    if (action === "Forward") {
      if (!selectedUser) {
        return;
      }
      setConfirmMessage("Are you sure you want to Forward this request?");
    }
    setShowConfirmModal(action);
  };

  // based from confirm modal
  const HandleOnConfirm = () => {
    if (showConfirmModal === "Forward") {
      void handleConfirmedForward();
    }
    if (showConfirmModal === "Approve") {
      void handleConfirmedApprove();
    }
    if (showConfirmModal === "For Reverification") {
      void handleConfirmedReverification();
    }
    if (showConfirmModal === "Disapprove") {
      void handleConfirmedDisapprove();
    }
    if (showConfirmModal === "Recommend Approval") {
      void handleConfirmedRecommend();
    }
    if (showConfirmModal === "Cancel") {
      void handleConfirmedCancel();
    }
    setShowConfirmModal("");
    setConfirmMessage("");
  };

  // based from confirm modal
  const handleOnCancel = () => {
    // hide the modal
    setShowConfirmModal("");
    setConfirmMessage("");
  };

  const handleConfirmedForward = async () => {
    if (!selectedUser) return;

    if (saving) return;

    setSaving(true);

    const newData = {
      current_tracker: "Forwarded",
      receiver_id: selectedUser.id,
    };
    try {
      const { error } = await supabase
        .from("hrm_request_trackers")
        .update(newData)
        .eq("id", documentData.id);

      if (error) {
        void logError(
          "Forward Request",
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

      const { error: error2 } = await supabase.from("hrm_tracker_flow").insert({
        tracker_id: documentData.id,
        user_id: user.id,
        receiver_id: selectedUser.id,
        status: "Forwarded",
      });

      if (error2) {
        void logError(
          "Forward Request Flow",
          "hrm_tracker_flow",
          "",
          error2.message,
        );
        setToast(
          "error",
          "Saving failed, please reload the page and try again.",
        );
        throw new Error(error2.message);
      }

      // Update data in redux
      const items: DocumentTypes[] = [...globallist];
      const updatedData = { ...newData, id: documentData.id };
      const foundIndex = items.findIndex((x) => x.id === updatedData.id);
      items[foundIndex] = { ...items[foundIndex], ...updatedData };
      dispatch(updateList(items));
      setDocumentData(items[foundIndex]); // update ui with new data

      // Notify requester and receiver
      void handleNotify(items[foundIndex], "Forwarded");

      // pop up the success message
      setToast("success", "Successfully saved.");

      // Recount sidebar counter
      dispatch(recount());

      setUpdateStatusFlow(!updateStatusFlow);
      setSaving(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleConfirmedApprove = async () => {
    if (saving) return;

    setSaving(true);

    const newData = {
      current_status: "Approved",
      current_approver_id: session?.user.id,
      approved_by: session?.user.id,
      date_approved: format(new Date(), "yyyy-MM-dd"),
    };
    try {
      // Atomic guard: only approve if the request is still "Approval Recommended".
      // Prevents a double-approval (and double credit/COC deduction) when the
      // modal is opened from a stale list where the status hasn't refreshed.
      const { data: updatedRows, error } = await supabase
        .from("hrm_request_trackers")
        .update(newData)
        .eq("id", documentData.id)
        .eq("current_status", "Approval Recommended")
        .select();

      if (error) {
        void logError(
          "Approval",
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

      // No row matched → it was already approved (or no longer approvable).
      // Bail out before deducting credits or inserting a duplicate log.
      if (!updatedRows || updatedRows.length === 0) {
        setToast(
          "error",
          "This request has already been approved or is no longer awaiting approval. Please reload the page.",
        );

        // Sync local + redux state to the real status so the button hides
        const items = [...globallist];
        const foundIndex = items.findIndex((x) => x.id === documentData.id);
        if (foundIndex >= 0) {
          items[foundIndex] = { ...items[foundIndex], ...newData };
          dispatch(updateList(items));
          setDocumentData(items[foundIndex]);
        }

        setUpdateStatusFlow(!updateStatusFlow);
        setSaving(false);
        return;
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
          message: "Approved",
          tracker_flow_id: data.id,
          user_id: session?.user.id,
        };

        const { error: error2 } = await supabase
          .from("hrm_tracker_logs")
          .insert(newData)
          .eq("id", documentData.id);

        if (error2) {
          void logError(
            "Approval Flow Logs",
            "hrm_tracker_flow",
            "",
            error2.message,
          );
        }
      }

      // Add entry to employees leave card if type of request is Leave
      if (documentData.type === "Leave") {
        // Refetch tracker from DB to get latest certified values (handles modal
        // reopened after certification or stale list data)
        const { data: freshTracker } = await supabase
          .from("hrm_request_trackers")
          .select(
            "leave_credit_use_vl, leave_credit_use_sl, leave_credit_use_sc, leave_credit_use_adoption, leave_credit_use_vawc, leave_credit_use_emergency, leave_credit_use_study, leave_credit_use_soloparent, leave_credit_use_slbw, leave_credit_use_spl, leave_credit_use_rehab, leave_credit_use_paternity, leave_credit_use_maternity, leave_credit_use_wellness, leave_days_with_pay, leave_days_without_pay"
          )
          .eq("id", documentData.id)
          .single();

        const leaveData = freshTracker
          ? { ...documentData, ...freshTracker }
          : documentData;

        // Current Balances
        const { data: balancesData } = await supabase
          .from("hrm_leave_credits")
          .select()
          .eq("user_id", documentData.creator.id);

        const balances: Array<{
          type: string;
          balance: string;
        }> = [];

        if (balancesData && balancesData.length > 0) {
          const creditsData: LeaveCreditTypes[] = balancesData;
          creditsData.forEach((credit) => {
            balances.push({
              type: credit.type,
              balance: credit.credits.toString(),
            });
          });
        }

        const creditsUsed = [
          {
            type: "Vacation Leave",
            value: leaveData.leave_credit_use_vl,
          },
          {
            type: "Sick Leave",
            value: leaveData.leave_credit_use_sl,
          },
          {
            type: "Service Credit",
            value: leaveData.leave_credit_use_sc,
          },
          {
            type: "Adoption Leave",
            value: leaveData.leave_credit_use_adoption,
          },
          {
            type: "10-Day VAWC Leave",
            value: leaveData.leave_credit_use_vawc,
          },
          {
            type: "Special Emergency (Calamity) Leave",
            value: leaveData.leave_credit_use_emergency,
          },
          {
            type: "Study Leave",
            value: leaveData.leave_credit_use_study,
          },
          {
            type: "Solo Parent Leave",
            value: leaveData.leave_credit_use_soloparent,
          },
          {
            type: "Special Leave Benefits For Women",
            value: leaveData.leave_credit_use_slbw,
          },
          {
            type: "Special Privilege Leave",
            value: leaveData.leave_credit_use_spl,
          },
          {
            type: "Rehabilitation Leave",
            value: leaveData.leave_credit_use_rehab,
          },
          {
            type: "Paternity Leave",
            value: leaveData.leave_credit_use_paternity,
          },
          {
            type: "Maternity Leave",
            value: leaveData.leave_credit_use_maternity,
          },
          {
            type: "Wellness Break",
            value: leaveData.leave_credit_use_wellness,
          },
        ];

        // Foreach credits used
        let totalCredits = 0;
        const usedCredits: string[] = [];
        creditsUsed.forEach((cu) => {
          if (cu.value && Number(cu.value) > 0) {
            totalCredits += Number(cu.value);
            usedCredits.push(`${cu.type} (${cu.value})`);
          }
        });

        // Update leave credits balances to db
        const updateLeaveCreditsPromises = creditsUsed.map(async (c) => {
          if (c.value && Number(c.value) > 0) {
            const bal = balances.find((b) => b.type === c.type);

            if (bal) {
              return await supabase
                .from("hrm_leave_credits")
                .update({
                  credits: Number(bal.balance) - Number(c.value),
                })
                .eq("type", c.type)
                .eq("user_id", documentData.creator.id);
            }
          }
        });
        await Promise.all(updateLeaveCreditsPromises);

        // Update Cto balances to db
        // Update CTO balances in the database
        const { data: leaveCocRecords, error: leaveError } = await supabase
          .from("hrm_leave_coc")
          .select("use_coc, user_cto_id")
          .eq("tracker_id", documentData.id);

        if (leaveError) {
          void logError(
            "Leave request - fetch leave coc records",
            "hrm_leave_coc",
            "",
            leaveError.message,
          );
          throw new Error(leaveError.message);
        }

        if (!leaveCocRecords || leaveCocRecords.length === 0) {
          console.warn("No COC records found for this tracker ID.");
        }

        // Process and update each CTO balance
        for (const record of leaveCocRecords) {
          const { use_coc, user_cto_id } = record;

          const { data: userCto, error: fetchCtoError } = await supabase
            .from("hrm_cto_users")
            .select("coc, used_coc")
            .eq("id", user_cto_id)
            .maybeSingle();

          if (fetchCtoError || !userCto) {
            void logError(
              "Leave request - fetch current CTO user",
              "hrm_cto_users",
              user_cto_id,
              fetchCtoError?.message || "CTO user not found",
            );
            throw new Error(fetchCtoError?.message || "CTO user not found");
          }

          const newCocValue = userCto.coc - use_coc;
          const newUsedCocValue =
            (Number(userCto.used_coc) || 0) + Number(use_coc);

          totalCredits += Number(use_coc);
          usedCredits.push(`COC (${use_coc})`);

          const { error: updateError } = await supabase
            .from("hrm_cto_users")
            .update({ coc: newCocValue, used_coc: newUsedCocValue })
            .eq("id", user_cto_id);

          if (updateError) {
            void logError(
              "Leave request - update CTO user balance",
              "hrm_cto_users",
              user_cto_id,
              updateError.message,
            );
            throw new Error(updateError.message);
          }
        }

        // Insert to leave cards
        const { error } = await supabase.from("hrm_leave_cards").insert({
          adjustment_date: new Date(),
          particulars: "Leave Request",
          remarks: `Credit used:  ${usedCredits.join(", ")}`,
          credits_used: totalCredits,
          balance: "",
          absence_with_pay: Math.max(0, Number(leaveData.leave_days_with_pay)),
          absence_without_pay: leaveData.leave_days_without_pay,
          type: leaveData.leave_type,
          tracker_id: leaveData.id,
          user_id: leaveData.created_by,
        });

        if (error) {
          void logError(
            "Leave request - add to leave card",
            "hrm_leave_cards",
            "",
            error.message,
          );
          throw new Error(error.message);
        }

        // If leave days without pay reaches the threshold, add to Service Record and Update hrm_user 'step_increment_leave_days'
        if (
          Number(leaveData.leave_days_without_pay) >=
          LWOP_SERVICE_RECORD_MIN_DAYS
        ) {
          const newData = {
            user_id: leaveData.created_by,
            org_id: process.env.NEXT_PUBLIC_ORG_ID,
            from: leaveData.leave_dates[0]?.date ?? "",
            designation: leaveData.creator.hrm_positions?.name,
            days_without_pay: leaveData.leave_days_without_pay,
            remarks: leaveData.leave_type,
            created_by: session?.user.id,
          };

          const { error: insertSRError } = await supabase
            .from("hrm_service_records")
            .insert(newData)
            .select();

          if (insertSRError) {
            void logError(
              "Create service record from Leave",
              "hrm_service_records",
              JSON.stringify(newData),
              insertSRError.message,
            );
          }

          const { error: updateUserError } = await supabase
            .from("hrm_users")
            .update({
              step_increment_leave_days:
                Number(leaveData.creator.step_increment_leave_days) +
                Number(leaveData.leave_days_without_pay),
            })
            .eq("id", leaveData.created_by);

          if (updateUserError) {
            void logError(
              "Update step_increment_leave_days during leave",
              "hrm_users",
              "",
              updateUserError.message,
            );
          }
        }
      }
      // End: Add entry to employees leave card if type of request is Leave

      // Update data in redux
      const items = [...globallist];
      const updatedData = { ...newData, id: documentData.id };
      const foundIndex = items.findIndex((x) => x.id === updatedData.id);
      items[foundIndex] = { ...items[foundIndex], ...updatedData };
      dispatch(updateList(items));
      setDocumentData(items[foundIndex]); // update ui with new data

      // Notify requester and follower
      void handleNotify(items[foundIndex], "Approved");

      // pop up the success message
      setToast("success", "Successfully saved.");

      // Recount sidebar counter
      dispatch(recount());

      refresh?.();

      setUpdateStatusFlow(!updateStatusFlow);
      setSaving(false);
    } catch (e) {
      console.error(e);
    }
  };

  // Computes exactly what will be restored before showing the revert
  // confirmation modal, so the super admin can see the real numbers.
  const handleOpenRevertPreview = async () => {
    if (loadingRevertPreview) return;

    setLoadingRevertPreview(true);

    try {
      const { data: freshTracker } = await supabase
        .from("hrm_request_trackers")
        .select(
          "leave_credit_use_vl, leave_credit_use_sl, leave_credit_use_sc, leave_credit_use_adoption, leave_credit_use_vawc, leave_credit_use_emergency, leave_credit_use_study, leave_credit_use_soloparent, leave_credit_use_slbw, leave_credit_use_spl, leave_credit_use_rehab, leave_credit_use_paternity, leave_credit_use_maternity, leave_credit_use_wellness, leave_days_without_pay",
        )
        .eq("id", documentData.id)
        .single();

      const leaveData = freshTracker
        ? { ...documentData, ...freshTracker }
        : documentData;

      const { data: balancesData } = await supabase
        .from("hrm_leave_credits")
        .select()
        .eq("user_id", documentData.creator.id);

      const balances: Array<{ type: string; balance: string }> = [];
      if (balancesData && balancesData.length > 0) {
        const creditsData: LeaveCreditTypes[] = balancesData;
        creditsData.forEach((credit) => {
          balances.push({ type: credit.type, balance: credit.credits.toString() });
        });
      }

      const creditsUsed = [
        { type: "Vacation Leave", value: leaveData.leave_credit_use_vl },
        { type: "Sick Leave", value: leaveData.leave_credit_use_sl },
        { type: "Service Credit", value: leaveData.leave_credit_use_sc },
        { type: "Adoption Leave", value: leaveData.leave_credit_use_adoption },
        { type: "10-Day VAWC Leave", value: leaveData.leave_credit_use_vawc },
        {
          type: "Special Emergency (Calamity) Leave",
          value: leaveData.leave_credit_use_emergency,
        },
        { type: "Study Leave", value: leaveData.leave_credit_use_study },
        { type: "Solo Parent Leave", value: leaveData.leave_credit_use_soloparent },
        {
          type: "Special Leave Benefits For Women",
          value: leaveData.leave_credit_use_slbw,
        },
        { type: "Special Privilege Leave", value: leaveData.leave_credit_use_spl },
        { type: "Rehabilitation Leave", value: leaveData.leave_credit_use_rehab },
        { type: "Paternity Leave", value: leaveData.leave_credit_use_paternity },
        { type: "Maternity Leave", value: leaveData.leave_credit_use_maternity },
        { type: "Wellness Break", value: leaveData.leave_credit_use_wellness },
      ];

      const credits = creditsUsed
        .filter((c) => c.value && Number(c.value) > 0)
        .map((c) => {
          const bal = balances.find((b) => b.type === c.type);
          const currentBalance = bal ? Number(bal.balance) : 0;
          return {
            type: c.type,
            restore: Number(c.value),
            currentBalance,
            newBalance: currentBalance + Number(c.value),
          };
        });

      const { data: leaveCocRecords } = await supabase
        .from("hrm_leave_coc")
        .select("use_coc, user_cto_id")
        .eq("tracker_id", documentData.id);

      let coc: {
        restore: number;
        currentCoc: number;
        newCoc: number;
      } | null = null;

      if (leaveCocRecords && leaveCocRecords.length > 0) {
        let totalRestore = 0;
        let currentCoc = 0;
        for (const record of leaveCocRecords) {
          totalRestore += Number(record.use_coc);
          const { data: userCto } = await supabase
            .from("hrm_cto_users")
            .select("coc")
            .eq("id", record.user_cto_id)
            .maybeSingle();
          if (userCto) currentCoc += Number(userCto.coc);
        }
        coc = {
          restore: totalRestore,
          currentCoc,
          newCoc: currentCoc + totalRestore,
        };
      }

      setRevertPreview({
        credits,
        coc,
        leaveDaysWithoutPay: Number(leaveData.leave_days_without_pay) || 0,
      });
    } catch (e) {
      console.error(e);
      setToast("error", "Failed to load revert preview, please try again.");
    } finally {
      setLoadingRevertPreview(false);
    }
  };

  // Reverts an "Approved" leave request back to "Approval Recommended" and
  // undoes the leave credit / CTO deductions and leave card entry created
  // during approval, so it can be re-certified and re-approved without
  // double-deducting balances. Super admin only — this mutates financial data.
  const handleConfirmedRevertApproval = async () => {
    if (saving) return;

    setSaving(true);

    try {
      // Refetch tracker to get the exact certified values used at approval time
      const { data: freshTracker } = await supabase
        .from("hrm_request_trackers")
        .select(
          "leave_credit_use_vl, leave_credit_use_sl, leave_credit_use_sc, leave_credit_use_adoption, leave_credit_use_vawc, leave_credit_use_emergency, leave_credit_use_study, leave_credit_use_soloparent, leave_credit_use_slbw, leave_credit_use_spl, leave_credit_use_rehab, leave_credit_use_paternity, leave_credit_use_maternity, leave_credit_use_wellness, leave_days_without_pay",
        )
        .eq("id", documentData.id)
        .single();

      const leaveData = freshTracker
        ? { ...documentData, ...freshTracker }
        : documentData;

      // Restore leave credit balances
      const { data: balancesData } = await supabase
        .from("hrm_leave_credits")
        .select()
        .eq("user_id", documentData.creator.id);

      const balances: Array<{ type: string; balance: string }> = [];
      if (balancesData && balancesData.length > 0) {
        const creditsData: LeaveCreditTypes[] = balancesData;
        creditsData.forEach((credit) => {
          balances.push({ type: credit.type, balance: credit.credits.toString() });
        });
      }

      const creditsUsed = [
        { type: "Vacation Leave", value: leaveData.leave_credit_use_vl },
        { type: "Sick Leave", value: leaveData.leave_credit_use_sl },
        { type: "Service Credit", value: leaveData.leave_credit_use_sc },
        { type: "Adoption Leave", value: leaveData.leave_credit_use_adoption },
        { type: "10-Day VAWC Leave", value: leaveData.leave_credit_use_vawc },
        {
          type: "Special Emergency (Calamity) Leave",
          value: leaveData.leave_credit_use_emergency,
        },
        { type: "Study Leave", value: leaveData.leave_credit_use_study },
        { type: "Solo Parent Leave", value: leaveData.leave_credit_use_soloparent },
        {
          type: "Special Leave Benefits For Women",
          value: leaveData.leave_credit_use_slbw,
        },
        { type: "Special Privilege Leave", value: leaveData.leave_credit_use_spl },
        { type: "Rehabilitation Leave", value: leaveData.leave_credit_use_rehab },
        { type: "Paternity Leave", value: leaveData.leave_credit_use_paternity },
        { type: "Maternity Leave", value: leaveData.leave_credit_use_maternity },
        { type: "Wellness Break", value: leaveData.leave_credit_use_wellness },
      ];

      const restoreCreditsPromises = creditsUsed.map(async (c) => {
        if (c.value && Number(c.value) > 0) {
          const bal = balances.find((b) => b.type === c.type);
          if (bal) {
            return await supabase
              .from("hrm_leave_credits")
              .update({ credits: Number(bal.balance) + Number(c.value) })
              .eq("type", c.type)
              .eq("user_id", documentData.creator.id);
          }
        }
      });
      await Promise.all(restoreCreditsPromises);

      // Restore CTO/COC balances
      const { data: leaveCocRecords, error: leaveError } = await supabase
        .from("hrm_leave_coc")
        .select("use_coc, user_cto_id")
        .eq("tracker_id", documentData.id);

      if (leaveError) {
        void logError(
          "Revert Approval - fetch leave coc records",
          "hrm_leave_coc",
          "",
          leaveError.message,
        );
      }

      for (const record of leaveCocRecords ?? []) {
        const { use_coc, user_cto_id } = record;

        const { data: userCto, error: fetchCtoError } = await supabase
          .from("hrm_cto_users")
          .select("coc, used_coc")
          .eq("id", user_cto_id)
          .maybeSingle();

        if (fetchCtoError || !userCto) {
          void logError(
            "Revert Approval - fetch current CTO user",
            "hrm_cto_users",
            user_cto_id,
            fetchCtoError?.message || "CTO user not found",
          );
          continue;
        }

        const { error: updateError } = await supabase
          .from("hrm_cto_users")
          .update({
            coc: Number(userCto.coc) + Number(use_coc),
            used_coc: Math.max(0, (Number(userCto.used_coc) || 0) - Number(use_coc)),
          })
          .eq("id", user_cto_id);

        if (updateError) {
          void logError(
            "Revert Approval - update CTO user balance",
            "hrm_cto_users",
            user_cto_id,
            updateError.message,
          );
        }
      }

      // Remove the leave card entry created during approval
      const { error: leaveCardError } = await supabase
        .from("hrm_leave_cards")
        .delete()
        .eq("tracker_id", documentData.id);

      if (leaveCardError) {
        void logError(
          "Revert Approval - delete leave card entry",
          "hrm_leave_cards",
          "",
          leaveCardError.message,
        );
      }

      // Restore step_increment_leave_days if it was bumped (threshold days without pay).
      // Must use the same threshold as the approval path above, or a revert
      // leaves the bump in place.
      let needsManualServiceRecordCheck = false;
      if (
        Number(leaveData.leave_days_without_pay) >= LWOP_SERVICE_RECORD_MIN_DAYS
      ) {
        needsManualServiceRecordCheck = true;

        const { error: updateUserError } = await supabase
          .from("hrm_users")
          .update({
            step_increment_leave_days: Math.max(
              0,
              Number(documentData.creator.step_increment_leave_days) -
                Number(leaveData.leave_days_without_pay),
            ),
          })
          .eq("id", documentData.created_by);

        if (updateUserError) {
          void logError(
            "Revert Approval - revert step_increment_leave_days",
            "hrm_users",
            "",
            updateUserError.message,
          );
        }
      }

      // Revert the request status
      const newData = {
        current_status: "Approval Recommended",
        current_approver_id: session?.user.id,
        approved_by: null,
        date_approved: null,
      };

      const { error } = await supabase
        .from("hrm_request_trackers")
        .update(newData)
        .eq("id", documentData.id);

      if (error) {
        void logError(
          "Revert Approval",
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

      // Added log to latest tracker flow
      const { data } = await supabase
        .from("hrm_tracker_flow")
        .select()
        .eq("tracker_id", documentData.id)
        .order("id", { ascending: false })
        .limit(1)
        .single();

      if (data) {
        const logMessage = needsManualServiceRecordCheck
          ? `Reverted to Approval Recommended (please manually review the Service Record entry for the >=${LWOP_SERVICE_RECORD_MIN_DAYS} days without pay adjustment)`
          : "Reverted to Approval Recommended";

        const newLogData = {
          message: logMessage,
          tracker_flow_id: data.id,
          user_id: session?.user.id,
        };

        const { error: error2 } = await supabase
          .from("hrm_tracker_logs")
          .insert(newLogData)
          .eq("id", documentData.id);

        if (error2) {
          void logError(
            "Approval Flow Logs",
            "hrm_tracker_flow",
            "",
            error2.message,
          );
        }
      }

      // Update data in redux
      const items = [...globallist];
      const updatedData = { ...newData, id: documentData.id };
      const foundIndex = items.findIndex((x) => x.id === updatedData.id);
      items[foundIndex] = { ...items[foundIndex], ...updatedData };
      dispatch(updateList(items));
      setDocumentData(items[foundIndex]); // update ui with new data

      // Notify requester and follower
      void handleNotify(items[foundIndex], "Reverted to Approval Recommended");

      setToast(
        "success",
        needsManualServiceRecordCheck
          ? "Reverted. Please manually review the Service Record entry."
          : "Successfully reverted to Approval Recommended.",
      );

      // Recount sidebar counter
      dispatch(recount());

      refresh?.();

      setUpdateStatusFlow(!updateStatusFlow);
      setSaving(false);
    } catch (e) {
      console.error(e);
      setSaving(false);
    }
  };

  const handleConfirmedReverification = async () => {
    if (saving) return;

    setSaving(true);

    const newData = {
      current_status: "For Verification",
      current_approver_id: session?.user.id,
    };
    try {
      // Atomic guard: only send back for reverification if the request is
      // still "Approval Recommended".
      const { data: updatedRows, error } = await supabase
        .from("hrm_request_trackers")
        .update(newData)
        .eq("id", documentData.id)
        .eq("current_status", "Approval Recommended")
        .select();

      if (error) {
        void logError(
          "For Reverification",
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

      if (!updatedRows || updatedRows.length === 0) {
        setToast(
          "error",
          "This request's status has changed. Please reload the page and try again.",
        );
        setUpdateStatusFlow(!updateStatusFlow);
        setSaving(false);
        return;
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
          message: "For Reverification",
          tracker_flow_id: data.id,
          user_id: session?.user.id,
        };

        const { error: error2 } = await supabase
          .from("hrm_tracker_logs")
          .insert(newData)
          .eq("id", documentData.id);

        if (error2) {
          void logError(
            "Approval Flow Logs",
            "hrm_tracker_flow",
            "",
            error2.message,
          );
        }
      }

      // Update data in redux
      const items = [...globallist];
      const updatedData = { ...newData, id: documentData.id };
      const foundIndex = items.findIndex((x) => x.id === updatedData.id);
      items[foundIndex] = { ...items[foundIndex], ...updatedData };
      dispatch(updateList(items));
      setDocumentData(items[foundIndex]); // update ui with new data

      // Notify requester and follower
      void handleNotify(items[foundIndex], "For Reverification");

      // pop up the success message
      setToast("success", "Successfully saved.");

      // Recount sidebar counter
      dispatch(recount());

      setUpdateStatusFlow(!updateStatusFlow);
      setSaving(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleConfirmedRecommend = async () => {
    if (saving) return;

    setSaving(true);

    const newData = {
      current_status: "Approval Recommended",
      current_approver_id: session?.user.id,
      recommended_by: session?.user.id,
      date_recommeded: format(new Date(), "yyyy-MM-dd"),
    };
    try {
      // Atomic guard: only recommend if the request hasn't already been
      // recommended/approved/disapproved/cancelled, so a stale modal can't
      // insert a duplicate "Approval Recommended" log.
      const { data: updatedRows, error } = await supabase
        .from("hrm_request_trackers")
        .update(newData)
        .eq("id", documentData.id)
        .neq("current_status", "Approval Recommended")
        .neq("current_status", "Approved")
        .neq("current_status", "Disapproved")
        .neq("current_status", "Cancelled")
        .select();

      if (error) {
        void logError(
          "Approval Recommended",
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

      if (!updatedRows || updatedRows.length === 0) {
        setToast(
          "error",
          "This request's status has changed. Please reload the page and try again.",
        );
        setUpdateStatusFlow(!updateStatusFlow);
        setSaving(false);
        return;
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
          message: "Approval Recommended",
          tracker_flow_id: data.id,
          user_id: session?.user.id,
        };

        const { error: error2 } = await supabase
          .from("hrm_tracker_logs")
          .insert(newData)
          .eq("id", documentData.id);

        if (error2) {
          void logError(
            "Approval Recommended Flow Logs",
            "hrm_tracker_flow",
            "",
            error2.message,
          );
        }
      }

      // Update data in redux
      const items = [...globallist];
      const updatedData = { ...newData, id: documentData.id };
      const foundIndex = items.findIndex((x) => x.id === updatedData.id);
      items[foundIndex] = { ...items[foundIndex], ...updatedData };
      dispatch(updateList(items));
      setDocumentData(items[foundIndex]); // update ui with new data

      // Notify requester and follower
      void handleNotify(items[foundIndex], "Approval Recommended");

      // pop up the success message
      setToast("success", "Successfully saved.");

      // Recount sidebar counter
      dispatch(recount());

      setUpdateStatusFlow(!updateStatusFlow);
      setSaving(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleConfirmedCancel = async () => {
    if (saving) return;

    setSaving(true);

    const newData = {
      current_status: "Cancelled",
      current_approver_id: session?.user.id,
    };
    try {
      // Atomic guard: only cancel if the request hasn't already reached a
      // terminal status, so a stale modal can't insert a duplicate log or
      // re-delete leave dates.
      const { data: updatedRows, error } = await supabase
        .from("hrm_request_trackers")
        .update(newData)
        .eq("id", documentData.id)
        .neq("current_status", "Approved")
        .neq("current_status", "Disapproved")
        .neq("current_status", "Cancelled")
        .select();

      if (error) {
        void logError(
          "Cancel Request",
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

      if (!updatedRows || updatedRows.length === 0) {
        setToast(
          "error",
          "This request's status has changed. Please reload the page and try again.",
        );
        setUpdateStatusFlow(!updateStatusFlow);
        setSaving(false);
        return;
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
          message: "Cancelled",
          tracker_flow_id: data.id,
          user_id: session?.user.id,
        };

        const { error: error2 } = await supabase
          .from("hrm_tracker_logs")
          .insert(newData)
          .eq("id", documentData.id);

        if (error2) {
          void logError(
            "Cancel Request Flow Logs",
            "hrm_tracker_flow",
            "",
            error2.message,
          );
        }
      }

      // from leave days
      await deleteleaveDays();

      // Update data in redux
      const items = [...globallist];
      const updatedData = { ...newData, id: documentData.id };
      const foundIndex = items.findIndex((x) => x.id === updatedData.id);
      items[foundIndex] = { ...items[foundIndex], ...updatedData };
      dispatch(updateList(items));
      setDocumentData(items[foundIndex]); // update ui with new data

      // pop up the success message
      setToast("success", "Successfully saved.");

      setUpdateStatusFlow(!updateStatusFlow);
      setSaving(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleConfirmedDisapprove = async () => {
    if (saving) return;

    setSaving(true);

    const newData = {
      current_status: "Disapproved",
      current_approver_id: session?.user.id,
    };
    try {
      // Atomic guard: only disapprove if the request hasn't already reached a
      // terminal status, so a stale modal can't insert a duplicate flow entry
      // or re-delete leave dates.
      const { data: updatedRows, error } = await supabase
        .from("hrm_request_trackers")
        .update(newData)
        .eq("id", documentData.id)
        .neq("current_status", "Approved")
        .neq("current_status", "Disapproved")
        .neq("current_status", "Cancelled")
        .select();

      if (error) {
        void logError(
          "Disapproved",
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

      if (!updatedRows || updatedRows.length === 0) {
        setToast(
          "error",
          "This request's status has changed. Please reload the page and try again.",
        );
        setUpdateStatusFlow(!updateStatusFlow);
        setSaving(false);
        return;
      }

      // add to tracker flow
      const { error: error2 } = await supabase.from("hrm_tracker_flow").insert({
        tracker_id: documentData.id,
        user_id: session?.user.id,
        status: "Disapproved",
      });

      if (error2) {
        void logError("Disapproved", "hrm_tracker_flow", "", error2.message);
        setToast(
          "error",
          "Saving failed, please reload the page and try again.",
        );
        throw new Error(error2.message);
      }

      // from leave days
      await deleteleaveDays();

      // Update data in redux
      const items = [...globallist];
      const updatedData = { ...newData, id: documentData.id };
      const foundIndex = items.findIndex((x) => x.id === updatedData.id);
      items[foundIndex] = { ...items[foundIndex], ...updatedData };
      dispatch(updateList(items));
      setDocumentData(items[foundIndex]); // update ui with new data

      // Notify requester and follower
      void handleNotify(items[foundIndex], "Disapproved");

      // pop up the success message
      setToast("success", "Successfully saved.");

      // Recount sidebar counter
      dispatch(recount());

      setUpdateStatusFlow(!updateStatusFlow);
      setSaving(false);
    } catch (e) {
      console.error(e);
    }
  };

  const deleteleaveDays = async () => {
    // from leave days
    const { error: error3 } = await supabase
      .from("hrm_leave_dates")
      .delete()
      .eq("tracker_id", documentData.id);

    if (error3) {
      void logError(
        "Disapproved - delete leave dates",
        "hrm_leave_days",
        "",
        error3.message,
      );
      setToast("error", "Saving failed, please reload the page and try again.");
    }
  };

  const handleSaveLeaveDates = async () => {
    if (!leaveFrom || !leaveTo || savingLeaveDates) return;
    const start = new Date(leaveFrom);
    const end = new Date(leaveTo);
    if (start > end) {
      setToast("error", "Leave From must be before Leave To.");
      return;
    }

    setSavingLeaveDates(true);
    try {
      const dateRange = eachDayOfInterval({ start, end }).filter(
        (date) => includeWeekend || (date.getDay() !== 0 && date.getDay() !== 6),
      );

      const paidCount = Number(documentData.leave_days_with_pay) || 0;
      const insertArray = dateRange.map((date, index) => ({
        tracker_id: documentData.id,
        date: format(date, "yyyy-MM-dd"),
        is_paid: index < paidCount,
      }));

      const { error: deleteErr } = await supabase
        .from("hrm_leave_dates")
        .delete()
        .eq("tracker_id", documentData.id);

      if (deleteErr) {
        void logError(
          "Edit Leave Dates - Delete",
          "hrm_leave_dates",
          "",
          deleteErr.message,
        );
        setToast("error", "Failed to update leave dates.");
        return;
      }

      const { error: insertErr } = await supabase
        .from("hrm_leave_dates")
        .insert(insertArray);

      if (insertErr) {
        void logError(
          "Edit Leave Dates - Insert",
          "hrm_leave_dates",
          "",
          insertErr.message,
        );
        setToast("error", "Failed to update leave dates.");
        return;
      }

      const { error: updateErr } = await supabase
        .from("hrm_request_trackers")
        .update({ leave_from: leaveFrom, leave_to: leaveTo })
        .eq("id", documentData.id);

      if (updateErr) {
        void logError(
          "Edit Leave Dates - Update Tracker",
          "hrm_request_trackers",
          "",
          updateErr.message,
        );
      }

      const updatedLeaveDates = insertArray.map((d) => ({
        ...d,
        id: undefined,
      }));
      setDocumentData((prev) => ({
        ...prev,
        leave_from: leaveFrom,
        leave_to: leaveTo,
        leave_dates: updatedLeaveDates,
      }));

      const items = [...globallist];
      const foundIndex = items.findIndex((x) => x.id === documentData.id);
      if (foundIndex >= 0) {
        items[foundIndex] = {
          ...items[foundIndex],
          leave_from: leaveFrom,
          leave_to: leaveTo,
          leave_dates: updatedLeaveDates,
        };
        dispatch(updateList(items));
      }

      setToast("success", "Leave dates updated successfully.");
      setShowEditLeaveDates(false);
    } catch (e) {
      console.error(e);
      setToast("error", "Failed to update leave dates.");
    } finally {
      setSavingLeaveDates(false);
    }
  };

  const handleSaveEditDates = async () => {
    if (savingDates) return;

    setSavingDates(true);
    try {
      const type = documentData.type;
      let updateFields: Record<string, string> = {};

      if (type === "Locator Slip") {
        if (!editDateFrom) {
          setToast("error", "Travel date is required.");
          return;
        }
        updateFields = {
          locator_slip_date: editDateFrom,
          ...(editDateTo ? { locator_slip_return_date: editDateTo } : {}),
        };
      } else if (type === "Pass Slip") {
        if (!editDateFrom) {
          setToast("error", "Date is required.");
          return;
        }
        updateFields = { pass_slip_date: editDateFrom };
      } else if (type === "Travel Authority") {
        if (!editDateFrom || !editDateTo) {
          setToast("error", "Both From and To dates are required.");
          return;
        }
        if (new Date(editDateFrom) > new Date(editDateTo)) {
          setToast("error", "From date must be before To date.");
          return;
        }
        updateFields = {
          travel_from: editDateFrom,
          travel_to: editDateTo,
        };
      } else {
        return;
      }

      const { error } = await supabase
        .from("hrm_request_trackers")
        .update(updateFields)
        .eq("id", documentData.id);

      if (error) {
        void logError(
          "Edit Request Dates",
          "hrm_request_trackers",
          JSON.stringify(updateFields),
          error.message,
        );
        setToast("error", "Failed to update dates.");
        return;
      }

      setDocumentData((prev) => ({
        ...prev,
        ...updateFields,
      }));

      const items = [...globallist];
      const foundIndex = items.findIndex((x) => x.id === documentData.id);
      if (foundIndex >= 0) {
        items[foundIndex] = {
          ...items[foundIndex],
          ...updateFields,
        };
        dispatch(updateList(items));
      }

      setToast("success", "Dates updated successfully.");
      setShowEditDates(false);
    } catch (e) {
      console.error(e);
      setToast("error", "Failed to update dates.");
    } finally {
      setSavingDates(false);
    }
  };

  const fetchAttachments = async () => {
    setLoadingReplies(true);

    const { data, error } = await supabase.storage
      .from("hrm_documents")
      .list(`requests/${documentData.id}`, {
        limit: 100,
        offset: 0,
        sortBy: { column: "name", order: "asc" },
      });

    if (error) console.error(error);
    setLoadingReplies(false);

    setAttachments(data ?? []);
  };

  const onDrop = useCallback((acceptedFiles: FileWithPath[]) => {
    setSelectedImages(
      acceptedFiles.map((file) =>
        Object.assign(file, {
          filename: file.name,
        }),
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

  const handleUploadFiles = async () => {
    const id = documentData.id.toString();
    const newAttachments: any = [];

    setUploading(true);

    // Upload attachments
    // Ensure selectedImages is an array of File objects
    const uploads = await Promise.all(
      selectedImages.map(async (file: File) => {
        const { error } = await supabase.storage
          .from("hrm_documents")
          .upload(`requests/${id}/${file.name}`, file);

        if (error) {
          console.error(`Failed to upload ${file.name}:`, error.message);
          return null;
        }

        return { name: file.name };
      }),
    );

    // Filter out failed uploads and update attachments
    const successfulUploads = uploads.filter(
      (file): file is { name: string } => file !== null,
    );
    newAttachments.push(...successfulUploads);

    setSelectedImages([]);
    setUploading(false);
    setToast("success", "Successfully uploaded.");

    setAttachments([...attachments, ...newAttachments]);
  };

  const deleteFile = (file: FileWithPath) => {
    const files = selectedImages.filter(
      (f: FileWithPath) => f.path !== file.path,
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

  const handleAddToStickies = async (item: DocumentTypes) => {
    setShowAddStickyModal(true);
    setSelectedItem(item);
  };

  const handleSelectedUsers = (selectedUsers: Employee[]) => {
    if (selectedUsers.length > 0) {
      setSelectedUser(selectedUsers[0]);
    } else {
      setSelectedUser(null);
    }
  };

  useEffect(() => {
    if (fileRejections.length > 0) {
      setSelectedImages([]);
    }
  }, [fileRejections]);

  useEffect(() => {
    void fetchAttachments();
  }, []);

  useEffect(() => {
    const checkedFollowStatus = async () => {
      const { count } = await supabase
        .from("hrm_tracker_followers")
        .select("*", { count: "exact" })
        .eq("user_id", user.id)
        .eq("tracker_id", documentData.id);

      if (count && count > 0) {
        setHideFollowButton(true);
      }
    };

    const checkedIfStickyStatus = async () => {
      const { count } = await supabase
        .from("hrm_request_tracker_stickies")
        .select("*", { count: "exact" })
        .eq("user_id", user.id)
        .eq("tracker_id", documentData.id);

      if (count && count > 0) {
        setHideStickyButton(true);
      }
    };

    void checkedFollowStatus();
    void checkedIfStickyStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wrapperRef]);

  return (
    <div ref={wrapperRef} className="app__modal_wrapper">
      <div className="app__modal_wrapper2_large">
        <div className="app__modal_wrapper3">
          <div className="app__modal_header">
            <h5 className="app__modal_header_text flex-1">Request Details</h5>
            <div className="flex space-x-4 items-center justify-end">
              {!hideStickyButton && (
                <>
                  <StarIcon
                    onClick={() => handleAddToStickies(documentData)}
                    className="cursor-pointer outline-none w-6 h-6 text-yellow-500"
                    data-tooltip-id="add-sticky-tooltip"
                    data-tooltip-content="Add to Stickies"
                  />
                  <Tooltip id="add-sticky-tooltip" place="bottom-end" />
                </>
              )}
              {!hideFollowButton ? (
                <>
                  <BellSlashIcon
                    onClick={handleFollow}
                    className="w-6 h-6 text-blue-700 cursor-pointer outline-none"
                    data-tooltip-id="follow-tooltip"
                    data-tooltip-content="Follow/Unfollow"
                  />
                  <Tooltip id="follow-tooltip" place="bottom-end" />
                </>
              ) : (
                <>
                  <BellAlertIcon
                    onClick={handleUnfollow}
                    className="w-6 h-6 text-blue-700 cursor-pointer outline-none"
                    data-tooltip-id="follow-tooltip"
                    data-tooltip-content="Follow/Unfollow"
                  />
                  <Tooltip id="follow-tooltip" place="bottom-end" />
                </>
              )}
              <CustomButton
                containerStyles="app__btn_gray"
                title="Close"
                btnType="button"
                handleClick={hideModal}
              />
            </div>
          </div>
          <div className="flex space-x-2 items-center justify-between border-b p-4 bg-orange-50">
            <div className="w-full">
              {/* Cancel Request */}
              {documentData.created_by === session?.user.id &&
                documentData.current_status !== "Approved" &&
                documentData.current_status !== "Disapproved" &&
                documentData.current_status !== "Cancelled" && (
                  <div className="mb-6">
                    <div className="space-x-2">
                      <CustomButton
                        containerStyles="app__btn_blue"
                        title={saving ? "Saving..." : "Cancel This Request"}
                        btnType="button"
                        handleClick={() => HandleConfirm("Cancel")}
                      />
                    </div>
                    <div className="text-[10px] mt-1 text-gray-600">
                      Requests can only be cancelled by the requester, by
                      clicking this button, your request process will be
                      terminated.
                    </div>
                  </div>
                )}
              {/* Recommending Approval */}
              {
                // documentData.current_approver_id !== session?.user.id &&
                documentData.receiver_id === session?.user.id &&
                  documentData.current_status !== "Approval Recommended" &&
                  documentData.current_status !== "Approved" &&
                  documentData.current_status !== "Disapproved" &&
                  documentData.current_status !== "Cancelled" &&
                  !hasAccess("sdsssss") && (
                    <div className="mb-6">
                      <div className="space-x-2">
                        <CustomButton
                          containerStyles="app__btn_green"
                          title={saving ? "Saving..." : "Recommend Approval"}
                          btnType="button"
                          handleClick={() =>
                            HandleConfirm("Recommend Approval")
                          }
                        />
                        <CustomButton
                          containerStyles="app__btn_red"
                          title={saving ? "Saving..." : "Disapprove"}
                          btnType="button"
                          handleClick={() => HandleConfirm("Disapprove")}
                        />
                      </div>
                      <div className="text-[10px] mt-1 text-gray-600">
                        By clicking &apos;Approve&apos;, you are authorizing and
                        granting permission to the requester to proceed with the
                        specified request.
                      </div>
                    </div>
                  )
              }
              {/* Final Approval */}
              {documentData.receiver_id === session?.user.id &&
                documentData.current_status === "Approval Recommended" &&
                (hasAccess("temporary_approver") ||
                  hasAccess("sds") ||
                  hasAccess("asds") ||
                  session?.user.email === "berlcamp@gmail.com") && (
                  <div className="mb-6">
                    <div className="space-x-2">
                      <CustomButton
                        containerStyles="app__btn_green"
                        title={saving ? "Saving..." : "Approve"}
                        btnType="button"
                        handleClick={() => HandleConfirm("Approve")}
                      />
                      <CustomButton
                        containerStyles="app__btn_orange"
                        title="For Reverification"
                        btnType="button"
                        handleClick={() => HandleConfirm("For Reverification")}
                      />
                      <CustomButton
                        containerStyles="app__btn_red"
                        title={saving ? "Saving..." : "Disapprove"}
                        btnType="button"
                        handleClick={() => HandleConfirm("Disapprove")}
                      />
                    </div>
                    <div className="text-[10px] mt-1 text-gray-600">
                      By clicking &apos;Approve&apos;, you are authorizing and
                      granting permission to the requester to proceed with the
                      specified request.
                    </div>
                  </div>
                )}
              {/* Revert Approval (super admin only) - for fixing leave requests approved before credits were certified */}
              {isSuperAdmin &&
                documentData.type === "Leave" &&
                documentData.current_status === "Approved" && (
                  <div className="mb-6">
                    <div className="space-x-2">
                      <CustomButton
                        containerStyles="app__btn_orange"
                        title={
                          loadingRevertPreview
                            ? "Loading..."
                            : "Revert to Approval Recommended"
                        }
                        btnType="button"
                        handleClick={() => {
                          void handleOpenRevertPreview();
                        }}
                      />
                    </div>
                    <div className="text-[10px] mt-1 text-gray-600">
                      Use this if the leave request was approved without
                      certifying leave credits first. This restores the
                      deducted leave credit/CTO balances and removes the
                      leave card entry, then sends it back to &apos;Approval
                      Recommended&apos; so it can be certified and re-approved.
                    </div>
                  </div>
                )}
              {/* Forward */}
              {((documentData.receiver_id === session?.user.id &&
                documentData.current_status !== "Disapproved" &&
                documentData.current_status !== "Cancelled" &&
                documentData.current_status !== "Approved") ||
                hasAccess("settings") ||
                hasAccess("tracker_manager")) && (
                <div className="">
                  <div className="font-medium text-sm text-gray-700">
                    Forward this request to:
                  </div>
                  <div className="flex w-full space-x-2">
                    <SearchUserInput
                      isMultiple={false}
                      excludedIds={session ? [session.user.id] : []}
                      classNames="w-1/2"
                      handleSelectedUsers={handleSelectedUsers}
                    />
                    <CustomButton
                      containerStyles="app__btn_green"
                      title={saving ? "Saving..." : "Forward"}
                      btnType="button"
                      handleClick={() => HandleConfirm("Forward")}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="modal-body relative overflow-x-scroll">
            {/* Document Details */}
            <div className="py-2">
              <div className="flex flex-col lg:flex-row w-full items-start justify-between space-x-2 text-xs dark:text-gray-400">
                {/* First Column */}
                <div className="px-4 w-full">
                  <table className="w-full">
                    <thead>
                      <tr>
                        <th className="w-40"></th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="px-2 py-2 font-light text-right">
                          Request Type:
                        </td>
                        <td className="text-sm font-medium">
                          {documentData.type}
                        </td>
                      </tr>
                      <tr>
                        <td className="px-2 py-2 font-light text-right">
                          Current Status:
                        </td>
                        <td>
                          {documentData.current_status ===
                            "For Verification" && (
                            <span className="app__status_orange">
                              {documentData.current_status}
                            </span>
                          )}
                          {documentData.current_status ===
                            "Approval Recommended" && (
                            <span className="app__status_green">
                              {documentData.current_status}
                            </span>
                          )}
                          {documentData.current_status === "Cancelled" && (
                            <span className="app__status_blue">
                              {documentData.current_status}
                            </span>
                          )}
                          {documentData.current_status === "Approved" && (
                            <span className="app__status_green">
                              {documentData.current_status}
                            </span>
                          )}
                          {documentData.current_status === "Disapproved" && (
                            <span className="app__status_red">
                              {documentData.current_status}
                            </span>
                          )}
                        </td>
                      </tr>
                      <tr>
                        <td className="px-2 py-2 font-light text-right">
                          Reference Code:
                        </td>
                        <td>
                          <span className="font-medium text-sm">
                            {documentData.reference_code}
                            {session?.user.email === "berlcamp@gmail.com" &&
                              ` - ${documentData.id}`}
                          </span>
                        </td>
                      </tr>
                      {/* Leave Requests Fields */}
                      {documentData.type === "Leave" && (
                        <>
                          <tr>
                            <td className="px-2 py-2 font-light text-right">
                              Leave Type:
                            </td>
                            <td className="text-sm font-medium">
                              {documentData.leave_type ===
                                "Mandatory/Force Leave" ||
                              documentData.leave_type ===
                                "Mandatory/Forced Leave"
                                ? "Mandatory/Forced Leave"
                                : documentData.leave_type}{" "}
                              {documentData.leave_others_specify ?? ""}
                              {documentData.leave_other_purpose ?? ""}
                            </td>
                          </tr>
                          {documentData.leave_days &&
                            documentData.leave_days.trim() !== "" && (
                              <tr>
                                <td className="px-2 py-2 font-light text-right">
                                  Number of working days applied for:
                                </td>
                                <td className="text-sm font-medium">
                                  {documentData.leave_days}
                                </td>
                              </tr>
                            )}
                          <tr>
                            <td className="px-2 py-2 font-light text-right">
                              Inclusive Dates:
                            </td>
                            <td className="text-sm font-medium">
                              <div className="text-xs">
                                {documentData.leave_dates?.length > 10 ? (
                                  <span>
                                    From{" "}
                                    <span className="inline-flex border border-blue-500 px-1 py-px font-semibold bg-blue-200 text-gray-900 mr-2">
                                      {format(
                                        new Date(
                                          documentData.leave_dates
                                            .slice() // Create a shallow copy to avoid mutating the original array
                                            .sort(
                                              (a, b) =>
                                                new Date(a.date).getTime() -
                                                new Date(b.date).getTime(),
                                            )[0].date,
                                        ),
                                        "MMM d, yyyy",
                                      )}
                                    </span>
                                    to{" "}
                                    <span className="inline-flex border border-blue-500 px-1 py-px font-semibold bg-blue-200 text-gray-900 mr-2">
                                      {format(
                                        new Date(
                                          documentData.leave_dates
                                            .slice() // Create a shallow copy to avoid mutating the original array
                                            .sort(
                                              (a, b) =>
                                                new Date(a.date).getTime() -
                                                new Date(b.date).getTime(),
                                            )[
                                            documentData.leave_dates.length - 1
                                          ].date,
                                        ),
                                        "MMM d, yyyy",
                                      )}
                                    </span>
                                  </span>
                                ) : (
                                  documentData.leave_dates?.map((day) => (
                                    <span
                                      className="inline-flex border border-blue-500 px-1 py-px font-semibold bg-blue-200 text-gray-900 mr-2"
                                      key={day.id}
                                    >
                                      {format(
                                        new Date(day.date),
                                        "MMM d, yyyy",
                                      )}
                                    </span>
                                  ))
                                )}
                              </div>
                            </td>
                          </tr>
                          {isSuperAdmin && documentData.leave_dates?.length > 0 && (
                            <tr>
                              <td className="px-2 py-2 font-light text-right">
                                Edit dates:
                              </td>
                              <td className="text-sm">
                                {!showEditLeaveDates ? (
                                  <CustomButton
                                    containerStyles="app__btn_blue_xs"
                                    title="Edit Date Range"
                                    btnType="button"
                                    handleClick={() => {
                                      const sorted = [
                                        ...(documentData.leave_dates ?? []),
                                      ].sort(
                                        (a, b) =>
                                          new Date(a.date).getTime() -
                                          new Date(b.date).getTime(),
                                      );
                                      setLeaveFrom(
                                        sorted[0]?.date?.slice(0, 10) ?? "",
                                      );
                                      setLeaveTo(
                                        sorted[sorted.length - 1]?.date?.slice(
                                          0,
                                          10,
                                        ) ?? "",
                                      );
                                      setShowEditLeaveDates(true);
                                    }}
                                  />
                                ) : (
                                  <div className="space-y-2">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <input
                                        type="date"
                                        value={leaveFrom}
                                        onChange={(e) =>
                                          setLeaveFrom(e.target.value)
                                        }
                                        className="app__input_standard max-w-[140px]"
                                      />
                                      <span className="text-gray-500">to</span>
                                      <input
                                        type="date"
                                        value={leaveTo}
                                        onChange={(e) =>
                                          setLeaveTo(e.target.value)
                                        }
                                        className="app__input_standard max-w-[140px]"
                                      />
                                    </div>
                                    <label className="flex items-center gap-1 text-xs">
                                      <input
                                        type="checkbox"
                                        checked={includeWeekend}
                                        onChange={(e) =>
                                          setIncludeWeekend(e.target.checked)
                                        }
                                      />
                                      Include weekend
                                    </label>
                                    <div className="flex gap-2">
                                      <CustomButton
                                        containerStyles="app__btn_green"
                                        title={
                                          savingLeaveDates ? "Saving..." : "Save"
                                        }
                                        btnType="button"
                                        handleClick={handleSaveLeaveDates}
                                      />
                                      <CustomButton
                                        containerStyles="app__btn_gray"
                                        title="Cancel"
                                        btnType="button"
                                        handleClick={() =>
                                          setShowEditLeaveDates(false)
                                        }
                                      />
                                    </div>
                                  </div>
                                )}
                              </td>
                            </tr>
                          )}
                          {documentData.leave_location &&
                            documentData.leave_location.trim() !== "" && (
                              <tr>
                                <td className="px-2 py-2 font-light text-right">
                                  Location:
                                </td>
                                <td className="text-sm font-medium">
                                  {documentData.leave_location}{" "}
                                  {documentData.leave_specify_location}
                                </td>
                              </tr>
                            )}
                          {documentData.leave_reason &&
                            documentData.leave_reason.trim() !== "" && (
                              <tr>
                                <td className="px-2 py-2 font-light text-right">
                                  Reason:
                                </td>
                                <td className="text-sm font-medium">
                                  {documentData.leave_reason}
                                </td>
                              </tr>
                            )}
                          {documentData.leave_hospitalization &&
                            documentData.leave_hospitalization.trim() !==
                              "" && (
                              <tr>
                                <td className="px-2 py-2 font-light text-right">
                                  Hospitalization:
                                </td>
                                <td className="text-sm font-medium">
                                  {documentData.leave_hospitalization} -{" "}
                                  {documentData.leave_illness}
                                </td>
                              </tr>
                            )}
                          {documentData.leave_women_illness &&
                            documentData.leave_women_illness.trim() !== "" && (
                              <tr>
                                <td className="px-2 py-2 font-light text-right">
                                  Illness:
                                </td>
                                <td className="text-sm font-medium">
                                  {documentData.leave_women_illness}
                                </td>
                              </tr>
                            )}
                          {documentData.leave_study_purpose &&
                            documentData.leave_study_purpose.trim() !== "" && (
                              <tr>
                                <td className="px-2 py-2 font-light text-right">
                                  Study Purpose:
                                </td>
                                <td className="text-sm font-medium">
                                  {documentData.leave_study_purpose}
                                </td>
                              </tr>
                            )}
                          {documentData.leave_other_purpose &&
                            documentData.leave_other_purpose.trim() !== "" && (
                              <tr>
                                <td className="px-2 py-2 font-light text-right">
                                  Other Purpose:
                                </td>
                                <td className="text-sm font-medium">
                                  {documentData.leave_other_purpose}
                                </td>
                              </tr>
                            )}
                          {documentData.leave_commutation &&
                            documentData.leave_commutation.trim() !== "" && (
                              <tr>
                                <td className="px-2 py-2 font-light text-right">
                                  Commutation:
                                </td>
                                <td className="text-sm font-medium">
                                  {documentData.leave_commutation}
                                </td>
                              </tr>
                            )}
                        </>
                      )}
                      {/* End - Leave Requests Fields */}

                      {/* Locator Slip Fields */}
                      {documentData.type === "Locator Slip" && (
                        <>
                          <tr>
                            <td className="px-2 py-2 font-light text-right">
                              Travel Type:
                            </td>
                            <td className="text-sm font-medium">
                              {documentData.locator_slip_type}
                            </td>
                          </tr>
                          <tr>
                            <td className="px-2 py-2 font-light text-right">
                              Purpose:
                            </td>
                            <td className="text-sm font-medium">
                              {documentData.locator_slip_purpose}
                            </td>
                          </tr>
                          <tr>
                            <td className="px-2 py-2 font-light text-right">
                              Travel Date/Time:
                            </td>
                            <td className="text-sm font-medium">
                              {format(
                                new Date(documentData.locator_slip_date),
                                "MMMM dd, yyyy",
                              )}
                              {" - "}
                              {documentData.locator_slip_time}
                            </td>
                          </tr>
                          <tr>
                            <td className="px-2 py-2 font-light text-right">
                              Return Date/Time:
                            </td>
                            <td className="text-sm font-medium">
                              {documentData.locator_slip_return_date &&
                                format(
                                  new Date(
                                    documentData.locator_slip_return_date,
                                  ),
                                  "MMMM dd, yyyy",
                                )}
                              {" - "}
                              {documentData.locator_slip_return_time}
                            </td>
                          </tr>
                          <tr>
                            <td className="px-2 py-2 font-light text-right">
                              Destination:
                            </td>
                            <td className="text-sm font-medium">
                              {documentData.locator_slip_destination}
                            </td>
                          </tr>
                          {isSuperAdmin && (
                            <tr>
                              <td className="px-2 py-2 font-light text-right">
                                Edit dates:
                              </td>
                              <td className="text-sm">
                                {!showEditDates ? (
                                  <CustomButton
                                    containerStyles="app__btn_blue_xs"
                                    title="Edit Dates"
                                    btnType="button"
                                    handleClick={() => {
                                      setEditDateFrom(
                                        documentData.locator_slip_date?.slice(0, 10) ?? "",
                                      );
                                      setEditDateTo(
                                        documentData.locator_slip_return_date?.slice(0, 10) ?? "",
                                      );
                                      setShowEditDates(true);
                                    }}
                                  />
                                ) : (
                                  <div className="space-y-2">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <label className="text-xs text-gray-500">Travel:</label>
                                      <input
                                        type="date"
                                        value={editDateFrom}
                                        onChange={(e) => setEditDateFrom(e.target.value)}
                                        className="app__input_standard max-w-[140px]"
                                      />
                                      <label className="text-xs text-gray-500">Return:</label>
                                      <input
                                        type="date"
                                        value={editDateTo}
                                        onChange={(e) => setEditDateTo(e.target.value)}
                                        className="app__input_standard max-w-[140px]"
                                      />
                                    </div>
                                    <div className="flex gap-2">
                                      <CustomButton
                                        containerStyles="app__btn_green"
                                        title={savingDates ? "Saving..." : "Save"}
                                        btnType="button"
                                        handleClick={handleSaveEditDates}
                                      />
                                      <CustomButton
                                        containerStyles="app__btn_gray"
                                        title="Cancel"
                                        btnType="button"
                                        handleClick={() => setShowEditDates(false)}
                                      />
                                    </div>
                                  </div>
                                )}
                              </td>
                            </tr>
                          )}
                        </>
                      )}
                      {/* End - Locator Slip Fields */}

                      {/* Service Record Print Request Fields */}
                      {documentData.type === "Service Record Print Request" && (
                        <>
                          <tr>
                            <td className="px-2 py-2 font-light text-right">
                              Purpose:
                            </td>
                            <td className="text-sm font-medium">
                              {
                                documentData.service_record_print_request_purpose
                              }
                            </td>
                          </tr>
                        </>
                      )}
                      {/* End - Locator Slip Fields */}

                      {/* Service Undertime Permit Fields */}
                      {documentData.type === "Undertime Permit" && (
                        <>
                          <tr>
                            <td className="px-2 py-2 font-light text-right">
                              Time to leave the office:
                            </td>
                            <td className="text-sm font-medium">
                              {documentData.undertime_permit_time}
                            </td>
                          </tr>
                          <tr>
                            <td className="px-2 py-2 font-light text-right">
                              Reason:
                            </td>
                            <td className="text-sm font-medium">
                              {documentData.undertime_permit_reason}
                            </td>
                          </tr>
                        </>
                      )}
                      {/* End - Undertime Permit Fields */}

                      {/* Pass Slip Fields */}
                      {documentData.type === "Pass Slip" && (
                        <>
                          <tr>
                            <td className="px-2 py-2 font-light text-right">
                              Request Permission To:
                            </td>
                            <td className="text-sm font-medium">
                              {documentData.pass_slip_type}
                            </td>
                          </tr>
                          {documentData.pass_slip_date &&
                            documentData.pass_slip_date.trim() !== "" && (
                              <tr>
                                <td className="px-2 py-2 font-light text-right">
                                  Date:
                                </td>
                                <td className="text-sm font-medium">
                                  {format(
                                    new Date(documentData.pass_slip_date),
                                    "MMMM dd, yyyy",
                                  )}
                                </td>
                              </tr>
                            )}
                          {documentData.pass_slip_intended_time_departure &&
                            documentData.pass_slip_intended_time_departure.trim() !==
                              "" && (
                              <tr>
                                <td className="px-2 py-2 font-light text-right">
                                  Intended Time of Departure:
                                </td>
                                <td className="text-sm font-medium">
                                  {
                                    documentData.pass_slip_intended_time_departure
                                  }
                                </td>
                              </tr>
                            )}
                          {documentData.pass_slip_intended_time_arrival &&
                            documentData.pass_slip_intended_time_arrival.trim() !==
                              "" && (
                              <tr>
                                <td className="px-2 py-2 font-light text-right">
                                  Intended Time of Arrival:
                                </td>
                                <td className="text-sm font-medium">
                                  {documentData.pass_slip_intended_time_arrival}
                                </td>
                              </tr>
                            )}
                          {documentData.pass_slip_fixed_time_from &&
                            documentData.pass_slip_fixed_time_from.trim() !==
                              "" && (
                              <tr>
                                <td className="px-2 py-2 font-light text-right">
                                  From:
                                </td>
                                <td className="text-sm font-medium">
                                  {documentData.pass_slip_fixed_time_from}
                                </td>
                              </tr>
                            )}
                          {documentData.pass_slip_fixed_time_to &&
                            documentData.pass_slip_fixed_time_to.trim() !==
                              "" && (
                              <tr>
                                <td className="px-2 py-2 font-light text-right">
                                  To:
                                </td>
                                <td className="text-sm font-medium">
                                  {documentData.pass_slip_fixed_time_to}
                                </td>
                              </tr>
                            )}
                          <tr>
                            <td className="px-2 py-2 font-light text-right">
                              Purpose:
                            </td>
                            <td className="text-sm font-medium">
                              {documentData.pass_slip_purpose}
                            </td>
                          </tr>
                          <tr>
                            <td className="px-2 py-2 font-light text-right">
                              Reason:
                            </td>
                            <td className="text-sm font-medium">
                              {documentData.pass_slip_reason}
                            </td>
                          </tr>
                          {isSuperAdmin && (
                            <tr>
                              <td className="px-2 py-2 font-light text-right">
                                Edit dates:
                              </td>
                              <td className="text-sm">
                                {!showEditDates ? (
                                  <CustomButton
                                    containerStyles="app__btn_blue_xs"
                                    title="Edit Date"
                                    btnType="button"
                                    handleClick={() => {
                                      setEditDateFrom(
                                        documentData.pass_slip_date?.slice(0, 10) ?? "",
                                      );
                                      setShowEditDates(true);
                                    }}
                                  />
                                ) : (
                                  <div className="space-y-2">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <label className="text-xs text-gray-500">Date:</label>
                                      <input
                                        type="date"
                                        value={editDateFrom}
                                        onChange={(e) => setEditDateFrom(e.target.value)}
                                        className="app__input_standard max-w-[140px]"
                                      />
                                    </div>
                                    <div className="flex gap-2">
                                      <CustomButton
                                        containerStyles="app__btn_green"
                                        title={savingDates ? "Saving..." : "Save"}
                                        btnType="button"
                                        handleClick={handleSaveEditDates}
                                      />
                                      <CustomButton
                                        containerStyles="app__btn_gray"
                                        title="Cancel"
                                        btnType="button"
                                        handleClick={() => setShowEditDates(false)}
                                      />
                                    </div>
                                  </div>
                                )}
                              </td>
                            </tr>
                          )}
                        </>
                      )}
                      {/* End - Pass Slip Fields */}

                      {/* Travel Authority Fields */}
                      {documentData.type === "Travel Authority" && (
                        <>
                          <tr>
                            <td className="px-2 py-2 font-light text-right">
                              Travel Type:
                            </td>
                            <td className="text-sm font-medium">
                              {documentData.travel_type} /{" "}
                              {documentData.travel_official_type}
                            </td>
                          </tr>
                          <tr>
                            <td className="px-2 py-2 font-light text-right">
                              Purpose:
                            </td>
                            <td className="text-sm font-medium">
                              {documentData.travel_purpose}
                            </td>
                          </tr>
                          <tr>
                            <td className="px-2 py-2 font-light text-right">
                              Inclusive Date (From):
                            </td>
                            <td className="text-sm font-medium">
                              {format(
                                new Date(documentData.travel_from),
                                "MMMM dd, yyyy",
                              )}
                            </td>
                          </tr>
                          <tr>
                            <td className="px-2 py-2 font-light text-right">
                              Inclusive Date (To):
                            </td>
                            <td className="text-sm font-medium">
                              {format(
                                new Date(documentData.travel_to),
                                "MMMM dd, yyyy",
                              )}
                            </td>
                          </tr>
                          <tr>
                            <td className="px-2 py-2 font-light text-right">
                              Destination:
                            </td>
                            <td className="text-sm font-medium">
                              {documentData.travel_destination}
                            </td>
                          </tr>
                          {documentData.travel_type === "Official Travel" && (
                            <>
                              <tr>
                                <td className="px-2 py-2 font-light text-right">
                                  Fund Source:
                                </td>
                                <td className="text-sm font-medium">
                                  {documentData.travel_fund_source}
                                </td>
                              </tr>
                              <tr>
                                <td className="px-2 py-2 font-light text-right">
                                  Host of Activity:
                                </td>
                                <td className="text-sm font-medium">
                                  {documentData.travel_host}
                                </td>
                              </tr>
                            </>
                          )}
                          <tr>
                            <td className="px-2 py-2 font-light text-right">
                              Accompanied with:
                            </td>
                            <td className="text-sm font-medium">
                              {documentData.travel_with}
                            </td>
                          </tr>
                          {isSuperAdmin && (
                            <tr>
                              <td className="px-2 py-2 font-light text-right">
                                Edit dates:
                              </td>
                              <td className="text-sm">
                                {!showEditDates ? (
                                  <CustomButton
                                    containerStyles="app__btn_blue_xs"
                                    title="Edit Date Range"
                                    btnType="button"
                                    handleClick={() => {
                                      setEditDateFrom(
                                        documentData.travel_from?.slice(0, 10) ?? "",
                                      );
                                      setEditDateTo(
                                        documentData.travel_to?.slice(0, 10) ?? "",
                                      );
                                      setShowEditDates(true);
                                    }}
                                  />
                                ) : (
                                  <div className="space-y-2">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <label className="text-xs text-gray-500">From:</label>
                                      <input
                                        type="date"
                                        value={editDateFrom}
                                        onChange={(e) => setEditDateFrom(e.target.value)}
                                        className="app__input_standard max-w-[140px]"
                                      />
                                      <label className="text-xs text-gray-500">To:</label>
                                      <input
                                        type="date"
                                        value={editDateTo}
                                        onChange={(e) => setEditDateTo(e.target.value)}
                                        className="app__input_standard max-w-[140px]"
                                      />
                                    </div>
                                    <div className="flex gap-2">
                                      <CustomButton
                                        containerStyles="app__btn_green"
                                        title={savingDates ? "Saving..." : "Save"}
                                        btnType="button"
                                        handleClick={handleSaveEditDates}
                                      />
                                      <CustomButton
                                        containerStyles="app__btn_gray"
                                        title="Cancel"
                                        btnType="button"
                                        handleClick={() => setShowEditDates(false)}
                                      />
                                    </div>
                                  </div>
                                )}
                              </td>
                            </tr>
                          )}
                        </>
                      )}
                      {/* End - Travel Authority Fields */}
                    </tbody>
                  </table>
                </div>
                {/* Second Column */}
                <div className="px-2 w-full">
                  <table className="w-full">
                    <thead>
                      <tr>
                        <th className="w-40"></th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="px-2 font-light text-right align-top">
                          Requester:
                        </td>
                        <td className="font-medium align-top">
                          <div className="text-gray-500 text-[10px]">
                            {format(
                              new Date(documentData.created_at),
                              "dd MMM yyyy h:mm a",
                            )}
                          </div>
                          <UserBlock user={documentData.creator} />
                          <div className="mt-1 text-gray-600 pl-6">
                            {documentData.creator.hrm_positions?.name}
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-2 pt-2 font-light text-right align-top">
                          Attachments:
                        </td>
                        <td className="pt-2">
                          <div>
                            {attachments?.length === 0 && (
                              <span>No attachments</span>
                            )}
                            {attachments?.map((file, index) => (
                              <div
                                key={index}
                                className="flex items-center space-x-2 justify-start"
                              >
                                <Attachment
                                  file={file.name}
                                  id={documentData.id}
                                />
                              </div>
                            ))}
                          </div>
                          <div className="hidden flex-auto overflow-y-auto relative mt-4">
                            <div className="grid grid-cols-1 gap-4">
                              <div className="w-full">
                                <div
                                  {...getRootProps()}
                                  className="cursor-pointer border-dashed border-2 bg-gray-100 text-gray-600 px-4 py-10"
                                >
                                  <input {...getInputProps()} />
                                  <p className="text-xs">
                                    Drag and drop some files here, or click to
                                    select files
                                  </p>
                                </div>
                                {fileRejections.length === 0 &&
                                  selectedImages.length > 0 && (
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
                                      File rejected. Please make sure its an
                                      image, PDF, DOC, or Excel file and less
                                      than 5MB.
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                            {selectedFiles.length > 0 &&
                              fileRejections.length === 0 && (
                                <CustomButton
                                  containerStyles="app__btn_green"
                                  title={uploading ? "Uploading..." : "Upload"}
                                  btnType="button"
                                  handleClick={handleUploadFiles}
                                />
                              )}
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  {/* Certification of leave credits */}
                  {documentData.type === "Leave" &&
                    documentData.current_status !== "Cancelled" &&
                    documentData.current_status !== "Disapproved" && (
                      <CreditsCertification
                        requestData={documentData}
                        onCertified={handleCertified}
                      />
                    )}
                </div>
              </div>
            </div>
            <hr />
            <div className="py-2 md:flex">
              <div className="md:w-1/2">
                <div className="mx-2 mt-4 px-4 py-4 text-gray-600 bg-gray-100">
                  <div className="mb-6 px-4">
                    <span className="font-bold text-xs">Tracker:</span>
                  </div>
                  <StatusFlow
                    updateStatusFlow={updateStatusFlow}
                    documentId={documentData.id.toString()}
                  />
                </div>
              </div>
              <div className="flex-1">
                {loadingReplies ? (
                  <TwoColTableLoading />
                ) : (
                  <Remarks document={documentData} />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Action Confirmation Modal */}
      {showConfirmModal !== "" && (
        <ConfirmModal
          header="Confirmation"
          btnText="Confirm"
          message={confirmMessage}
          onConfirm={HandleOnConfirm}
          onCancel={handleOnCancel}
        />
      )}
      {/* Revert Approval Preview Modal (super admin only) */}
      {revertPreview && (
        <div className="app__modal_wrapper">
          <div className="app__modal_wrapper2">
            <div className="app__modal_wrapper3">
              <div className="app__modal_header">
                <h5 className="app__modal_header_text">
                  Revert to Approval Recommended
                </h5>
              </div>
              <div className="modal-body relative p-4">
                <div className="text-gray-600 text-sm mb-3">
                  This will send the request back to{" "}
                  <span className="font-medium">Approval Recommended</span>{" "}
                  so leave credits can be certified, then re-approved. The
                  following will be restored:
                </div>

                {revertPreview.credits.length === 0 && !revertPreview.coc && (
                  <div className="text-sm text-gray-600 mb-3">
                    No leave credit or CTO deductions were found for this
                    request.
                  </div>
                )}

                {revertPreview.credits.length > 0 && (
                  <div className="mb-3">
                    <div className="text-xs font-medium text-gray-700 mb-1">
                      Leave credits
                    </div>
                    <table className="w-full text-xs border">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="text-left p-1 border">Type</th>
                          <th className="text-right p-1 border">Restore</th>
                          <th className="text-right p-1 border">Current</th>
                          <th className="text-right p-1 border">New</th>
                        </tr>
                      </thead>
                      <tbody>
                        {revertPreview.credits.map((c) => (
                          <tr key={c.type}>
                            <td className="p-1 border">{c.type}</td>
                            <td className="p-1 border text-right text-green-600">
                              +{c.restore}
                            </td>
                            <td className="p-1 border text-right">
                              {c.currentBalance}
                            </td>
                            <td className="p-1 border text-right font-medium">
                              {c.newBalance}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {revertPreview.coc && (
                  <div className="mb-3">
                    <div className="text-xs font-medium text-gray-700 mb-1">
                      Compensatory Time Off (CTO/COC)
                    </div>
                    <table className="w-full text-xs border">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="text-left p-1 border">Restore</th>
                          <th className="text-right p-1 border">Current</th>
                          <th className="text-right p-1 border">New</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="p-1 border text-green-600">
                            +{revertPreview.coc.restore}
                          </td>
                          <td className="p-1 border text-right">
                            {revertPreview.coc.currentCoc}
                          </td>
                          <td className="p-1 border text-right font-medium">
                            {revertPreview.coc.newCoc}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="text-xs text-gray-600 mb-2">
                  • The leave card entry created on approval will be removed.
                </div>
                <div className="text-xs text-gray-600 mb-2">
                  • Status will change back to &apos;Approval
                  Recommended&apos; and the approved-by/date will be cleared.
                </div>
                {revertPreview.leaveDaysWithoutPay >=
                  LWOP_SERVICE_RECORD_MIN_DAYS && (
                  <div className="text-xs text-red-600 mb-2">
                    • This request had {revertPreview.leaveDaysWithoutPay}{" "}
                    days without pay (≥{LWOP_SERVICE_RECORD_MIN_DAYS}), which
                    bumped the employee&apos;s
                    step increment leave days. That will be reverted
                    automatically, but the related Service Record entry
                    cannot be matched safely and must be reviewed/deleted
                    manually.
                  </div>
                )}

                <div className="app__modal_footer">
                  <button
                    onClick={() => {
                      setRevertPreview(null);
                      void handleConfirmedRevertApproval();
                    }}
                    type="button"
                    className="flex items-center bg-emerald-500 hover:bg-emerald-600 border border-emerald-600 font-medium px-2 py-1 text-sm text-white rounded-sm"
                  >
                    Confirm Revert
                  </button>
                  <button
                    onClick={() => setRevertPreview(null)}
                    type="button"
                    className="flex items-center bg-gray-500 hover:bg-gray-600 border border-gray-600 font-medium px-2 py-1 text-sm text-white rounded-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Add to Sticky Modal */}
      {showAddStickyModal && (
        <AddStickyModal
          item={selectedItem}
          hideAddStickButton={() => setHideStickyButton(true)}
          hideModal={() => setShowAddStickyModal(false)}
        />
      )}
    </div>
  );
}
