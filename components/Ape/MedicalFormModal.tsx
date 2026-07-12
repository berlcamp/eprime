"use client";

import { CustomButton } from "@/components/index";
import { useFilter } from "@/context/FilterContext";
import { useSupabase } from "@/context/SupabaseProvider";
import { EyeIcon } from "@heroicons/react/24/solid";
import { useEffect, useState } from "react";

import type { ApeTypes } from "@/types";
import MedicalHistoryView from "./MedicalHistoryView";

interface ModalProps {
  hideModal: () => void;
  editData: ApeTypes;
}

// Read-only view of an employee's Medical History form + uploaded medical
// record file/s. Used by the Medical Officer to quickly review a record.
export default function MedicalFormModal({ hideModal, editData }: ModalProps) {
  const { setToast } = useFilter();
  const { supabase } = useSupabase();
  const [attachments, setAttachments] = useState<Array<{ name: string }>>([]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editData]);

  const fullname = `${editData.hrm_users?.firstname ?? ""} ${
    editData.hrm_users?.middlename ?? ""
  } ${editData.hrm_users?.lastname ?? ""}`
    .replace(/\s+/g, " ")
    .trim();

  return (
    <div className="app__modal_wrapper">
      <div className="app__modal_wrapper2_large">
        <div className="app__modal_wrapper3">
          <div className="app__modal_header">
            <h5 className="app__modal_header_text">Employee Medical Form</h5>
            <CustomButton
              containerStyles="app__btn_gray"
              title="Close"
              btnType="button"
              handleClick={hideModal}
            />
          </div>

          <div className="app__modal_body space-y-3">
            {/* Employee */}
            <div className="rounded-lg border border-gray-200 dark:border-gray-600 p-3 bg-white dark:bg-gray-800">
              <div className="text-[10px] uppercase tracking-wide text-gray-400">
                Employee
              </div>
              <div className="text-base font-semibold capitalize text-gray-800 dark:text-gray-100">
                {fullname || "—"}
              </div>
            </div>

            {/* Attachments */}
            <div className="rounded-lg border border-gray-200 dark:border-gray-600 p-3 bg-white dark:bg-gray-800">
              <div className="text-xs font-bold uppercase tracking-wide text-gray-600 dark:text-gray-200 mb-2">
                Medical Record Attachment/s
              </div>
              {attachments.length === 0 ? (
                <div className="text-xs text-gray-500 italic">
                  No files were uploaded for this record.
                </div>
              ) : (
                <div className="flex flex-col gap-y-1.5">
                  {attachments.map((file) => (
                    <button
                      key={file.name}
                      type="button"
                      onClick={async () => await handleViewFile(file.name)}
                      className="flex items-center gap-x-2 text-blue-600 hover:underline text-sm w-fit"
                      title="View in browser"
                    >
                      <EyeIcon className="w-4 h-4" />
                      <span className="break-all text-left">{file.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Medical History */}
            <MedicalHistoryView medicalHistory={editData.medical_history} />
          </div>
        </div>
      </div>
    </div>
  );
}
