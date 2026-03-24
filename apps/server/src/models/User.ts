import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  username: string;
  email: string;
  flyMachineId: string | null;
  flyVolumeId: string | null; 
  nodes: any[];
  edges: any[];
  workspaceSettings: {
    theme: string;
    lastOpenedFile?: string;
  };
  rootFolders: Array<{
    name: string;
    path?: string;
    lastSynced?: Date;
  }>;
  lastActive: Date;
  isPro: boolean;
}

const userSchema = new Schema<IUser>(
  {
    username: { type: String, required: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    flyMachineId: { type: String, default: null },
    flyVolumeId: { type: String, default: null }, 
    nodes: { type: [Schema.Types.Mixed] as any, default: [] },
    edges: { type: [Schema.Types.Mixed] as any, default: [] },
    workspaceSettings: {
      theme: { type: String, default: "dark" },
      lastOpenedFile: { type: String },
    },
    rootFolders: [
      {
        _id: false,
        name: { type: String, required: true },
        path: String,
        lastSynced: { type: Date, default: Date.now },
      },
    ],
    lastActive: { type: Date, default: Date.now },
    isPro: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    autoIndex: false,
  },
);

export const User =
  mongoose.models.User || mongoose.model<IUser>("User", userSchema, "users_v3");