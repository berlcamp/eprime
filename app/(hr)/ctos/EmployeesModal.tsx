/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable react-hooks/exhaustive-deps */
import {
  ConfirmModal,
  CustomButton,
  SearchUserInput,
  TableRowLoading,
  UserBlock,
} from "@/components/index";
import { useFilter } from "@/context/FilterContext";
import { useSupabase } from "@/context/SupabaseProvider";
import { Menu, Transition } from "@headlessui/react";
import {
  ArrowPathIcon,
  ChevronDownIcon,
  TrashIcon,
} from "@heroicons/react/20/solid";
import { Fragment, useEffect, useState } from "react";
import uuid from "react-uuid";
import AttachmentsModal from "./AttachmentsModal";

// Redux imports
import { updateList } from "@/GlobalRedux/Features/listSlice";
import { useDispatch, useSelector } from "react-redux";

// Types
import type { CtoTypes, CtoUserTypes, Employee } from "@/types";
import { logError } from "@/utils/fetchApi";
import { format } from "date-fns";
import ConfirmApproveModal from "./ConfirmApproveModal";
import Remarks from "./Remarks";

interface ModalProps {
  hideModal: () => void;
  ctoData: CtoTypes | null;
}

const EmployeesModal = ({ hideModal, ctoData }: ModalProps) => {
  const { setToast, hasAccess } = useFilter();
  const { supabase } = useSupabase();

  const [user, setUser] = useState<Employee | null>(null);
  const [clear, setClear] = useState(false);

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string>("");
  const [selectedRow, setSelectedRow] = useState<CtoUserTypes | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAttachmentsModal, setShowAttachmentsModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [totalCocCurrentYear, setTotalCocCurrentYear] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | "">("");

  const [list, setList] = useState<CtoUserTypes[]>([]);

  // Redux staff
  const globallist = useSelector((state: any) => state.list.value);
  const dispatch = useDispatch();

  const handleAddEmployee = async () => {
    if (saving) {
      return;
    }

    if (!ctoData) return;

    if (!user) {
      setErrorMessage("Employee name is required");
      return;
    }

    // if for some reason the employee selected already exists
    if (list.some((item) => user.id === item.hrm_user_id)) {
      return;
    }

    setSaving(true);

    const refCode = ctoData.reference_code;

    const newData = {
      cto_id: ctoData.id,
      hrm_user_id: user.id,
      reference_code: refCode,
      is_approved: false,
      coc: Number(ctoData.coc),
      expiration: ctoData.expiration,
      status: ctoData.status,
    };

    try {
      const { error, data } = await supabase
        .from("hrm_cto_users")
        .insert(newData)
        .select();

      if (error) throw new Error(error.message);

      const updatedData = { ...newData, hrm_users: user, id: data[0].id };

      // add to list
      setList([updatedData, ...list]);

      // Update hrm_cto_users data in redux
      const items = globallist.map((item: CtoTypes) => {
        if (item.id === ctoData?.id) {
          return { ...item, hrm_cto_users: [updatedData, ...list] };
        } else {
          return item;
        }
      });
      dispatch(updateList(items));

      // insert to notifications
      const { error: error2 } = await supabase
        .from("hrm_notifications")
        .insert({
          message:
            "You are added to a <b>CTO</b>, please upload supporting documents.",
          url: `/profile/${user.id}?page=ctos&id=${data[0].id}`,
          type: "cto",
          user_id: user.id,
          cto_user_id: data[0].id,
          reference_table: "hrm_cto_users",
        });

      if (error2) {
        throw new Error(error2.message);
      }

      // Clear search user box
      setUser(null);
      setClear(!clear);

      // pop up the success message
      setToast("success", "Successfully saved.");
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = (item: CtoUserTypes) => {
    setSelectedRow(item);
    setShowApproveModal(true);
  };

  const handleDelete = (id: string) => {
    setSelectedId(id);
    setShowDeleteModal(true);
  };

  const handleViewAttachments = (id: string) => {
    setSelectedId(id);
    setShowAttachmentsModal(true);
  };

  const handleApproveConfirmed = async (expDate: string, cocBal: string) => {
    if (!ctoData) return;

    if (!selectedRow) return;

    try {
      const { error } = await supabase
        .from("hrm_cto_users")
        .update({
          is_approved: true,
          expiration: expDate,
          coc: cocBal,
          original_coc: cocBal,
        })
        .eq("id", selectedRow.id);

      if (error) throw new Error(error.message);

      // insert to notifications
      const { error: error2 } = await supabase
        .from("hrm_notifications")
        .insert({
          message: "Your <b>CTO</b> has been approved.",
          url: `/profile/${selectedRow.hrm_user_id}?page=ctos`,
          type: "cto",
          user_id: selectedRow.hrm_user_id,
          cto_id: ctoData.id,
          reference_table: "hrm_ctos",
        });

      if (error2) throw new Error(error2.message);

      // Update leave card
      const newData = {
        type: "Compensatory Overtime Credit",
        remarks: "",
        credits_earned: cocBal,
        user_id: selectedRow.hrm_user_id,
        particulars: "Earned Compensatory Overtime Credit",
      };

      const { error: error3 } = await supabase
        .from("hrm_leave_cards")
        .insert(newData)
        .select();

      if (error3) {
        void logError(
          "Earned Compensatory Overtime Credit on CTO approval",
          "hrm_leave_cards",
          JSON.stringify(newData),
          error3.message,
        );
        setToast(
          "error",
          "Error updating leave card, please adjust the employees leave card manually.",
        );
        throw new Error(error3.message);
      }

      // Update list
      const updatedData = list.map((item) => {
        if (item.id === selectedRow?.id) {
          return {
            ...item,
            is_approved: true,
            coc: Number(cocBal),
            expiration: expDate,
          };
        }
        return item;
      });
      setList(updatedData);

      // pop up the success message
      setToast("success", "Successfully Deleted!");
    } catch (e) {
      console.error(e);
    }

    setShowApproveModal(false);
  };

  const handleDeleteConfirmed = async () => {
    try {
      const { error } = await supabase
        .from("hrm_cto_users")
        .delete()
        .eq("id", selectedId);

      if (error) throw new Error(error.message);

      // Update list
      const updatedData = list.filter((item) => item.id !== selectedId);
      setList(updatedData);

      // Update hrm_cto_users data in redux
      const items = globallist.map((item: CtoTypes) => {
        if (item.id === ctoData?.id) {
          return { ...item, hrm_cto_users: updatedData };
        } else {
          return item;
        }
      });
      dispatch(updateList(items));

      // delete the files on supabase storage
      const { data: files, error: error3 } = await supabase.storage
        .from("hrm")
        .list(`ctos/${selectedId}`);
      if (error3) throw new Error(error3.message);
      if (files.length > 0) {
        const filesToRemove = files.map(
          (x: { name: string }) => `ctos/${selectedId}/${x.name}`,
        );
        const { error: error4 } = await supabase.storage
          .from("hrm")
          .remove(filesToRemove);
        if (error4) throw new Error(error4.message);
      }

      // pop up the success message
      setToast("success", "Successfully Deleted!");
    } catch (e) {
      console.error(e);
    }

    setShowDeleteModal(false);
  };

  const handleSelectedUsers = (selectedUsers: Employee[]) => {
    if (selectedUsers.length > 0) {
      setUser(selectedUsers[0]);
    } else {
      setUser(null);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setList([]);

    try {
      const { data, error } = await supabase
        .from("hrm_cto_users")
        .select("*, hrm_users:hrm_user_id(*)")
        .eq("cto_id", ctoData?.id)
        .order("id", { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      setList(data);
    } catch (error) {
      console.error("fetch cto users", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    void fetchData();
  }, []);

  useEffect(() => {
    if (!showApproveModal || !selectedRow?.hrm_user_id) return;
    void (async () => {
      try {
        const currentYear = new Date().getFullYear();
        const { data, error } = await supabase
          .from("hrm_cto_users")
          .select("coc, hrm_ctos!cto_id(date_issued)")
          .eq("hrm_user_id", selectedRow.hrm_user_id);

        if (error) throw new Error(error.message);

        const getDateIssued = (item: {
          hrm_ctos?: { date_issued: string } | Array<{ date_issued: string }>;
          coc?: number | null;
        }) => {
          const ctos = item.hrm_ctos;
          return Array.isArray(ctos) ? ctos[0]?.date_issued : ctos?.date_issued;
        };
        const total =
          data
            ?.filter(
              (item) =>
                getDateIssued(item) &&
                new Date(getDateIssued(item) as string).getFullYear() ===
                  currentYear,
            )
            .reduce((sum, item) => sum + (Number(item.coc) || 0), 0) ?? 0;
        setTotalCocCurrentYear(total);
      } catch (e) {
        console.error("fetch total COC current year", e);
        setTotalCocCurrentYear(0);
      }
    })();
  }, [showApproveModal, selectedRow?.hrm_user_id, supabase]);

  if (!ctoData) {
    return;
  }

  const isDataEmpty = !Array.isArray(list) || list.length < 1 || !list;

  return (
    <>
      <div className="app__modal_wrapper">
        <div className="app__modal_wrapper2_large">
          <div className="app__modal_wrapper3">
            <div className="app__modal_header">
              <h5 className="app__modal_header_text">Manage CTO Employees</h5>
              <CustomButton
                containerStyles="app__btn_gray"
                title="Close"
                isDisabled={saving}
                btnType="button"
                handleClick={hideModal}
              />
            </div>

            {ctoData.status !== "Expired" && (
              <div className="mx-4 my-4">
                <div className="w-full">
                  <div className="app__form_field_container">
                    <div className="w-full">
                      <div className="app__label_standard">Add Employee:</div>
                      <SearchUserInput
                        isMultiple={false}
                        nonTeachingOnly={true}
                        clear={clear}
                        excludedIds={list.map((obj) => obj.hrm_user_id)}
                        handleSelectedUsers={handleSelectedUsers}
                      />
                      {errorMessage && (
                        <div className="app__error_message">{errorMessage}</div>
                      )}
                    </div>
                  </div>
                  <div className="app__modal_footer_left">
                    <CustomButton
                      btnType="button"
                      handleClick={handleAddEmployee}
                      isDisabled={saving}
                      title={saving ? "Saving..." : "Add"}
                      containerStyles="app__btn_green"
                    />
                  </div>
                </div>
              </div>
            )}
            <div className="app__modal_body">
              {/* Main Content */}
              <div className="pb-5">
                <div className="app__warning_text2">
                  <span className="app__warning_title">Note:</span> Approved
                  employees can no longer be deleted.
                </div>
                <div className="flex justify-end">
                  <CustomButton
                    btnType="button"
                    handleClick={fetchData}
                    isDisabled={loading}
                    title="Refresh"
                    containerStyles="app__btn_normal mb-2 flex space-x-1"
                    rightIcon={<ArrowPathIcon className="w-4 h-4" />}
                  />
                </div>
                <table className="app__table">
                  <thead className="app__thead">
                    <tr>
                      <th className="hidden md:table-cell app__th pl-4"></th>
                      <th className="hidden md:table-cell app__th">
                        Employees
                      </th>
                      <th className="hidden md:table-cell app__th">COC</th>
                      <th className="hidden md:table-cell app__th">Status</th>
                      <th className="hidden md:table-cell app__th">
                        Expiration
                      </th>
                      <th className="hidden md:table-cell app__th">
                        Attachments
                      </th>
                      <th className="hidden md:table-cell app__th"></th>
                      <th className="hidden md:table-cell app__th"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {!isDataEmpty &&
                      list.map((item: CtoUserTypes) => (
                        <tr key={uuid()} className="app__tr">
                          <td className="w-6 pl-4 app__td">
                            {!item.is_approved && (
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
                                      <Menu.Item>
                                        <div
                                          onClick={() => handleDelete(item.id)}
                                          className="app__dropdown_item"
                                        >
                                          <TrashIcon className="w-4 h-4" />
                                          <span>Remove</span>
                                        </div>
                                      </Menu.Item>
                                    </div>
                                  </Menu.Items>
                                </Transition>
                              </Menu>
                            )}
                          </td>
                          <th className="app__th_firstcol">
                            <div className="hidden md:inline-block font-medium">
                              <UserBlock user={item.hrm_users} />
                            </div>
                            {/* Mobile View */}
                            <div>
                              <div className="md:hidden app__td_mobile">
                                <UserBlock user={item.hrm_users} />
                                <div>
                                  {item.is_approved ? (
                                    <span className="app__status_container_green">
                                      Approved
                                    </span>
                                  ) : (
                                    <span className="app__status_container_orange">
                                      For Approval
                                    </span>
                                  )}
                                </div>
                                <div>
                                  <CustomButton
                                    btnType="button"
                                    title="View Attachments"
                                    handleClick={() =>
                                      handleViewAttachments(item.id)
                                    }
                                    containerStyles="app__btn_normal"
                                  />
                                </div>
                              </div>
                            </div>
                            {/* End - Mobile View */}
                          </th>
                          <td className="hidden md:table-cell app__td">
                            {item.coc}
                          </td>
                          <td className="hidden md:table-cell app__td">
                            {item.is_approved ? (
                              <span className="app__status_container_green">
                                Approved
                              </span>
                            ) : (
                              <span className="app__status_container_orange">
                                Pending Approval
                              </span>
                            )}
                          </td>
                          <td className="hidden md:table-cell app__td">
                            {item.expiration &&
                              format(
                                new Date(item.expiration),
                                "MMMM dd, yyyy",
                              )}
                          </td>
                          <td className="hidden md:table-cell app__td">
                            <div>
                              <CustomButton
                                btnType="button"
                                title="View Attachments"
                                handleClick={() =>
                                  handleViewAttachments(item.id)
                                }
                                containerStyles="app__btn_normal"
                              />
                            </div>
                          </td>
                          <td className="hidden md:table-cell app__td">
                            {ctoData.status !== "Expired" &&
                              !item.is_approved &&
                              hasAccess("cto_sc_approver") && (
                                <CustomButton
                                  btnType="button"
                                  title="Approve"
                                  handleClick={() => handleApprove(item)}
                                  containerStyles="app__btn_green"
                                />
                              )}
                          </td>
                          <td className="hidden md:table-cell app__td">
                            {ctoData.status !== "Expired" &&
                              hasAccess("cto_sc_approver") && (
                                <Remarks cto={item} />
                              )}
                          </td>
                        </tr>
                      ))}
                    {loading && <TableRowLoading cols={7} rows={2} />}
                  </tbody>
                </table>
                {!loading && isDataEmpty && (
                  <div className="app__norecordsfound">No records found.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Delete Modal */}
      {showDeleteModal && (
        <ConfirmModal
          header="Confirm Delete"
          btnText="Confirm"
          message="This action cannot be undone. Are you sure you want to remove this employee?"
          onConfirm={handleDeleteConfirmed}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}
      {/* Confirm Approve Modal */}
      {showApproveModal && (
        <ConfirmApproveModal
          coc={ctoData.coc}
          totalCocCurrentYear={totalCocCurrentYear}
          header="Confirm Approve"
          btnText="Confirm"
          message="This action cannot be undone. Are you sure you want to approve this employee?"
          onConfirm={handleApproveConfirmed}
          onCancel={() => setShowApproveModal(false)}
        />
      )}
      {/* Attachments Modal */}
      {showAttachmentsModal && (
        <AttachmentsModal
          id={selectedId}
          hideModal={() => setShowAttachmentsModal(false)}
        />
      )}
    </>
  );
};

export default EmployeesModal;
