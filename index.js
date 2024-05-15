const express = require("express");
const cors = require("cors");
const app = express();
require("dotenv").config();
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const port = process.env.PORT || 5000;

//middleware

app.use(
  cors({
    origin: ["http://localhost:5173", "https://bdstudylab.netlify.app"],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.cauvj2c.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
const cookieOptions = {
  httpOnly: true,
  // secure: process.env.NODE_ENV === "production" ? true : false,
  // sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
};

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    const itemsCollection = client.db("studyLab").collection("assignments");
    const itemsAttemptedCollection = client
      .db("studyLab")
      .collection("attempted");

    app.get("/items", async (req, res) => {
      const cursor = itemsCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });
    app.get("/items/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await itemsCollection.findOne(query);
      res.send(result);
    });
    app.put("/items/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedItems = req.body;
      const items = {
        $set: {
          image: updatedItems.image,
          item_title: updatedItems.item_title,
          category: updatedItems.category,
          description: updatedItems.description,
          marks: updatedItems.marks,

          userImg: updatedItems.userImg,
          dueDate: updatedItems.dueDate,
        },
      };
      const result = await itemsCollection.updateOne(filter, items);
      res.send(result);
    });
    app.post("/items", async (req, res) => {
      const newitems = req.body;
      console.log(newitems);
      const result = await itemsCollection.insertOne(newitems);
      res.send(result);
    });
    app.delete("/items/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await itemsCollection.deleteOne(query);
      res.send(result);
    });

    //attempted related api

    app.get("/attemptedItems", async (req, res) => {
      const cursor = itemsAttemptedCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.post("/attemptedItems", async (req, res) => {
      const newitems = req.body;
      console.log(newitems);
      const result = await itemsAttemptedCollection.insertOne(newitems);
      res.send(result);
    });
    //auth related api
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      console.log("user for token", user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1hr",
      });
      res.cookie("token", token, cookieOptions);
      res.send({ success: true });
    });

    app.post("/logout", async (req, res) => {
      const user = req.body;
      console.log("loging out", user);
      res
        .clearCookie("token", { ...cookieOptions, maxAge: 0 })
        .send({ success: true });
    });

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("server is running successfully");
});
app.listen(port, () => {
  console.log(`server is running on port :${port}`);
});
