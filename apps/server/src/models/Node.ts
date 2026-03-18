import mongoose, { Schema, Document } from "mongoose";

export interface INodeContainer extends Document {
  userId: mongoose.Types.ObjectId;
  nodes: Array<{
    nodeId: string;
    type: string;
    position: { x: number; y: number };
    data: {
      filename: string;
      path: string;
      code: string;
    };
  }>;
}

const NodeContainerSchema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    nodes: { type: Array, default: [] },
  },
  { timestamps: true },
);

export default mongoose.model<INodeContainer>("Node", NodeContainerSchema);
