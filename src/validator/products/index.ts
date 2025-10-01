import InvariantError from "../../exceptions/InvariantError";
import ProductSchemaPayload from "./schema";
const ProductValidator = {
  validateProductPayload: (payload: any) => {
    const validationResult = ProductSchemaPayload.validate(payload);

    if (validationResult.error) {
      throw new InvariantError(validationResult.error.message);
    }
  },
};

export default ProductValidator;
