/* eslint-disable @typescript-eslint/no-non-null-assertion */
"use client";

import { useEffect, useState } from "react";

import { CustomButton, Sidebar, Title, TopBar } from "@/components/index";
import ReportsSidebar from "@/components/Sidebars/ReportsSidebar";
import { Card, CardContent } from "@/components/ui/card";
import { useSupabase } from "@/context/SupabaseProvider";
import { type Office, type PositionTypes, type SchoolTypes } from "@/types";
import { fetchOffices, fetchPositions, fetchSchools } from "@/utils/fetchApi";
import Excel from "exceljs";
import { saveAs } from "file-saver";

import { TagIcon } from "@heroicons/react/20/solid";

export default function EmployeesRecordsPage() {
  const [filterSchool, setFilterSchool] = useState("");
  const [filterOffice, setFilterOffice] = useState("");
  const [filterPosition, setFilterPosition] = useState("");
  const [selectedSchool, setSelectedSchool] = useState("");
  const [selectedOffice, setSelectedOffice] = useState("");
  const [selectedPosition, setSelectedPosition] = useState("");
  const [schools, setSchools] = useState<SchoolTypes[]>([]);
  const [offices, setOffices] = useState<Office[]>([]);
  const [positions, setPositions] = useState<PositionTypes[]>([]);
  const [exporting, setExporting] = useState(false);
  const [exportingByPosition, setExportingByPosition] = useState(false);

  const { supabase } = useSupabase();

  // Fetch schools, offices, and positions
  useEffect(() => {
    const fetchData = async () => {
      const schoolsResult = await fetchSchools({}, 300, 0);
      const officesResult = await fetchOffices("", 300, 0);
      const positionsResult = await fetchPositions("", 999, 0);
      setSchools(schoolsResult.data.length > 0 ? schoolsResult.data : []);
      setOffices(officesResult.data.length > 0 ? officesResult.data : []);
      setPositions(
        positionsResult.data && positionsResult.data.length > 0
          ? positionsResult.data
          : []
      );
    };
    void fetchData();
  }, []);

  const handleApply = () => {
    setFilterSchool(selectedSchool);
    setFilterOffice(selectedOffice);
    setFilterPosition(selectedPosition);
  };

  const handleClear = () => {
    setFilterSchool("");
    setSelectedSchool("");
    setFilterOffice("");
    setSelectedOffice("");
    setFilterPosition("");
    setSelectedPosition("");
  };

  const exportToExcel = async () => {
    setExporting(true);
    try {
      // Build query for employees
      let query = supabase
        .from("hrm_users")
        .select(
          `
          id,
          firstname,
          middlename,
          lastname,
          email,
          joining_date,
          status,
          school_id,
          office_id,
          item_id,
          hrm_schools:school_id(name),
          hrm_offices:office_id(name),
          hrm_positions:position_id(name),
          hrm_item:item_id(
            item_number,
            status,
            reason_for_removal,
            vice,
            hrm_position:position_id(name)
          )
        `
        )
        .eq("org_id", process.env.NEXT_PUBLIC_ORG_ID!)
        .not("item_id", "is", null);

      // Apply filters
      if (filterSchool && filterSchool !== "") {
        query = query.eq("school_id", filterSchool);
      }

      if (filterOffice && filterOffice !== "") {
        query = query.eq("office_id", filterOffice);
      }

      if (filterPosition && filterPosition !== "") {
        query = query.eq("position_id", filterPosition);
      }

      // Order by name
      query = query.order("lastname", { ascending: true });

      const { data: usersData, error: usersError } = await query;

      if (usersError) throw new Error(usersError.message);

      // Fetch PDS data for mobile numbers
      const userIds = usersData?.map((u: any) => u.id) || [];
      let pdsData: any[] = [];

      if (userIds.length > 0) {
        const { data: pds, error: pdsError } = await supabase
          .from("hrm_pds")
          .select("user_id, mobile_number")
          .in("user_id", userIds);

        if (!pdsError && pds) {
          pdsData = pds;
        }
      }

      // Fetch service records for separation dates
      let serviceRecords: any[] = [];

      if (userIds.length > 0) {
        const { data: srData, error: srError } = await supabase
          .from("hrm_service_records")
          .select("user_id, separation_date, separation_cause")
          .in("user_id", userIds);

        if (!srError && srData) {
          serviceRecords = srData;
        }
      }

      // Create workbook
      const workbook = new Excel.Workbook();
      const worksheet = workbook.addWorksheet("Employees Records");

      // Define columns
      worksheet.columns = [
        { header: "No.", key: "no", width: 10 },
        { header: "Employee ID Number", key: "employee_id", width: 20 },
        { header: "Full Name", key: "full_name", width: 35 },
        { header: "Position/Designation", key: "position", width: 30 },
        { header: "Vice", key: "vice", width: 30 },
        { header: "Mobile Number", key: "mobile_number", width: 20 },
        { header: "Date Hired", key: "date_hired", width: 15 },
        { header: "Personal Email Address", key: "email", width: 30 },
        {
          header: "Source(s) of Fund (if Non-DepEd funded)",
          key: "source_of_fund",
          width: 30,
        },
        {
          header: "Date of Effectivity of Separation (if inactive)",
          key: "separation_date",
          width: 30,
        },
        {
          header: "Cause of Separation (if inactive)",
          key: "separation_cause",
          width: 30,
        },
      ];

      // Add data rows
      usersData?.forEach((user: any, index: number) => {
        // Get employee ID from item_number
        const employeeId = user.hrm_item?.item_number || user.id || "";

        // Get full name
        const fullName = `${user.lastname || ""}, ${user.firstname || ""} ${
          user.middlename || ""
        }`.trim();

        // Get position - prefer from item, fallback to user position
        const position =
          user.hrm_item?.hrm_position?.name || user.hrm_positions?.name || "";

        // Get vice from item
        const vice = user.hrm_item?.vice || "";

        // Get mobile number from PDS
        const userPds = pdsData.find((pds: any) => pds.user_id === user.id);
        const mobileNumber = userPds?.mobile_number || "";

        // Get date hired
        const dateHired = user.joining_date
          ? new Date(user.joining_date).toLocaleDateString("en-US", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
            })
          : "";

        // Get email
        const email = user.email || "";

        // Source of fund - not available in schema, leaving empty
        const sourceOfFund = "";

        // Get separation data
        const userServiceRecords = serviceRecords.filter(
          (sr: any) => sr.user_id === user.id
        );
        const latestServiceRecord =
          userServiceRecords.length > 0
            ? userServiceRecords[userServiceRecords.length - 1]
            : null;

        // Check if inactive - status is not "Active" or item status indicates inactive
        const isInactive =
          user.status !== "Active" ||
          user.hrm_item?.status === "Inactive" ||
          user.hrm_item?.status === "Separated";

        const separationDate =
          isInactive && latestServiceRecord?.separation_date
            ? new Date(latestServiceRecord.separation_date).toLocaleDateString(
                "en-US",
                {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                }
              )
            : isInactive && user.hrm_item?.reason_for_removal
            ? "" // If there's reason but no date, leave empty or use item date if available
            : "";

        const separationCause = isInactive
          ? latestServiceRecord?.separation_cause ||
            user.hrm_item?.reason_for_removal ||
            ""
          : "";

        worksheet.addRow({
          no: index + 1,
          employee_id: employeeId,
          full_name: fullName,
          position,
          vice,
          mobile_number: mobileNumber,
          date_hired: dateHired,
          email,
          source_of_fund: sourceOfFund,
          separation_date: separationDate,
          separation_cause: separationCause,
        });
      });

      // Generate and download Excel file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      saveAs(blob, `Employees Records - DepEd.xlsx`);
    } catch (error) {
      console.error("Export error:", error);
      alert("Failed to export data. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  const exportByPosition = async () => {
    setExportingByPosition(true);
    try {
      let query = supabase
        .from("hrm_users")
        .select(
          `
          id,
          firstname,
          middlename,
          lastname,
          hrm_schools:school_id(name),
          hrm_offices:office_id(name),
          hrm_positions:position_id(name),
          hrm_item:item_id(hrm_position:position_id(name))
        `
        )
        .eq("org_id", process.env.NEXT_PUBLIC_ORG_ID!)
        .eq("status", "Active")
        .not("item_id", "is", null);

      if (filterSchool && filterSchool !== "") {
        query = query.eq("school_id", filterSchool);
      }

      if (filterOffice && filterOffice !== "") {
        query = query.eq("office_id", filterOffice);
      }

      if (filterPosition && filterPosition !== "") {
        query = query.eq("position_id", filterPosition);
      }

      const { data, error } = await query;

      if (error) throw new Error(error.message);

      const rows = (data || []).map((user: any) => {
        const position =
          user.hrm_item?.hrm_position?.name || user.hrm_positions?.name || "";
        const fullName = `${user.lastname || ""}, ${user.firstname || ""} ${
          user.middlename || ""
        }`.trim();
        const schoolOffice =
          user.hrm_schools?.name || user.hrm_offices?.name || "";
        return { position, fullName, schoolOffice };
      });

      // Sort by position, then by name
      rows.sort((a, b) => {
        const p = a.position.localeCompare(b.position);
        if (p !== 0) return p;
        return a.fullName.localeCompare(b.fullName);
      });

      const workbook = new Excel.Workbook();
      const worksheet = workbook.addWorksheet("Employees by Position");

      worksheet.columns = [
        { header: "No.", key: "no", width: 8 },
        { header: "Position", key: "position", width: 35 },
        { header: "Name", key: "full_name", width: 35 },
        { header: "School / Office", key: "school_office", width: 35 },
      ];

      rows.forEach((row, index) => {
        worksheet.addRow({
          no: index + 1,
          position: row.position,
          full_name: row.fullName,
          school_office: row.schoolOffice,
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      saveAs(blob, `Employees by Position - DepEd.xlsx`);
    } catch (error) {
      console.error("Export by position error:", error);
      alert("Failed to export data. Please try again.");
    } finally {
      setExportingByPosition(false);
    }
  };

  return (
    <>
      <Sidebar>
        <ReportsSidebar />
      </Sidebar>
      <TopBar />

      <div className="app__main">
        <div>
          <div className="app__title">
            <Title title="Employees Records" />
          </div>

          {/* Filters */}
          <div className="app__filters">
            <div className="items-center space-x-2 space-y-1">
              <div className="app__filter_field_container">
                <div className="items-center space-y-1">
                  <div className="app__filter_container">
                    <TagIcon className="w-4 h-4 mr-1" />
                    <select
                      value={selectedSchool}
                      onChange={(e) => setSelectedSchool(e.target.value)}
                      className="app__filter_select"
                    >
                      <option value="">All</option>
                      {schools.map((item, index) => (
                        <option key={index} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="app__filter_container">
                    <TagIcon className="w-4 h-4 mr-1" />
                    <select
                      value={selectedOffice}
                      onChange={(e) => setSelectedOffice(e.target.value)}
                      className="app__filter_select"
                    >
                      <option value="">All</option>
                      {offices.map((item, index) => (
                        <option key={index} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="app__filter_container">
                    <TagIcon className="w-4 h-4 mr-1" />
                    <select
                      value={selectedPosition}
                      onChange={(e) => setSelectedPosition(e.target.value)}
                      className="app__filter_select"
                    >
                      <option value="">Choose Position</option>
                      {positions.map((item, index) => (
                        <option key={index} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
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
                    Export Employees Records
                  </h2>
                  <p className="text-sm text-gray-600 mb-4">
                    Export employee data to Excel with the following
                    information: Employee ID Number, Full Name,
                    Position/Designation, Mobile Number, Date Hired, Personal
                    Email Address, Source(s) of Fund (if Non-DepEd funded), Date
                    of Effectivity of Separation (if inactive), and Cause of
                    Separation (if inactive).
                  </p>
                  <button
                    onClick={exportToExcel}
                    disabled={exporting}
                    className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                      exporting
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

          {/* Export by Position Card */}
          <div className="w-full px-4 pt-4 pb-4 bg-gray-100">
            <Card className="rounded-xl shadow">
              <CardContent className="pt-6">
                <div className="text-center">
                  <h2 className="font-semibold text-lg mb-4">
                    Export Employees by Position
                  </h2>
                  <p className="text-sm text-gray-600 mb-4">
                    Export a simplified list grouped and sorted by position.
                    Columns: Position, Name, and School/Office. Honors the
                    School, Office, and Position filters above.
                  </p>
                  <button
                    onClick={exportByPosition}
                    disabled={exportingByPosition}
                    className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                      exportingByPosition
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700 text-white"
                    }`}
                  >
                    {exportingByPosition
                      ? "Exporting..."
                      : "Export by Position"}
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
