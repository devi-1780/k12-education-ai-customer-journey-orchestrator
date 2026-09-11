import { createResourceSlice } from '../../utils/createResourceSlice.js';

const { slice, fetchList } = createResourceSlice('journey', '/journey');
export const fetchJourney = fetchList;
export const { clearError: clearJourneyError } = slice.actions;
export default slice.reducer;
