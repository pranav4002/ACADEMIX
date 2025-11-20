import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  signupData: null,
  loading: false,

  // FIXED: DO NOT JSON.parse the token
  token: localStorage.getItem("token") || null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setSignupData(state, action) {
      state.signupData = action.payload;
    },
    setLoading(state, action) {
      state.loading = action.payload;
    },
    setToken(state, action) {
      state.token = action.payload;
      localStorage.setItem("token", action.payload); // also save it
    },
  },
});

export const { setSignupData, setLoading, setToken } = authSlice.actions;
export default authSlice.reducer;
