import crypto from "crypto";
import { userRepository } from "../repositories/userRepository";

const hashPassword = (password: string) =>
  crypto.createHash("sha256").update(password).digest("hex");

export const authService = {
  async register(fullName: string, email: string, password: string) {
    const normalizedEmail = email.trim().toLowerCase();
    if (!fullName || !normalizedEmail || !password) {
      return { success: false, message: "Full name, email, and password are required." };
    }

    const existing = await userRepository.findByEmail(normalizedEmail);
    if (existing) {
      return { success: false, message: "Email is already registered." };
    }

    const user = await userRepository.createUser(
      fullName,
      normalizedEmail,
      hashPassword(password)
    );

    return {
      success: true,
      message: "Registration successful.",
      user: {
        userId: user.userId.toString(),
        fullName: user.fullName,
        email: user.email,
      },
    };
  },

  async login(email: string, password: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await userRepository.findByEmail(normalizedEmail);
    if (!user) {
      return { success: false, message: "Invalid credentials." };
    }

    const hash = hashPassword(password);
    if (user.passwordHash !== hash) {
      return { success: false, message: "Invalid credentials." };
    }

    return {
      success: true,
      message: "Login successful.",
      user: {
        userId: user.userId.toString(),
        fullName: user.fullName,
        email: user.email,
      },
    };
  },
};
