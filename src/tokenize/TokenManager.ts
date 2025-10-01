import jwt from "jsonwebtoken";
import InvariantError from "../exceptions/InvariantError";

interface CustomJwtPayload {
  role: string;
  [key: string]: any;
}

const TokenManager = {
  generateAccessToken: (payload: object) => {
    return jwt.sign(payload, process.env.ACCESS_TOKEN_KEY as string, {
      expiresIn: "1h",
    });
  },

  generateRefreshToken: (payload: object) => {
    return jwt.sign(payload, process.env.REFRESH_TOKEN_KEY as string, {
      expiresIn: "7d",
    });
  },

  verifyAccessToken: (accessToken: string): CustomJwtPayload => {
    try {
      const payload = jwt.verify(
        accessToken,
        process.env.ACCESS_TOKEN_KEY as string
      );

      const decodedPayload = payload as any;

      if (!decodedPayload.role) {
        throw new InvariantError("Role not found in token");
      }

      return decodedPayload as CustomJwtPayload;
    } catch (error) {
      throw new InvariantError(
        "Access token tidak valid atau sudah kadaluarsa"
      );
    }
  },

  verifyRefreshToken: (refreshToken: string): any => {
    try {
      const payload = jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_KEY as string
      );
      return payload;
    } catch (error) {
      throw new InvariantError("Refresh token tidak valid");
    }
  },
};

export default TokenManager;
