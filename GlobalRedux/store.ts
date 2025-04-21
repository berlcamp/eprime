'use client'

import { configureStore } from '@reduxjs/toolkit'
import list2Reducer from './Features/list2Slice'
import listReducer from './Features/listSlice'
import recountReducer from './Features/recountSlice'
import remarksReducer from './Features/remarksSlice'
import resultsReducer from './Features/resultsCounterSlice'
import slowListReducer from './Features/slowListSlice'

export const store = configureStore({
  reducer: {
    list: listReducer,
    list2: list2Reducer,
    slowList: slowListReducer,
    remarks: remarksReducer,
    results: resultsReducer,
    recount: recountReducer
  }
})

// Infer the `RootState` type from the store
export type RootState = ReturnType<typeof store.getState>

// You can also export the `AppDispatch` type
export type AppDispatch = typeof store.dispatch
