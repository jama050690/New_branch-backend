import express from "express";
import cors from "cors";
import { readFile } from "node:fs/promises";
import sha1 from "sha1";

const users = JSON.parse(await readFile("./users.json", "utf8"));

const PORT = process.env.PORT || 3000;
const app = express();

app.use(express.json());
app.use(cors());

app.post("/login", (req, res) => {
  let { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .send({ message: "`username` and `password` must include body" });
  }

  username = username.trim();

  if (!users[username]) {
    return res.status(401).send({ message: `${username} not found` });
  }

  const user = users[username];
  const hashedPassword = sha1(String(password));

  console.log("RAW password:", JSON.stringify(password));
  console.log("LENGTH:", password.length);
  console.log(
    "CODES:",
    [...password].map((c) => c.charCodeAt(0)),
  );
  console.log("Input hash :", hashedPassword);
  console.log("Stored hash:", user.password);

  if (user.password !== hashedPassword) {
    return res.status(401).send({ message: "Wrong password" });
  }

  res.send({ ok: true });
});

app.listen(PORT, () => console.log(`Server running on ${PORT}`));
