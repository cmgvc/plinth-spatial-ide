import mongoose, { Schema, Document } from "mongoose";

export interface INodeContainer extends Document {
  userId: string; // Changed from ObjectId to String for compatibility
  flyMachineId: string | null; 
  flyVolumeId: string | null;
  nodes: any[];
  edges: any[];
}

const NodeContainerSchema = new Schema(
  {
    userId: {
      type: String, // Matches the string IDs being sent by the frontend
      required: true,
      unique: true,
    },
    flyMachineId: { type: String, default: null },
    flyVolumeId: { type: String, default: null },
    nodes: { type: Array, default: [] },
    // Persist ReactFlow edges too (see `apps/server/src/routes/nodeRoutes.ts`).
    edges: { type: Array, default: [] },
  },
  { timestamps: true },
);

// Keep the index for performance
NodeContainerSchema.index({ userId: 1 });

// Use the existing model if it exists, otherwise create it
export default mongoose.models.Node || mongoose.model<INodeContainer>("Node", NodeContainerSchema);