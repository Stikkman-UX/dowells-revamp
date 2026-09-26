import { Schema, Document, model } from "mongoose";
import * as interfaces from "./interface";

export interface IAsset extends interfaces.IAssetInterface, Document {
  createdAt: Date;
  updatedAt: Date;
}

const assetMetadataSchema = new Schema<interfaces.IAssetMetadata>(
  {
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    fileType: {
      type: String,
      required: true,
      enum: Object.values(interfaces.EAssetFileType),
    },
    fileSize: { type: Number, required: true },
  },
  { _id: false }
);

const assetSchema = new Schema<IAsset>(
  {
    assetId: { type: String, required: true },
    bucket: { type: String, required: true },
    objectKey: { type: String, required: true },
    metadata: { type: assetMetadataSchema, required: true },
  },
  { timestamps: true }
);

assetSchema.index({ assetId: 1 }, { unique: true });

const Asset = model<IAsset>("Asset", assetSchema);

export default Asset;
