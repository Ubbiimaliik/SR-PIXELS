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

const PortfolioImageSchema = new mongoose.Schema({
  name: String,
  image: Buffer,
  contentType: String
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
        tickerText: "◆ PRINTING SOLUTIONS — High-Resolution Output Protocols ◆ BRANDING & ADVERTISING — Strategic Visual Deployment ◆ DIGITAL & WEB — Interactive UI/UX Engineering ◆ GOVT & CORPORATE — Institutional Grade Compliance ◆ 500+ PROJECTS DEPLOYED ◆ 8+ YEARS ACTIVE ◆ SR PIXELS — EXCELLENCE WITH PERFECTION",
        servicesTitle: "Our Services",
        servicesBannerTitle: "What We Offer",
        servicesBannerSub: "Explore our comprehensive range of services tailored to elevate your brand.",
        services: [
          { id: "svc-print", title: "PRINTING SOLUTIONS", desc: "High-quality printing services including wide format, offset, and digital printing on premium materials.", btnText: "LEARN MORE" },
          { id: "svc-brand", title: "BRANDING & ADVERTISING", desc: "Strategic visual identity and advertising campaigns designed to maximize your brand's market presence.", btnText: "LEARN MORE" },
          { id: "svc-govt", title: "GOVT & CORPORATE", desc: "Secure, standardized communication and visual asset management tailored for large-scale organizations.", btnText: "LEARN MORE" },
          { id: "svc-digital", title: "DIGITAL & WEB", desc: "Interactive websites and digital experiences built with engaging user interfaces and seamless functionality.", btnText: "LEARN MORE" },
          { id: "svc-event", title: "EVENT MANAGEMENT", desc: "End-to-end event planning, coordination, and execution to deliver memorable brand experiences.", btnText: "LEARN MORE" }
        ],
        portfolioTitle: "Our Portfolio",
        portfolioSub: "A showcase of our recent projects and successful brand deployments.",
        reviewsTitle: "Client Reviews",
        reviewsSub: "What our partners say about our work and commitment to excellence.",
        reviews: [
          { stars: "★★★★★", text: "\"SR Pixels transformed our brand identity completely. Their attention to detail and precision is unmatched in the industry.\"", author: "- Omni Corp" },
          { stars: "★★★★★", text: "\"The digital hoarding they installed for us is visually stunning. Excellent communication and flawless execution.\"", author: "- Defense Initiative" },
          { stars: "★★★★★", text: "\"A highly professional team. They handled our entire corporate compliance documentation with utmost security and design flair.\"", author: "- Nexus Core" },
          { stars: "★★★★★", text: "\"Our interactive web application was delivered on time and exceeded all our expectations. Highly recommended.\"", author: "- Vanguard Systems" }
        ],
        contactTitle: "Contact Us",
        contactSub: "Get in touch with our team to start your next project.",
        contactInfo: {
          name: "Satyam Rajput / Abhishek",
          phone: "+91 9876543210",
          location: "SECTOR_7G<br/>NEO_TOKYO_HUB",
          email: "UPLINK@SRPIXELS.SYS"
        },
        directProtocolTitle: "Connect With us",
        directProtocolDesc: "Require immediate bandwidth? Initiate direct encrypted comms via WhatsApp.",
        directProtocolBtn: "INITIATE_WA_CHAT"
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

// Get portfolio images metadata
app.get("/api/portfolio", async (req, res) => {
  try {
    const images = await PortfolioImage.find({}, { image: 0 }); // Exclude image buffer
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
    const { name } = req.body;
    const newImage = new PortfolioImage({
      name,
      image: req.file.buffer,
      contentType: req.file.mimetype
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
