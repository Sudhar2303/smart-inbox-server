import mongoose from "mongoose";

const connectDB = async (): Promise<void> => {
    const db = await mongoose.connect(process.env.MONGO_URI as string);
    console.log(`MongoDB connected: ${db.connection.name}`);
}

export default connectDB;
