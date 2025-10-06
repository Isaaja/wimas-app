import Joi from "joi";

const CategorySchemaPayload = Joi.object({
  category_name: Joi.string().required(),
});

export default CategorySchemaPayload;
