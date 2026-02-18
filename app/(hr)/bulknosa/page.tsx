"use client";

import {
  RecordsSideBar,
  Sidebar,
  Title,
  TopBar,
  Unauthorized,
} from "@/components/index";
import { superAdmins } from "@/constants";
import { useFilter } from "@/context/FilterContext";
import { useSupabase } from "@/context/SupabaseProvider";
import type { Employee, NosaTypes, SignatoriesTypes } from "@/types";
import {
  fetchSalaryGradesForNosa,
  fetchUsersByLastnameLetter,
} from "@/utils/fetchApi";
import { subDays } from "date-fns";
import { Loader2, Printer } from "lucide-react";
import React, { useRef, useState } from "react";
import { useReactToPrint } from "react-to-print";
import BulkNosaModal from "./BulkNosaModal";
import { BulkPrintNosa } from "./BulkPrintNosa";

interface SalaryRow {
  grade: string | number;
  step: string | number;
  salary: string | number;
  previous?: string | number | null;
}

/** Build SalaryRow[] from raw hrm_salaries: new amount from is_active='yes', previous from tranche=previous */
function buildSalaryRowsFromSalaries(
  allSalaries: Array<{
    grade: string | number;
    step: string | number;
    salary: string | number | null;
    tranche: string | null;
    previous: string | null;
    is_active: string | null;
  }>,
): SalaryRow[] {
  const activeRows = allSalaries.filter((r) => r.is_active === "yes");
  return activeRows.map((row) => {
    const prevRow =
      row.previous != null &&
      row.previous !== "" &&
      allSalaries.find(
        (r) =>
          String(r.grade) === String(row.grade) &&
          String(r.step) === String(row.step) &&
          r.tranche === row.previous,
      );
    const prevSalary =
      prevRow && typeof prevRow === "object" && "salary" in prevRow
        ? (prevRow.salary ?? 0)
        : 0;
    return {
      grade: row.grade,
      step: row.step,
      salary: row.salary ?? 0,
      previous: prevSalary,
    };
  });
}

function buildNosaFromUser(
  user: Employee,
  salaryRows: SalaryRow[],
  effectiveDate: string,
): NosaTypes | null {
  const match = salaryRows.find(
    (row) =>
      String(row.grade) === String(user.salary_grade) &&
      String(row.step) === String(user.salary_step),
  );
  if (!match) return null;

  const previousAmount = match.previous != null ? String(match.previous) : "0";
  const newAmount = match.salary != null ? String(match.salary) : "0";
  const effective = new Date(effectiveDate);
  const asOf = subDays(effective, 1);

  return {
    id: user.id,
    user_id: user.id,
    hrm_user: user,
    as_of_date: asOf.toISOString().split("T")[0],
    effective_date: effectiveDate,
    previous_amount: previousAmount,
    previous_grade: user.salary_grade || "",
    previous_step: user.salary_step || "",
    new_amount: newAmount,
    new_grade: user.salary_grade || "",
    new_step: user.salary_step || "",
    confirmed: "",
    date: "",
    reason: "",
    other_reason: "",
  };
}

const Page: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [printItems, setPrintItems] = useState<NosaTypes[]>([]);
  const [signatories, setSignatories] = useState<SignatoriesTypes | null>(null);
  const [loading, setLoading] = useState(false);

  const { session } = useSupabase();
  const { hasAccess, setToast } = useFilter();

  const componentRef = useRef<HTMLDivElement>(null);
  const printFn = useReactToPrint({
    contentRef: componentRef,
    documentTitle: "Bulk NOSA",
  });

  const handleModalSubmit = async (data: {
    signatories: SignatoriesTypes;
    effectiveDate: string;
    lastnameLetter: string;
  }) => {
    setLoading(true);
    try {
      const [usersResult, salaryResult] = await Promise.all([
        fetchUsersByLastnameLetter(data.lastnameLetter, 99999, 0),
        fetchSalaryGradesForNosa(9999),
      ]);

      if (!usersResult.data?.length) {
        setToast(
          "error",
          `No employees found with lastname starting with "${data.lastnameLetter}".`,
        );
        return;
      }

      const salaryRows = buildSalaryRowsFromSalaries(salaryResult.data ?? []);
      const items: NosaTypes[] = usersResult.data
        .map((user) =>
          buildNosaFromUser(user as Employee, salaryRows, data.effectiveDate),
        )
        .filter((item): item is NosaTypes => item != null);

      if (items.length === 0) {
        setToast(
          "error",
          `No employees with matching salary data (grade+step in hrm_salaries) for lastname starting with "${data.lastnameLetter}".`,
        );
        return;
      }

      setPrintItems(items);
      setSignatories(data.signatories);

      setTimeout(() => {
        printFn();
      }, 100);
    } catch (e) {
      console.error(e);
      setToast("error", "Failed to fetch employees.");
    } finally {
      setLoading(false);
    }
  };

  if (!hasAccess("records") && !superAdmins.includes(session?.user.email ?? ""))
    return <Unauthorized />;

  return (
    <>
      <Sidebar>
        <RecordsSideBar />
      </Sidebar>
      <TopBar />
      <div className="app__main">
        <div>
          <div className="app__title">
            <Title title="Bulk NOSA" />
          </div>

          <div className="mx-4 mt-6 max-w-2xl">
            {/* Hero card */}
            <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/20 text-white">
                    <Printer className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">
                      Print Notices of Salary Adjustment in Bulk
                    </h2>
                    <p className="text-sm text-emerald-100 mt-0.5">
                      Generate NOSA documents for multiple employees at once
                    </p>
                  </div>
                </div>
              </div>

              <div className="px-6 py-5 space-y-4">
                <p className="text-sm text-gray-600 leading-relaxed">
                  Select an effective date and a lastname letter to generate NOSA documents for all employees whose lastname starts with that letter. Signatory details will be configured in the next step.
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(true)}
                    disabled={loading}
                    className="inline-flex items-center gap-2 rounded-md bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Processing…
                      </>
                    ) : (
                      <>
                        <Printer className="h-4 w-4" />
                        Print Bulk NOSA
                      </>
                    )}
                  </button>
                  {loading && (
                    <span className="text-xs text-gray-500">
                      Fetching employees and salary data…
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick tip */}
            <p className="mt-4 text-xs text-gray-500">
              Tip: Employees must have a matching salary grade and step in the active salary schedule to be included.
            </p>
          </div>
        </div>
      </div>

      {showModal && (
        <BulkNosaModal
          hideModal={() => setShowModal(false)}
          modalData={handleModalSubmit}
        />
      )}

      {printItems.length > 0 && signatories && (
        <BulkPrintNosa
          items={printItems}
          signatories={signatories}
          ref={componentRef}
        />
      )}
    </>
  );
};

export default Page;
