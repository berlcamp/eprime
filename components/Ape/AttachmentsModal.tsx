/* eslint-disable react-hooks/exhaustive-deps */
"use client";
import ConfirmModal from "@/components/ConfirmModal";
import { CustomButton } from "@/components/index";
import { useFilter } from "@/context/FilterContext";
import { useSupabase } from "@/context/SupabaseProvider";
import { EyeIcon } from "@heroicons/react/24/solid";
import { useCallback, useEffect, useState } from "react";
import { type FileWithPath, useDropzone } from "react-dropzone";
import uuid from "react-uuid";

// types
import type { ApeTypes } from "@/types";
import { XMarkIcon } from "@heroicons/react/20/solid";

interface ModalProps {
  hideModal: () => void;
  editData: ApeTypes | null;
  // read-only when the record is diagnosed (locked) or opened by a Medical Officer
  readOnly?: boolean;
}

type Attachment = {
  name: string;
  id?: string;
  updated_at?: string;
  created_at?: string;
};

export default function AttachmentsModal({
  editData,
  hideModal,
  readOnly = false,
}: ModalProps) {
  const { setToast } = useFilter();
  const { supabase } = useSupabase();

  const [selectedImages, setSelectedImages] = useState<any>([]);
  const [selectedFile, setSelectedFile] = useState("");
  const [saving, setSaving] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);

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

  const handleUpload = async () => {
    if (!editData) return;

    setSaving(true);

    try {
      await handleUploadFiles(editData.id);

      // Notify Medical Officers
      const fullname = `${editData.hrm_users?.firstname ?? ""} ${
        editData.hrm_users?.middlename ?? ""
      } ${editData.hrm_users?.lastname ?? ""}`;
      await handleNotify(fullname, editData.id);

      await fetchAttachments();
      setSelectedImages([]);
      setToast("success", "Successfully saved.");
    } catch (error) {
      console.error("Upload process failed:", error);
      setToast("error", "Upload failed. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleUploadFiles = async (id: string) => {
    try {
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
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(`File upload failed: ${error.message}`);
      } else {
        throw new Error("File upload failed due to an unknown error");
      }
    }
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

  // Open the attachment in a new browser tab for viewing (no forced download).
  const handleViewFile = async (file: string) => {
    if (!editData) return;

    const { data, error } = await supabase.storage
      .from("hrm")
      .createSignedUrl(`annual_physical_exams/${editData.id}/${file}`, 300);

    if (error || !data?.signedUrl) {
      setToast("error", "Unable to open the file. Please try again.");
      return;
    }

    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  };

  const handleConfirm = async () => {
    setShowConfirmation(false);
    await handleDeleteFile();
  };

  const handleCancel = () => {
    setShowConfirmation(false);
  };

  const handleDeleteClick = (file: any) => {
    setSelectedFile(file);
    setShowConfirmation(true);
  };

  const handleDeleteFile = async () => {
    if (!editData) return;

    const { error } = await supabase.storage
      .from("hrm")
      .remove([`annual_physical_exams/${editData.id}/${selectedFile}`]);

    if (error) {
      console.error(error);
    } else {
      const newAttachments = attachments.filter(
        (item: { name: string }) => item.name !== selectedFile,
      );
      setAttachments(newAttachments);
      setToast("success", "Successfully deleted.");
    }
  };

  const fetchAttachments = async () => {
    if (!editData?.id) return;

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

  const handleNotify = async (fullname: string, id: string) => {
    if (!editData) return;

    try {
      const userIds: string[] = [];

      // Medical Officers
      const { data, error } = await supabase
        .from("hrm_system_access")
        .select("user_id")
        .eq("type", "medical_officer")
        .eq("org_id", process.env.NEXT_PUBLIC_ORG_ID);

      if (error) {
        throw new Error(error.message);
      }

      data.forEach((item: any) => {
        userIds.push(item.user_id);
      });

      const notificationData: any[] = [];

      userIds.forEach((userId) => {
        notificationData.push({
          message: `${fullname} uploaded an Annual Physical Exam result. Kindly review and record a diagnosis.`,
          url: `/annualphysicalexams?ref=${id}`,
          type: "Annual Physical Exam",
          user_id: userId,
          reference_table: "hrm_annual_physical_exams",
        });
      });

      if (notificationData.length > 0) {
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

  useEffect(() => {
    if (fileRejections.length > 0) {
      setSelectedImages([]);
    }
  }, [fileRejections]);

  useEffect(() => {
    if (editData) void fetchAttachments();
  }, []);

  return (
    <>
      <div className="app__modal_wrapper">
        <div className="app__modal_wrapper2">
          <div className="app__modal_wrapper3">
            <div className="app__modal_header">
              <h5 className="app__modal_header_text">
                Physical Exam Result Files
              </h5>
              <CustomButton
                btnType="button"
                isDisabled={saving}
                handleClick={hideModal}
                title="Close"
                containerStyles="app__btn_gray"
              />
            </div>

            <div className="app__modal_body">
              <div className="app__form_field_container">
                <div className="w-full">
                  <div className="text-gray-600 font-medium text-sm mb-1 dark:text-gray-300">
                    Documents:
                  </div>
                  <div>
                    {attachments.length === 0 ? (
                      <div className="text-sm text-gray-500">
                        No documents uploaded.
                      </div>
                    ) : (
                      <>
                        {attachments?.map((file: { name: string }) => (
                          <div
                            key={uuid()}
                            className="flex items-center space-x-2 justify-start p-1"
                          >
                            <div
                              onClick={async () =>
                                await handleViewFile(file.name)
                              }
                              className="flex space-x-2 items-center cursor-pointer"
                              title="View in browser"
                            >
                              <EyeIcon className="w-4 h-4 text-blue-700" />
                              {file.name.length > 11 ? (
                                <span className="text-blue-500 text-xs">
                                  {file.name.charAt(0)}...{file.name.slice(-10)}
                                </span>
                              ) : (
                                <span className="text-blue-500 text-xs">
                                  {file.name}
                                </span>
                              )}
                            </div>
                            {!readOnly && (
                              <span
                                onClick={() => handleDeleteClick(file.name)}
                                className="text-red-600 cursor-pointer text-xs font-bold"
                              >
                                [Delete This File]
                              </span>
                            )}
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              </div>
              {!readOnly && (
                <>
                  <div className="flex-auto overflow-y-auto relative p-4">
                    <div className="grid grid-cols-1 gap-4 mb-4">
                      <div className="w-full">
                        <div
                          {...getRootProps()}
                          className="border border-dashed bg-gray-100 text-gray-600 px-4 py-8"
                        >
                          <input {...getInputProps()} />
                          <p className="text-sm text-gray-500">
                            Drag and drop some files here, or click to select
                            files
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
                              File rejected. Please make sure its an image, PDF,
                              DOC, or Excel file and less than 5MB.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="app__modal_footer">
                    <CustomButton
                      btnType="button"
                      isDisabled={saving || selectedImages.length === 0}
                      handleClick={handleUpload}
                      title={saving ? "Saving..." : "Save"}
                      containerStyles="app__btn_green"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      {showConfirmation && (
        <ConfirmModal
          header="Confirm Delete"
          btnText="Confirm"
          message="Are you sure you want to delete this file?"
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </>
  );
}
