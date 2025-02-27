import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { jsPDF } from "jspdf";
import "jspdf-autotable"; // Import for table formatting
import axios from "axios"; // Import axios
import "./App.css"; 

const MONGODB_API = "http://127.0.0.1:5001"; // MongoDB API (same server as BigchainDB)

const ResultsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const retrievedData = location.state?.retrievedData;

  const downloadPDF = () => {
    if (!retrievedData) return;

    const doc = new jsPDF();

    // Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("Heart Disease Prediction Report", 20, 20);

    // Subtitle
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Transaction ID: ${retrievedData.transactionId}`, 20, 30);
    doc.text(`Email: ${retrievedData.email}`, 20, 40); // ✅ Display Email
    doc.text(`Timestamp: ${new Date(retrievedData.timestamp).toLocaleString()}`, 20, 50);

    // Prediction Result
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Prediction Result:", 20, 65);

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Prediction: ${retrievedData.prediction}`, 20, 75);
    doc.text(`Probability: ${retrievedData.probability}`, 20, 85);

    // Table Header
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Patient Details:", 20, 100);

    // Prepare table data
    const patientData = retrievedData.patientData;
    const tableData = [
      ["Age", `${patientData.age} years`],
      ["Sex", patientData.sex === 1 ? "Male" : "Female"],
      ["Chest Pain Type", ["Typical Angina", "Atypical Angina", "Non-Anginal", "Asymptomatic"][patientData.cp]],
      ["Resting BP", `${patientData.trestbps} mmHg`],
      ["Cholesterol", `${patientData.chol} mg/dL`],
      ["Fasting Blood Sugar", patientData.fbs === 1 ? "≥ 120 mg/dL (High)" : "< 120 mg/dL (Normal)"],
      ["Resting ECG", ["Normal", "ST-T Abnormality", "Left Ventricular Hypertrophy"][patientData.restecg]],
      ["Max Heart Rate", `${patientData.thalach} bpm`],
      ["Exercise Induced Angina", patientData.exang === 1 ? "Yes" : "No"],
      ["ST Depression", patientData.oldpeak],
      ["Slope of ST Segment", ["Upsloping", "Flat", "Downsloping"][patientData.slope]],
      ["Major Vessels", patientData.ca],
      ["Thalassemia", ["Normal", "Fixed Defect", "Reversible Defect"][patientData.thal]],
    ];

    // Add table to PDF
    doc.autoTable({
      startY: 110,
      head: [["Parameter", "Value"]],
      body: tableData,
      theme: "grid",
      styles: { fontSize: 11 },
      headStyles: { fillColor: [211, 63, 73] }, // Red header
    });

    // Save PDF
    doc.save("Heart_Disease_Prediction_Report.pdf");
  };

  const saveToDatabase = async () => {
    if (!retrievedData || !retrievedData.transactionId) {
      console.log("⚠️ No transaction ID available.");
      return;
    }

    console.log(`🔄 Saving transaction ID to MongoDB for user: ${retrievedData.email}`); // ✅ Display email in log

    try {
      const response = await axios.post(`${MONGODB_API}/save-transaction`, {
        email: retrievedData.email, // ✅ Save Email to Database
        transactionId: retrievedData.transactionId,
      });

      console.log("✅ Transaction ID saved successfully:", response.data);
      alert("Transaction ID saved to database!");
    } catch (error) {
      console.error("❌ Error saving to database:", error);
      alert("Failed to save transaction.");
    }
  };

  return (
    <div className="results-page" style={{ height: "100vh", overflow: "auto", padding: "20px", display: "flex", flexDirection: "column", justifyContent: "flex-start" }}>


      <h2>📜 Retrieved Prediction Data</h2>

      {retrievedData ? (
        <div className="retrieved-data-box">
          <div className="transaction-info">
            <strong>Transaction ID:</strong> 
            <span className="transaction-id">{retrievedData.transactionId}</span>
          </div>

          {/* ✅ Display Email */}
          <div className="email-info">
            <strong>Email:</strong> 
            <span className="email-text">{retrievedData.email}</span>
          </div>

          <div className="prediction-details">
            <p><strong>Prediction:</strong> 
              <span className={retrievedData.prediction === "Positive" ? "positive-text" : "negative-text"}>
                {retrievedData.prediction}
              </span>
            </p>
            <p><strong>Probability:</strong> {retrievedData.probability}</p>
            <p><strong>Timestamp:</strong> {new Date(retrievedData.timestamp).toLocaleString()}</p>
          </div>

          <h3>👨‍⚕️ Patient Details</h3>
          <table className="patient-data-table">
            <tbody>
              <tr><td><strong>Age</strong></td><td>{retrievedData.patientData.age} years</td></tr>
              <tr><td><strong>Sex</strong></td><td>{retrievedData.patientData.sex === 1 ? "Male" : "Female"}</td></tr>
              <tr><td><strong>Chest Pain Type</strong></td><td>{["Typical Angina", "Atypical Angina", "Non-Anginal", "Asymptomatic"][retrievedData.patientData.cp]}</td></tr>
              <tr><td><strong>Resting BP</strong></td><td>{retrievedData.patientData.trestbps} mmHg</td></tr>
              <tr><td><strong>Cholesterol</strong></td><td>{retrievedData.patientData.chol} mg/dL</td></tr>
              <tr><td><strong>Fasting Blood Sugar</strong></td><td>{retrievedData.patientData.fbs === 1 ? "≥ 120 mg/dL (High)" : "< 120 mg/dL (Normal)"}</td></tr>
              <tr><td><strong>Resting ECG</strong></td><td>{["Normal", "ST-T Abnormality", "Left Ventricular Hypertrophy"][retrievedData.patientData.restecg]}</td></tr>
              <tr><td><strong>Max Heart Rate</strong></td><td>{retrievedData.patientData.thalach} bpm</td></tr>
              <tr><td><strong>Exercise Induced Angina</strong></td><td>{retrievedData.patientData.exang === 1 ? "Yes" : "No"}</td></tr>
              <tr><td><strong>ST Depression</strong></td><td>{retrievedData.patientData.oldpeak}</td></tr>
              <tr><td><strong>Slope of ST Segment</strong></td><td>{["Upsloping", "Flat", "Downsloping"][retrievedData.patientData.slope]}</td></tr>
              <tr><td><strong>Major Vessels</strong></td><td>{retrievedData.patientData.ca}</td></tr>
              <tr><td><strong>Thalassemia</strong></td><td>{["Normal", "Fixed Defect", "Reversible Defect"][retrievedData.patientData.thal]}</td></tr>
            </tbody>
          </table>

          <button className="download-button" onClick={downloadPDF}>📄 Download PDF</button>
          <button className="save-button" onClick={saveToDatabase}>💾 Save to DB</button>
        </div>
      ) : (
        <p>No data found. Please return to home and retrieve the prediction.</p>
      )}
    </div>
  );
};

export default ResultsPage;
