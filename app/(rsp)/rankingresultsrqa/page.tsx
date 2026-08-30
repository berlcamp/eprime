"use client";
import {
  ConfirmModal,
  CustomButton,
  Sidebar,
  TableRowLoading,
  Title,
  TopBar,
  Unauthorized,
} from "@/components/index";
import { useFilter } from "@/context/FilterContext";
import { Menu, Transition } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import Excel from "exceljs";
import { saveAs } from "file-saver";
import React, { Fragment, useEffect, useState } from "react";
import Filters from "./Filters";

// Types
import type { ApplicantTypes, RankingTypes } from "@/types";

import CommitteePointsModal from "@/components/Rsp/CommitteePointsModal";
import {
  EmployeePrintablesController,
  type EmployeePrintablesControllerHandle,
} from "@/components/Rsp/EmployeePrintablesController";
import { PrintableActionsMenu } from "@/components/Rsp/PrintableActionsMenu";
import RspSidebar from "@/components/Sidebars/RspSidebar";
import { superAdmins } from "@/constants";
import { useSupabase } from "@/context/SupabaseProvider";
import { CommitteeAccumulatedPoints } from "@/utils/data-helpers";
import { logError } from "@/utils/fetchApi";
import axios from "axios";
import { format } from "date-fns";
import { CalendarIcon, CheckIcon } from "lucide-react";
import Image from "next/image";

interface ListTypes {
  no?: number;
  no2?: number;
  applicant: ApplicantTypes;
  accumulated_points: Record<string, number> | null;
  overall_score: string;
}

const Page: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [refetch, setRefetch] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [showCommitteePointsModal, setShowCommitteePointsModal] =
    useState(false);
  const [showConfirmAppointModal, setShowConfirmAppointModal] = useState(false);
  const [showConfirmUnappointModal, setShowConfirmUnappointModal] =
    useState(false);
  const [selectedItem, setSelectedItem] = useState<ApplicantTypes | null>(null);

  const [list, setList] = useState<ListTypes[]>([]);
  const [rankList, setRankList] = useState<ListTypes[]>([]);
  const [originalList, setOriginalList] = useState<ListTypes[] | []>([]);
  const [filterRankingIds, setFilterRankingIds] = useState<string[]>([]);
  const [filterDisplay, setFilterDisplay] = useState<string>("");

  const [rankingsMeta, setRankingsMeta] = useState<RankingTypes[]>([]);

  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchMajor, setSearchMajor] = useState("");
  const [majors, setMajors] = useState<string[] | []>([]);

  const { hasAccess, setToast } = useFilter();
  const { supabase, session } = useSupabase();

  const isSuperAdmin = superAdmins.includes(session?.user.email ?? "");

  const printablesRef = React.useRef<EmployeePrintablesControllerHandle>(null);

  const fetchData = async () => {
    if (filterRankingIds.length === 0) {
      return;
    }
    setLoading(true);

    try {
      const { data: metaRows } = await supabase
        .from("hrm_rankings")
        .select(
          "*, position:position_id(name), committees:hrm_ranking_committees(*, hrm_user:user_id(id, firstname, middlename, lastname, avatar_url, signature_path, hrm_positions:position_id(name)))",
        )
        .in("id", filterRankingIds);

      setRankingsMeta(metaRows ?? []);

      const query = supabase
        .from("hrm_ranking_applicants")
        .select(
          "*, hrm_item:item_id(implementing_unit:implementing_unit_id(*),hrm_position:position_id(*)),ranking:ranking_id(type,year,passing_score,position:position_id(name,salary_grade),committees:hrm_ranking_committees(*, hrm_user:user_id(id, firstname, middlename, lastname, avatar_url, signature_path, hrm_positions:position_id(name)), committee_criterias:hrm_ranking_committee_criterias( *, criteria:criteria_id(*), criteria_points:hrm_ranking_applicant_points(*))))",
          {
            count: "exact",
          },
        )
        .eq("evaluation_status", "Qualified")
        .in("ranking_id", filterRankingIds);

      const { data, error } = await query;

      if (error) {
        throw new Error(error.message);
      }

      if (data.length === 0) {
        setList([]);
        setOriginalList([]);
        setRankList([]);
        setMajors([]);
        return;
      }

      const structguredData: ListTypes[] = [];
      data.forEach((d: ApplicantTypes) => {
        const accumulatedPoints: Record<string, number> | null =
          CommitteeAccumulatedPoints(d.id, d.ranking.committees);

        structguredData.push({
          applicant: d,
          accumulated_points: accumulatedPoints,
          overall_score: accumulatedPoints
            ? Object.values(accumulatedPoints)
                .reduce((sum: number, points) => sum + points, 0)
                .toFixed(2)
            : "",
        });
      });

      structguredData.sort((a, b) => {
        const scoreA = parseFloat(a.overall_score || "0");
        const scoreB = parseFloat(b.overall_score || "0");
        return scoreB - scoreA;
      });

      structguredData.forEach((item, index) => {
        item.no = index + 1;
        item.no2 = undefined;
      });

      const uniqueMajors = Array.from(
        new Set(structguredData.map((item) => item.applicant.specific_major)),
      );

      setMajors(uniqueMajors);

      setList(structguredData);
      setOriginalList(structguredData);

      setRankList(structguredData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchApplicant = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const searchTerm = e.target.value;
    setSearchKeyword(searchTerm);

    if (searchTerm.trim().length < 3) {
      setList(originalList);
      return;
    }

    // Search user
    const searchWords = e.target.value.split(" ");
    const results = list.filter((user) => {
      const fullName =
        `${user.applicant.firstname} ${user.applicant.middlename} ${user.applicant.lastname}`.toLowerCase();
      return searchWords.every((word) => fullName.includes(word.toLowerCase()));
    });

    setList(results);
  };
  const handleSearchMajor = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const searchTerm = e.target.value;
    setSearchMajor(searchTerm);

    if (searchTerm.trim() !== "") {
      const filteredArr = originalList.filter(
        (item) => item.applicant.specific_major === searchTerm,
      );
      // Add index "no" starting from 1
      filteredArr.forEach((item, index) => {
        item.no2 = index + 1;
      });
      setList(filteredArr);
    } else {
      setList(originalList);
    }
  };

  const handleViewCommitteePoints = (item: ApplicantTypes) => {
    setShowCommitteePointsModal(true);
    setSelectedItem(item);
  };

  const handleAppoint = (item: ApplicantTypes) => {
    setShowConfirmAppointModal(true);
    setSelectedItem(item);
  };

  const handleConfirmedAppoint = async () => {
    if (saving || !selectedItem) return;

    setSaving(true);

    try {
      const { error } = await supabase
        .from("hrm_ranking_applicants")
        .update({
          status: "Appointed",
          // Dates the appointment stage of the turnaround report.
          appointed_at: new Date().toISOString(),
        })
        .eq("id", selectedItem.id);

      if (error) {
        void logError(
          "Appoint applicant",
          "hrm_ranking_applicants",
          "",
          error.message,
        );
        setToast(
          "error",
          "Saving failed, please reload the page and try again.",
        );
        throw new Error(error.message);
      }

      // Email the applicant on the server side
      axios
        .post("/api/appointemail", {
          position: selectedItem?.ranking?.position?.name,
          type: selectedItem?.ranking?.type,
          code: selectedItem.code,
          email: selectedItem.email,
          firstname: selectedItem.firstname,
          middlename: selectedItem.middlename,
          lastname: selectedItem.lastname,
        })
        .then(function () {
          //
        })
        .catch(function (error) {
          void logError(
            "Approving registration",
            "hrm_registrations",
            JSON.stringify({
              position: selectedItem?.ranking?.position?.name,
              type: selectedItem?.ranking?.type,
              code: selectedItem.code,
              firstname: selectedItem.firstname,
              middlename: selectedItem.middlename,
              lastname: selectedItem.lastname,
            }),
            JSON.stringify(error),
          );
          console.error(error);
        });

      // pop up the success message
      setToast("success", "Successfully saved.");

      setSaving(false);
      setShowConfirmAppointModal(false);
      setRefetch(!refetch);
    } catch (e) {
      console.error(e);
    }
  };

  const handleUnappoint = (item: ApplicantTypes) => {
    setShowConfirmUnappointModal(true);
    setSelectedItem(item);
  };

  // Reverts an accidental appointment. No email is sent — the applicant was
  // already notified by handleConfirmedAppoint, so this has to be relayed
  // to them manually.
  const handleConfirmedUnappoint = async () => {
    if (saving || !selectedItem || !isSuperAdmin) return;

    setSaving(true);

    try {
      const { error } = await supabase
        .from("hrm_ranking_applicants")
        .update({
          status: null,
        })
        .eq("id", selectedItem.id);

      if (error) {
        void logError(
          "Unappoint applicant",
          "hrm_ranking_applicants",
          "",
          error.message,
        );
        setToast(
          "error",
          "Saving failed, please reload the page and try again.",
        );
        throw new Error(error.message);
      }

      setToast("success", "Successfully unappointed.");

      setShowConfirmUnappointModal(false);
      setRefetch(!refetch);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadExcel = async (type: string) => {
    setDownloading(true);

    let list = rankList;
    if (type === "RQA") {
      const filteredList = rankList.filter(
        (item) =>
          Number(item.overall_score) >
          Number(item.applicant.ranking?.passing_score ?? 50),
      );
      list = filteredList;
    }

    // Create a new workbook and add a worksheet
    const workbook = new Excel.Workbook();
    const worksheet = workbook.addWorksheet("Sheet 1");

    // Extract unique keys from accumulated_points dynamically
    const allKeys = Array.from(
      new Set(
        list.flatMap((item) => Object.keys(item.accumulated_points ?? {})),
      ),
    );

    // Define worksheet columns dynamically
    worksheet.columns = [
      { header: "No.", key: "number", width: 10 },
      { header: "Names of Applicant", key: "name", width: 25 },
      { header: "Ranking", key: "ranking", width: 25 },
      { header: "Ranking Type", key: "ranking_type", width: 20 },
      { header: "Ranking Year", key: "ranking_year", width: 15 },
      { header: "Position", key: "position", width: 25 },
      { header: "Implementing Unit", key: "ius", width: 25 },
      { header: "Applicant Code", key: "code", width: 25 },
      { header: "Email", key: "email", width: 25 },
      { header: "Address", key: "address", width: 30 },
      { header: "Age", key: "age", width: 10 },
      { header: "Sex", key: "sex", width: 12 },
      { header: "Civil Status", key: "civil_status", width: 15 },
      { header: "Contact Number", key: "contact_number", width: 18 },
      { header: "Religion", key: "religion", width: 18 },
      { header: "Disability", key: "disability", width: 18 },
      { header: "Special Skills", key: "special_skills", width: 25 },
      { header: "Solo Parent", key: "solo_parent", width: 18 },
      { header: "Member of Ethnic Group", key: "ethnicity", width: 25 },
      { header: "Latin Honor", key: "latin_honor", width: 20 },
      {
        header: "Special Program Beneficiary",
        key: "special_program_beneficiary",
        width: 25,
      },
      { header: "Major", key: "major", width: 25 },
      { header: "Current DepEd Employee", key: "current_employee", width: 20 },
      {
        header: "Current Position",
        key: "current_position",
        width: 25,
      },
      {
        header: "Current Implementing Unit",
        key: "current_ius",
        width: 25,
      },
      { header: "Previous Applicant", key: "previous_applicant", width: 18 },
      ...allKeys.map((key) => ({ header: key, key, width: 15 })), // Dynamic columns
      { header: "Total", key: "overall_score", width: 15 },
      { header: "remarks", key: "remarks", width: 15 },
      { header: "For Background Investigation (Yes)", key: "yes", width: 15 },
      { header: "For Background Investigation (No)", key: "no", width: 15 },
      {
        header:
          "For Appointment (To be filled out by the appointing Officer/Authority, Please sign opposite the name of the applicant)",
        key: "status1",
        width: 15,
      },
      {
        header:
          "Status of Appointment (Based on availability of PBET/LET/LEPT)",
        key: "status2",
        width: 15,
      },
    ];

    // Data for the Excel file
    const data: any[] = list.map((item, index) => ({
      number: index + 1,
      name: `${item.applicant.lastname}, ${item.applicant.firstname} ${item.applicant.middlename}`,
      ranking: `${item.applicant.ranking?.position?.name ?? "N/A"}`,
      ranking_type: `${item.applicant.ranking?.type ?? ""}`,
      ranking_year: `${item.applicant.ranking?.year ?? ""}`,
      position: `${item.applicant.hrm_item?.hrm_position?.name ?? "N/A"}`,
      ius: `${item.applicant.hrm_item?.implementing_unit?.name ?? "N/A"}`,
      code: `${item.applicant.code}`,
      email: `${item.applicant.email ?? ""}`,
      address: `${item.applicant.address ?? ""}`,
      age: `${item.applicant.age ?? ""}`,
      sex: `${item.applicant.sex ?? ""}`,
      civil_status: `${item.applicant.civil_status ?? ""}`,
      contact_number: `${item.applicant.contact_number ?? ""}`,
      religion: `${item.applicant.religion ?? ""}`,
      disability: `${item.applicant.disability ?? ""}`,
      special_skills: `${item.applicant.special_skills ?? ""}`,
      solo_parent: `${item.applicant.solo_parent ?? ""}${
        item.applicant.solo_parent_detail
          ? ` - ${item.applicant.solo_parent_detail}`
          : ""
      }`,
      ethnicity: `${item.applicant.ethnicity ?? ""}${
        item.applicant.ethnicity_detail
          ? ` - ${item.applicant.ethnicity_detail}`
          : ""
      }`,
      latin_honor: `${item.applicant.latin_honor_yesno ?? ""}${
        item.applicant.latin_honor ? ` - ${item.applicant.latin_honor}` : ""
      }`,
      special_program_beneficiary: `${
        item.applicant.special_program_beneficiary_yesno ?? ""
      }${
        item.applicant.special_program_beneficiary
          ? ` - ${item.applicant.special_program_beneficiary}`
          : ""
      }`,
      major: `${item.applicant.specific_major ?? ""}`,
      current_employee: `${item.applicant.current_employee ?? ""}`,
      current_position:
        item.applicant.current_employee === "Yes"
          ? `${item.applicant.hrm_item?.hrm_position?.name ?? ""}`
          : "",
      current_ius:
        item.applicant.current_employee === "Yes"
          ? `${item.applicant.hrm_item?.implementing_unit?.name ?? ""}`
          : "",
      previous_applicant: `${item.applicant.previous_applicant ?? ""}`,
      ...allKeys.reduce<Record<string, any>>((acc, key) => {
        acc[key] = item.accumulated_points?.[key] ?? "-"; // Use "-" if value is missing
        return acc;
      }, {}),
      overall_score: item.overall_score,
      remarks: "",
      yes: "",
      no: "",
      status1: "",
      status2: "",
    }));

    data.push({ name: "" });
    data.push({ name: "Confirmed Committee Members:" });
    rankingsMeta.forEach((ranking) => {
      data.push({
        name: `${ranking.position?.name ?? "—"} — ${ranking.type} — ${ranking.year}`,
      });
      ranking.committees?.forEach((c) => {
        if (c.type === "Original Member" && c.status === "Confirmed") {
          data.push({
            name: `${c.hrm_user.firstname} ${c.hrm_user.middlename ?? ""} ${
              c.hrm_user.lastname
            } / ${c.hrm_user.hrm_positions?.name}`,
          });
        }
      });
    });

    // Add data to the worksheet
    data.forEach((item) => worksheet.addRow(item));

    // Generate the Excel file
    await workbook.xlsx.writeBuffer().then((buffer) => {
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      saveAs(blob, "Ranking-Results.xlsx");
    });
    setDownloading(false);
  };

  // Filter data by Display (RQA uses each applicant's ranking passing score)
  useEffect(() => {
    setLoading(true);

    if (filterDisplay === "RQA") {
      const filteredList = rankList.filter(
        (item) =>
          Number(item.overall_score) >
          Number(item.applicant.ranking?.passing_score ?? 50),
      );
      setList(filteredList);
    } else {
      setList(rankList);
    }

    setLoading(false);
  }, [filterDisplay, rankList]);

  // Fetch data
  useEffect(() => {
    setList([]);
    setRankList([]);
    setRankingsMeta([]);
    void fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterRankingIds, refetch]);

  const isDataEmpty = !Array.isArray(list) || list.length < 1 || !list;

  // Check access from permission settings or Super Admins
  if (!hasAccess("rsp_manager") && !hasAccess("hr") && !hasAccess("sds"))
    return <Unauthorized />;

  return (
    <>
      <Sidebar>
        <RspSidebar />
      </Sidebar>
      <TopBar />
      <div className="app__main">
        <div>
          <div className="app__title">
            <Title title="Ranking Results (RQA)" />
          </div>

          {/* Filters */}
          <div className="app__filters">
            <Filters setFilterRankingIds={setFilterRankingIds} />
          </div>

          {rankList.length > 0 && (
            <div className="flex space-x-2 px-4 py-4 w-full md:w-1/2">
              <input
                placeholder="Search applicant"
                type="text"
                value={searchKeyword}
                onChange={handleSearchApplicant}
                className="app__input_standard"
              />
              <select
                value={searchMajor}
                onChange={handleSearchMajor}
                className="app__input_standard"
              >
                <option value="">All Major</option>
                {majors.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            </div>
          )}

          {rankList.length > 0 && (
            <div className="flex items-center space-x-2 py-2 px-4 bg-gray-50 border-t border-gray-200 text-gray-500">
              <div className="flex-1 text-xs">{`Total results: ${list.length}`}</div>
              <div className="space-x-2">
                <CustomButton
                  containerStyles="app__btn_green"
                  title={downloading ? "Downloading..." : "Download Rank List"}
                  btnType="button"
                  handleClick={() => handleDownloadExcel("Rank List")}
                />
                <CustomButton
                  containerStyles="app__btn_green"
                  title="Download CAR-RQA (per ranking passing score)"
                  btnType="button"
                  handleClick={() => handleDownloadExcel("RQA")}
                />
                <CustomButton
                  containerStyles="app__btn_blue"
                  title="Display Rank List"
                  btnType="button"
                  handleClick={() => setFilterDisplay("Rank List")}
                />
                <CustomButton
                  containerStyles="app__btn_blue"
                  title="Display CAR-RQA (per ranking passing score)"
                  btnType="button"
                  handleClick={() => setFilterDisplay("RQA")}
                />
              </div>
              <div className="app__filter_container max-w-md">
                <CheckIcon className="w-4 h-4 mr-1 shrink-0" />
                <div className="text-xs">
                  RQA passing scores (per ranking):{" "}
                  {rankingsMeta
                    .map(
                      (r) =>
                        `${r.position?.name ?? "—"}: ${r.passing_score ?? "—"}`,
                    )
                    .join(" · ")}
                </div>
              </div>
              <div className="app__filter_container max-w-md">
                <CalendarIcon className="w-4 h-4 mr-1 shrink-0" />
                <div className="text-xs">
                  Closed:{" "}
                  {rankingsMeta
                    .map(
                      (r) =>
                        `${r.position?.name ?? "—"}: ${
                          r.closed_at
                            ? format(new Date(r.closed_at), "MMM d, yyyy")
                            : "—"
                        }`,
                    )
                    .join(" · ")}
                </div>
              </div>
            </div>
          )}

          {filterRankingIds.length === 0 && (
            <div className="mt-10 text-center text-xl font-light text-gray-600">
              Select one or more CAR-RQA rankings from the filters above, then
              apply.
            </div>
          )}

          {/* Main Content */}
          {rankList.length > 0 && (
            <div>
              <table className="app__table">
                <thead className="app__thead">
                  <tr>
                    <th className="app__th pl-4"></th>
                    <th className="app__th pl-4">Rank</th>
                    <th className="app__th pl-4">Rank By Major</th>
                    <th className="app__th w-[220px]">Ranking</th>
                    <th className="app__th w-[300px]">Applicant</th>
                    <th className="app__th w-40"></th>
                    <th className="app__th">Accumulated Points</th>
                    <th className="app__th">Overall Score</th>
                  </tr>
                </thead>
                <tbody>
                  {!isDataEmpty &&
                    list.map((item, index) => (
                      <tr key={index} className="app__tr">
                        <td className="w-6 pl-4 app__td">
                          <Menu as="div" className="app__menu_container">
                            <div>
                              <Menu.Button className="app__dropdown_btn">
                                <ChevronDownIcon
                                  className="h-5 w-5"
                                  aria-hidden="true"
                                />
                              </Menu.Button>
                            </div>

                            <Transition
                              as={Fragment}
                              enter="transition ease-out duration-100"
                              enterFrom="transform opacity-0 scale-95"
                              enterTo="transform opacity-100 scale-100"
                              leave="transition ease-in duration-75"
                              leaveFrom="transform opacity-100 scale-100"
                              leaveTo="transform opacity-0 scale-95"
                            >
                              <Menu.Items className="app__dropdown_items">
                                <PrintableActionsMenu
                                  onPrintAdviseOrder={() =>
                                    printablesRef.current?.openAdviseOrder(
                                      item.applicant,
                                    )
                                  }
                                  onPrintAssumption={() =>
                                    printablesRef.current?.openAssumption(
                                      item.applicant,
                                    )
                                  }
                                  onPrintOathOfOffice={() =>
                                    printablesRef.current?.openOathOfOffice(
                                      item.applicant,
                                    )
                                  }
                                  onPrintAppointmentForm={() =>
                                    printablesRef.current?.openAppointmentForm(
                                      item.applicant,
                                    )
                                  }
                                  onViewCommitteePoints={() =>
                                    handleViewCommitteePoints(item.applicant)
                                  }
                                  showViewCommitteePoints
                                  isAppointed={
                                    item.applicant.status === "Appointed"
                                  }
                                />
                              </Menu.Items>
                            </Transition>
                          </Menu>
                        </td>
                        <td className="w-6 pl-4 app__td text-lg">{item.no}</td>
                        <td className="w-6 pl-4 app__td text-lg">{item.no2}</td>
                        <td className="app__td text-sm align-top">
                          <div className="font-medium">
                            {item.applicant.ranking?.position?.name ?? "—"}
                          </div>
                          <div className="font-light text-gray-600">
                            {item.applicant.ranking?.type} ·{" "}
                            {item.applicant.ranking?.year}
                          </div>
                        </td>
                        <th className="app__th_firstcol">
                          <div className="font-medium">
                            {item.applicant.lastname},{" "}
                            {item.applicant.firstname}{" "}
                            {item.applicant.middlename}
                          </div>
                          <div className="font-light">
                            Application Code: {item.applicant.code}
                          </div>
                          <div className="font-light">
                            Address: {item.applicant.address}
                          </div>
                          <div className="font-light">
                            Age: {item.applicant.age}
                          </div>
                          <div className="font-light">
                            Sex: {item.applicant.sex}
                          </div>
                          <div className="font-light">
                            Civil Status: {item.applicant.civil_status}
                          </div>
                          <div className="font-light">
                            Contact Number: {item.applicant.contact_number}
                          </div>
                          <div className="font-light">
                            Religion: {item.applicant.religion}
                          </div>
                          <div className="font-light">
                            Disability: {item.applicant.disability}
                          </div>
                          <div className="font-light">
                            Special Skills: {item.applicant.special_skills}
                          </div>
                          <div className="font-light">
                            Solo Parent: {item.applicant.solo_parent}
                          </div>
                          <div className="font-light">
                            Member of Ethnic Group: {item.applicant.ethnicity}{" "}
                            {item.applicant.ethnicity_detail}
                          </div>
                          <div className="font-light">
                            Latin Honor: {item.applicant.latin_honor_yesno}{" "}
                            {item.applicant.latin_honor}
                          </div>
                          <div className="font-light">
                            Special Program Beneficiary?:{" "}
                            {item.applicant.special_program_beneficiary_yesno}{" "}
                            {item.applicant.special_program_beneficiary}
                          </div>
                          <div className="font-light">
                            Major: {item.applicant.specific_major}
                          </div>
                          {item.applicant.current_employee === "Yes" && (
                            <>
                              <div className="font-bold mt-2">
                                (Current DepEd Employee)
                              </div>
                              <div className="">
                                Position:{" "}
                                {item.applicant.hrm_item?.hrm_position?.name}
                              </div>
                              <div className="">
                                Implementing Unit:{" "}
                                {
                                  item.applicant.hrm_item?.implementing_unit
                                    ?.name
                                }
                              </div>
                            </>
                          )}
                          {item.applicant.previous_applicant === "Yes" && (
                            <div className="font-bold">
                              (Previous Applicant)
                            </div>
                          )}
                        </th>
                        <td className="app__td">
                          {(hasAccess("sds") || hasAccess("settings")) &&
                            item.applicant.status !== "Appointed" && (
                              <CustomButton
                                containerStyles="app__btn_blue"
                                title="Appoint"
                                btnType="button"
                                handleClick={() =>
                                  handleAppoint(item.applicant)
                                }
                              />
                            )}
                          {item.applicant.status === "Appointed" && (
                            <div className="space-y-2">
                              <div className="font-bold text-lg">Appointed</div>
                              {isSuperAdmin && (
                                <CustomButton
                                  containerStyles="app__btn_red"
                                  title="Unappoint"
                                  btnType="button"
                                  handleClick={() =>
                                    handleUnappoint(item.applicant)
                                  }
                                />
                              )}
                            </div>
                          )}
                        </td>
                        <td className="app__td">
                          {item.accumulated_points && (
                            <div>
                              {Object.entries(item.accumulated_points).map(
                                ([criteriaName, avgPoints]) => (
                                  <div key={criteriaName}>
                                    <span>{criteriaName}:</span>
                                    <span className="font-bold">
                                      {" "}
                                      {avgPoints.toFixed(3)}{" "}
                                    </span>
                                    {/* Display with 2 decimal places */}
                                  </div>
                                ),
                              )}
                            </div>
                          )}
                        </td>
                        <td className="app__td">
                          {Number(item.overall_score).toFixed(3)}
                        </td>
                      </tr>
                    ))}
                  {loading && <TableRowLoading cols={5} rows={2} />}
                </tbody>
              </table>
              {!loading && isDataEmpty && (
                <div className="app__norecordsfound">No results.</div>
              )}
              {!isDataEmpty && (
                <div className="mx-4 mt-4 space-y-8">
                  {rankingsMeta.map((ranking) => (
                    <div key={ranking.id}>
                      <div className="text-sm font-bold text-gray-600">
                        Ranking committees — {ranking.position?.name ?? "—"} (
                        {ranking.type}, {ranking.year})
                      </div>
                      <div className="mt-4 space-x-4 space-y-2">
                        {ranking.committees?.map((committee) => (
                          <div key={committee.id} className="inline-flex">
                            <div>
                              {committee.status === "Confirmed" ? (
                                <div>
                                  {committee.hrm_user?.signature_path ? (
                                    <Image
                                      src={committee.hrm_user?.signature_path}
                                      alt=""
                                      width={75}
                                      height={75}
                                      className="object-contain"
                                    />
                                  ) : (
                                    <Image
                                      src="/sgd.png"
                                      alt=""
                                      width={75}
                                      height={75}
                                    />
                                  )}
                                </div>
                              ) : (
                                <div className="h-[75px]">&nbsp;</div>
                              )}
                              <div className="text-sm underline underline-offset-4">
                                {committee.hrm_user.firstname}{" "}
                                {committee.hrm_user.middlename ?? ""}{" "}
                                {committee.hrm_user.lastname}
                              </div>
                              <div className="text-xs">
                                {committee.hrm_user.hrm_positions?.name}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* All print modals + hidden print targets for the 4 appointment printables */}
      <EmployeePrintablesController ref={printablesRef} />

      {/* Show Casted Points Modal */}
      {showCommitteePointsModal && selectedItem && (
        <CommitteePointsModal
          applicantData={selectedItem}
          hideModal={() => setShowCommitteePointsModal(false)}
        />
      )}

      {/* Disapprove Confirmation Modal */}
      {showConfirmAppointModal && (
        <ConfirmModal
          header="Confirmation"
          btnText="Confirm"
          message="Are you sure you want to appoint this employee?"
          onConfirm={handleConfirmedAppoint}
          onCancel={() => setShowConfirmAppointModal(false)}
        />
      )}

      {/* Unappoint Confirmation Modal */}
      {showConfirmUnappointModal && isSuperAdmin && (
        <ConfirmModal
          header="Confirmation"
          btnText="Confirm"
          message="Are you sure you want to unappoint this employee? The applicant already received the appointment email, so you will need to inform them separately."
          onConfirm={handleConfirmedUnappoint}
          onCancel={() => setShowConfirmUnappointModal(false)}
        />
      )}
    </>
  );
};
export default Page;
