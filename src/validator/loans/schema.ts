import Joi from "joi";

const FileSchema = Joi.object({
  originalname: Joi.string().required(),
  mimetype: Joi.string()
    .valid("image/jpeg", "image/png", "image/jpg", "image/webp")
    .required(),
  size: Joi.number()
    .max(5 * 1024 * 1024) // max 5 MB
    .required(),
});

const LoanItemSchema = Joi.object({
  product_id: Joi.string().required(),
  quantity: Joi.number().integer().min(1).required(),
});

const LoanSchemaPayload = Joi.object({
  userId: Joi.string().required(),
  user: Joi.array().items(Joi.string()).min(1).required(),
  items: Joi.array().items(LoanItemSchema).min(1).required(),
  image: FileSchema.required(),
});

export default LoanSchemaPayload;
