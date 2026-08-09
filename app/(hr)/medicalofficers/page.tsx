"use client";

import {
  ConfirmModal,
  CustomButton,
  MedicalSideBar,
  Sidebar,
  Title,
  TopBar,
  Unauthorized,
  UserBlock,
} from "@/components/index";
import { superAdmins } from "@/constants";
import { useFilter } from "@/context/FilterContext";
import { useSupabase } from "@/context/SupabaseProvider";
import type { Employee, MedicalOfficerTypes } from "@/types";
import { logError } from "@/utils/fetchApi";
import { XMarkIcon } from "@heroicons/react/24/solid";
import React, { useEffect, useState } from "react";

const Page: React.FC = () => {
  const { supabase, session, systemUsers } = useSupabase();
  const { hasAccess, setToast } = useFilter();

  const isManager =
    hasAccess("physical_exam_manager") ||
    superAdmins.includes(session?.user.email ?? "");

  const [loaded, setLoaded] = useState(false);
  const [officers, setOfficers] = useState<MedicalOfficerTypes[]>([]);
  const [schools, setSchools] = useState<Array<{ id: string; name: string }>>(
    [],
  );

  // Add-officer user search
  const [searchUser, setSearchUser] = useState("");
  const [searchResults, setSearchResults] = useState<Employee[]>([]);

  // Remove-officer confirmation
  const [officerToRemove, setOfficerToRemove] =
    useState<MedicalOfficerTypes | null>(null);

  const fetchData = async () => {
    try {
      const { data: officersData, error } = await supabase
        .from("hrm_medical_officers")
        .select(
          "*, hrm_user:user_id(id,firstname,middlename,lastname,avatar_url), hrm_medical_officer_schools(id,school_id,hrm_schools:school_id(id,name))",
        )
        .eq("org_id", process.env.NEXT_PUBLIC_ORG_ID)
        .order("created_at", { ascending: true });

      if (error) {
        void logError(
          "fetch medical officers",
          "hrm_medical_officers",
          "",
          error.message,
        );
        throw new Error(error.message);
      }

      const { data: schoolsData } = await supabase
        .from("hrm_schools")
        .select("id,name")
        .eq("org_id", process.env.NEXT_PUBLIC_ORG_ID)
        .order("name", { ascending: true });

      setOfficers(officersData ?? []);
      setSchools(schoolsData ?? []);
      setLoaded(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearchUser = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchUser(value);

    if (value.trim().length < 3) {
      setSearchResults([]);
      return;
    }

    const searchWords = value.toLowerCase().split(" ");
    const results = (systemUsers as Employee[]).filter((user) => {
      // exclude users who are already medical officers
      if (officers.some((o) => o.user_id.toString() === user.id.toString()))
        return false;

      const fullName =
        `${user.lastname} ${user.firstname} ${user.middlename}`.toLowerCase();
      return searchWords.every((word) => fullName.includes(word));
    });

    setSearchResults(results.slice(0, 10));
  };

  const handleAddOfficer = async (user: Employee) => {
    try {
      const insertData = {
        user_id: user.id,
        org_id: process.env.NEXT_PUBLIC_ORG_ID,
      };
      const { error } = await supabase
        .from("hrm_medical_officers")
        .insert(insertData);

      if (error) {
        void logError(
          "add medical officer",
          "hrm_medical_officers",
          JSON.stringify(insertData),
          error.message,
        );
        setToast("error", "Error saving, please reload the page and try again.");
      } else {
        setToast("success", "Successfully added Nurse-Incharge.");
        await fetchData();
      }
    } catch (err) {
      console.error(err);
    }

    setSearchUser("");
    setSearchResults([]);
  };

  const handleAssignSchool = async (
    officer: MedicalOfficerTypes,
    schoolId: string,
  ) => {
    if (!schoolId) return;

    // Skip if already assigned
    if (
      officer.hrm_medical_officer_schools?.some(
        (s) => s.school_id.toString() === schoolId.toString(),
      )
    )
      return;

    try {
      const insertData = {
        org_id: process.env.NEXT_PUBLIC_ORG_ID,
        medical_officer_id: officer.id,
        school_id: schoolId,
      };
      const { error } = await supabase
        .from("hrm_medical_officer_schools")
        .insert(insertData);

      if (error) {
        void logError(
          "assign medical officer school",
          "hrm_medical_officer_schools",
          JSON.stringify(insertData),
          error.message,
        );
        setToast("error", "Error saving, please reload the page and try again.");
      } else {
        setToast("success", "School assigned.");
        await fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveSchool = async (assignmentId: string) => {
    try {
      const { error } = await supabase
        .from("hrm_medical_officer_schools")
        .delete()
        .eq("id", assignmentId);

      if (error) {
        setToast("error", "Error saving, please reload the page and try again.");
      } else {
        setToast("success", "School removed.");
        await fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleConfirmedRemoveOfficer = async () => {
    if (!officerToRemove) return;

    try {
      const { error } = await supabase
        .from("hrm_medical_officers")
        .delete()
        .eq("id", officerToRemove.id);

      if (error) {
        setToast("error", "Error saving, please reload the page and try again.");
      } else {
        setToast("success", "Nurse-Incharge removed.");
        await fetchData();
      }
    } catch (err) {
      console.error(err);
    }

    setOfficerToRemove(null);
  };

  useEffect(() => {
    if (isManager) void fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!isManager) return <Unauthorized />;

  return (
    <>
      <Sidebar>
        <MedicalSideBar />
      </Sidebar>
      <TopBar />
      <div className="app__main">
        <div>
          <div className="app__title">
            <Title title="Nurse-Incharges" />
          </div>

          <div className="app__content pb-20">
            {/* Add Medical Officer */}
            <div className="app__form_field_container">
              <div className="w-full">
                <div className="app__label_standard">
                  Add user as nurse-incharge:
                </div>
                <div className="relative bg-white p-1 border border-gray-300 rounded-sm max-w-md">
                  <input
                    type="text"
                    placeholder="Search User"
                    value={searchUser}
                    onChange={handleSearchUser}
                    className="app__input_noborder"
                  />
                  {searchResults.length > 0 && (
                    <div className="app__search_user_results_container">
                      {searchResults.map((item: Employee, index) => (
                        <div
                          key={index}
                          onClick={async () => await handleAddOfficer(item)}
                          className="app__search_user_results"
                        >
                          <UserBlock user={item} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Officers list */}
            {loaded && officers.length === 0 && (
              <div className="app__norecordsfound">
                No Nurse-Incharges added yet.
              </div>
            )}

            <div className="space-y-3 mt-2">
              {officers.map((officer) => (
                <div
                  key={officer.id}
                  className="bg-white border border-gray-200 rounded-md p-3 max-w-2xl"
                >
                  <div className="flex items-center justify-between">
                    <div className="capitalize font-medium text-sm">
                      {officer.hrm_user?.firstname}{" "}
                      {officer.hrm_user?.middlename}{" "}
                      {officer.hrm_user?.lastname}
                    </div>
                    <CustomButton
                      containerStyles="app__btn_red_xs"
                      title="Remove"
                      btnType="button"
                      handleClick={() => setOfficerToRemove(officer)}
                    />
                  </div>

                  <div className="mt-2">
                    <div className="app__label_standard mb-1">
                      Assigned Schools:
                    </div>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {(officer.hrm_medical_officer_schools ?? []).length ===
                      0 ? (
                        <span className="text-xs text-gray-500 italic">
                          No schools assigned. This nurse-incharge will not see
                          any exams until a school is assigned.
                        </span>
                      ) : (
                        officer.hrm_medical_officer_schools?.map((s) => (
                          <span
                            key={s.id}
                            className="inline-flex items-center text-xs border border-gray-400 rounded-sm px-1 bg-gray-200"
                          >
                            {s.hrm_schools?.name}
                            <XMarkIcon
                              onClick={async () =>
                                await handleRemoveSchool(s.id)
                              }
                              className="w-4 h-4 ml-1 cursor-pointer"
                            />
                          </span>
                        ))
                      )}
                    </div>
                    <select
                      value=""
                      onChange={async (e) =>
                        await handleAssignSchool(officer, e.target.value)
                      }
                      className="app__select_standard max-w-md"
                    >
                      <option value="">+ Assign a school</option>
                      {schools
                        .filter(
                          (school) =>
                            !officer.hrm_medical_officer_schools?.some(
                              (s) =>
                                s.school_id.toString() === school.id.toString(),
                            ),
                        )
                        .map((school) => (
                          <option key={school.id} value={school.id}>
                            {school.name}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {officerToRemove && (
        <ConfirmModal
          header="Confirmation"
          btnText="Confirm"
          message="Are you sure you want to remove this Nurse-Incharge? Their school assignments will also be removed."
          onConfirm={handleConfirmedRemoveOfficer}
          onCancel={() => setOfficerToRemove(null)}
        />
      )}
    </>
  );
};

export default Page;
