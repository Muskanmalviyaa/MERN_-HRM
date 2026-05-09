import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth.token;
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery,
  tagTypes: ['Attendance', 'Overtime', 'Users', 'Stats'],
  endpoints: (builder) => ({

    // ── Auth ────────────────────────────────────────────────
    login: builder.mutation({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
    }),
    signup: builder.mutation({
      query: (data) => ({
        url: '/auth/signup',
        method: 'POST',
        body: data,
      }),
    }),

    // ── Users ───────────────────────────────────────────────
    getMe: builder.query({
      query: () => '/users/me',
      providesTags: ['Users'],
    }),
    getUsers: builder.query({
      query: () => '/users',
      providesTags: ['Users'],
    }),
    updateUserRole: builder.mutation({
      query: ({ id, role }) => ({
        url: `/users/${id}/role`,
        method: 'PATCH',
        body: { role },
      }),
      invalidatesTags: ['Users'],
    }),

    // ── Attendance ──────────────────────────────────────────
    getAttendance: builder.query({
      query: (params) => ({
        url: '/attendance',
        params,
      }),
      providesTags: ['Attendance'],
    }),
    punchIn: builder.mutation({
      query: (data) => ({
        url: '/attendance/punch-in',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Attendance', 'Stats'],
    }),
    punchOut: builder.mutation({
      query: () => ({
        url: '/attendance/punch-out',
        method: 'POST',
      }),
      invalidatesTags: ['Attendance', 'Stats'],
    }),
    validateAttendance: builder.mutation({
      query: ({ id, validationStatus, validationRemarks }) => ({
        url: `/attendance/${id}/validate`,
        method: 'PATCH',
        body: { validationStatus, validationRemarks },
      }),
      invalidatesTags: ['Attendance'],
    }),

    // ── Overtime ────────────────────────────────────────────
    getOvertimeRequests: builder.query({
      query: () => '/overtime',
      providesTags: ['Overtime'],
    }),
    requestOvertime: builder.mutation({
      query: (data) => ({
        url: '/overtime',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Overtime', 'Attendance'],
    }),
    reviewOvertime: builder.mutation({
      query: ({ id, status, reviewNote }) => ({
        url: `/overtime/${id}/review`,
        method: 'PATCH',
        body: { status, reviewNote },
      }),
      invalidatesTags: ['Overtime', 'Attendance'],
    }),

    // ── Reports / Dashboard ─────────────────────────────────
    getStats: builder.query({
      query: () => '/reports/stats',
      providesTags: ['Stats'],
    }),
    getAttendanceReport: builder.query({
      query: (params) => ({
        url: '/reports/attendance',
        params,
      }),
    }),
  }),
});

export const {
  useLoginMutation,
  useSignupMutation,
  useGetMeQuery,
  useGetUsersQuery,
  useUpdateUserRoleMutation,
  useGetAttendanceQuery,
  usePunchInMutation,
  usePunchOutMutation,
  useValidateAttendanceMutation,
  useGetOvertimeRequestsQuery,
  useRequestOvertimeMutation,
  useReviewOvertimeMutation,
  useGetStatsQuery,
  useGetAttendanceReportQuery,
} = apiSlice;
