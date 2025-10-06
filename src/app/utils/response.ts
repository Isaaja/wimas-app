import { NextResponse } from "next/server";

export function errorResponse(
  error: any,
  defaultMessage = "Terjadi kesalahan server"
) {
  const statusCode = error.statusCode || 500;
  const message = error.message || defaultMessage;

  return NextResponse.json({ status: "fail", message }, { status: statusCode });
}

export function successResponse(
  data?: any,
  message?: string,
  statusCode = 200
) {
  const response: Record<string, any> = {};

  response.status = "success";
  if (message) response.message = message;
  if (data !== undefined && data !== null && data !== "") {
    response.data = data;
  }
  return NextResponse.json(response, { status: statusCode });
}
