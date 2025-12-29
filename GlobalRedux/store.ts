"use client";

import { configureStore } from "@reduxjs/toolkit";
import list2Reducer from "./Features/list2Slice";
import listReducer from "./Features/listSlice";
import recountReducer from "./Features/recountSlice";
import remarksReducer from "./Features/remarksSlice";
import resultsReducer from "./Features/resultsCounterSlice";
import slowListReducer from "./Features/slowListSlice";

// Create a function to make the store a singleton
function makeStore() {
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

// Create store instance
let storeInstance: ReturnType<typeof makeStore> | undefined;

export const getStore = () => {
  if (typeof window === "undefined") {
    // Server-side: always return a new store
    return makeStore();
  }
  // Client-side: use singleton pattern
  if (!storeInstance) {
    storeInstance = makeStore();
  }
  return storeInstance;
};

export const store = getStore();

// Infer the `RootState` type from the store
export type RootState = ReturnType<typeof store.getState>;

// You can also export the `AppDispatch` type
export type AppDispatch = typeof store.dispatch;
