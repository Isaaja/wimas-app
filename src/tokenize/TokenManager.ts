/* eslint-disable @typescript-eslint/no-unused-vars */
import jwt from "jsonwebtoken";
import InvariantError from "../exceptions/InvariantError";
import { JwtPayload } from "@supabase/supabase-js";

const TokenManager = {
  generateAccessToken: (payload: object) => {
    return jwt.sign(payload, process.env.ACCESS_TOKEN_KEY as string, {
      expiresIn: "5m",
    });
  },

  generateRefreshToken: (payload: object) => {
    return jwt.sign(payload, process.env.REFRESH_TOKEN_KEY as string, {
      expiresIn: "7d",
    });
  },

  verifyAccessToken: (accessToken: string): JwtPayload => {
    try {
      const payload = jwt.verify(
        accessToken,
        process.env.ACCESS_TOKEN_KEY as string
      );

      const { exp: _exp, iat: _iat, ...userPayload } = payload as JwtPayload;
      return userPayload as JwtPayload;
    } catch (error) {
      throw new InvariantError(
        "Access token tidak valid atau sudah kadaluarsa"
      );
    }
  },

  verifyRefreshToken: (refreshToken: string): JwtPayload => {
    try {
      const payload = jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_KEY as string
      );
      const { exp: _exp, iat: _iat, ...userPayload } = payload as JwtPayload;
      return userPayload as JwtPayload;
    } catch (error) {
      throw new InvariantError("Refresh token tidak valid");
    }
  },
};

export default TokenManager;
