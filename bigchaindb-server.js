import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import axios from "axios";
import bip39 from "bip39";
import mongoose from "mongoose";

// Import bigchaindb-driver correctly
import bigchaindb from "bigchaindb-driver";
const { Ed25519Keypair, Transaction, Connection } = bigchaindb;

const app = express();
const PORT = 5001;
const API_PATH = "http://localhost:9984/api/v1/";
const MONGO_URI = "mongodb+srv://bhasvanth02:ETI4J117BbADbKlO@cluster0.mhe0l.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

app.use(cors());
app.use(bodyParser.json());

const conn = new Connection(API_PATH);

// Connect to MongoDB
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ Connected to MongoDB"))
.catch((err) => console.error("❌ MongoDB Connection Error:", err));

// User Schema
const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  password: String,
  role: String,
  transactionIds: [String], // Array of Transaction IDs
});

const User = mongoose.model("User", userSchema);

// Function to generate a keypair
const generateKeypair = () => {
  const seed = bip39.mnemonicToSeedSync(bip39.generateMnemonic());
  return new Ed25519Keypair(seed.slice(0, 32));
};

const keypair = generateKeypair();

// Store Prediction
app.post("/store-prediction", async (req, res) => {
  try {
    const { patientData, prediction, probability } = req.body;
    console.log("🔄 Storing Prediction in BigchainDB...");

    const assetData = {
      data: { type: "heart_disease_prediction", patientData, prediction, probability },
    };

    const metadata = { timestamp: new Date().toISOString() };

    const txCreate = Transaction.makeCreateTransaction(
      assetData,
      metadata,
      [Transaction.makeOutput(Transaction.makeEd25519Condition(keypair.publicKey))],
      keypair.publicKey
    );

    const signedTx = Transaction.signTransaction(txCreate, keypair.privateKey);
    const response = await conn.postTransactionCommit(signedTx);

    console.log("✅ Transaction ID:", response.id);
    res.json({ transactionId: response.id, message: "Prediction stored successfully." });
  } catch (error) {
    console.error("❌ Error storing prediction:", error);
    res.status(500).json({ error: "Error storing prediction" });
  }
});

// Retrieve Prediction
app.get("/get-prediction/:transactionId", async (req, res) => {
  try {
    const { transactionId } = req.params;
    console.log(`🔍 Retrieving Transaction: ${transactionId}`);
    const response = await axios.get(`${API_PATH}transactions/${transactionId}`);
    res.json(response.data);
  } catch (error) {
    console.error("❌ Error retrieving prediction:", error);
    res.status(500).json({ error: "Error retrieving prediction" });
  }
});

// Save Transaction ID to MongoDB
app.post("/save-transaction", async (req, res) => {
  const { email, transactionId } = req.body;

  if (!email || !transactionId) {
    return res.status(400).json({ error: "Missing email or transaction ID." });
  }

  try {
    const user = await User.findOneAndUpdate(
      { email: email },
      { $push: { transactionIds: transactionId } }, // Add new transactionId to array
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    console.log("✅ Transaction ID saved successfully:", transactionId);
    res.json({ message: "Transaction ID saved successfully.", user });
  } catch (error) {
    console.error("❌ Error saving transaction ID:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(PORT, () => console.log(`🚀 BigchainDB Server running on port ${PORT}`));
