import InvariantError from "../../exceptions/InvariantError";
import LoanSchemaPayload from "./schema";
const LoanValidator = {
  validateLoanPayload: (payload: any) => {
    const validationResult = LoanSchemaPayload.validate(payload);

    if (validationResult.error) {
      throw new InvariantError(validationResult.error.message);
    }
  },
};

export default LoanValidator;
