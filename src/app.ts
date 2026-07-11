import express from "express";

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

app.post("/customers", (req, res) => {
  const { name, email, password, address, telefone } = req.body;
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
