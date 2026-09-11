import { createResourceSlice } from '../../utils/createResourceSlice.js';

const { slice, fetchList } = createResourceSlice('profiles', '/profiles');
export const fetchProfiles = fetchList;
export const { clearError: clearProfilesError } = slice.actions;
export default slice.reducer;
