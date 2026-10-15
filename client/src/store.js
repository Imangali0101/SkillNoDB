import { configureStore, createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from './api';

export const fetchMe = createAsyncThunk('auth/me', () => api('/me'));

// mode: 'login' | 'register'. После успеха JWT кладём в localStorage и грузим профиль.
export const authenticate = createAsyncThunk('auth/authenticate', async ({ mode, ...form }) => {
  const data = await api(`/auth/${mode}`, { method: 'POST', body: form });
  localStorage.setItem('token', data.token);
  return api('/me');
});

const slice = createSlice({
  name: 'auth',
  initialState: { user: null, loading: !!localStorage.getItem('token') },
  reducers: {
    logout(state) { localStorage.removeItem('token'); state.user = null; },
    setUser(state, { payload }) { state.user = payload; },
  },
  extraReducers: (b) => {
    b.addCase(authenticate.pending, (s) => { s.loading = true; })
     .addCase(authenticate.rejected, (s) => { s.loading = false; })
     .addCase(fetchMe.fulfilled, (s, { payload }) => { s.user = payload; s.loading = false; })
     .addCase(fetchMe.rejected, (s) => { localStorage.removeItem('token'); s.user = null; s.loading = false; })
     .addCase(authenticate.fulfilled, (s, { payload }) => { s.user = payload; s.loading = false; });
  },
});

export const { logout, setUser } = slice.actions;
export default configureStore({ reducer: { auth: slice.reducer } });
