import { EUserType } from "@models/user/interface";
import { AssetFileInput } from "@utils/helper/fileSignature";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userType?: EUserType;
      /** Populated by uploadAsset (src/utils/middleware/upload.ts) after
       *  magic-byte detection + SVG validation. */
      assetFile?: AssetFileInput;
    }
  }
}

export {};
