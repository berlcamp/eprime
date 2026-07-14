"use client";

import {
  CustomButton,
  MedicalSideBar,
  PerPage,
  ShowMore,
  Sidebar,
  TableRowLoading,
  Title,
  TopBar,
  Unauthorized,
} from "@/components/index";
import { superAdmins } from "@/constants";
import { useFilter } from "@/context/FilterContext";
import { useSupabase } from "@/context/SupabaseProvider";
import { fetchApes } from "@/utils/fetchApi";
import { format } from "date-fns";
import React, { useEffect, useState } from "react";
import DiagnosisModal from "./DiagnosisModal";
import Filters from "./Filters";

// Types
import type { ApeTypes } from "@/types";

// Redux imports
import { updateList } from "@/GlobalRedux/Features/listSlice";
import { updateResultCounter } from "@/GlobalRedux/Features/resultsCounterSlice";
import { useDispatch, useSelector } from "react-redux";

const Page: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [showDiagnosisModal, setShowDiagnosisModal] = useState(false);

  const [list, setList] = useState<ApeTypes[]>([]);
  const [filterKeyword, setFilterKeyword] = useState<string>("");
  const [filterYear, setFilterYear] = useState<string>("");
  const [perPageCount, setPerPageCount] = useState<number>(10);
  const [editData, setEditData] = useState<ApeTypes | null>(null);

  // Redux staff
  const globallist = useSelector((state: any) => state.list.value);
  const resultsCounter = useSelector((state: any) => state.results.value);
  const dispatch = useDispatch();

  const { session, medicalOfficer } = useSupabase();
  const { hasAccess } = useFilter();

  const isManager =
    hasAccess("physical_exam_manager") ||
    superAdmins.includes(session?.user.email ?? "");

  // Managers see all exams (org-wide). A Medical Officer who is not a manager is
  // scoped to the employees of their assigned school(s).
  const scopedSchoolIds =
    !isManager && medicalOfficer?.isOfficer
      ? medicalOfficer.schoolIds ?? []
      : undefined;

  const fetchData = async () => {
    setLoading(true);

    try {
      const result = await fetchApes(
        { filterKeyword, filterYear, schoolIds: scopedSchoolIds },
        perPageCount,
        0,
      );
      dispatch(updateList(result.data));
      dispatch(
        updateResultCounter({
          showing: result.data.length,
          results: result.count ? result.count : 0,
        }),
      );
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleShowMore = async () => {
    setLoading(true);

    try {
      const result = await fetchApes(
        { filterKeyword, filterYear, schoolIds: scopedSchoolIds },
        perPageCount,
        list.length,
      );
      const newList = [...list, ...result.data];
      dispatch(updateList(newList));
      dispatch(
        updateResultCounter({
          showing: newList.length,
          results: result.count ? result.count : 0,
        }),
      );
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDiagnose = (item: ApeTypes) => {
    setShowDiagnosisModal(true);
    setEditData(item);
  };

  // Update list whenever list in redux updates
  useEffect(() => {
    setList(globallist);
  }, [globallist]);

  // Fetch data
  useEffect(() => {
    setList([]);
    void fetchData();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKeyword, filterYear, perPageCount]);

  const isDataEmpty = !Array.isArray(list) || list.length < 1 || !list;

  // Check access: Physical Exam Managers, Super Admins, or Medical Officers.
  if (!isManager && !medicalOfficer?.isOfficer) return <Unauthorized />;

  return (
    <>
      <Sidebar>
        <MedicalSideBar />
      </Sidebar>
      <TopBar />
      <div className="app__main">
        <div>
          <div className="app__title">
            <Title title="Annual Physical Exams" />
          </div>

          {/* Filters */}
          <div className="app__filters">
            <Filters
              setFilterKeyword={setFilterKeyword}
              setFilterYear={setFilterYear}
            />
          </div>

          {/* Per Page */}
          <PerPage
            showingCount={resultsCounter.showing}
            resultsCount={resultsCounter.results}
            perPageCount={perPageCount}
            setPerPageCount={setPerPageCount}
          />

          {/* Main Content */}
          <div>
            <table className="app__table">
              <thead className="app__thead">
                <tr>
                  <th className="hidden md:table-cell app__th pl-4">
                    Employee
                  </th>
                  <th className="hidden md:table-cell app__th">Date of Exam</th>
                  <th className="hidden md:table-cell app__th">
                    Fitness Result
                  </th>
                  <th className="hidden md:table-cell app__th">Diagnosis</th>
                  <th className="hidden md:table-cell app__th"></th>
                </tr>
              </thead>
              <tbody>
                {!isDataEmpty &&
                  list.map((item: ApeTypes, index) => (
                    <tr key={index} className="app__tr">
                      <th className="app__th_firstcol">
                        <div className="capitalize">
                          {item.hrm_users?.firstname}{" "}
                          {item.hrm_users?.middlename}{" "}
                          {item.hrm_users?.lastname}
                        </div>
                        {/* Mobile View */}
                        <div className="md:hidden app__td">
                          <div className="font-light">
                            Date of Exam:{" "}
                            {item.exam_date &&
                              format(new Date(item.exam_date), "MMM d, yyyy")}
                          </div>
                          <div className="font-light">
                            Fitness Result: {item.fitness_result ?? "Pending"}
                          </div>
                          <div className="font-light">
                            Diagnosis:{" "}
                            {item.hrm_ape_diagnoses &&
                            item.hrm_ape_diagnoses.length > 0
                              ? item.hrm_ape_diagnoses
                                  .map(
                                    (d) =>
                                      `${format(
                                        new Date(d.diagnosis_date),
                                        "MMM d, yyyy",
                                      )}: ${d.diagnosis}`,
                                  )
                                  .join("; ")
                              : item.diagnosis ?? "Pending"}
                          </div>
                        </div>
                        {/* End - Mobile View */}
                      </th>
                      <td className="hidden md:table-cell app__td">
                        <div>
                          {item.exam_date &&
                            format(new Date(item.exam_date), "MMM d, yyyy")}
                        </div>
                      </td>
                      <td className="hidden md:table-cell app__td">
                        {item.fitness_result ? (
                          <span className="app__status_container_green">
                            {item.fitness_result}
                          </span>
                        ) : (
                          <span className="app__status_container_orange">
                            Pending&nbsp;Review
                          </span>
                        )}
                      </td>
                      <td className="hidden md:table-cell app__td">
                        {item.hrm_ape_diagnoses &&
                        item.hrm_ape_diagnoses.length > 0 ? (
                          <div className="space-y-1">
                            {[...item.hrm_ape_diagnoses]
                              .sort((a, b) =>
                                a.diagnosis_date.localeCompare(
                                  b.diagnosis_date,
                                ),
                              )
                              .map((d) => (
                                <div key={d.id}>
                                  <span className="font-semibold text-xs">
                                    {format(
                                      new Date(d.diagnosis_date),
                                      "MMM d, yyyy",
                                    )}
                                    :
                                  </span>{" "}
                                  {d.diagnosis}
                                </div>
                              ))}
                          </div>
                        ) : (
                          <div>{item.diagnosis}</div>
                        )}
                      </td>
                      <td className="hidden md:table-cell app__td">
                        <CustomButton
                          containerStyles="app__btn_green"
                          title={
                            item.diagnosed_at
                              ? "Edit Diagnosis"
                              : "Review & Diagnose"
                          }
                          btnType="button"
                          handleClick={() => handleDiagnose(item)}
                        />
                      </td>
                    </tr>
                  ))}
                {loading && <TableRowLoading cols={5} rows={2} />}
              </tbody>
            </table>
            {!loading && isDataEmpty && (
              <div className="app__norecordsfound">No records found.</div>
            )}
          </div>

          {/* Show More */}
          {resultsCounter.results > resultsCounter.showing && !loading && (
            <ShowMore handleShowMore={handleShowMore} />
          )}
        </div>
      </div>

      {/* Diagnosis Modal */}
      {showDiagnosisModal && editData && (
        <DiagnosisModal
          editData={editData}
          hideModal={() => setShowDiagnosisModal(false)}
        />
      )}
    </>
  );
};
export default Page;
