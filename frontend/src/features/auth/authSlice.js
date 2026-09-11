import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axiosInstance.js';

const stored = JSON.parse(localStorage.getItem('k12_auth') || 'null');

export const login = createAsyncThunk('auth/login', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/login', payload);
    return data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Login failed');
  }
});

export const registerUser = createAsyncThunk('auth/register', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/register', payload);
    return data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Registration failed');
  }
});

export const forgotPassword = createAsyncThunk('auth/forgotPassword', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/forgot-password', payload);
    return data.message;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Request failed');
  }
});

const initialState = {
  user: stored?.user || null,
  accessToken: stored?.accessToken || null,
  refreshToken: stored?.refreshToken || null,
  status: 'idle',
  error: null,
};

function persist(state) {
  localStorage.setItem('k12_auth', JSON.stringify({ user: state.user, accessToken: state.accessToken, refreshToken: state.refreshToken }));
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      localStorage.removeItem('k12_auth');
    },
    setTokens(state, action) {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      persist(state);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        persist(state);
      })
      .addCase(login.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(registerUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state) => {
        state.status = 'succeeded';
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  },
});

export const { logout, setTokens } = authSlice.actions;
export default authSlice.reducer;
