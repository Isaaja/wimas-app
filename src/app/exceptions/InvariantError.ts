import ClientError from "./ClientError";

class InvariantError extends ClientError {
  constructor(message: any) {
    super(message);
    this.name = "InvariantError";
  }
}

export default InvariantError;
