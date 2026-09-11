import { createResourceSlice } from '../../utils/createResourceSlice.js';

const { slice, fetchList } = createResourceSlice('audit', '/audit-logs');
export const fetchAuditLogs = fetchList;
export default slice.reducer;
