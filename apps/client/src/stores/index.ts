import { configureStore } from '@reduxjs/toolkit';
import fileReducer from './fileSlice';

export const store = configureStore({
  reducer: {
    files: fileReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;