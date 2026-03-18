import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface ConfirmConfig {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel?: () => void;
  type?: "danger" | "default" | "info"; 
}

const uiSlice = createSlice({
  name: "ui",
  initialState: { confirmConfig: null as ConfirmConfig | null },
  reducers: {
    setConfirm: (state, action: PayloadAction<ConfirmConfig | null>) => {
      state.confirmConfig = action.payload;
    },
  },
});

export const { setConfirm } = uiSlice.actions;
export default uiSlice.reducer;