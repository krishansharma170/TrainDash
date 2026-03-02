import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

const db = new Database("training.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    role TEXT NOT NULL, -- 'ADMIN', 'TRAINER', 'MANAGER', 'TRAINEE'
    manager_id INTEGER,
    FOREIGN KEY(manager_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS trainings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    topic TEXT NOT NULL,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    venue TEXT NOT NULL,
    trainer_id INTEGER,
    status TEXT DEFAULT 'PLANNED', -- 'PLANNED', 'ONGOING', 'COMPLETED', 'CANCELLED'
    max_seats INTEGER DEFAULT 20,
    FOREIGN KEY(trainer_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS nominations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    training_id INTEGER,
    trainee_id INTEGER,
    manager_id INTEGER,
    status TEXT DEFAULT 'NOMINATED', -- 'NOMINATED', 'APPROVED', 'REJECTED', 'ATTENDED'
    FOREIGN KEY(training_id) REFERENCES trainings(id),
    FOREIGN KEY(trainee_id) REFERENCES users(id),
    FOREIGN KEY(manager_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS materials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    training_id INTEGER,
    filename TEXT NOT NULL,
    original_name TEXT NOT NULL,
    mimetype TEXT NOT NULL,
    size INTEGER NOT NULL,
    uploaded_by INTEGER,
    upload_date TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(training_id) REFERENCES trainings(id),
    FOREIGN KEY(uploaded_by) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    training_id INTEGER,
    trainee_id INTEGER,
    topic_score INTEGER CHECK(topic_score BETWEEN 1 AND 5),
    trainer_score INTEGER CHECK(trainer_score BETWEEN 1 AND 5),
    usefulness_score INTEGER CHECK(usefulness_score BETWEEN 1 AND 5),
    comments TEXT,
    submitted_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(training_id) REFERENCES trainings(id),
    FOREIGN KEY(trainee_id) REFERENCES users(id)
  );
`);

// Seed Initial Data if empty
const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get() as { count: number };
if (userCount.count === 0) {
  const insertUser = db.prepare("INSERT INTO users (name, role, manager_id) VALUES (?, ?, ?)");
  
  // Admin & Trainer (User)
  const adminInfo = insertUser.run("Vikash (Admin/Trainer)", "ADMIN", null);
  const trainerId = adminInfo.lastInsertRowid;
  
  // Managers
  const manager1Info = insertUser.run("Alice (Manager)", "MANAGER", null);
  const manager2Info = insertUser.run("Bob (Manager)", "MANAGER", null);
  
  // Trainees
  insertUser.run("Charlie (Trainee)", "TRAINEE", manager1Info.lastInsertRowid);
  insertUser.run("Diana (Trainee)", "TRAINEE", manager1Info.lastInsertRowid);
  insertUser.run("Eve (Trainee)", "TRAINEE", manager2Info.lastInsertRowid);
  insertUser.run("Frank (Trainee)", "TRAINEE", manager2Info.lastInsertRowid);

  // Seed some trainings
  const insertTraining = db.prepare("INSERT INTO trainings (title, topic, date, time, venue, trainer_id, status, max_seats) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
  insertTraining.run("React Fundamentals", "Frontend Development", "2026-03-10", "10:00 AM - 02:00 PM", "Room A", trainerId, "PLANNED", 20);
  insertTraining.run("Advanced TypeScript", "Frontend Development", "2026-03-15", "02:00 PM - 05:00 PM", "Room B", trainerId, "PLANNED", 15);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- API ROUTES ---

  // Users
  app.get("/api/users", (req, res) => {
    const users = db.prepare("SELECT * FROM users").all();
    res.json(users);
  });

  app.get("/api/users/:id", (req, res) => {
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.params.id);
    if (user) res.json(user);
    else res.status(404).json({ error: "User not found" });
  });

  app.get("/api/users/role/:role", (req, res) => {
    const users = db.prepare("SELECT * FROM users WHERE role = ?").all(req.params.role);
    res.json(users);
  });

  app.get("/api/managers/:id/team", (req, res) => {
    const team = db.prepare("SELECT * FROM users WHERE manager_id = ?").all(req.params.id);
    res.json(team);
  });

  // Trainings
  app.get("/api/trainings", (req, res) => {
    const trainings = db.prepare(`
      SELECT t.*, u.name as trainer_name 
      FROM trainings t 
      LEFT JOIN users u ON t.trainer_id = u.id
      ORDER BY t.date ASC
    `).all();
    res.json(trainings);
  });

  app.post("/api/trainings", (req, res) => {
    const { title, topic, date, time, venue, trainer_id, max_seats } = req.body;
    const stmt = db.prepare("INSERT INTO trainings (title, topic, date, time, venue, trainer_id, max_seats) VALUES (?, ?, ?, ?, ?, ?, ?)");
    const info = stmt.run(title, topic, date, time, venue, trainer_id, max_seats || 20);
    res.json({ id: info.lastInsertRowid });
  });

  app.put("/api/trainings/:id/status", (req, res) => {
    const { status } = req.body;
    const stmt = db.prepare("UPDATE trainings SET status = ? WHERE id = ?");
    stmt.run(status, req.params.id);
    res.json({ success: true });
  });

  // Nominations
  app.get("/api/trainings/:id/nominations", (req, res) => {
    const nominations = db.prepare(`
      SELECT n.*, u.name as trainee_name, m.name as manager_name
      FROM nominations n
      JOIN users u ON n.trainee_id = u.id
      JOIN users m ON n.manager_id = m.id
      WHERE n.training_id = ?
    `).all(req.params.id);
    res.json(nominations);
  });

  app.get("/api/users/:id/nominations", (req, res) => {
    const nominations = db.prepare(`
      SELECT n.*, t.title, t.date, t.time, t.venue, t.status as training_status
      FROM nominations n
      JOIN trainings t ON n.training_id = t.id
      WHERE n.trainee_id = ?
    `).all(req.params.id);
    res.json(nominations);
  });

  app.post("/api/nominations", (req, res) => {
    const { training_id, trainee_id, manager_id } = req.body;
    
    // Check if already nominated
    const existing = db.prepare("SELECT * FROM nominations WHERE training_id = ? AND trainee_id = ?").get(training_id, trainee_id);
    if (existing) {
      return res.status(400).json({ error: "Already nominated" });
    }

    const stmt = db.prepare("INSERT INTO nominations (training_id, trainee_id, manager_id) VALUES (?, ?, ?)");
    const info = stmt.run(training_id, trainee_id, manager_id);
    res.json({ id: info.lastInsertRowid });
  });

  app.delete("/api/nominations/:id", (req, res) => {
    const stmt = db.prepare("DELETE FROM nominations WHERE id = ?");
    stmt.run(req.params.id);
    res.json({ success: true });
  });

  // Materials
  app.post("/api/trainings/:id/materials", upload.single("file"), (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    const { id } = req.params;
    const { uploaded_by } = req.body;
    
    const stmt = db.prepare("INSERT INTO materials (training_id, filename, original_name, mimetype, size, uploaded_by) VALUES (?, ?, ?, ?, ?, ?)");
    const info = stmt.run(id, req.file.filename, req.file.originalname, req.file.mimetype, req.file.size, uploaded_by);
    res.json({ id: info.lastInsertRowid });
  });

  app.get("/api/trainings/:id/materials", (req, res) => {
    const materials = db.prepare("SELECT * FROM materials WHERE training_id = ?").all(req.params.id);
    res.json(materials);
  });

  app.get("/api/materials/:id/download", (req, res) => {
    const material = db.prepare("SELECT * FROM materials WHERE id = ?").get(req.params.id) as any;
    if (!material) return res.status(404).json({ error: "Material not found" });
    
    const filePath = path.join(uploadsDir, material.filename);
    res.download(filePath, material.original_name);
  });

  // Feedback
  app.post("/api/trainings/:id/feedback", (req, res) => {
    const { trainee_id, topic_score, trainer_score, usefulness_score, comments } = req.body;
    const { id } = req.params;

    const existing = db.prepare("SELECT * FROM feedback WHERE training_id = ? AND trainee_id = ?").get(id, trainee_id);
    if (existing) return res.status(400).json({ error: "Feedback already submitted" });

    const stmt = db.prepare("INSERT INTO feedback (training_id, trainee_id, topic_score, trainer_score, usefulness_score, comments) VALUES (?, ?, ?, ?, ?, ?)");
    const info = stmt.run(id, trainee_id, topic_score, trainer_score, usefulness_score, comments);
    res.json({ id: info.lastInsertRowid });
  });

  app.get("/api/trainings/:id/feedback", (req, res) => {
    const feedback = db.prepare(`
      SELECT f.*, u.name as trainee_name
      FROM feedback f
      JOIN users u ON f.trainee_id = u.id
      WHERE f.training_id = ?
    `).all(req.params.id);
    res.json(feedback);
  });

  // Analytics
  app.get("/api/analytics", (req, res) => {
    const statusCounts = db.prepare("SELECT status, COUNT(*) as count FROM trainings GROUP BY status").all();
    
    const topicScores = db.prepare(`
      SELECT t.topic, 
             AVG(f.topic_score) as avg_topic_score, 
             AVG(f.usefulness_score) as avg_usefulness_score
      FROM trainings t
      JOIN feedback f ON t.id = f.training_id
      GROUP BY t.topic
    `).all();

    const trainerScores = db.prepare(`
      SELECT u.name as trainer_name, AVG(f.trainer_score) as avg_trainer_score
      FROM trainings t
      JOIN feedback f ON t.id = f.training_id
      JOIN users u ON t.trainer_id = u.id
      GROUP BY t.trainer_id
    `).all();

    const popularTopics = db.prepare(`
      SELECT t.topic, COUNT(n.id) as nomination_count
      FROM trainings t
      LEFT JOIN nominations n ON t.id = n.training_id
      GROUP BY t.topic
      ORDER BY nomination_count DESC
      LIMIT 5
    `).all();

    res.json({ statusCounts, topicScores, trainerScores, popularTopics });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
