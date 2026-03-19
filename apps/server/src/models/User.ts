import mongoose, { Schema, Document } from "mongoose";

// 1. Define the TypeScript Interface
export interface IUser extends Document {
  userId: string; // The external ID from your Auth provider
  username: string;
  email: string;
  flyMachineId: string | null;
  
  // Canvas State (Moved here to support nodeRoutes)
  nodes: Array<{
    nodeId: string;
    type: string;
    position: { x: number; y: number };
    data: any;
  }>;
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

const userSchema = new Schema<IUser>({
  // This matches the :userId param in your routes
  userId: { type: String, required: true, unique: true, index: true }, 
  
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  
  flyMachineId: { type: String, default: null },

  // Added Canvas Support
  nodes: [{
    _id: false,
    nodeId: { type: String, required: true },
    type: { type: String, default: 'fileNode' },
    position: {
      x: { type: Number, default: 0 },
      y: { type: Number, default: 0 }
    },
    data: { type: Schema.Types.Mixed } // Stores filename, code, etc.
  }],
  // Mongoose typing can be overly strict here; edges are stored as generic objects
  // (ReactFlow edge shapes) so we allow Mixed.
  edges: { type: [Schema.Types.Mixed] as any, default: [] },

  workspaceSettings: {
    theme: { type: String, default: "dark" },
    lastOpenedFile: { type: String }
  },

  rootFolders: [{ 
    _id: false, 
    name: { type: String, required: true }, 
    path: String,
    lastSynced: { type: Date, default: Date.now }
  }],

  lastActive: { type: Date, default: Date.now },
  isPro: { type: Boolean, default: false }
}, {
  timestamps: true 
});

// 2. Export the Model
// Note: If you were importing "Node" in your routes, 
// you should rename that import to "User" or rename this model.
export const User = mongoose.model<IUser>("User", userSchema);