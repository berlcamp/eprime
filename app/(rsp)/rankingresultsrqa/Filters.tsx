import { CustomButton } from "@/components/index";
import { TagIcon } from "@heroicons/react/20/solid";
import React, { useEffect, useState } from "react";

import { useSupabase } from "@/context/SupabaseProvider";
import type { RankingTypes } from "@/types";

const RQA_ONLY_TYPES = new Set(["CAR-RQA", "CAR-RQA (Special Items)"]);

interface FilterTypes {
  setFilterRankingIds: (ids: string[]) => void;
}

const Filters = ({ setFilterRankingIds }: FilterTypes) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [rankings, setRankings] = useState<RankingTypes[] | []>([]);

  const { supabase } = useSupabase();

  const toggleRanking = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleApply = () => {
    if (selectedIds.size === 0) return;
    setFilterRankingIds(Array.from(selectedIds));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (selectedIds.size === 0) return;
    setFilterRankingIds(Array.from(selectedIds));
  };

  const handleClear = () => {
    setSelectedIds(new Set());
    setFilterRankingIds([]);
  };

  useEffect(() => {
    const fetchRankings = async () => {
      const { data } = await supabase
        .from("hrm_rankings")
        .select(
          "*,position:position_id(name),committees:hrm_ranking_committees(*)",
        )
        .eq("status", "Closed")
        .order("id", { ascending: false });
      if (data) {
        const filteredRankings = data.filter((ranking: RankingTypes) => {
          if (!RQA_ONLY_TYPES.has(ranking.type)) return false;
          const totalMembers = ranking.committees.length;
          const confirmedCount = ranking.committees.filter(
            (c) => c.status === "Confirmed",
          ).length;

          return confirmedCount > totalMembers / 2;
        });

        setRankings(filteredRankings);
      }
    };

    void fetchRankings();
  }, [supabase]);

  return (
    <div className="">
      <div className="items-center space-x-2 space-y-1">
        <form
          onSubmit={handleSubmit}
          className="items-center inline-flex app__filter_field_container"
        >
          <div className="items-center space-y-1 w-full max-w-xl">
            <div className="app__filter_container items-start">
              <TagIcon className="w-4 h-4 mr-1 mt-1 shrink-0" />
              <div className="flex flex-col gap-2 w-full">
                <span className="text-xs text-gray-600">
                  CAR-RQA &amp; CAR-RQA (Special Items) only — select one or
                  more:
                </span>
                <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-md p-2 space-y-2 bg-white">
                  {rankings.length === 0 && (
                    <div className="text-sm text-gray-500">
                      No closed CAR-RQA rankings yet.
                    </div>
                  )}
                  {rankings.map((item) => (
                    <label
                      key={item.id}
                      className="flex items-start gap-2 cursor-pointer text-sm"
                    >
                      <input
                        type="checkbox"
                        className="mt-0.5 rounded border-gray-300"
                        checked={selectedIds.has(item.id)}
                        onChange={() => toggleRanking(item.id)}
                      />
                      <span>
                        {item.position?.name} — {item.type} — {item.year}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
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
