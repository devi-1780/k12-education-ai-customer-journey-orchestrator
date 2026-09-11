import { createResourceSlice } from '../../utils/createResourceSlice.js';

const { slice, fetchList } = createResourceSlice('reports', '/reports');
export const fetchReports = fetchList;
export default slice.reducer;
