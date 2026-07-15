import jwt from "jsonwebtoken";
import { Database } from "./database.js";
import { Router } from "express";
import { UserService } from "./services/user-service.js";

export const middleware = Router();

const unprotectedRoutes = [
  { method: "POST", path: "/auth/login" },
  { method: "POST", path: "/customers/register" },
  { method: "POST", path: "/partners/register" },
  { method: "GET", path: "/events" },
];

// No middleware.ts
middleware.use(async (req, res, next) => {
  // ... verificação de rota pública ...

  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No token provided" });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: number;
      email: string;
    };

    // Pegamos a instância do pool
    const pool = Database.getInstance();

    const userService = new UserService();
    const user = await userService.findById(payload.id); // Certifique-se que este método usa o pool

    if (!user) return res.status(401).json({ message: "User not found" });

    req.user = user as { id: number; email: string };
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
  // NÃO precisa mais de finally { connection.end() } aqui!
});
