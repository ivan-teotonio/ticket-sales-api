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

app.post("/events", (req, res) => {
  const { name, description, date, address, phone } = req.body;
});

app.get("/events", (req, res) => {});

app.get("/events/:eventId", (req, res) => {
  const { eventId } = req.params;
  console.log(eventId);
  res.send();
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
