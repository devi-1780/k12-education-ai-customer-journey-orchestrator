import { createResourceSlice } from '../../utils/createResourceSlice.js';

const { slice, fetchList } = createResourceSlice('users', '/users');
export const fetchUsers = fetchList;
export default slice.reducer;
