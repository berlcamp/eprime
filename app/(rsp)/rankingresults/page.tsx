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

import { PrintAdviseOrder } from "@/components/Printables/PrintAdviseOrder";
import { PrintAppointmentForm } from "@/components/Printables/PrintAppointmentForm";
import { PrintAssumption } from "@/components/Printables/PrintAssumption";
import { PrintOathOfOffice } from "@/components/Printables/PrintOathOfOffice";
import { PrintableActionsMenu } from "@/components/Rsp/PrintableActionsMenu";
import OathOfOfficeModal from "@/components/Rsp/OathOfOfficeModal";
import CommitteePointsModal from "@/components/Rsp/CommitteePointsModal";
import RspSidebar from "@/components/Sidebars/RspSidebar";
import { Input } from "@/components/ui/input";
import { useSupabase } from "@/context/SupabaseProvider";
import { CommitteeAccumulatedPoints } from "@/utils/data-helpers";
import { logError } from "@/utils/fetchApi";
import axios from "axios";
import { CheckIcon } from "lucide-react";
import Image from "next/image";
import { useReactToPrint } from "react-to-print";
import AppointmentFormModal from "./AppointmentFormModal";
import AssumptionModal from "./AssumptionModal";

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
  const [selectedItem, setSelectedItem] = useState<ApplicantTypes | null>(null);

  const [list, setList] = useState<ListTypes[]>([]);
  const [rankList, setRankList] = useState<ListTypes[]>([]);
  const [originalList, setOriginalList] = useState<ListTypes[] | []>([]);
  const [filterRanking, setFilterRanking] = useState<string>("");
  const [filterDisplay, setFilterDisplay] = useState<string>("");

  const [selectedType, setSelectedType] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [isAdviseOrderOpen, setIsAdviseOrderOpen] = useState(false);
  const [isAssumptionOpen, setIsAssumptionOpen] = useState(false);
  const [isOathOpen, setIsOathOpen] = useState(false);
  const [isAppointmentFormOpen, setIsAppointmentFormOpen] = useState(false);

  const [rankingDetails, setRankingDetails] = useState<RankingTypes | null>(
    null,
  );

  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchMajor, setSearchMajor] = useState("");
  const [majors, setMajors] = useState<string[] | []>([]);

  const { hasAccess, setToast } = useFilter();
  const { supabase } = useSupabase();

  const componentRef = React.useRef(null);
  const printFn = useReactToPrint({
    contentRef: componentRef,
    documentTitle: "request-form",
  });

  const fetchData = async () => {
    if (filterRanking === "") {
      return;
    }
    setLoading(true);

    try {
      const query = supabase
        .from("hrm_ranking_applicants")
        .select(
          "*, hrm_item:item_id(implementing_unit:implementing_unit_id(*),hrm_position:position_id(*)),ranking:ranking_id(type,year,passing_score,position:position_id(name),committees:hrm_ranking_committees(*, hrm_user:user_id(id, firstname, middlename, lastname, avatar_url, signature_path, hrm_positions:position_id(name)), committee_criterias:hrm_ranking_committee_criterias( *, criteria:criteria_id(*), criteria_points:hrm_ranking_applicant_points(*))))",
          {
            count: "exact",
          },
        )
        .eq("evaluation_status", "Qualified")
        .eq("ranking_id", filterRanking);

      const { data, error } = await query;

      console.log("data", data);

      if (error) {
        throw new Error(error.message);
      }

      if (filterRanking !== "") {
        if (data.length > 0) {
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

          // Sort structguredData by overall_score in descending order
          structguredData.sort((a, b) => {
            const scoreA = parseFloat(a.overall_score || "0");
            const scoreB = parseFloat(b.overall_score || "0");
            return scoreB - scoreA; // Sort in descending order
          });

          // Add index "no" starting from 1
          structguredData.forEach((item, index) => {
            item.no = index + 1;
            item.no2 = undefined;
          });

          // Extract unique majors using Array.from() to avoid spread operator issues
          const uniqueMajors = Array.from(
            new Set(
              structguredData.map((item) => item.applicant.specific_major),
            ),
          );

          setMajors(uniqueMajors);

          setList(structguredData);
          setOriginalList(structguredData);

          setRankList(structguredData);

          // get the ranking details so we can use the passing score
          setRankingDetails(structguredData[0].applicant.ranking);
        }
      }
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

  const handleDownloadExcel = async (type: string) => {
    setDownloading(true);

    const passingScore = rankingDetails?.passing_score ?? 50;

    let list = rankList;
    if (type === "RQA") {
      const filteredList = rankList.filter(
        (item) => Number(item.overall_score) > Number(passingScore),
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
      { header: "Position", key: "position", width: 25 },
      { header: "Implementing Unit", key: "ius", width: 25 },
      { header: "Applicant Code", key: "code", width: 25 },
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
      position: `${item.applicant.hrm_item?.hrm_position?.name ?? "N/A"}`,
      ius: `${item.applicant.hrm_item?.implementing_unit?.name ?? "N/A"}`,
      code: `${item.applicant.code}`,
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
    rankingDetails?.committees.forEach((c) => {
      if (c.type === "Original Member" && c.status === "Confirmed") {
        data.push({
          name: `${c.hrm_user.firstname} ${c.hrm_user.middlename ?? ""} ${
            c.hrm_user.lastname
          } / ${c.hrm_user.hrm_positions?.name}`,
        });
      }
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

  // Preload all images before printing (resolve on load or error so we don't block)
  const preloadImages = (urls: string[]) => {
    return Promise.all(
      urls.map(
        (url) =>
          new Promise<void>((resolve) => {
            const img = new window.Image();
            img.onload = () => resolve();
            img.onerror = () => resolve(); // Resolve on error so PNG fallback to SVG doesn't block
            img.src = url;
          }),
      ),
    );
  };

  const preloadPrintImages = () =>
    preloadImages([
      "/logos/deped_logo_1.png",
      "/logos/deped_logo_2.png",
      "/deped_header.svg",
      "/logos/matatag.png",
      "/logos/matatag.svg",
      "/logos/bagong.png",
      "/logos/bagong.svg",
      "/logos/bayugan.png",
      "/logos/bayugan.svg",
    ]);

  const handlePrintAdviseOrder = async (item: ApplicantTypes, type: string) => {
    await preloadPrintImages();

    setSelectedType(type);

    setTimeout(() => {
      setSelectedItem({
        ...item,
        date: selectedDate,
        assignment: selectedLocation,
      }); // Set the new item after a short delay
      setTimeout(() => {
        printFn(); // Trigger the print function after re-rendering the new content
      }, 100); // Adjust this delay if needed
    }, 100); // This delay ensures the unmounting and re-rendering are separated
  };

  const handlePrintAssumption = async (
    item: ApplicantTypes,
    date: string,
    location: string,
    signatory: string,
    position: string,
  ) => {
    await preloadPrintImages();

    setSelectedType("assumption");

    setTimeout(() => {
      setSelectedItem({
        ...item,
        date,
        assignment: location,
        signatory,
        position,
      }); // Set the new item after a short delay
      setTimeout(() => {
        printFn(); // Trigger the print function after re-rendering the new content
      }, 100); // Adjust this delay if needed
    }, 100); // This delay ensures the unmounting and re-rendering are separated
  };

  const handlePrintOathOfOffice = async (
    item: ApplicantTypes,
    date: string,
    signatory: string,
    position: string,
  ) => {
    await preloadPrintImages();
    setSelectedType("oath-of-office");
    setTimeout(() => {
      setSelectedItem({
        ...item,
        date,
        signatory,
        position,
      });
      setTimeout(() => printFn(), 100);
    }, 100);
  };

  const handlePrintAppointmentForm = async (
    item: ApplicantTypes,
    date: string,
    employmentStatus: string,
    natureOfAppointment: string,
    assignment: string,
  ) => {
    await preloadPrintImages();
    setSelectedType("appointment-form");
    setTimeout(() => {
      setSelectedItem({
        ...item,
        date,
        assignment,
        employment_status: employmentStatus,
        nature_of_appointment: natureOfAppointment,
      });
      setTimeout(() => printFn(), 100);
    }, 100);
  };

  // Filter data by Display
  useEffect(() => {
    setLoading(true);
    const passingScore = rankingDetails?.passing_score ?? 50;

    if (filterDisplay === "RQA") {
      const filteredList = rankList.filter(
        (item) => Number(item.overall_score) > Number(passingScore),
      );
      setList(filteredList);
    } else {
      setList(rankList);
    }

    setLoading(false);
  }, [filterDisplay, rankingDetails]);

  // Fetch data
  useEffect(() => {
    setList([]);
    setRankList([]);
    void fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterRanking, refetch]);

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
            <Title title="Ranking Results" />
          </div>

          {/* Filters */}
          <div className="app__filters">
            <Filters setFilterRanking={setFilterRanking} />
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
                  title={`Download ${rankingDetails?.type}`}
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
                  title={`Display ${rankingDetails?.type}`}
                  btnType="button"
                  handleClick={() => setFilterDisplay("RQA")}
                />
              </div>
              <div className="app__filter_container">
                <CheckIcon className="w-4 h-4 mr-1" />
                <div className="text-xs">
                  {rankingDetails?.type.includes("RQA") ? "RQA" : "CAR"} Passing
                  Score: {rankingDetails?.passing_score}
                </div>
              </div>
            </div>
          )}

          {filterRanking === "" && (
            <div className="mt-10 text-center text-xl font-light text-gray-600">
              Choose ranking from filters above.
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
                                  onPrintAdviseOrder={() => {
                                    setIsAdviseOrderOpen(true);
                                    setSelectedItem(item.applicant);
                                  }}
                                  onPrintAssumption={() => {
                                    setIsAssumptionOpen(true);
                                    setSelectedItem(item.applicant);
                                  }}
                                  onPrintOathOfOffice={() => {
                                    setIsOathOpen(true);
                                    setSelectedItem(item.applicant);
                                  }}
                                  onPrintAppointmentForm={() => {
                                    setIsAppointmentFormOpen(true);
                                    setSelectedItem(item.applicant);
                                  }}
                                  onViewCommitteePoints={() =>
                                    handleViewCommitteePoints(item.applicant)
                                  }
                                  showViewCommitteePoints
                                  isAppointed={item.applicant.status === "Appointed"}
                                />
                              </Menu.Items>
                            </Transition>
                          </Menu>
                        </td>
                        <td className="w-6 pl-4 app__td text-lg">{item.no}</td>
                        <td className="w-6 pl-4 app__td text-lg">{item.no2}</td>
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
                            <span className="font-bold text-lg">Appointed</span>
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
                  {loading && <TableRowLoading cols={4} rows={2} />}
                </tbody>
              </table>
              {!loading && isDataEmpty && (
                <div className="app__norecordsfound">No results.</div>
              )}
              {!isDataEmpty && (
                <div className="mx-4 mt-4">
                  <div className="text-sm font-bold text-gray-600">
                    Ranking Committees:
                  </div>
                  <div className="mt-4 space-x-4 space-y-2">
                    {rankingDetails?.committees.map((committee) => (
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
              )}
            </div>
          )}
        </div>
      </div>

      {/* Advise Order Print Modal */}
      {isAdviseOrderOpen && selectedItem && (
        <div className="z-50 fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50">
          <div className="bg-white p-6 rounded shadow-lg w-xl">
            <div className="app__form_field_container">
              <div className="w-full">
                <div className="app__label_standard">
                  Select Date & Assignment:
                </div>
                <div className="flex space-x-1">
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                  />
                  <Input
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    placeholder="Assignment"
                    className="app__input_standard"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsAdviseOrderOpen(false)}
                className="px-4 py-2 border rounded"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!selectedDate || !selectedLocation) {
                    alert("Please select a date and assignment");
                    return;
                  }
                  setIsAdviseOrderOpen(false);
                  void handlePrintAdviseOrder(selectedItem, "advise-order");
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded"
              >
                Print
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assumption to Duty Print Modal */}
      {isAssumptionOpen && selectedItem && (
        <AssumptionModal
          onConfirm={(date, location, signatory, position) => {
            setIsAssumptionOpen(false);
            void handlePrintAssumption(
              selectedItem,
              date,
              location,
              signatory,
              position,
            );
          }}
          onCancel={() => setIsAssumptionOpen(false)}
        />
      )}

      {/* Oath of Office Print Modal */}
      {isOathOpen && selectedItem && (
        <OathOfOfficeModal
          onConfirm={(date) => {
            setIsOathOpen(false);
            void handlePrintOathOfOffice(
              selectedItem,
              date,
              "",
              "",
            );
          }}
          onCancel={() => setIsOathOpen(false)}
        />
      )}

      {/* Appointment Form Print Modal */}
      {isAppointmentFormOpen && selectedItem && (
        <AppointmentFormModal
          onConfirm={(date, employmentStatus, natureOfAppointment, assignment) => {
            setIsAppointmentFormOpen(false);
            void handlePrintAppointmentForm(
              selectedItem,
              date,
              employmentStatus,
              natureOfAppointment,
              assignment,
            );
          }}
          onCancel={() => setIsAppointmentFormOpen(false)}
        />
      )}

      {/* Print Advisd Order */}
      {selectedItem && selectedType === "advise-order" && (
        <PrintAdviseOrder selectedItem={selectedItem} ref={componentRef} />
      )}
      {/* Print Assumption */}
      {selectedItem && selectedType === "assumption" && (
        <PrintAssumption selectedItem={selectedItem} ref={componentRef} />
      )}
      {/* Print Oath of Office */}
      {selectedItem && selectedType === "oath-of-office" && (
        <PrintOathOfOffice selectedItem={selectedItem} ref={componentRef} />
      )}
      {/* Print Appointment Form */}
      {selectedItem && selectedType === "appointment-form" && (
        <PrintAppointmentForm selectedItem={selectedItem} ref={componentRef} />
      )}

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
    </>
  );
};
export default Page;
