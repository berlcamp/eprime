'use client'

import { configureStore } from '@reduxjs/toolkit'
import listReducer from './Features/listSlice'
import recountReducer from './Features/recountSlice'
import remarksReducer from './Features/remarksSlice'
import resultsReducer from './Features/resultsCounterSlice'
import slowListReducer from './Features/slowListSlice'

export const store = configureStore({
  reducer: {
    list: listReducer,
    slowList: slowListReducer,
    remarks: remarksReducer,
    results: resultsReducer,
    recount: recountReducer
  }
})
