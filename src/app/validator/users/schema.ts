import Joi from "joi";

const UserPayloadSchema = Joi.object({
  name: Joi.string().required(),
  username: Joi.string().required(),
  password: Joi.string(),
});

export default UserPayloadSchema;
