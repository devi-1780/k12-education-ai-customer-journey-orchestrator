import { createResourceSlice } from '../../utils/createResourceSlice.js';

const { slice, fetchList } = createResourceSlice('tickets', '/tickets');
export const fetchTickets = fetchList;
export const { clearError: clearTicketsError } = slice.actions;
export default slice.reducer;
