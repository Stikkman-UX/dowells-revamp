import { Types } from "mongoose";

export const generateMongoId = () => new Types.ObjectId();

export const convertToMongoId = (id: string) => new Types.ObjectId(id);
