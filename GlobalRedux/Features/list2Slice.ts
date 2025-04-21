'use client'

import { createSlice, PayloadAction } from '@reduxjs/toolkit'

const initialState = {
  value: [] as any[] // Replace `any[]` with a specific type (e.g., `Supplier[]`) if needed
}

export const list2Slice = createSlice({
  name: 'list2',
  initialState,
  reducers: {
    // updateList: (state, action) => {
    //   state.value = action.payload
    // },
    // add to list
    updateList: (state, action: PayloadAction<any[]>) => {
      state.value = action.payload
    },
    // Update an item in the list by its `id`
    editList: (state, action: PayloadAction<any>) => {
      const index = state.value.findIndex(
        (item) => item.id === action.payload.id
      )
      if (index !== -1) {
        state.value[index] = action.payload
      }
    },
    // Add a new item to the list
    addItem: (state, action: PayloadAction<any>) => {
      state.value.unshift(action.payload)
    },

    // Delete an item from the list by its `id`
    deleteItem: (state, action: PayloadAction<any>) => {
      state.value = state.value.filter(
        (item) => item.id.toString() !== action.payload.id.toString()
      )
    }
  }
})

export const { updateList, editList, addItem, deleteItem } = list2Slice.actions

export default list2Slice.reducer
