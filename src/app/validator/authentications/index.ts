import InvariantError from "@/app/exceptions/InvariantError";
import AuthenticationSchemas from "./schema";

const AuthenticationsValidator = {
  validatePostAuthenticationPayload: (payload: any) => {
    const validationResult =
      AuthenticationSchemas.PostAuthenticationPayloadSchema.validate(payload);
    if (validationResult.error) {
      throw new InvariantError(validationResult.error.message);
    }
  },
  validatePutAuthenticationPayload: (payload: any) => {
    const validationResult =
      AuthenticationSchemas.PutAuthenticationPayloadSchema.validate(payload);
    if (validationResult.error) {
      throw new InvariantError(validationResult.error.message);
    }
  },
  validateDeleteAuthenticationPayload: (payload: any) => {
    const validationResult =
      AuthenticationSchemas.DeleteAuthenticationPayloadSchema.validate(payload);
    if (validationResult.error) {
      throw new InvariantError(validationResult.error.message);
    }
  },
};

module.exports = AuthenticationsValidator;
