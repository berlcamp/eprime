import { CustomButton } from "@/components/index";
import { CalendarIcon, MagnifyingGlassIcon } from "@heroicons/react/20/solid";
import React, { useState } from "react";

interface FilterTypes {
  setFilterKeyword: (keyword: string) => void;
  setFilterYear: (year: string) => void;
}

const Filters = ({ setFilterKeyword, setFilterYear }: FilterTypes) => {
  const [keyword, setKeyword] = useState<string>("");
  const [year, setYear] = useState<string>("");

  const currentYear = new Date().getFullYear();
  const years: number[] = [];
  for (let y = currentYear; y >= currentYear - 10; y--) {
    years.push(y);
  }

  const handleApply = () => {
    if (keyword.trim() === "" && year === "") return;

    setFilterKeyword(keyword);
    setFilterYear(year);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (keyword.trim() === "" && year === "") return;

    setFilterKeyword(keyword);
    setFilterYear(year);
  };

  const handleClear = () => {
    setFilterKeyword("");
    setKeyword("");
    setFilterYear("");
    setYear("");
  };

  return (
    <div className="">
      <div className="items-center space-x-2 space-y-1">
        <form
          onSubmit={handleSubmit}
          className="items-center inline-flex app__filter_field_container"
        >
          <div className="items-center space-y-1">
            <div className="app__filter_container">
              <MagnifyingGlassIcon className="w-4 h-4 mr-1" />
              <input
                placeholder="Search Employee Name"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="app__filter_input"
              />
            </div>
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
          </div>
        </form>
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
