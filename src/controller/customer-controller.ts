import * as mysql from "mysql2/promise";
import bcrypt from "bcrypt";
import { createConnection } from "../database";
import { Router } from "express";
import { CustomerService } from "../services/customer-service";

export const customerRoutes = Router();

customerRoutes.post("/register", async (req, res) => {
  const { name, email, password, address, phone } = req.body;

  const costumerService = new CustomerService();
  const result = await costumerService.register({
    name,
    email,
    password,
    address,
    phone,
  });

  const { password: _, ...userWithoutPassword } = result;
  res.status(201).json(userWithoutPassword);
});
