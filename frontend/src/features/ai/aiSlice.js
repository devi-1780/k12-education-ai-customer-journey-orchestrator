import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axiosInstance.js';

export const fetchRecommendations = createAsyncThunk('ai/fetchRecommendations', async (params = {}) => {
  const { data } = await api.get('/ai/recommendations', { params });
  return { items: data.data, meta: data.meta };
});

export const runIntentSentiment = createAsyncThunk('ai/runIntentSentiment', async (payload) => {
  const { data } = await api.post('/ai/intent-sentiment', payload);
  return data.data;
});

export const runChurnPropensity = createAsyncThunk('ai/runChurnPropensity', async (payload) => {
  const { data } = await api.post('/ai/churn-propensity', payload);
  return data.data;
});

export const runNextBestAction = createAsyncThunk('ai/runNextBestAction', async (payload) => {
  const { data } = await api.post('/ai/next-best-action', payload);
  return data.data;
});

export const reviewRecommendation = createAsyncThunk('ai/reviewRecommendation', async ({ id, ...payload }) => {
  const { data } = await api.post(`/ai/recommendations/${id}/review`, payload);
  return data.data;
});

const aiSlice = createSlice({
  name: 'ai',
  initialState: { items: [], meta: null, status: 'idle' },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchRecommendations.pending, (state) => { state.status = 'loading'; })
      .addCase(fetchRecommendations.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload.items;
        state.meta = action.payload.meta;
      })
      .addCase(reviewRecommendation.fulfilled, (state, action) => {
        const idx = state.items.findIndex((i) => i._id === action.payload._id);
        if (idx !== -1) state.items[idx] = action.payload;
      });
  },
});

export default aiSlice.reducer;
