'use client'

import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  value: null
}

export const slowListSlice = createSlice({
  name: 'list',
  initialState,
  reducers: {
    updateSlowList: (state, action) => {
      state.value = action.payload
    }
  }
})

export const { updateSlowList } = slowListSlice.actions

export default slowListSlice.reducer
