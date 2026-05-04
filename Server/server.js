require("dotenv").config({ path: "../.env.local" });
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const bcrypt = require("bcrypt");
const path = require("path");

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ limit: "20mb", extended: true }));
// Serve static files from the parent directory
app.use(express.static("../"));

// Specific route for /admin
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "../admin.html"));
});

// Handle cases where /admin is appended to index.html
app.get("/index.html/admin", (req, res) => {
  res.redirect("/admin");
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/srp")
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Schemas
const ContentSchema = new mongoose.Schema({
  key: { type: String, unique: true },
  data: mongoose.Schema.Types.Mixed
});
const Content = mongoose.model("Content", ContentSchema);

const PortfolioFolderSchema = new mongoose.Schema({
  name: { type: String, required: true }
});
const PortfolioFolder = mongoose.model("PortfolioFolder", PortfolioFolderSchema);

const PortfolioImageSchema = new mongoose.Schema({
  name: String,
  image: Buffer,
  contentType: String,
  folderId: { type: mongoose.Schema.Types.ObjectId, ref: 'PortfolioFolder' }
});
const PortfolioImage = mongoose.model("PortfolioImage", PortfolioImageSchema);

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});
const User = mongoose.model("User", UserSchema);

// Multer setup for in-memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Auth Middleware (Simplified, no JWT)
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  // Basic check for session-based token (mocked for this session)
  if (!token || token === "null" || token === "undefined") {
    return res.status(401).json({ error: "Access denied. Login required." });
  }
  next();
};

// Initialize Default Content
const initializeContent = async () => {
  const existing = await Content.findOne({ key: "pageContent" });
  if (!existing) {
    await Content.create({
      key: "pageContent",
      data: {
        tickerText: "",
        servicesTitle: "",
        servicesBannerTitle: "",
        servicesBannerSub: "",
        services: [],
        portfolioTitle: "",
        portfolioSub: "",
        reviewsTitle: "",
        reviewsSub: "",
        reviews: [],
        contactTitle: "",
        contactSub: "",
        names: [],
        phones: [],
        locations: [],
        emails: [],
        directProtocolTitle: "",
        directProtocolDesc: "",
        directProtocolBtn: ""
      }
    });
  }
};
initializeContent();

// API Endpoints

// Auth Endpoints
app.post("/api/auth/signup", async (req, res) => {
  try {
    const { username, password } = req.body;
    if(!username || !password) return res.status(400).json({ error: "Username and password required" });
    const existing = await User.findOne({ username });
    if(existing) return res.status(400).json({ error: "User already exists" });
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashedPassword });
    await user.save();
    
    res.json({ message: "User created successfully" });
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if(!user) return res.status(400).json({ error: "Invalid credentials" });
    
    const valid = await bcrypt.compare(password, user.password);
    if(!valid) return res.status(400).json({ error: "Invalid credentials" });
    
    // Return a simple session string instead of JWT
    res.json({ token: `session-${user.username}-${Date.now()}`, message: "Logged in successfully" });
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});

// Get page content
app.get("/api/content", async (req, res) => {
  try {
    const content = await Content.findOne({ key: "pageContent" });
    res.json(content ? content.data : {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update page content
app.post("/api/content", authenticateToken, async (req, res) => {
  try {
    const { data } = req.body;
    await Content.findOneAndUpdate({ key: "pageContent" }, { data }, { upsert: true });
    res.json({ message: "Content updated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all portfolio folders
app.get("/api/folders", async (req, res) => {
  try {
    const folders = await PortfolioFolder.find({});
    res.json(folders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a portfolio folder
app.post("/api/folders", authenticateToken, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "Folder name required" });
    const folder = new PortfolioFolder({ name });
    await folder.save();
    res.json(folder);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a portfolio folder and its images
app.delete("/api/folders/:id", authenticateToken, async (req, res) => {
  try {
    await PortfolioImage.deleteMany({ folderId: req.params.id });
    await PortfolioFolder.findByIdAndDelete(req.params.id);
    res.json({ message: "Folder and its images deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get portfolio images (optionally filtered by folderId)
app.get("/api/portfolio", async (req, res) => {
  try {
    const { folderId } = req.query;
    const query = folderId ? { folderId } : {};
    const images = await PortfolioImage.find(query, { image: 0 }); // Exclude image buffer
    res.json(images);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single portfolio image data
app.get("/api/portfolio/:id/image", async (req, res) => {
  try {
    const image = await PortfolioImage.findById(req.params.id);
    if (!image || !image.image) return res.status(404).send("Not found");
    res.set("Content-Type", image.contentType);
    res.send(image.image);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Upload portfolio image
app.post("/api/portfolio", authenticateToken, upload.single("image"), async (req, res) => {
  try {
    const { name, folderId } = req.body;
    const newImage = new PortfolioImage({
      name,
      image: req.file.buffer,
      contentType: req.file.mimetype,
      folderId
    });
    await newImage.save();
    res.json({ message: "Image uploaded", id: newImage._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete portfolio image
app.delete("/api/portfolio/:id", authenticateToken, async (req, res) => {
  try {
    await PortfolioImage.findByIdAndDelete(req.params.id);
    res.json({ message: "Image deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
