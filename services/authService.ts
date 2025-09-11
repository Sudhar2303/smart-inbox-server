import { Types } from 'mongoose'
import userModel, { UserInterface } from '../models/userModel'

export const findUserByEmail = async(email : string): Promise<UserInterface | null> => {
    return userModel.findOne({email}).select('+password')
}

export const createUser = async(name : string, email : string, password?: string): Promise<UserInterface> => {
    return await userModel.create({name,email,password})
}

export const findUserById = async (id: Types.ObjectId): Promise<UserInterface | null> => {
  return await userModel.findById(id);
};

