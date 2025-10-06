import InvariantError from "../../exceptions/InvariantError";
import { UserPayloadSchema, UpdateUserSchema } from "./schema";

const UsersValidator = {
  validateUserPayload: (payload: any) => {
    const validationResult = UserPayloadSchema.validate(payload);

    if (validationResult.error) {
      throw new InvariantError(validationResult.error.message);
    }
  },
  validateUpdateUserPayload: (payload: any) => {
    const validationResult = UpdateUserSchema.validate(payload);

    if (validationResult.error) {
      throw new InvariantError(validationResult.error.message);
    }
  },
};

export default UsersValidator;
