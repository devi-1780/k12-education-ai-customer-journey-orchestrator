import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api/axiosInstance.js';

/**
 * Factory for a standard "list resource from a REST endpoint" slice.
 * Keeps every feature slice (profiles, journey, tickets, etc.) consistent
 * without duplicating the same loading/error/pagination boilerplate.
 */
export function createResourceSlice(name, endpoint) {
  const fetchList = createAsyncThunk(`${name}/fetchList`, async (params = {}, { rejectWithValue }) => {
    try {
      const { data } = await api.get(endpoint, { params });
      return { items: data.data, meta: data.meta };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || `Failed to load ${name}`);
    }
  });

  const slice = createSlice({
    name,
    initialState: { items: [], meta: null, status: 'idle', error: null },
    reducers: {
      clearError(state) {
        state.error = null;
      },
    },
    extraReducers: (builder) => {
      builder
        .addCase(fetchList.pending, (state) => {
          state.status = 'loading';
          state.error = null;
        })
        .addCase(fetchList.fulfilled, (state, action) => {
          state.status = 'succeeded';
          state.items = action.payload.items;
          state.meta = action.payload.meta;
        })
        .addCase(fetchList.rejected, (state, action) => {
          state.status = 'failed';
          state.error = action.payload;
        });
    },
  });

  return { slice, fetchList };
}
