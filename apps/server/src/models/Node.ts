import mongoose, { Schema, Document } from 'mongoose';

export interface INode extends Document {
  id: string;
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
  id: { type: String, required: true, unique: true },
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

export default mongoose.model<INode>('Node', NodeSchema);