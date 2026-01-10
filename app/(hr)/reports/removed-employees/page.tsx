/* eslint-disable @typescript-eslint/no-non-null-assertion */
"use client";

import { useEffect, useState } from "react";

import { CustomButton, Sidebar, Title, TopBar } from "@/components/index";
import ReportsSidebar from "@/components/Sidebars/ReportsSidebar";
import { Card, CardContent } from "@/components/ui/card";
import { useSupabase } from "@/context/SupabaseProvider";
import { useFilter } from "@/context/FilterContext";
import { superAdmins } from "@/constants";
import { Unauthorized } from "@/components/index";
import { TagIcon } from "@heroicons/react/20/solid";
import { format } from "date-fns";
import Excel from "exceljs";
import { saveAs } from "file-saver";

interface RemovedEmployee {
  id: string;
  item_id: string;
  user_id: string;
  reason: string;
  removed_at: string;
  removed_by: string | null;
  item_number: string | null;
  position_id: string | null;
  implementing_unit_id: string | null;
  school_id: string | null;
  office_id: string | null;
  salary_grade: string | null;
  date_of_original_appointment: string | null;
  date_of_last_promotion: string | null;
  hrm_user: {
    id: string;
    firstname: string;
    middlename: string;
    lastname: string;
    avatar_url: string;
  } | null;
  hrm_position: {
    id: string;
    name: string;
  } | null;
  hrm_school: {
    id: string;
    name: string;
  } | null;
  hrm_office: {
    id: string;
    name: string;
  } | null;
  implementing_unit: {
    id: string;
    name: string;
  } | null;
  removed_by_user: {
    id: string;
    firstname: string;
    middlename: string;
    lastname: string;
  } | null;
}

export default function RemovedEmployeesPage() {
  const [list, setList] = useState<RemovedEmployee[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [selectedDateFrom, setSelectedDateFrom] = useState("");
  const [selectedDateTo, setSelectedDateTo] = useState("");

  const { supabase, session } = useSupabase();
  const { hasAccess } = useFilter();

  const fetchData = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("hrm_items_removed")
        .select(
          `
          *,
          hrm_user:user_id(id,firstname,middlename,lastname,avatar_url),
          hrm_position:position_id(id,name),
          hrm_school:school_id(id,name),
          hrm_office:office_id(id,name),
          implementing_unit:implementing_unit_id(id,name),
          removed_by_user:removed_by(id,firstname,middlename,lastname)
        `
        )
        .eq("org_id", process.env.NEXT_PUBLIC_ORG_ID!)
        .order("removed_at", { ascending: false });

      // Apply date filters
      if (filterDateFrom && filterDateFrom !== "") {
        query = query.gte("removed_at", filterDateFrom);
      }

      if (filterDateTo && filterDateTo !== "") {
        // Add one day to include the entire selected day
        const dateTo = new Date(filterDateTo);
        dateTo.setDate(dateTo.getDate() + 1);
        query = query.lt("removed_at", dateTo.toISOString());
      }

      const { data, error } = await query;

      if (error) throw new Error(error.message);

      setList(data || []);
    } catch (error) {
      console.error("Fetch removed employees error:", error);
      setList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, [filterDateFrom, filterDateTo]);

  const handleApply = () => {
    setFilterDateFrom(selectedDateFrom);
    setFilterDateTo(selectedDateTo);
  };

  const handleClear = () => {
    setFilterDateFrom("");
    setSelectedDateFrom("");
    setFilterDateTo("");
    setSelectedDateTo("");
  };

  const exportToExcel = async () => {
    setExporting(true);
    try {
      const workbook = new Excel.Workbook();
      const worksheet = workbook.addWorksheet("Removed Employees");

      // Define columns
      worksheet.columns = [
        { header: "No.", key: "no", width: 10 },
        { header: "Employee Name", key: "employee_name", width: 35 },
        { header: "Item Number", key: "item_number", width: 20 },
        { header: "Position", key: "position", width: 30 },
        { header: "School/Office", key: "school_office", width: 30 },
        { header: "Implementing Unit", key: "implementing_unit", width: 30 },
        { header: "Salary Grade", key: "salary_grade", width: 15 },
        {
          header: "Date of Original Appointment",
          key: "date_of_original_appointment",
          width: 25,
        },
        {
          header: "Date of Last Promotion",
          key: "date_of_last_promotion",
          width: 25,
        },
        { header: "Reason for Removal", key: "reason", width: 50 },
        { header: "Removed At", key: "removed_at", width: 20 },
        { header: "Removed By", key: "removed_by", width: 30 },
      ];

      // Add data rows
      list.forEach((item, index) => {
        const employeeName = item.hrm_user
          ? `${item.hrm_user.lastname || ""}, ${
              item.hrm_user.firstname || ""
            } ${item.hrm_user.middlename || ""}`.trim()
          : "N/A";

        const schoolOffice = item.hrm_school
          ? item.hrm_school.name
          : item.hrm_office
          ? item.hrm_office.name
          : "";

        const removedByName = item.removed_by_user
          ? `${item.removed_by_user.lastname || ""}, ${
              item.removed_by_user.firstname || ""
            } ${item.removed_by_user.middlename || ""}`.trim()
          : "N/A";

        worksheet.addRow({
          no: index + 1,
          employee_name: employeeName,
          item_number: item.item_number || "",
          position: item.hrm_position?.name || "",
          school_office: schoolOffice,
          implementing_unit: item.implementing_unit?.name || "",
          salary_grade: item.salary_grade || "",
          date_of_original_appointment: item.date_of_original_appointment
            ? format(new Date(item.date_of_original_appointment), "MM/dd/yyyy")
            : "",
          date_of_last_promotion: item.date_of_last_promotion
            ? format(new Date(item.date_of_last_promotion), "MM/dd/yyyy")
            : "",
          reason: item.reason,
          removed_at: format(new Date(item.removed_at), "MM/dd/yyyy HH:mm"),
          removed_by: removedByName,
        });
      });

      // Generate and download Excel file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      saveAs(blob, `Removed Employees - ${format(new Date(), "yyyy-MM-dd")}.xlsx`);
    } catch (error) {
      console.error("Export error:", error);
      alert("Failed to export data. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  // Check access
  if (
    !hasAccess("records") &&
    !hasAccess("settings") &&
    !hasAccess("hr") &&
    !superAdmins.includes(session?.user.email ?? "")
  )
    return <Unauthorized />;

  return (
    <>
      <Sidebar>
        <ReportsSidebar />
      </Sidebar>
      <TopBar />

      <div className="app__main">
        <div>
          <div className="app__title">
            <Title title="Removed Employees from Plantilla" />
          </div>

          {/* Filters */}
          <div className="app__filters">
            <div className="items-center space-x-2 space-y-1">
              <div className="app__filter_field_container">
                <div className="items-center space-y-1">
                  <div className="app__filter_container">
                    <TagIcon className="w-4 h-4 mr-1" />
                    <input
                      type="date"
                      value={selectedDateFrom}
                      onChange={(e) => setSelectedDateFrom(e.target.value)}
                      className="app__filter_select"
                      placeholder="Date From"
                    />
                  </div>
                  <div className="app__filter_container">
                    <TagIcon className="w-4 h-4 mr-1" />
                    <input
                      type="date"
                      value={selectedDateTo}
                      onChange={(e) => setSelectedDateTo(e.target.value)}
                      className="app__filter_select"
                      placeholder="Date To"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2 mt-4">
              <CustomButton
                containerStyles="app__btn_green"
                title="Apply Filter"
                btnType="button"
                handleClick={handleApply}
              />
              <CustomButton
                containerStyles="app__btn_gray"
                title="Clear Filter"
                btnType="button"
                handleClick={handleClear}
              />
            </div>
          </div>

          {/* Export Card */}
          <div className="w-full px-4 pt-4 bg-gray-100">
            <Card className="rounded-xl shadow">
              <CardContent className="pt-6">
                <div className="text-center">
                  <h2 className="font-semibold text-lg mb-4">
                    Export Removed Employees Report
                  </h2>
                  <p className="text-sm text-gray-600 mb-4">
                    Export removed employees data to Excel with employee
                    information, position, reason for removal, and removal date.
                  </p>
                  <button
                    onClick={exportToExcel}
                    disabled={exporting || list.length === 0}
                    className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                      exporting || list.length === 0
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700 text-white"
                    }`}
                  >
                    {exporting ? "Exporting..." : "Export to Excel"}
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Table */}
          <div className="w-full px-4 pt-4">
            <div className="app__table_container">
              <table className="app__table">
                <thead className="app__thead">
                  <tr>
                    <th className="app__th">No.</th>
                    <th className="app__th">Employee Name</th>
                    <th className="app__th">Item Number</th>
                    <th className="app__th">Position</th>
                    <th className="app__th">School/Office</th>
                    <th className="app__th">Reason</th>
                    <th className="app__th">Removed At</th>
                    <th className="app__th">Removed By</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="app__td text-center">
                        Loading...
                      </td>
                    </tr>
                  ) : list.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="app__td text-center">
                        No removed employees found.
                      </td>
                    </tr>
                  ) : (
                    list.map((item, index) => {
                      const employeeName = item.hrm_user
                        ? `${item.hrm_user.lastname || ""}, ${
                            item.hrm_user.firstname || ""
                          } ${item.hrm_user.middlename || ""}`.trim()
                        : "N/A";

                      const schoolOffice = item.hrm_school
                        ? item.hrm_school.name
                        : item.hrm_office
                        ? item.hrm_office.name
                        : "";

                      const removedByName = item.removed_by_user
                        ? `${item.removed_by_user.lastname || ""}, ${
                            item.removed_by_user.firstname || ""
                          } ${item.removed_by_user.middlename || ""}`.trim()
                        : "N/A";

                      return (
                        <tr key={item.id} className="app__tr">
                          <td className="app__td">{index + 1}</td>
                          <td className="app__td">{employeeName}</td>
                          <td className="app__td">{item.item_number || ""}</td>
                          <td className="app__td">
                            {item.hrm_position?.name || ""}
                          </td>
                          <td className="app__td">{schoolOffice}</td>
                          <td className="app__td">
                            <div className="max-w-xs truncate" title={item.reason}>
                              {item.reason}
                            </div>
                          </td>
                          <td className="app__td">
                            {format(new Date(item.removed_at), "MM/dd/yyyy HH:mm")}
                          </td>
                          <td className="app__td">{removedByName}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
