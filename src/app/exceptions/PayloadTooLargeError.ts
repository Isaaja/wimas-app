import ClientError from "./ClientError";
class PayloadTooLargeError extends ClientError {
  constructor(message: any) {
    super(message, 413);
    this.name = "PayloadTooLargeError";
  }
}

export default PayloadTooLargeError;
