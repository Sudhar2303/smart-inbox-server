import { Schema, model, Document, Types } from "mongoose";

export interface generatedRepliesInterface extends Document {
  user: Types.ObjectId,       
  provider: "google",
  conversationId: string,     
  suggestion: string,
  used: boolean,       
  createdAt: Date
}

const generatedRepliesSchema = new Schema<generatedRepliesInterface>(
  {
    user: { 
        type: Schema.Types.ObjectId, 
        ref: "User", 
        required: true 
    },
    provider: { 
        type: String, 
        enum: ["google"], 
        required: true 
    },
    conversationId: { 
        type: String, 
        required: true 
    },
    suggestion: { 
        type: String,
        required: true 
    },
    used: { 
      type: Boolean, 
      default: false 
    },
    createdAt: { 
        type: Date, 
        default: Date.now, 
        expires: 60 * 60 * 24 * 7 
    } 
  },
  { 
    collection: "generatedReplies" 
}
);

export default model<generatedRepliesInterface>("generatedReplies", generatedRepliesSchema);
