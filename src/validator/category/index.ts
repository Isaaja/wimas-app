import InvariantError from "../../exceptions/InvariantError";
import CategorySchemaPayload from "./schema";
const CategoryValidator = {
  validateProductPayload: (payload: any) => {
    const validationResult = CategorySchemaPayload.validate(payload);

    if (validationResult.error) {
      throw new InvariantError(validationResult.error.message);
    }
  },
};

export default CategoryValidator;
