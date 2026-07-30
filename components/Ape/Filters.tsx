import { CustomButton } from "@/components/index";
import {
  CalendarIcon,
  ClipboardDocumentCheckIcon,
} from "@heroicons/react/20/solid";
import React, { useState } from "react";

interface FilterTypes {
  setFilterYear: (year: string) => void;
  setFilterStatus: (status: string) => void;
}

// Filters for a single employee's own Annual Physical Exam records. There is no
// name search here since the list already belongs to one employee.
const Filters = ({ setFilterYear, setFilterStatus }: FilterTypes) => {
  const [year, setYear] = useState<string>("");
  const [status, setStatus] = useState<string>("");

  const currentYear = new Date().getFullYear();
  const years: number[] = [];
  for (let y = currentYear; y >= currentYear - 10; y--) {
    years.push(y);
  }

  const handleApply = () => {
    if (year === "" && status === "") return;

    setFilterYear(year);
    setFilterStatus(status);
  };

  const handleClear = () => {
    setFilterYear("");
    setYear("");
    setFilterStatus("");
    setStatus("");
  };

  return (
    <div>
      <div className="items-center space-x-2 space-y-1">
        <div className="items-center inline-flex app__filter_field_container">
          <div className="items-center space-y-1">
            <div className="app__filter_container">
              <CalendarIcon className="w-4 h-4 mr-1" />
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="app__filter_select"
              >
                <option value="">Year:</option>
                {years.map((y) => (
                  <option key={y} value={y.toString()}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
            <div className="app__filter_container">
              <ClipboardDocumentCheckIcon className="w-4 h-4 mr-1" />
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="app__filter_select"
              >
                <option value="">Status: All</option>
                <option value="Pending">Pending Review</option>
                <option value="Diagnosed">Diagnosed</option>
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
  );
};

export default Filters;
