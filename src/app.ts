import express from "express";
import * as mysql from "mysql2/promise";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

dotenv.config();

function createConnection() {
  return mysql.createConnection({
    host: process.env.DB_HOST!,
    user: process.env.DB_USER!,
    password: process.env.DB_PASSWORD!,
    database: process.env.DB_NAME!,
    port: parseInt(process.env.DB_PORT!),
  });
}

const port = process.env.PORT || 3000;

const app = express();

app.use(express.json());

app.use(async (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) {
    res.status(401).json({ message: "No token provided" });
    return;
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: number;
      email: string;
    };
    const connection = await createConnection();
    const [rows] = await connection.execute<mysql.RowDataPacket[]>(
      "SELECT * FROM users WHERE id = ?",
      [payload.id],
    );
    const user = rows.length ? rows[0] : null;
    if (!user) {
      res.status(401).json({ message: "User not found" });
      return;
    }
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: "Failed to authenticate token" });
    return;
  }
});

app.get("/", async (req, res) => {
  res.json({ message: "Hello world!" });
});

app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;
  const connection = await createConnection();
  try {
    const [rows] = await connection.execute<mysql.RowDataPacket[]>(
      "SELECT * FROM users WHERE email = ?",
      [email],
    );
    const user = rows.length ? rows[0] : null;

    if (user && bcrypt.compareSync(password, user.password)) {
      //gerar o jwt
      const token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET!,
        { expiresIn: process.env.JWT_EXPIRES_IN as string },
      );
      res.json({ token });
    } else {
      res.status(401).json({ message: "Invalid credentials" });
    }
  } finally {
    await connection.end();
  }
});

app.post("/partners", async (req, res) => {
  const { name, email, password, company_name } = req.body;

  const connection = await createConnection();

  try {
    const createdAt = new Date();
    const hashedPassword = bcrypt.hashSync(password, 10);

    const [userResult] = await connection.execute<mysql.ResultSetHeader>(
      "INSERT INTO users (name,email,password,created_at) VALUES (?,?,?,?)",
      [name, email, hashedPassword, createdAt],
    );

    const userId = userResult.insertId;

    const [partnerResult] = await connection.execute<mysql.ResultSetHeader>(
      "INSERT INTO  partners (user_id, company_name, created_at) VALUES (?,?,?)",
      [userId, company_name, createdAt],
    );
    res.status(201).json({
      id: partnerResult.insertId,
      name,
      user_id: userId,
      company_name,
      created_at: createdAt,
    });
  } finally {
    await connection.end();
  }
});

app.get("/partners/events", (req, res) => {});

app.get("/partners/events/:eventId", (req, res) => {
  const { eventId } = req.params;
  console.log(eventId);
  res.send();
});

app.post("/customers", async (req, res) => {
  const { name, email, password, address, phone } = req.body;

  const connection = await createConnection();

  try {
    const createdAt = new Date();
    const hashedPassword = bcrypt.hashSync(password, 10);

    const [userResult] = await connection.execute<mysql.ResultSetHeader>(
      "INSERT INTO users (name,email,password,created_at) VALUES (?,?,?,?)",
      [name, email, hashedPassword, createdAt],
    );

    const userId = userResult.insertId;

    const [customersResult] = await connection.execute<mysql.ResultSetHeader>(
      "INSERT INTO  customers (user_id, address, phone, created_at) VALUES (?,?,?,?)",
      [userId, address, phone, createdAt],
    );
    res.status(201).json({
      id: customersResult.insertId,
      user_id: userId,
      name,
      address,
      phone: phone,
      created_at: createdAt,
    });
  } finally {
    await connection.end();
  }
});

app.post("/events", (req, res) => {
  const { name, description, date, address, phone } = req.body;
});

app.get("/events", (req, res) => {});

app.get("/events/:eventId", (req, res) => {
  const { eventId } = req.params;
  console.log(eventId);
  res.send();
});

app.listen(port, async () => {
  const connection = await createConnection();
  await connection.execute("SET FOREIGN_KEY_CHECKS = 0");
  await connection.execute("TRUNCATE TABLE events");
  await connection.execute("TRUNCATE TABLE customers");
  await connection.execute("TRUNCATE TABLE partners");
  await connection.execute("TRUNCATE TABLE users");
  await connection.execute("SET FOREIGN_KEY_CHECKS = 1");
  console.log(`Server is running on port ${port}`);
});
