import Joi from "joi";

const ProductSchemaPayload = Joi.object({
  product_name: Joi.string().required(),
  product_image: Joi.string().allow("").optional(),
  quantity: Joi.number().integer().min(1).required(),
  category_id: Joi.string().required(),
  product_available: Joi.number().integer().min(0).required(),
  units: Joi.array()
    .items(
      Joi.object({
        serialNumber: Joi.string().required(),
      })
    )
    .min(1)
    .required(),
});

export default ProductSchemaPayload;
