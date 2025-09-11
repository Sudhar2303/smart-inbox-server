import { body, param } from "express-validator";

export const createDraftValidator = [
  body("to").isEmail().withMessage("Valid recipient email required"),
  body("subject").isString().withMessage("Subject is required"),
  body("body").isString().withMessage("Body content is required"),
];

export const updateDraftValidator = [
  body("draftId").isString().withMessage("Invalid draftId"),
  body("to").optional().isEmail().withMessage("Valid recipient email required"),
  body("subject").optional().isString(),
  body("body").optional().isString(),
];


export const deleteDraftValidator = [
  param("draftId").isString().withMessage("Invalid draftId"),
];

export const sendDraftValidator = [
  body("draftId").isString().withMessage("Invalid draftId"),
  body("to").optional().isEmail().withMessage("Valid recipient email required"),
  body("subject").optional().isString(),
  body("body").optional().isString(),
];
