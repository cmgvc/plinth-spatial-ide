import mongoose, { Schema, Document } from 'mongoose';

export interface INode extends Document {
  userId: mongoose.Types.ObjectId;
  nodeId: string;
  type: string;
  position: { x: number; y: number };
  data: {
    filename: string;
    path: string;
    code: string;
  };
  style: { width: number; height: number };
}

const NodeSchema: Schema = new Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true 
  },
  nodeId: { type: String, required: true },
  type: { type: String, default: 'fileNode' },
  position: {
    x: { type: Number, required: true },
    y: { type: Number, required: true },
  },
  data: {
    filename: { type: String, required: true },
    path: { type: String },
    code: { type: String },
  },
  style: {
    width: { type: Number },
    height: { type: Number },
  },
}, { timestamps: true });

NodeSchema.index({ userId: 1, nodeId: 1 }, { unique: true });

export default mongoose.model<INode>('Node', NodeSchema);