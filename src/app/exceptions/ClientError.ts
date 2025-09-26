class ClientError extends Error {
  statusCode: number;

  constructor(message: any, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.name = "ClientError";
  }
}

export default ClientError;
