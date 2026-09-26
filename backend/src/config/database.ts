import mongoose from "mongoose";

export const connectDB = () => {
  const uri = process.env.MONGODB_URL;

  if (!uri) {
    throw new Error("MONGODB_URL is not set");
  }

  return mongoose.connect(uri);
};

export const mongoDB = mongoose.connection.on("error", (err) => {
  console.log("Error occurred in DB: ", err);
});
