// Stub slice — wallet/user identity removed. Provides an empty `userData`
// shape so legacy `useSelector(state => state.user.userData)` calls don't
// crash. Real player profile data lives in localStorage (sandbox_username, etc.).
import { createSlice } from '@reduxjs/toolkit';

const userSlice = createSlice({
  name: 'user',
  initialState: { userData: null, hasProfile: false },
  reducers: {},
});

export default userSlice.reducer;
