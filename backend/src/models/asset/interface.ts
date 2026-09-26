export enum EAssetFileType {
  Image = "Image",
  Video = "Video",
  Document = "Document",
}

export interface IAssetMetadata {
  originalName: string;
  mimeType: string;
  fileType: EAssetFileType;
  fileSize: number;
}

export interface IAssetInterface {
  assetId: string;
  bucket: string;
  objectKey: string;
  metadata: IAssetMetadata;
}
