import Joi from "joi";

const UserPayloadSchema = Joi.object({
  name: Joi.string().required(),
  username: Joi.string().required(),
  password: Joi.string().optional(),
  email: Joi.string().email().optional(),
  noHandphone: Joi.string()
    .pattern(/^[0-9+]+$/)
    .optional(),
});

const UpdateUserSchema = Joi.object({
  name: Joi.string().optional(),
  username: Joi.string().optional(),
  email: Joi.string().email().optional(),
  noHandphone: Joi.string().optional(),
});

export { UserPayloadSchema, UpdateUserSchema };
