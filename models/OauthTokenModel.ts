import { Schema, model, Document, Types } from "mongoose";

export interface oauthTokenInterface extends Document {
  author: Types.ObjectId
  provider: string
  providerId: string
  refreshToken?: string
}

const oauthTokenSchema = new Schema<oauthTokenInterface>(
  {
    author: { 
        type: Schema.Types.ObjectId, 
        ref: "User", 
        required: true 
    },
    provider: { 
        type: String, 
        enum: ["google"], 
        required: true 
    },
    providerId: { 
        type: String, 
        required: true, 
        unique: true 
    },
    refreshToken: { 
        type: String, 
        default: null 
    }
  },
  { 
    timestamps: true, 
    collection: "oauthTokens" 
  } 
);

export default model<oauthTokenInterface>("oauthToken", oauthTokenSchema);
