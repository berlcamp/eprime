"use client";

import { useFilter } from "@/context/FilterContext";
import { useSupabase } from "@/context/SupabaseProvider";
import { superAdmins } from "@/constants";
import { HeartIcon } from "@heroicons/react/20/solid";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const MedicalSideBar = () => {
  const currentRoute = usePathname();
  const [pendingCount, setPendingCount] = useState("");

  const { hasAccess } = useFilter();
  const { supabase, session } = useSupabase();

  const canAccess =
    hasAccess("medical_officer") ||
    superAdmins.includes(session?.user.email ?? "");

  const counter = async () => {
    const { count } = await supabase
      .from("hrm_annual_physical_exams")
      .select("id", { count: "exact" })
      .eq("org_id", process.env.NEXT_PUBLIC_ORG_ID)
      .is("diagnosed_at", null);

    if (count && count > 0) setPendingCount(`For Diagnosis (${count})`);
  };

  useEffect(() => {
    if (canAccess) void counter();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!canAccess) return <></>;

  return (
    <ul className="pt-8 mt-4 space-y-2 border-gray-700">
      <li>
        <div className="flex items-center text-gray-500 items-centers space-x-1 px-2">
          <HeartIcon className="w-4 h-4" />
          <span>Medical Records</span>
        </div>
      </li>
      <li>
        <Link
          href="/annualphysicalexams"
          className={`app__menu_link ${
            currentRoute === "/annualphysicalexams" ? "app_menu_link_active" : ""
          }`}
        >
          <span className="flex-1 ml-3 whitespace-nowrap">
            Annual Physical Exams
          </span>
          {pendingCount !== "" && (
            <span className="inline-flex items-center justify-center rounded-lg bg-red-500">
              <span className="px-1 text-white text-[10px]">{pendingCount}</span>
            </span>
          )}
        </Link>
      </li>
    </ul>
  );
};

export default MedicalSideBar;
