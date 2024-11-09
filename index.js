const express = require('express');
const app = express();
const cors = require("cors");
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173'],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.lqama.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// JWT verification middleware
const verifyToken = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) return res.status(403).send({ success: false, message: "No token provided" });
  
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) return res.status(401).send({ success: false, message: "Failed to authenticate token" });
    req.user = decoded;
    next();
  });
};

async function run() {
  try {
    await client.connect();
    const db = client.db("aredb");
    const userCollection = db.collection("users");
    const locationCollection = db.collection("locations");
    const teacherCollection = db.collection("teachers");

    // JWT endpoint
    app.post('/jwt', async (req, res) => {
      const user = req.body;
      try {
        const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
        res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'none' })
          .send({ success: true });
      } catch (error) {
        console.error("JWT Error:", error.message);
        res.status(500).send({ success: false, message: "JWT generation failed" });
      }
    });

    // Create user endpoint
    app.post('/users', async (req, res) => {
      const user = req.body;
      try {
        const query = { email: user.email };
        const existingUser = await userCollection.findOne(query);
        if (existingUser) {
          return res.send({ success: false, message: 'User already exists' });
        }
        const result = await userCollection.insertOne(user);
        res.send({ success: true, data: result });
      } catch (error) {
        console.error("Error creating user:", error.message);
        res.status(500).send({ success: false, message: "User creation failed" });
      }
    });

    // Locations endpoint
    app.get('/locations', async (req, res) => {
      try {
        const result = await locationCollection.find().toArray();
        res.send({ success: true, data: result });
      } catch (error) {
        console.error("Error fetching locations:", error.message);
        res.status(500).send({ success: false, message: "Failed to fetch locations" });
      }
    });

    // Teacher endpoint with JWT protection
    app.post('/teacher', verifyToken, async (req, res) => {
      try {
        const result = await teacherCollection.find().toArray();
        res.send({ success: true, data: result });
      } catch (error) {
        console.error("Error fetching teachers:", error.message);
        res.status(500).send({ success: false, message: "Failed to fetch teachers" });
      }
    });

    console.log("Connected to MongoDB successfully!");
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('aRe server is ready');
});

app.listen(port, () => {
  console.log(`aRe server is running on ${port}`);
});
