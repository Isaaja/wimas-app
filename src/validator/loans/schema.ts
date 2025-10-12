import Joi from "joi";

const FileSchema = Joi.object({
  originalname: Joi.string().required(),
  mimetype: Joi.string().valid("application/pdf").required(),
  size: Joi.number().required(),
});

const LoanItemSchema = Joi.object({
  product_id: Joi.string().required(),
  quantity: Joi.number().integer().min(1).required(),
});

const LoanSchemaPayload = Joi.object({
  user: Joi.array().items(Joi.string()).min(1).required(),
  items: Joi.array().items(LoanItemSchema).min(1).required(),
  docs: FileSchema.required(),
});

export default LoanSchemaPayload;
