import GeneratedReply, { generatedRepliesInterface } from "../models/generatedReplies";
import { Types } from "mongoose";

export const findGeneratedReply = async ( userId: Types.ObjectId, conversationId: string ): Promise<generatedRepliesInterface | null> => {
  return GeneratedReply.findOne({ user: userId, conversationId,used: false });
};

export const createGeneratedReply = async ( userId: Types.ObjectId, conversationId: string, suggestion: string ): Promise<generatedRepliesInterface> => {
  return GeneratedReply.create({
    user: userId,
    provider: "google",
    conversationId,
    suggestion,
    used: false, 
  });
};

export const markReplyAsUsed = async ( userId: Types.ObjectId, conversationId: string ): Promise<void> => {
  await GeneratedReply.updateOne(
    { user: userId, conversationId },
    { $set: { used: true } }
  );
};
