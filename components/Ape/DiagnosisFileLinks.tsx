"use client";
import { useFilter } from "@/context/FilterContext";
import { useSupabase } from "@/context/SupabaseProvider";
import { PaperClipIcon } from "@heroicons/react/24/solid";

// types
import type { ApeDiagnosisFileTypes } from "@/types";

interface Props {
  files?: ApeDiagnosisFileTypes[];
}

// View links for the file/s a Medical Officer attached to one diagnosis entry.
export default function DiagnosisFileLinks({ files }: Props) {
  const { setToast } = useFilter();
  const { supabase } = useSupabase();

  const handleViewFile = async (path: string) => {
    const { data, error } = await supabase.storage
      .from("hrm")
      .createSignedUrl(path, 300);

    if (error || !data?.signedUrl) {
      setToast("error", "Unable to open the file. Please try again.");
      return;
    }

    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  };

  if (!files || files.length === 0) return null;

  return (
    <div className="flex flex-col gap-y-px mt-1">
      {files.map((file) => (
        <button
          key={file.id}
          type="button"
          onClick={async () => await handleViewFile(file.file_path)}
          className="flex items-center gap-x-1 text-blue-600 hover:underline text-xs w-fit"
          title="View in browser"
        >
          <PaperClipIcon className="w-3 h-3 shrink-0" />
          <span className="break-all text-left">{file.file_name}</span>
        </button>
      ))}
    </div>
  );
}
