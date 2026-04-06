"use client";

import { configureStore } from "@reduxjs/toolkit";
import list2Reducer from "./Features/list2Slice";
import listReducer from "./Features/listSlice";
import recountReducer from "./Features/recountSlice";
import remarksReducer from "./Features/remarksSlice";
import resultsReducer from "./Features/resultsCounterSlice";
import slowListReducer from "./Features/slowListSlice";

export function makeStore() {
  return configureStore({
    reducer: {
      list: listReducer,
      list2: list2Reducer,
      slowList: slowListReducer,
      remarks: remarksReducer,
      results: resultsReducer,
      recount: recountReducer,
    },
  });
}

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
