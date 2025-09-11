import { Request, Response } from "express"
import { setResponseBody } from "../utils/responseFormatter"
import { Types } from "mongoose";
import { findUserById } from "../services/authService";

export const getUserInfo = async (request: Request, response: Response) => {
  try {
    
    const userId = (request.user as { _id: Types.ObjectId })._id;

    if (!userId) {
      return response.status(400).send(
        setResponseBody("User ID not found in request", "validation_error")
      );
    }

    const user = await findUserById(userId);

    if (!user) {
      return response.status(404).send(
        setResponseBody("User not found", null)
      );
    }

    return response.status(200).send(
      setResponseBody("User details fetched successfully", null ,user)
    );
  } catch (error) {
    console.error("Error fetching user info:", error);
    return response.status(500).send(
      setResponseBody("Internal server error", "server error")
    );
  }
};
