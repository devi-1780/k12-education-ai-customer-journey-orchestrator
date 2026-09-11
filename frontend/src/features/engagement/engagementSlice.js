import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axiosInstance.js';

export const fetchSegments = createAsyncThunk('engagement/fetchSegments', async (params = {}) => {
  const { data } = await api.get('/engagement/segments', { params });
  return data.data;
});

export const fetchCampaigns = createAsyncThunk('engagement/fetchCampaigns', async (params = {}) => {
  const { data } = await api.get('/engagement/campaigns', { params });
  return data.data;
});

export const fetchNBAQueue = createAsyncThunk('engagement/fetchNBAQueue', async (params = {}) => {
  const { data } = await api.get('/engagement/nba-queue', { params });
  return data.data;
});

const engagementSlice = createSlice({
  name: 'engagement',
  initialState: { segments: [], campaigns: [], nbaQueue: [], status: 'idle' },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSegments.fulfilled, (state, action) => { state.segments = action.payload; })
      .addCase(fetchCampaigns.fulfilled, (state, action) => { state.campaigns = action.payload; })
      .addCase(fetchNBAQueue.fulfilled, (state, action) => { state.nbaQueue = action.payload; })
      .addMatcher((a) => a.type.startsWith('engagement/') && a.type.endsWith('/pending'), (state) => { state.status = 'loading'; })
      .addMatcher((a) => a.type.startsWith('engagement/') && a.type.endsWith('/fulfilled'), (state) => { state.status = 'succeeded'; });
  },
});

export default engagementSlice.reducer;
