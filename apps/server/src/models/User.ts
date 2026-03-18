import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  workspaceVolume: { type: String, unique: true },
  rootFolders: [{ 
    name: String, 
    path: String 
  }],
  lastActive: { type: Date, default: Date.now },
  isPro: {type: Boolean}
});

userSchema.pre("save", async function () {
  if (!this.workspaceVolume) {
    const slug = this.username.toLowerCase().replace(/[^a-z0-9]/g, '_');
    this.workspaceVolume = `vol_${slug}_${this._id}`;
  }
});

export const User = mongoose.model("User", userSchema);