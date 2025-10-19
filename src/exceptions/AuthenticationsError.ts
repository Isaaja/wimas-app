import ClientError from "./ClientError";

class AuthenticationError extends ClientError {
  constructor(message: any) {
    super(message, 401);
    this.name = "AuthenticationError";
  }
}
export default AuthenticationError;
