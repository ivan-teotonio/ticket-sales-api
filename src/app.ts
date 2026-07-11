import express from "express";
import * as mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const port = process.env.PORT || 3000;

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Hello world!" });
});

app.post("/auth/login", (req, res) => {
  const { email, password } = req.body;
  res.send();
});

app.post("/partners", (req, res) => {
  const { name, email, password, company_name } = req.body;
});

app.get("/partners/events", (req, res) => {});

app.get("/partners/events/:eventId", (req, res) => {
  const { eventId } = req.params;
  console.log(eventId);
  res.send();
});

app.post("/customers", (req, res) => {
  const { name, email, password, address, telefone } = req.body;
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

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
