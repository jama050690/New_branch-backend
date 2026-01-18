import express from "express";
import cors from "cors";
import { readFile, writeFile } from "node:fs/promises";
import sha1 from "sha1";
import path from "path";
import multer from "multer";
import { fileURLToPath } from "url";

const PORT = 3000;
const app = express();

// ================= MIDDLEWARE =================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ================= __dirname =================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ================= VIEW ENGINE (EJS) =================
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "src/views"));

// ================= STATIC =================
app.use("/public", express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ================= MULTER =================
const storage = multer.diskStorage({
  destination: path.join(__dirname, "uploads"),
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// ================= USERS =================
const USERS_FILE = path.join(__dirname, "users.json");

async function readUsers() {
  return JSON.parse(await readFile(USERS_FILE, "utf8"));
}

async function saveUsers(users) {
  await writeFile(USERS_FILE, JSON.stringify(users, null, 2));
}

// ================= PAGES =================
app.get("/", (req, res) => res.redirect("/login"));

app.get("/signup", (req, res) => {
  res.render("signup", { error: null });
});

// ================= LOGIN =================
app.get("/login", (req, res) => {
  res.render("login", { error: null });
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const users = await readUsers();
  const user = users[email?.toLowerCase()];

  if (!user) {
    return res.render("login", {
      error: "User not found",
      user: null,
    });
  }

  if (user.password !== sha1(password)) {
    return res.render("login", {
      error: "Wrong password",
      user: null,
    });
  }

  res.send("Login success");
});

// ================= SIGNUP =================
app.post("/signup", upload.single("profile_picture"), async (req, res) => {
  const { name, email, age, password, gender } = req.body;

  if (!name || !email || !password || !gender || !req.file) {
    return res.render("signup", {
      error: "All fields including image are required",
      user: null, // MUHIM
    });
  }

  const users = await readUsers();
  const key = email.toLowerCase();

  if (users[key]) {
    return res.render("signup", {
      error: "User already exists",
      user: null,
    });
  }

  //  RASMNI BASE64 QILISH
  const imageBase64 = req.file.buffer.toString("base64");
  const mimeType = req.file.mimetype;

  users[key] = {
    name,
    age,
    gender,
    password: sha1(password),

    profile_picture: {
      mimeType,
      data: imageBase64,
    },
  };

  await saveUsers(users);
  res.redirect("/login");
});

// ================= LOGIN =================
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const users = await readUsers();
  const user = users[email?.toLowerCase()];

  if (!user) {
    return res.render("login", { error: "User not found" });
  }

  if (user.password !== sha1(password)) {
    return res.render("login", { error: "Wrong password" });
  }

  res.send("Login success ");
});

// ================= START =================
app.listen(PORT, () => {
  console.log(` Server running: http://localhost:${PORT}`);
});
