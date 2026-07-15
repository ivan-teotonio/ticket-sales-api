import jwt, { type SignOptions } from "jsonwebtoken";
import bcrypt from "bcrypt";
import { UserModel } from "../models/user-model";

//um controller acessa um service e o service acessa o model, e o model acessa o banco de dados

export class AuthService {
  async login(email: string, password: string) {
    const userModel = await UserModel.findByEmail(email);
    if (userModel && bcrypt.compareSync(password, userModel.password)) {
      const expiresIn = process.env.JWT_EXPIRES_IN as SignOptions["expiresIn"];
      return jwt.sign(
        { id: userModel.id, email: userModel.email },
        process.env.JWT_SECRET!,
        { expiresIn },
      );
    } else {
      throw new InvalidCredentialError();
    }
  }
}

export class InvalidCredentialError extends Error {}
