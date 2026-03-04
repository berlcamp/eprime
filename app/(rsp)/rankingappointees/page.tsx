"use client";

import {
  Sidebar,
  TableRowLoading,
  Title,
  TopBar,
  Unauthorized,
} from "@/components/index";
import { useFilter } from "@/context/FilterContext";
import { Menu, Transition } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import React, { Fragment, useEffect, useState } from "react";
import Filters from "./Filters";

// Types
import type { ApplicantTypes } from "@/types";

import { PrintAdviseOrder } from "@/components/Printables/PrintAdviseOrder";
import { PrintAppointmentForm } from "@/components/Printables/PrintAppointmentForm";
import { PrintAssumption } from "@/components/Printables/PrintAssumption";
import { PrintOathOfOffice } from "@/components/Printables/PrintOathOfOffice";
import { AdviseOrderModal } from "@/components/Rsp/AdviseOrderModal";
import OathOfOfficeModal from "@/components/Rsp/OathOfOfficeModal";
import { PrintableActionsMenu } from "@/components/Rsp/PrintableActionsMenu";
import RspSidebar from "@/components/Sidebars/RspSidebar";
import { useSupabase } from "@/context/SupabaseProvider";
import { CommitteeAccumulatedPoints } from "@/utils/data-helpers";
import { fetchSalaryGrades } from "@/utils/fetchApi";
import { numberToWords } from "@/utils/text-helper";
import { useReactToPrint } from "react-to-print";
import AppointmentFormModal from "../rankingresults/AppointmentFormModal";
import AssumptionModal from "../rankingresults/AssumptionModal";

interface ListTypes {
  applicant: ApplicantTypes;
  accumulated_points: Record<string, number> | null;
  overall_score: string;
}

const Page: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ApplicantTypes | null>(null);
  const [selectedType, setSelectedType] = useState<string>("");
  const [isAdviseOrderOpen, setIsAdviseOrderOpen] = useState(false);
  const [isAssumptionOpen, setIsAssumptionOpen] = useState(false);
  const [isOathOpen, setIsOathOpen] = useState(false);
  const [isAppointmentFormOpen, setIsAppointmentFormOpen] = useState(false);

  const [list, setList] = useState<ListTypes[]>([]);
  const [rankList, setRankList] = useState<ListTypes[]>([]);
  const [filterKeyword, setFilterKeyword] = useState<string>("");
  const [filterRanking, setFilterRanking] = useState<string>("");

  const { hasAccess } = useFilter();
  const { supabase } = useSupabase();

  const componentRef = React.useRef(null);
  const printFn = useReactToPrint({
    contentRef: componentRef,
    documentTitle: "request-form",
  });

  const preloadImages = (urls: string[]) => {
    return Promise.all(
      urls.map(
        (url) =>
          new Promise<void>((resolve) => {
            const img = new window.Image();
            img.onload = () => resolve();
            img.onerror = () => resolve();
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

  const handlePrintAdviseOrder = async (
    item: ApplicantTypes,
    type: string,
    date: string,
    location: string,
  ) => {
    await preloadPrintImages();
    setSelectedType(type);
    setTimeout(() => {
      setSelectedItem({
        ...item,
        date,
        assignment: location,
      });
      setTimeout(() => printFn(), 100);
    }, 100);
  };

  const handlePrintAssumption = async (
    item: ApplicantTypes,
    date: string,
    location: string,
    signatory: string,
    position: string,
    attestedBy: string,
    attestedByPosition: string,
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
        attested_by: attestedBy,
        attested_by_position: attestedByPosition,
      });
      setTimeout(() => printFn(), 100);
    }, 100);
  };

  const handlePrintOathOfOffice = async (
    item: ApplicantTypes,
    date: string,
  ) => {
    await preloadPrintImages();
    setSelectedType("oath-of-office");
    setTimeout(() => {
      setSelectedItem({
        ...item,
        date,
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
    vice: string,
    reasonOfVacancy: string,
    plantillaNumber: string,
    plantillaType?: string,
    publicationPosting?: {
      publishedAt: string;
      publishedFrom: string;
      publishedTo: string;
      postedIn: string;
      postedFrom: string;
      postedTo: string;
      hrmpsbAssessmentStartedOn: string;
    },
  ) => {
    await preloadPrintImages();

    const salaryGrade =
      item?.ranking?.position?.salary_grade ||
      item?.hrm_item?.salary_grade ||
      item?.hrm_item?.hrm_position?.salary_grade;
    let salaryAmount = "";
    let salaryInWords = "";
    if (salaryGrade) {
      const { data: salaryGrades } = await fetchSalaryGrades(999, 0);
      const matching = salaryGrades?.find(
        (sg: { grade: string; step: string }) =>
          String(sg.grade) === String(salaryGrade) && String(sg.step) === "1",
      );
      if (matching?.salary) {
        const amt = Number(matching.salary);
        salaryAmount = amt.toLocaleString("en-PH", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
        salaryInWords = numberToWords(amt);
      }
    }

    setSelectedType("appointment-form");
    setTimeout(() => {
      setSelectedItem({
        ...item,
        date,
        assignment,
        employment_status: employmentStatus,
        nature_of_appointment: natureOfAppointment,
        vice,
        reason_of_vacancy: reasonOfVacancy,
        plantilla_number: plantillaNumber,
        salary_amount: salaryAmount,
        salary_in_words: salaryInWords,
        plantilla_type: plantillaType,
        ...(publicationPosting && {
          published_at: publicationPosting.publishedAt,
          published_from: publicationPosting.publishedFrom,
          published_to: publicationPosting.publishedTo,
          posted_in: publicationPosting.postedIn,
          posted_from: publicationPosting.postedFrom,
          posted_to: publicationPosting.postedTo,
          hrmpsb_assessment_started_on:
            publicationPosting.hrmpsbAssessmentStartedOn,
        }),
      } as ApplicantTypes);
      setTimeout(() => printFn(), 100);
    }, 100);
  };

  const fetchData = async () => {
    setLoading(true);

    try {
      let query = supabase
        .from("hrm_ranking_applicants")
        .select(
          "*, hrm_item:item_id(implementing_unit:implementing_unit_id(*),hrm_position:position_id(*)), ranking:ranking_id(type,passing_score,position:position_id(name),committees:hrm_ranking_committees(*, hrm_user:user_id(id, firstname, lastname, avatar_url), committee_criterias:hrm_ranking_committee_criterias( *, criteria:criteria_id(*), criteria_points:hrm_ranking_applicant_points(*))))",
          {
            count: "exact",
          },
        )
        .eq("status", "Appointed");

      // filter ranking
      if (filterRanking !== "") {
        query = query.eq("ranking_id", filterRanking);
      }

      // filter keyword
      if (filterKeyword !== "") {
        query = query.or(
          `lastname.ilike.%${filterKeyword}%,firstname.ilike.%${filterKeyword}%,middlename.ilike.%${filterKeyword}%`,
        );
      }
      const { data, error } = await query;

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

          setList(structguredData);
          setRankList(structguredData);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data
  useEffect(() => {
    setList([]);
    setRankList([]);
    void fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterRanking, filterKeyword]);

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
            <Title title="Appointees" />
          </div>

          {/* Filters */}
          <div className="app__filters">
            <Filters
              setFilterRanking={setFilterRanking}
              setFilterKeyword={setFilterKeyword}
            />
          </div>

          {rankList.length > 0 && (
            <div className="flex items-center space-x-2 py-2 px-4 bg-gray-50 border-t border-gray-200 text-gray-500">
              <div className="flex-1 text-xs">{`Total results: ${list.length}`}</div>
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
                                  isAppointed={true}
                                />
                              </Menu.Items>
                            </Transition>
                          </Menu>
                        </td>
                        <th className="app__th_firstcol">
                          <div className="font-medium">
                            {item.applicant.lastname},{" "}
                            {item.applicant.firstname}{" "}
                            {item.applicant.middlename}
                          </div>
                          <div className="font-light">
                            {item.applicant.email}
                          </div>
                          {item.applicant.current_employee === "Yes" && (
                            <div className="font-bold">
                              (Current DepEd Employee)
                            </div>
                          )}
                          {item.applicant.previous_applicant === "Yes" && (
                            <div className="font-bold">
                              (Previous Applicant)
                            </div>
                          )}
                        </th>
                        <td className="app__td">
                          <span className="font-bold text-lg">Appointed</span>
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
                                      {avgPoints.toFixed(2)}{" "}
                                    </span>
                                    {/* Display with 2 decimal places */}
                                  </div>
                                ),
                              )}
                            </div>
                          )}
                        </td>
                        <td className="app__td">{item.overall_score}</td>
                      </tr>
                    ))}
                  {loading && <TableRowLoading cols={4} rows={2} />}
                </tbody>
              </table>
              {!loading && isDataEmpty && (
                <div className="app__norecordsfound">No results.</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Advise Order Print Modal */}
      {selectedItem && (
        <AdviseOrderModal
          open={isAdviseOrderOpen}
          onOpenChange={setIsAdviseOrderOpen}
          onConfirm={(date, location) => {
            void handlePrintAdviseOrder(
              selectedItem,
              "advise-order",
              date,
              location,
            );
          }}
        />
      )}

      {/* Assumption to Duty Print Modal */}
      {selectedItem && (
        <AssumptionModal
          open={isAssumptionOpen}
          onOpenChange={setIsAssumptionOpen}
          onConfirm={(date, location, signatory, position, attestedBy, attestedByPosition) => {
            void handlePrintAssumption(
              selectedItem,
              date,
              location,
              signatory,
              position,
              attestedBy,
              attestedByPosition,
            );
          }}
        />
      )}

      {/* Oath of Office Print Modal */}
      {selectedItem && (
        <OathOfOfficeModal
          open={isOathOpen}
          onOpenChange={setIsOathOpen}
          onConfirm={(date) => {
            void handlePrintOathOfOffice(selectedItem, date);
          }}
        />
      )}

      {/* Appointment Form Print Modal */}
      {selectedItem && (
        <AppointmentFormModal
          open={isAppointmentFormOpen}
          onOpenChange={setIsAppointmentFormOpen}
          defaultVice={selectedItem.hrm_item?.vice ?? ""}
          defaultPlantillaNumber={selectedItem.hrm_item?.item_number ?? ""}
          onConfirm={(
            date,
            employmentStatus,
            natureOfAppointment,
            assignment,
            vice,
            reasonOfVacancy,
            plantillaNumber,
            plantillaType,
            publicationPosting,
          ) => {
            void handlePrintAppointmentForm(
              selectedItem,
              date,
              employmentStatus,
              natureOfAppointment,
              assignment,
              vice,
              reasonOfVacancy,
              plantillaNumber,
              plantillaType,
              publicationPosting,
            );
          }}
        />
      )}

      {/* Print Advise Order */}
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
    </>
  );
};
export default Page;
