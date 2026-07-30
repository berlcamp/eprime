"use client";

import {
  CustomButton,
  PerPage,
  ShowMore,
  TableRowLoading,
  Title,
} from "@/components/index";
import { superAdmins } from "@/constants";
import { useSupabase } from "@/context/SupabaseProvider";
import { fetchMyApes } from "@/utils/fetchApi";
import { Menu, Transition } from "@headlessui/react";
import {
  ChevronDownIcon,
  PencilSquareIcon,
  TrashIcon,
} from "@heroicons/react/20/solid";
import { format } from "date-fns";
import { Fragment, useEffect, useState } from "react";

import AddEditModal from "./AddEditModal";
import AttachmentsModal from "./AttachmentsModal";
import DeleteApeModal from "./DeleteApeModal";
import DiagnosisHistoryModal from "./DiagnosisHistoryModal";
import Filters from "./Filters";
import { sortDiagnosesNewestFirst } from "./diagnosisHelpers";

// Types
import type { ApeTypes } from "@/types";

// Redux imports
import { updateList } from "@/GlobalRedux/Features/listSlice";
import { updateResultCounter } from "@/GlobalRedux/Features/resultsCounterSlice";
import { useDispatch, useSelector } from "react-redux";

export default function Ape({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(false);

  const [list, setList] = useState<ApeTypes[]>([]);
  const [editData, setEditData] = useState<ApeTypes | null>(null);
  const [selectedId, setSelectedId] = useState<string>("");

  const [showAddModal, setShowAddModal] = useState(false);
  const [showAttachmentsModal, setShowAttachmentsModal] = useState(false);
  const [showDiagnosisModal, setShowDiagnosisModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [perPageCount, setPerPageCount] = useState<number>(10);
  const [filterYear, setFilterYear] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");

  // Redux staff
  const globallist = useSelector((state: any) => state.list.value);
  const resultsCounter = useSelector((state: any) => state.results.value);
  const dispatch = useDispatch();

  const { session } = useSupabase();

  const isOwner = userId === session?.user.id;
  const isSuperAdmin = superAdmins.includes(session?.user.email ?? "");

  const fetchData = async () => {
    setLoading(true);

    try {
      const result = await fetchMyApes(
        { userId, filterYear, filterStatus },
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
      const result = await fetchMyApes(
        { userId, filterYear, filterStatus },
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

  const handleAdd = () => {
    setShowAddModal(true);
    setEditData(null);
  };

  const handleEdit = (item: ApeTypes) => {
    setShowAddModal(true);
    setEditData(item);
  };

  const handleAttachments = (item: ApeTypes) => {
    setShowAttachmentsModal(true);
    setEditData(item);
  };

  const handleDiagnosis = (item: ApeTypes) => {
    setShowDiagnosisModal(true);
    setEditData(item);
  };

  const handleDelete = (id: string) => {
    setSelectedId(id);
    setShowDeleteModal(true);
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
  }, [perPageCount, filterYear, filterStatus]);

  const isDataEmpty = !Array.isArray(list) || list.length < 1 || !list;

  return (
    <>
      <div>
        <div className="app__title">
          <Title title="Annual Physical Exam" />
          {isOwner && (
            <CustomButton
              containerStyles="app__btn_green"
              title="Add Annual Physical Exam"
              btnType="button"
              handleClick={handleAdd}
            />
          )}
        </div>

        <div className="app__warning_text">
          <span className="app__warning_title">Note:</span> Upload your Annual
          Physical Exam result/s here. A Medical Officer will review and record a
          diagnosis. Once a diagnosis is recorded, the record can no longer be
          edited.
        </div>

        {/* Filters */}
        <div className="app__filters">
          <Filters
            setFilterYear={setFilterYear}
            setFilterStatus={setFilterStatus}
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
                <th className="hidden md:table-cell app__th pl-4"></th>
                <th className="hidden md:table-cell app__th">Date of Exam</th>
                <th className="hidden md:table-cell app__th">Remarks</th>
                <th className="hidden md:table-cell app__th">Files</th>
                <th className="hidden md:table-cell app__th">Fitness Result</th>
                <th className="hidden md:table-cell app__th">Diagnosis</th>
              </tr>
            </thead>
            <tbody>
              {!isDataEmpty &&
                list.map((item: ApeTypes, index) => {
                  const isDiagnosed = !!item.diagnosed_at;

                  // The column is too narrow for a full history, so it shows
                  // the most recent entry and defers the rest to the modal.
                  const diagnoses = sortDiagnosesNewestFirst(
                    item.hrm_ape_diagnoses,
                  );
                  const latest = diagnoses[0];

                  // The owner may only touch a record until it is diagnosed. A
                  // Super Admin can always delete, diagnosed or not.
                  const canEdit = isOwner && !isDiagnosed;
                  const canDelete = canEdit || isSuperAdmin;

                  return (
                    <tr key={index} className="app__tr">
                      <td className="w-6 pl-4 app__td">
                        {canDelete && (
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
                                <div className="py-1">
                                  {canEdit && (
                                    <Menu.Item>
                                      <div
                                        onClick={() => handleEdit(item)}
                                        className="app__dropdown_item"
                                      >
                                        <PencilSquareIcon className="w-4 h-4" />
                                        <span>Edit</span>
                                      </div>
                                    </Menu.Item>
                                  )}
                                  {canDelete && (
                                    <Menu.Item>
                                      <div
                                        onClick={() => handleDelete(item.id)}
                                        className="app__dropdown_item"
                                      >
                                        <TrashIcon className="w-4 h-4" />
                                        <span>Delete</span>
                                      </div>
                                    </Menu.Item>
                                  )}
                                </div>
                              </Menu.Items>
                            </Transition>
                          </Menu>
                        )}
                      </td>
                      <th className="app__th_firstcol">
                        <div>
                          {item.exam_date &&
                            format(new Date(item.exam_date), "MMM d, yyyy")}
                        </div>
                        {/* Mobile View */}
                        <div className="md:hidden app__td">
                          <div className="font-light">
                            Remarks: {item.remarks}
                          </div>
                          <div className="font-light">
                            Fitness Result: {item.fitness_result ?? "Pending"}
                          </div>
                          <div className="font-light">
                            {latest ? (
                              <>
                                <div>
                                  Latest Diagnosis (
                                  {format(
                                    new Date(latest.diagnosis_date),
                                    "MMM d, yyyy",
                                  )}
                                  ):
                                </div>
                                <div className="line-clamp-2 whitespace-pre-wrap">
                                  {latest.diagnosis}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleDiagnosis(item)}
                                  className="mt-1 text-blue-600 hover:underline"
                                >
                                  {diagnoses.length > 1
                                    ? `View All (${diagnoses.length})`
                                    : "View Details"}
                                </button>
                              </>
                            ) : (
                              <div>Diagnosis: {item.diagnosis || "Pending"}</div>
                            )}
                          </div>
                        </div>
                        {/* End - Mobile View */}
                      </th>
                      <td className="hidden md:table-cell app__td">
                        <div>{item.remarks}</div>
                      </td>
                      <td className="hidden md:table-cell app__td">
                        <CustomButton
                          containerStyles="app__btn_blue"
                          title="Attachments"
                          btnType="button"
                          handleClick={() => handleAttachments(item)}
                        />
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
                      <td className="hidden md:table-cell app__td align-top">
                        {latest ? (
                          <div className="space-y-1 max-w-xs">
                            <div className="font-semibold text-xs">
                              {format(
                                new Date(latest.diagnosis_date),
                                "MMM d, yyyy",
                              )}
                            </div>
                            <div className="line-clamp-2 whitespace-pre-wrap">
                              {latest.diagnosis}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDiagnosis(item)}
                              className="text-blue-600 hover:underline text-xs font-medium"
                            >
                              {diagnoses.length > 1
                                ? `View All (${diagnoses.length})`
                                : "View Details"}
                            </button>
                          </div>
                        ) : (
                          // Records diagnosed before hrm_ape_diagnoses existed.
                          <div>{item.diagnosis || "Pending"}</div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              {loading && <TableRowLoading cols={6} rows={2} />}
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

      {/* Add/Edit Modal */}
      {showAddModal && (
        <AddEditModal
          editData={editData}
          userId={userId}
          hideModal={() => setShowAddModal(false)}
        />
      )}

      {/* Attachments Modal */}
      {showAttachmentsModal && (
        <AttachmentsModal
          editData={editData}
          readOnly={!isOwner || !!editData?.diagnosed_at}
          hideModal={() => setShowAttachmentsModal(false)}
        />
      )}

      {/* Diagnosis History Modal */}
      {showDiagnosisModal && editData && (
        <DiagnosisHistoryModal
          editData={editData}
          hideModal={() => setShowDiagnosisModal(false)}
        />
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <DeleteApeModal
          id={selectedId}
          hideModal={() => setShowDeleteModal(false)}
        />
      )}
    </>
  );
}
