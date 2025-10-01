import Joi from "joi";

const ProductSchemaPayload = Joi.object({
  product_name: Joi.string().required(),
  product_image: Joi.string().required(),
  quantity: Joi.number().required(),
  category_id: Joi.string().required(),
  product_avaible: Joi.number().required(),
  status: Joi.string().required(),
});

export default ProductSchemaPayload;
