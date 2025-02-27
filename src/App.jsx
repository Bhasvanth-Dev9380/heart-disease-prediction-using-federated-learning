import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import Sidebar from "./components/sidebar";
import ResultsPage from "./ResultsPage";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { FaHeartbeat, FaChartBar } from "react-icons/fa";
import "./App.css"; // Import styles

const PREDICTION_API = "http://127.0.0.1:5000/predict"; // Flask API
const BLOCKCHAIN_API = "http://127.0.0.1:5001"; // BigchainDB API
const MONGODB_API = "http://127.0.0.1:5001"; // MongoDB API (same server as BigchainDB)

function HomePage() {
  const [formData, setFormData] = useState({
    age: 30, sex: 0, cp: 1, trestbps: 120, chol: 200,
    fbs: 0, restecg: 1, thalach: 150, exang: 0,
    oldpeak: 1.0, slope: 1, ca: 0, thal: 2,
  });

  const [prediction, setPrediction] = useState(null);
  const [transactionId, setTransactionId] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Extract email from URL query parameters
  const queryParams = new URLSearchParams(location.search);
  const email = queryParams.get("email") || "No Email Provided";

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData({ ...formData, [name]: type === "radio" ? parseInt(value) : parseFloat(value) });
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      console.log("🔄 Sending patient data to Flask for prediction...");
      const response = await axios.post(PREDICTION_API, formData);
      setPrediction(response.data);
      console.log("✅ Received Prediction:", response.data);

      console.log("🔄 Sending prediction data to BigchainDB...");
      const blockchainResponse = await axios.post(`${BLOCKCHAIN_API}/store-prediction`, {
        patientData: formData,
        prediction: response.data["Heart Disease Prediction"],
        probability: response.data["Federated Average Probability"],
      });

      setTransactionId(blockchainResponse.data.transactionId);
      console.log("✅ Stored in BigchainDB. Transaction ID:", blockchainResponse.data.transactionId);
    } catch (error) {
      console.error("❌ Error:", error);
    }
    setLoading(false);
  };

  const fetchStoredPrediction = async () => {
    if (!transactionId) {
      console.log("⚠️ No transaction ID available.");
      return;
    }

    console.log(`🔍 Retrieving stored prediction... Transaction ID: ${transactionId}`);

    try {
      const response = await axios.get(`${BLOCKCHAIN_API}/get-prediction/${transactionId}`);
      const transactionData = response.data;

      // Extract email from URL parameters
      const queryParams = new URLSearchParams(window.location.search);
      const email = queryParams.get("email") || "No Email Provided";

      const extractedData = {
        transactionId: transactionData.id,
        timestamp: transactionData.metadata.timestamp,
        patientData: transactionData.asset.data.data.patientData,
        prediction: transactionData.asset.data.data.prediction,
        probability: (transactionData.asset.data.data.probability * 100).toFixed(2) + "%",
        email: email, // ✅ Include email in the extracted data
      };

      navigate("/results", { state: { retrievedData: extractedData } });
    } catch (error) {
      console.error("❌ Error retrieving prediction:", error);
    }
};

  
  const saveToDatabase = async () => {
    if (!transactionId) {
      console.log("⚠️ No transaction ID available.");
      return;
    }

    console.log(`🔄 Saving transaction ID to MongoDB for user: ${email}`);

    try {
      const response = await axios.post(`${MONGODB_API}/save-transaction`, {
        email: email,
        transactionId: transactionId,
      });

      console.log("✅ Transaction ID saved successfully:", response.data);
      alert("Transaction ID saved to database!");
    } catch (error) {
      console.error("❌ Error saving to database:", error);
      alert("Failed to save transaction.");
    }
  };

  return (
    <div className="app-container">
      <Sidebar formData={formData} handleChange={handleChange} handleSubmit={handleSubmit} loading={loading} />

      <main className="main-content">
        <h1><FaHeartbeat /> Heart Disease Prediction App</h1>
        <p>Welcome to the <strong>Heart Disease Prediction App</strong> powered by <strong>Federated Learning</strong>!</p>

        {/* ✅ Display Email */}
        <h3>Logged in as: {email}</h3>

        {prediction && prediction["Model Probabilities"] && (
          <div className="result-container">
            <h2>🩺 Prediction Result</h2>
            <div className={`result-box ${prediction["Heart Disease Prediction"] === "Positive" ? "positive" : "negative"}`}>
              {prediction["Heart Disease Prediction"]}
            </div>
            <p>Federated Average Probability: <strong>{(prediction["Federated Average Probability"] * 100).toFixed(2)}%</strong></p>

            {/* Graph - Show only if Model Probabilities exist */}
            <h3><FaChartBar /> Model-wise Probabilities</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={Object.entries(prediction["Model Probabilities"]).map(([model, probability]) => ({ model, probability }))}>
                <XAxis dataKey="model" />
                <YAxis domain={[0, 1]} />
                <Tooltip />
                <Legend />
                <Bar dataKey="probability" fill="#d33f49" />
              </BarChart>
            </ResponsiveContainer>

            {/* Show Blockchain Transaction ID */}
            {transactionId && (
              <div>
                <h3>Blockchain Transaction ID</h3>
                <p className="transaction-id">{transactionId}</p>
                <button className="fetch-button" onClick={fetchStoredPrediction}>🔍 View Results</button>
                <button className="save-button" onClick={saveToDatabase}>💾 Save to DB</button> {/* New Save Button */}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/results" element={<ResultsPage />} />
      </Routes>
    </Router>
  );
}

export default App;
