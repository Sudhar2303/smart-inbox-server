import { Schema, model, Document, Types } from "mongoose";
import bcrypt from "bcryptjs";

export interface UserInterface extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password?: string;
}

const userSchema = new Schema<UserInterface>(
  {
    name: {
      type: String,
      minlength: [1, "First name must be at least 1 character long"],
      maxlength: [100, "First name must not exceed 100 characters"],
      match: [/^[A-Za-z\s]+$/, "First name can only contain letters and spaces"],
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/,
        "Please provide a valid email address",
      ],
    },
    password: {
      type: String,
      select: false,
      minlength: [8, "Password must be at least 8 characters long"],
      maxlength: [20, "Password must not exceed 20 characters"],
      match: [
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[ !"#$%&'()*+,-./:;<=>?@[\\\]^_`{|}~])[A-Za-z\d !"#$%&'()*+,-./:;<=>?@[\\\]^_`{|}~]{8,20}$/,
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
      ],
    },
  },
  {
    timestamps: true,
    collection: "Users",
  }
);

userSchema.pre<UserInterface>("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next()
  const salt = await bcrypt.genSalt(10)
  this.password = await bcrypt.hash(this.password, salt)
  next()
});

export default model<UserInterface>("User", userSchema)
