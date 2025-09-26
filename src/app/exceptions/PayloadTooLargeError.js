import ClientError from "./ClientError";
class PayloadTooLargeError extends ClientError {
  constructor(message) {
    super(message, 413);
    this.name = "PayloadTooLargeError";
  }
}

export default PayloadTooLargeError;
