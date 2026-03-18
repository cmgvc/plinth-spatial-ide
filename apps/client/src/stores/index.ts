import { configureStore } from '@reduxjs/toolkit';
import fileReducer from './fileSlice';
import uiReducer from './uiSlice';

declare global {
  interface Window {
    __REDUX_STORE__?: typeof store;
    isTest?: boolean;
  }
}

export const store = configureStore({
  reducer: {
    files: fileReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

if (typeof window !== 'undefined' && (window.isTest || window.location.search.includes('test=true'))) {
  window.__REDUX_STORE__ = store;
}

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;