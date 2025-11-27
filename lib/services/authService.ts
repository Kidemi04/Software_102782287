import { visitorRepository } from "../repositories/visitorRepository";

export const authService = {
  async register(name: string, email: string, password: string) {
    const trimmedEmail = email.trim().toLowerCase();
    if (!name || !trimmedEmail || !password) {
      return { success: false, message: "Name, email, and password are required." };
    }

    const existing = await visitorRepository.findByEmail(trimmedEmail);
    if (existing) {
      return { success: false, message: "Email is already registered." };
    }

    const visitor = await visitorRepository.createVisitor(name, trimmedEmail, password);
    return { success: true, message: "Registration successful.", visitor };
  },

  async login(email: string, password: string) {
    const trimmedEmail = email.trim().toLowerCase();
    const visitor = await visitorRepository.findByEmail(trimmedEmail);
    if (!visitor) {
      return { success: false, message: "Invalid credentials." };
    }
    if (visitor.password !== password) {
      return { success: false, message: "Invalid credentials." };
    }
    return { success: true, message: "Login successful.", visitor };
  },
};
