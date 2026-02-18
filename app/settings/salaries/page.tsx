"use client";

import {
  PerPage,
  SettingsSideBar,
  ShowMore,
  Sidebar,
  TableRowLoading,
  Title,
  TopBar,
} from "@/components/index";
import { Badge } from "@/components/ui/badge";
import { fetchSalaryGrades } from "@/utils/fetchApi";
import React, { useEffect, useState } from "react";

// Types
import type { SalaryGradeTypes } from "@/types";

// Redux imports
import { updateList } from "@/GlobalRedux/Features/listSlice";
import { updateResultCounter } from "@/GlobalRedux/Features/resultsCounterSlice";
import { formatToPesos } from "@/utils/text-helper";
import { useDispatch, useSelector } from "react-redux";

const Page: React.FC = () => {
  const [loading, setLoading] = useState(false);

  const [list, setList] = useState<SalaryGradeTypes[]>([]);
  const [perPageCount, setPerPageCount] = useState<number>(10);

  // Redux staff
  const globallist = useSelector((state: any) => state.list.value);
  const resultsCounter = useSelector((state: any) => state.results.value);
  const dispatch = useDispatch();

  const fetchData = async () => {
    setLoading(true);

    try {
      const result = await fetchSalaryGrades(perPageCount, 0);

      // update the list in redux
      dispatch(updateList(result.data));

      // Updating showing text in redux
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

  // Append data to existing list whenever 'show more' button is clicked
  const handleShowMore = async () => {
    setLoading(true);

    try {
      const result = await fetchSalaryGrades(perPageCount, list.length);

      // update the list in redux
      const newList = [...list, ...result.data];
      dispatch(updateList(newList));

      // Updating showing text in redux
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

  // Update list whenever list in redux updates
  useEffect(() => {
    setList(globallist);
  }, [globallist]);

  // Featch data
  useEffect(() => {
    setList([]);
    void fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [perPageCount]);

  const isDataEmpty = !Array.isArray(list) || list.length < 1 || !list;

  return (
    <>
      <Sidebar>
        <SettingsSideBar />
      </Sidebar>
      <TopBar />
      <div className="app__main">
        <div>
          <div className="app__title">
            <Title title="Salary Grades" />
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
                  <th className="app__th">Grade</th>
                  <th className="app__th">Step</th>
                  <th className="app__th">Salary</th>
                  <th className="app__th">Tranche</th>
                  <th className="app__th">Remarks</th>
                  <th className="app__th">Status</th>
                </tr>
              </thead>
              <tbody>
                {!isDataEmpty &&
                  list.map((item, index) => (
                    <tr key={index} className="app__tr">
                      <th className="app__th_firstcol">{item.grade}</th>
                      <td className="app__td">{item.step}</td>
                      <td className="app__td">
                        {formatToPesos(Number(item.salary))}
                      </td>
                      <td className="app__td">{item.tranche}</td>
                      <td className="app__td">{item.remarks}</td>
                      <td className="app__td">
                        {item.is_active === "yes" ? (
                          <Badge variant="green">Active</Badge>
                        ) : (
                          item.is_active
                        )}
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
    </>
  );
};
export default Page;
