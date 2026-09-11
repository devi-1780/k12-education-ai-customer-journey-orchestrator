import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axiosInstance.js';

export const fetchNotifications = createAsyncThunk('notifications/fetch', async (params = {}) => {
  const { data } = await api.get('/notifications', { params });
  return { items: data.data, meta: data.meta };
});

export const markNotificationRead = createAsyncThunk('notifications/markRead', async (id) => {
  await api.post(`/notifications/${id}/read`);
  return id;
});

export const markAllNotificationsRead = createAsyncThunk('notifications/markAllRead', async () => {
  await api.post('/notifications/read-all');
});

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState: { items: [], meta: null, status: 'idle' },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.items = action.payload.items;
        state.meta = action.payload.meta;
        state.status = 'succeeded';
      })
      .addCase(markNotificationRead.fulfilled, (state, action) => {
        const n = state.items.find((i) => i._id === action.payload);
        if (n) n.isRead = true;
      })
      .addCase(markAllNotificationsRead.fulfilled, (state) => {
        state.items.forEach((i) => { i.isRead = true; });
      });
  },
});

export default notificationsSlice.reducer;
