import { Types } from "mongoose";
import oauthTokenModel ,{ oauthTokenInterface } from "../models/OauthTokenModel"

interface UpdateOAuthTokenInput {
  _id: Types.ObjectId;
  provider: string;
  providerId: string;
  refreshToken?: string;
}

export const findOAuthTokenById = async(_id : Types.ObjectId, provider : string): Promise<oauthTokenInterface | null> => {
    return oauthTokenModel.findOne({ author: _id, provider })
}

export const updateOAuthToken = async ( data: UpdateOAuthTokenInput ): Promise<oauthTokenInterface> => {
  const { _id, provider, providerId, refreshToken } = data

  const updatedToken = await oauthTokenModel.findOneAndUpdate(
        { author: _id, provider }, 
        { author: _id, provider, providerId, refreshToken },
        { new: true, upsert: true }
    )

  return updatedToken
};