import jwt from "jsonwebtoken";
import InvariantError from "../exceptions/InvariantError";

const TokenManager = {
  generateAccessToken: (payload: object) => {
    return jwt.sign(payload, process.env.ACCESS_TOKEN_KEY as string, {
      expiresIn: "15m",
    });
  },

  generateRefreshToken: (payload: object) => {
    return jwt.sign(payload, process.env.REFRESH_TOKEN_KEY as string, {
      expiresIn: "7d",
    });
  },

  verifyRefreshToken: (refreshToken: string) => {
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
