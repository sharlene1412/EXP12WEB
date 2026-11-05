
import express from "express";
import { MongoClient, ObjectId } from "mongodb";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
    path: path.join(__dirname, ".env")
});

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    console.log("MongoDB URL not found in .env");
    process.exit(1);
}

const client = new MongoClient(MONGO_URI);
let db;

// Home route
app.get("/", (req, res) => {
    res.send("FreshMart Backend Running Successfully!");
});

// GET all products
app.get("/api/products", async (req, res) => {
    try {
        const products = await db.collection("products")
            .find({})
            .toArray();

        res.json(products);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ADD product
app.post("/api/products", async (req, res) => {
    try {
        const result = await db.collection("products")
            .insertOne(req.body);

        res.status(201).json({
            message: "Product added successfully",
            id: result.insertedId
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// UPDATE product
app.put("/api/products/:id", async (req, res) => {
    try {
        if (!ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: "Invalid ID" });
        }

        const result = await db.collection("products").updateOne(
            { _id: new ObjectId(req.params.id) },
            { $set: req.body }
        );

        res.json({
            message: "Product updated",
            modifiedCount: result.modifiedCount
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// DELETE product
app.delete("/api/products/:id", async (req, res) => {
    try {
        if (!ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: "Invalid ID" });
        }

        const result = await db.collection("products").deleteOne({
            _id: new ObjectId(req.params.id)
        });

        res.json({
            message: "Product deleted",
            deletedCount: result.deletedCount
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// USER REGISTRATION
app.post("/api/users/register", async (req, res) => {
    try {
        const { name, email, password, mobile } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                message: "Please fill all required fields"
            });
        }

        const users = db.collection("users");

        const existing = await users.findOne({ email });

        if (existing) {
            return res.status(409).json({
                message: "Email already registered"
            });
        }

        const result = await users.insertOne({
            name,
            email,
            password,
            mobile: mobile || "",
            createdAt: new Date()
        });

        res.status(201).json({
            message: "Registration successful",
            userId: result.insertedId
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// SAVE ORDER
app.post("/api/orders", async (req, res) => {
    try {
        const result = await db.collection("orders").insertOne({
            ...req.body,
            createdAt: new Date(),
            paymentStatus: "Demo"
        });

        res.status(201).json({
            message: "Order saved successfully",
            orderId: result.insertedId
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET ORDERS
app.get("/api/orders", async (req, res) => {
    try {
        const orders = await db.collection("orders")
            .find({})
            .sort({ createdAt: -1 })
            .toArray();

        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// CONNECT DATABASE AND START SERVER
async function startServer() {
    try {
        await client.connect();

        db = client.db("FreshMart");

        console.log("MongoDB Connected Successfully!");

        app.listen(PORT, () => {
            console.log(`FreshMart running at http://localhost:${PORT}`);
        });

    } catch (err) {
        console.error("MongoDB Connection Error:", err.message);
        process.exit(1);
    }
}

startServer();
