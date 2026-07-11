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

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
