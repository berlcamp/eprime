/* eslint-disable @typescript-eslint/no-non-null-assertion */
"use client";

import { useEffect, useState } from "react";

import { Sidebar, Title, TopBar } from "@/components/index";
import ReportsSidebar from "@/components/Sidebars/ReportsSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSupabase } from "@/context/SupabaseProvider";
import Excel from "exceljs";
import { saveAs } from "file-saver";
import { DateRangePicker } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";

const requestTypes = [
  "Leave",
  "Locator Slip",
  "Pass Slip",
  "Service Record Print Request",
  "Travel Authority",
  "Undertime Permit",
];

const leaveTypes = [
  "Vacation Leave",
  "Sick Leave",
  "Compensatory Time Off",
  "Mandatory/Forced Leave",
  "Maternity Leave",
  "Paternity Leave",
  "Special Privilege Leave",
  "Solo Parent Leave",
  "Study Leave",
  "10-Day VAWC Leave",
  "Rehabilitation Privilege",
  "Special Leave Benefits for Women",
  "Special Emergency (Calamity) Leave",
  "Adoption Leave",
  "Terminal/Monetization Leave",
  "30 days Maternity Leave Extension (without pay)",
  "15 days Maternity Leave Extension for Solo Parent (with pay)",
  "7 days Additional Paternity Leave (from wife-maternity leave)",
  "Others",
];

export default function ReportRequestsPage() {
  const [mode, setMode] = useState<"daily" | "weekly" | "monthly" | "custom">(
    "daily"
  );
  const [range, setRange] = useState([
    {
      startDate: new Date(),
      endDate: new Date(),
      key: "selection",
    },
  ]);
  const [requestCounts, setRequestCounts] = useState<any>({});
  const [leaveCounts, setLeaveCounts] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);

  const { supabase } = useSupabase();

  const getDateFilter = () => {
    const today = new Date();
    let start, end;

    switch (mode) {
      case "daily":
        start = new Date(today.setHours(0, 0, 0, 0));
        end = new Date();
        break;

      case "weekly": {
        const day = today.getDay();
        const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Monday
        start = new Date(today.setDate(diff));
        start.setHours(0, 0, 0, 0);
        end = new Date();
        break;
      }

      case "monthly":
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        end = new Date();
        break;

      case "custom":
        start = range[0].startDate;
        end = range[0].endDate;
        break;

      default:
        start = end = new Date();
    }

    return { start, end };
  };

  const loadData = async () => {
    setLoading(true);

    const { start, end } = getDateFilter();

    // 1️⃣ Fetch all approved requests in range
    const { data, error } = await supabase
      .from("hrm_request_trackers")
      .select("type, leave_type, date_approved")
      .gte("date_approved", start.toISOString().split("T")[0])
      .lte("date_approved", end.toISOString().split("T")[0]);

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    // 2️⃣ Count request types
    const reqCount: any = {};
    requestTypes.forEach((r) => (reqCount[r] = 0));
    data.forEach((row) => {
      if (reqCount[row.type] !== undefined) reqCount[row.type]++;
    });

    // 3️⃣ Count leave types
    const lCount: any = {};
    leaveTypes.forEach((l) => (lCount[l] = 0));

    data
      .filter((x) => x.type === "Leave")
      .forEach((x) => {
        if (lCount[x.leave_type] !== undefined) lCount[x.leave_type]++;
        else lCount.Others++;
      });

    setRequestCounts(reqCount);
    setLeaveCounts(lCount);
    setLoading(false);
  };

  const exportRequestType = async (requestType: string) => {
    setExporting(requestType);
    try {
      const { start, end } = getDateFilter();

      // Fetch full request data with user information
      const { data, error } = await supabase
        .from("hrm_request_trackers")
        .select(
          "*,leave_dates:hrm_leave_dates(*),creator:created_by(id,firstname,lastname,middlename,hrm_schools:school_id(name),hrm_positions:position_id(name),hrm_offices:office_id(name)),receiver:receiver_id(id,firstname,lastname,middlename),approver:current_approver_id(id,firstname,lastname,middlename),recommender:recommended_by(id,firstname,lastname,middlename),certifier:certified_by(id,firstname,lastname,middlename),finalapprover:approved_by(id,firstname,lastname,middlename)"
        )
        .eq("type", requestType)
        .gte("date_approved", start.toISOString().split("T")[0])
        .lte("date_approved", end.toISOString().split("T")[0]);

      if (error) throw new Error(error.message);

      // Create workbook
      const workbook = new Excel.Workbook();
      const worksheet = workbook.addWorksheet("Requests");

      // Define columns based on request type
      const baseColumns = [
        { header: "No.", key: "no", width: 10 },
        { header: "Reference Code", key: "reference_code", width: 20 },
        { header: "Type", key: "type", width: 20 },
        { header: "Status", key: "current_status", width: 15 },
        { header: "Date Created", key: "date_created", width: 15 },
        { header: "Date Approved", key: "date_approved", width: 15 },
        { header: "Created By", key: "created_by_name", width: 30 },
        { header: "School/Office", key: "school_office", width: 30 },
        { header: "Position", key: "position", width: 25 },
      ];

      // Add type-specific columns
      const typeSpecificColumns: any[] = [];
      if (requestType === "Leave") {
        typeSpecificColumns.push(
          { header: "Leave Type", key: "leave_type", width: 25 },
          { header: "Leave From", key: "leave_from", width: 15 },
          { header: "Leave To", key: "leave_to", width: 15 },
          { header: "Leave Days", key: "leave_days", width: 15 },
          { header: "Days With Pay", key: "leave_days_with_pay", width: 15 },
          {
            header: "Days Without Pay",
            key: "leave_days_without_pay",
            width: 15,
          },
          { header: "Leave Reason", key: "leave_reason", width: 30 },
          { header: "Recommended By", key: "recommended_by_name", width: 30 },
          { header: "Certified By", key: "certified_by_name", width: 30 },
          { header: "Approved By", key: "approved_by_name", width: 30 }
        );
      } else if (requestType === "Locator Slip") {
        typeSpecificColumns.push(
          { header: "Purpose", key: "locator_slip_purpose", width: 30 },
          { header: "Type", key: "locator_slip_type", width: 20 },
          { header: "Date", key: "locator_slip_date", width: 15 },
          { header: "Time", key: "locator_slip_time", width: 15 },
          { header: "Return Time", key: "locator_slip_return_time", width: 15 },
          { header: "Destination", key: "locator_slip_destination", width: 30 }
        );
      } else if (requestType === "Pass Slip") {
        typeSpecificColumns.push(
          { header: "Type", key: "pass_slip_type", width: 20 },
          { header: "Date", key: "pass_slip_date", width: 15 },
          {
            header: "Intended Time Departure",
            key: "pass_slip_intended_time_departure",
            width: 20,
          },
          {
            header: "Intended Time Arrival",
            key: "pass_slip_intended_time_arrival",
            width: 20,
          },
          {
            header: "Fixed Time From",
            key: "pass_slip_fixed_time_from",
            width: 20,
          },
          {
            header: "Fixed Time To",
            key: "pass_slip_fixed_time_to",
            width: 20,
          },
          { header: "Purpose", key: "pass_slip_purpose", width: 30 },
          { header: "Reason", key: "pass_slip_reason", width: 30 }
        );
      } else if (requestType === "Travel Authority") {
        typeSpecificColumns.push(
          { header: "Travel Type", key: "travel_type", width: 20 },
          {
            header: "Travel Official Type",
            key: "travel_official_type",
            width: 25,
          },
          { header: "Purpose", key: "travel_purpose", width: 30 },
          { header: "Host", key: "travel_host", width: 30 },
          { header: "From", key: "travel_from", width: 15 },
          { header: "To", key: "travel_to", width: 15 },
          { header: "Destination", key: "travel_destination", width: 30 },
          { header: "Fund Source", key: "travel_fund_source", width: 25 },
          { header: "With", key: "travel_with", width: 30 }
        );
      } else if (requestType === "Undertime Permit") {
        typeSpecificColumns.push(
          { header: "Reason", key: "undertime_permit_reason", width: 30 },
          { header: "Time", key: "undertime_permit_time", width: 15 }
        );
      } else if (requestType === "Service Record Print Request") {
        typeSpecificColumns.push({
          header: "Purpose",
          key: "service_record_print_request_purpose",
          width: 30,
        });
      }

      worksheet.columns = [...baseColumns, ...typeSpecificColumns];

      // Add data rows
      data.forEach((item: any, index: number) => {
        const row: any = {
          no: index + 1,
          reference_code: item.reference_code || "",
          type: item.type || "",
          current_status: item.current_status || "",
          date_created: item.date_created || "",
          date_approved: item.date_approved || "",
          created_by_name: item.creator
            ? `${item.creator.lastname || ""}, ${
                item.creator.firstname || ""
              } ${item.creator.middlename || ""}`.trim()
            : "",
          school_office:
            item.creator?.hrm_schools?.name ||
            item.creator?.hrm_offices?.name ||
            "",
          position: item.creator?.hrm_positions?.name || "",
        };

        // Add type-specific fields
        if (requestType === "Leave") {
          // Calculate days from hrm_leave_dates table
          const leaveDates = item.leave_dates || [];
          const totalDays = leaveDates.length;
          const daysWithPay = leaveDates.filter(
            (d: any) => d.is_paid === true
          ).length;
          const daysWithoutPay = totalDays - daysWithPay;

          // Calculate leave_from and leave_to from hrm_leave_dates
          const sortedDates = leaveDates
            .map((d: any) => d.date)
            .filter((d: string) => d)
            .sort(
              (a: string, b: string) =>
                new Date(a).getTime() - new Date(b).getTime()
            );
          const leaveFrom = sortedDates.length > 0 ? sortedDates[0] : "";
          const leaveTo =
            sortedDates.length > 0 ? sortedDates[sortedDates.length - 1] : "";

          row.leave_type = item.leave_type || "";
          row.leave_from = leaveFrom || item.leave_from || "";
          row.leave_to = leaveTo || item.leave_to || "";
          row.leave_days = totalDays || "";
          row.leave_days_with_pay = daysWithPay || "";
          row.leave_days_without_pay = daysWithoutPay || "";
          row.leave_reason = item.leave_reason || "";
          row.recommended_by_name = item.recommender
            ? `${item.recommender.lastname || ""}, ${
                item.recommender.firstname || ""
              } ${item.recommender.middlename || ""}`.trim()
            : "";
          row.certified_by_name = item.certifier
            ? `${item.certifier.lastname || ""}, ${
                item.certifier.firstname || ""
              } ${item.certifier.middlename || ""}`.trim()
            : "";
          row.approved_by_name = item.finalapprover
            ? `${item.finalapprover.lastname || ""}, ${
                item.finalapprover.firstname || ""
              } ${item.finalapprover.middlename || ""}`.trim()
            : "";
        } else if (requestType === "Locator Slip") {
          row.locator_slip_purpose = item.locator_slip_purpose || "";
          row.locator_slip_type = item.locator_slip_type || "";
          row.locator_slip_date = item.locator_slip_date || "";
          row.locator_slip_time = item.locator_slip_time || "";
          row.locator_slip_return_time = item.locator_slip_return_time || "";
          row.locator_slip_destination = item.locator_slip_destination || "";
        } else if (requestType === "Pass Slip") {
          row.pass_slip_type = item.pass_slip_type || "";
          row.pass_slip_date = item.pass_slip_date || "";
          row.pass_slip_intended_time_departure =
            item.pass_slip_intended_time_departure || "";
          row.pass_slip_intended_time_arrival =
            item.pass_slip_intended_time_arrival || "";
          row.pass_slip_fixed_time_from = item.pass_slip_fixed_time_from || "";
          row.pass_slip_fixed_time_to = item.pass_slip_fixed_time_to || "";
          row.pass_slip_purpose = item.pass_slip_purpose || "";
          row.pass_slip_reason = item.pass_slip_reason || "";
        } else if (requestType === "Travel Authority") {
          row.travel_type = item.travel_type || "";
          row.travel_official_type = item.travel_official_type || "";
          row.travel_purpose = item.travel_purpose || "";
          row.travel_host = item.travel_host || "";
          row.travel_from = item.travel_from || "";
          row.travel_to = item.travel_to || "";
          row.travel_destination = item.travel_destination || "";
          row.travel_fund_source = item.travel_fund_source || "";
          row.travel_with = item.travel_with || "";
        } else if (requestType === "Undertime Permit") {
          row.undertime_permit_reason = item.undertime_permit_reason || "";
          row.undertime_permit_time = item.undertime_permit_time || "";
        } else if (requestType === "Service Record Print Request") {
          row.service_record_print_request_purpose =
            item.service_record_print_request_purpose || "";
        }

        worksheet.addRow(row);
      });

      // Generate and download Excel file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      saveAs(blob, `${requestType} Report - DepEd.xlsx`);
    } catch (error) {
      console.error("Export error:", error);
      alert("Failed to export data. Please try again.");
    } finally {
      setExporting(null);
    }
  };

  const exportLeaveType = async (leaveType: string) => {
    setExporting(`Leave-${leaveType}`);
    try {
      const { start, end } = getDateFilter();

      // Build query
      let query = supabase
        .from("hrm_request_trackers")
        .select(
          "*,leave_dates:hrm_leave_dates(*),creator:created_by(id,firstname,lastname,middlename,hrm_schools:school_id(name),hrm_positions:position_id(name),hrm_offices:office_id(name)),receiver:receiver_id(id,firstname,lastname,middlename),approver:current_approver_id(id,firstname,lastname,middlename),recommender:recommended_by(id,firstname,lastname,middlename),certifier:certified_by(id,firstname,lastname,middlename),finalapprover:approved_by(id,firstname,lastname,middlename)"
        )
        .eq("type", "Leave")
        .gte("date_approved", start.toISOString().split("T")[0])
        .lte("date_approved", end.toISOString().split("T")[0]);

      // For "Others", we'll filter after fetching
      if (leaveType !== "Others") {
        query = query.eq("leave_type", leaveType);
      }

      const { data, error } = await query;

      if (error) throw new Error(error.message);

      // Filter for "Others" if needed
      const filteredData =
        leaveType === "Others"
          ? data.filter(
              (item: any) =>
                !leaveTypes.includes(item.leave_type) || !item.leave_type
            )
          : data;

      // Create workbook
      const workbook = new Excel.Workbook();
      const worksheet = workbook.addWorksheet("Leave Requests");

      // Define columns
      worksheet.columns = [
        { header: "No.", key: "no", width: 10 },
        { header: "Reference Code", key: "reference_code", width: 20 },
        { header: "Leave Type", key: "leave_type", width: 25 },
        { header: "Status", key: "current_status", width: 15 },
        { header: "Date Created", key: "date_created", width: 15 },
        { header: "Date Approved", key: "date_approved", width: 15 },
        { header: "Created By", key: "created_by_name", width: 30 },
        { header: "School/Office", key: "school_office", width: 30 },
        { header: "Position", key: "position", width: 25 },
        { header: "Leave From", key: "leave_from", width: 15 },
        { header: "Leave To", key: "leave_to", width: 15 },
        { header: "Leave Days", key: "leave_days", width: 15 },
        { header: "Days With Pay", key: "leave_days_with_pay", width: 15 },
        {
          header: "Days Without Pay",
          key: "leave_days_without_pay",
          width: 15,
        },
        { header: "Leave Reason", key: "leave_reason", width: 30 },
        { header: "Recommended By", key: "recommended_by_name", width: 30 },
        { header: "Date Recommended", key: "date_recommeded", width: 15 },
        { header: "Certified By", key: "certified_by_name", width: 30 },
        {
          header: "Certification As Of",
          key: "certification_as_of",
          width: 20,
        },
        { header: "Approved By", key: "approved_by_name", width: 30 },
      ];

      // Add data rows
      filteredData.forEach((item: any, index: number) => {
        // Calculate days from hrm_leave_dates table
        const leaveDates = item.leave_dates || [];
        const totalDays = leaveDates.length;
        const daysWithPay = leaveDates.filter(
          (d: any) => d.is_paid === true
        ).length;
        const daysWithoutPay = totalDays - daysWithPay;

        // Calculate leave_from and leave_to from hrm_leave_dates
        const sortedDates = leaveDates
          .map((d: any) => d.date)
          .filter((d: string) => d)
          .sort(
            (a: string, b: string) =>
              new Date(a).getTime() - new Date(b).getTime()
          );
        const leaveFrom = sortedDates.length > 0 ? sortedDates[0] : "";
        const leaveTo =
          sortedDates.length > 0 ? sortedDates[sortedDates.length - 1] : "";

        worksheet.addRow({
          no: index + 1,
          reference_code: item.reference_code || "",
          leave_type: item.leave_type || "",
          current_status: item.current_status || "",
          date_created: item.date_created || "",
          date_approved: item.date_approved || "",
          created_by_name: item.creator
            ? `${item.creator.lastname || ""}, ${
                item.creator.firstname || ""
              } ${item.creator.middlename || ""}`.trim()
            : "",
          school_office:
            item.creator?.hrm_schools?.name ||
            item.creator?.hrm_offices?.name ||
            "",
          position: item.creator?.hrm_positions?.name || "",
          leave_from: leaveFrom || item.leave_from || "",
          leave_to: leaveTo || item.leave_to || "",
          leave_days: totalDays || "",
          leave_days_with_pay: daysWithPay || "",
          leave_days_without_pay: daysWithoutPay || "",
          leave_reason: item.leave_reason || "",
          recommended_by_name: item.recommender
            ? `${item.recommender.lastname || ""}, ${
                item.recommender.firstname || ""
              } ${item.recommender.middlename || ""}`.trim()
            : "",
          date_recommeded: item.date_recommeded || "",
          certified_by_name: item.certifier
            ? `${item.certifier.lastname || ""}, ${
                item.certifier.firstname || ""
              } ${item.certifier.middlename || ""}`.trim()
            : "",
          certification_as_of: item.certification_as_of || "",
          approved_by_name: item.finalapprover
            ? `${item.finalapprover.lastname || ""}, ${
                item.finalapprover.firstname || ""
              } ${item.finalapprover.middlename || ""}`.trim()
            : "",
        });
      });

      // Generate and download Excel file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      saveAs(blob, `${leaveType} Report - DepEd.xlsx`);
    } catch (error) {
      console.error("Export error:", error);
      alert("Failed to export data. Please try again.");
    } finally {
      setExporting(null);
    }
  };

  useEffect(() => {
    void loadData();
  }, [mode, range]);

  return (
    <>
      <Sidebar>
        <ReportsSidebar />
      </Sidebar>
      <TopBar />

      <div className="app__main">
        <div>
          <div className="app__title">
            <Title title="HR Requests Reports" />
          </div>

          {/* Filters */}
          <div className="app__filters">
            <div className="flex items-center gap-4">
              <select
                className="border px-2 py-1 rounded text-xs"
                value={mode}
                onChange={(e) =>
                  setMode(
                    e.target.value as "daily" | "weekly" | "monthly" | "custom"
                  )
                }
              >
                <option value="daily">Today</option>
                <option value="weekly">This Week</option>
                <option value="monthly">This Month</option>
                <option value="custom">Custom Range</option>
              </select>

              {mode === "custom" && (
                <DateRangePicker
                  onChange={(item) =>
                    setRange([
                      {
                        startDate: item.selection.startDate!,
                        endDate: item.selection.endDate!,
                        key: "selection",
                      },
                    ])
                  }
                  moveRangeOnFirstSelection={false}
                  ranges={range}
                />
              )}
            </div>
          </div>
          <div className="w-full px-4 pt-4 bg-gray-100">
            {/* Request Type Cards */}
            <h2 className="font-semibold text-lg">Request Types</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {requestTypes.map((t) => (
                <Card key={t} className="rounded-xl shadow">
                  <CardHeader>
                    <CardTitle className="text-sm">{t}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-center mb-3">
                      {loading ? "..." : requestCounts[t] ?? 0}
                    </div>
                    <div className="text-center">
                      <button
                        onClick={() => {
                          void exportRequestType(t);
                        }}
                        disabled={loading || exporting === t}
                        className={`text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors ${
                          loading || exporting === t
                            ? "opacity-50 cursor-not-allowed"
                            : "cursor-pointer"
                        }`}
                      >
                        {exporting === t
                          ? "Exporting..."
                          : "Export Data to Excel"}
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Leave Type Cards */}
            <h2 className="font-semibold text-lg mt-6">Leave Types</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {leaveTypes.map((l) => (
                <Card key={l} className="rounded-xl shadow">
                  <CardHeader>
                    <CardTitle className="text-sm">{l}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-center mb-3">
                      {loading ? "..." : leaveCounts[l] ?? 0}
                    </div>
                    <div className="text-center">
                      <button
                        onClick={() => {
                          void exportLeaveType(l);
                        }}
                        disabled={loading || exporting === `Leave-${l}`}
                        className={`text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors ${
                          loading || exporting === `Leave-${l}`
                            ? "opacity-50 cursor-not-allowed"
                            : "cursor-pointer"
                        }`}
                      >
                        {exporting === `Leave-${l}`
                          ? "Exporting..."
                          : "Export Data to Excel"}
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
