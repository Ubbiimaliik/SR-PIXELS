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

// Specific route for /products
app.get("/products", (req, res) => {
  res.sendFile(path.join(__dirname, "../products.html"));
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
  name: { type: String, required: true },
  coverPhotoId: { type: mongoose.Schema.Types.ObjectId, ref: 'PortfolioImage' }
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

const ContentImageSchema = new mongoose.Schema({
  key: { type: String, unique: true },
  image: Buffer,
  contentType: String
});
const ContentImage = mongoose.model("ContentImage", ContentImageSchema);

const ProductSchema = new mongoose.Schema({
  title: String,
  desc: String,
  category: String,
  badge: String,
  image: Buffer,
  contentType: String
});
const Product = mongoose.model("Product", ProductSchema);

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
  // Home Page Content
  const existingHome = await Content.findOne({ key: "pageContent" });
  if (!existingHome) {
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

  // Product Page Content
  const existingProduct = await Content.findOne({ key: "productContent" });
  if (!existingProduct) {
    await Content.create({
      key: "productContent",
      data: {
        heroTitle: "PRINT<br/><span class=\"headline-accent flicker-text\" style=\"color: var(--orange); text-shadow: 0 0 20px var(--orange-glow-strong);\">BRAND</span><br/>STAND OUT",
        heroSub: "High-fidelity printing and corporate branding solutions designed for businesses that demand precision and professional execution.",
        featuredTitle: "Featured Solutions",
        featuredLargeTitle: "Corporate Signage",
        featuredLargeDesc: "High-visibility 3D lettering and illuminated signs designed to make your storefront stand out.",
        featuredSmall1Title: "Vehicle Wraps",
        featuredSmall1Tag: "MOBILE ADVERTISING",
        featuredSmall2Title: "Offset Printing",
        featuredSmall2Tag: "BULK MEDIA",
        collectionTitle: "PRINTING & BRANDING COLLECTION",
        collectionDesc: "Elevate your corporate identity with our comprehensive suite of printing and branding materials, engineered for uncompromising quality.",
        catalogTitle: "Our Products",
        ctaTitle: "Need custom solutions?",
        ctaDesc: "Our team can design and produce bespoke materials that perfectly align with your brand requirements and specifications."
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
    if (!username || !password) return res.status(400).json({ error: "Username and password required" });
    const existing = await User.findOne({ username });
    if (existing) return res.status(400).json({ error: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashedPassword });
    await user.save();

    res.json({ message: "User created successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ error: "Invalid credentials" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ error: "Invalid credentials" });

    // Return a simple session string instead of JWT
    res.json({ token: `session-${user.username}-${Date.now()}`, message: "Logged in successfully" });
  } catch (err) {
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

// Get all portfolio folders with their cover photo ID
app.get("/api/folders", async (req, res) => {
  try {
    const folders = await PortfolioFolder.find({});
    // For each folder, if coverPhotoId is null, try to find the first image
    const foldersWithDefaults = await Promise.all(folders.map(async (f) => {
      let coverId = f.coverPhotoId;
      if (!coverId) {
        const firstImg = await PortfolioImage.findOne({ folderId: f._id }).sort({ _id: 1 });
        if (firstImg) coverId = firstImg._id;
      }
      return { ...f.toObject(), coverPhotoId: coverId };
    }));
    res.json(foldersWithDefaults);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update folder cover photo
app.patch("/api/folders/:id/cover", authenticateToken, async (req, res) => {
  try {
    const { coverPhotoId } = req.body;
    await PortfolioFolder.findByIdAndUpdate(req.params.id, { coverPhotoId });
    res.json({ message: "Cover photo updated" });
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

// --- PRODUCT PAGE ENDPOINTS ---

// Get product page content
app.get("/api/products-content", async (req, res) => {
  try {
    const content = await Content.findOne({ key: "productContent" });
    res.json(content ? content.data : {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update product page content
app.post("/api/products-content", authenticateToken, async (req, res) => {
  try {
    const { data } = req.body;
    await Content.findOneAndUpdate({ key: "productContent" }, { data }, { upsert: true });
    res.json({ message: "Product content updated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all products
app.get("/api/products", async (req, res) => {
  try {
    const { category } = req.query;
    const query = category && category !== "all" ? { category } : {};
    const products = await Product.find(query, { image: 0 }); // Exclude image buffer
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single product image
app.get("/api/products/:id/image", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product || !product.image) return res.status(404).send("Not found");
    res.set("Content-Type", product.contentType);
    res.send(product.image);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Upload/Create product
app.post("/api/products", authenticateToken, upload.single("image"), async (req, res) => {
  try {
    const { title, desc, category, badge } = req.body;
    const newProduct = new Product({
      title,
      desc,
      category,
      badge,
      image: req.file ? req.file.buffer : null,
      contentType: req.file ? req.file.mimetype : null
    });
    await newProduct.save();
    res.json({ message: "Product created", id: newProduct._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete product
app.delete("/api/products/:id", authenticateToken, async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: "Product deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- CONTENT IMAGE ENDPOINTS ---

// Get content image by key
app.get("/api/content-images/:key", async (req, res) => {
  try {
    const img = await ContentImage.findOne({ key: req.params.key });
    if (!img || !img.image) return res.status(404).send("Not found");
    res.set("Content-Type", img.contentType);
    res.send(img.image);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Upload/Update content image
app.post("/api/content-images/:key", authenticateToken, upload.single("image"), async (req, res) => {
  try {
    const { key } = req.params;
    const update = {
      image: req.file.buffer,
      contentType: req.file.mimetype
    };
    await ContentImage.findOneAndUpdate({ key }, update, { upsert: true });
    res.json({ message: "Content image updated", key });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
