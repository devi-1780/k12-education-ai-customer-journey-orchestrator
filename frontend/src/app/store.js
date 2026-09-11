import { configureStore } from '@reduxjs/toolkit';
import { injectStore } from '../api/axiosInstance.js';
import authReducer from '../features/auth/authSlice.js';
import profilesReducer from '../features/profiles/profilesSlice.js';
import journeyReducer from '../features/journey/journeySlice.js';
import ticketsReducer from '../features/tickets/ticketsSlice.js';
import engagementReducer from '../features/engagement/engagementSlice.js';
import aiReducer from '../features/ai/aiSlice.js';
import notificationsReducer from '../features/notifications/notificationsSlice.js';
import reportsReducer from '../features/reports/reportsSlice.js';
import usersReducer from '../features/users/usersSlice.js';
import auditReducer from '../features/audit/auditSlice.js';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    profiles: profilesReducer,
    journey: journeyReducer,
    tickets: ticketsReducer,
    engagement: engagementReducer,
    ai: aiReducer,
    notifications: notificationsReducer,
    reports: reportsReducer,
    users: usersReducer,
    audit: auditReducer,
  },
});

injectStore(store);
