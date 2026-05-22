import { createSlice } from '@reduxjs/toolkit';

const TOKEN_KEY = 'careerforge_token';

const initialState = {
  user: null,
  token: localStorage.getItem(TOKEN_KEY) || '',
  isLoggedIn: Boolean(localStorage.getItem(TOKEN_KEY)),
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isLoggedIn = Boolean(action.payload.token);
    },
    clearCredentials: (state) => {
      state.user = null;
      state.token = '';
      state.isLoggedIn = false;
    },
    setUser: (state, action) => {
      state.user = action.payload;
    },
  },
});

export const { setCredentials, clearCredentials, setUser } = authSlice.actions;
export { TOKEN_KEY };
export default authSlice.reducer;
