import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { jsPDF } from "jspdf";
import "jspdf-autotable";

const BLOCKCHAIN_API = "http://127.0.0.1:5001"; // Blockchain API

const TransactionDetails = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [patientInfo, setPatientInfo] = useState(null);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPatientProfileAndTransactions = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login");
          return;
        }

        // Fetch patient profile to get email
        const profileResponse = await fetch(
          "http://localhost:5000/api/patient/profile",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!profileResponse.ok) {
          console.error("Failed to fetch patient profile");
          return;
        }

        const patientData = await profileResponse.json();
        setPatientInfo(patientData);
        const email = patientData.email;

        // Fetch transaction IDs from MongoDB
        const userResponse = await axios.get(
          `http://localhost:5000/api/patient/get-user/${email}`
        );

        if (userResponse.status === 200) {
          const userData = userResponse.data;
          const transactionIds = userData.transactionIds || [];

          if (transactionIds.length > 0) {
            // Fetch transaction details from Blockchain
            const transactionsData = await Promise.all(
              transactionIds.map(async (txId) => {
                try {
                  const response = await axios.get(
                    `${BLOCKCHAIN_API}/get-prediction/${txId}`
                  );
                  return response.data || {}; // Ensure the response is an object
                } catch (error) {
                  console.error(`Error fetching transaction ${txId}:`, error);
                  return null;
                }
              })
            );

            // Filter out failed transactions
            setTransactions(transactionsData.filter((tx) => tx !== null));
          }
        } else {
          console.error("Failed to fetch user details from MongoDB.");
        }
      } catch (error) {
        console.error("Error fetching patient profile and transactions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPatientProfileAndTransactions();
  }, []);

  // Open modal when clicking on a transaction card
  const handleTransactionClick = (tx) => {
    setSelectedTransaction(tx);
  };

  // Close the modal
  const closeDialog = () => {
    setSelectedTransaction(null);
  };

  const downloadPDF = (transactionData) => {
    if (!transactionData ) return;
  
    const doc = new jsPDF();
  
    // Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("Heart Disease Prediction Report", 70, 20); // Center-aligned
  
    // Current User Details
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Patient Name: ${patientInfo.firstName|| "N/A"} ${patientInfo.lastName|| "N/A"}`, 20, 35);
    doc.text(`Email: ${patientInfo.email || "N/A"}`, 20, 45);
  
    // Transaction Details
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Transaction ID: ${transactionData.id}`, 20, 55);
    doc.text(`Timestamp: ${new Date(transactionData.metadata?.timestamp).toLocaleString()}`, 20, 65);
  
    // Prediction Result
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Prediction Result:", 20, 80);
  
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Prediction: ${transactionData.asset?.data?.data?.prediction || "No Prediction Data"}`, 20, 90);
    doc.text(`Probability: ${
      transactionData.asset?.data?.data?.probability
        ? (transactionData.asset.data.data.probability * 100).toFixed(2) + "%"
        : "No Probability Data"
    }`, 20, 100);
  
    // Table Header
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Patient Details:", 20, 115);
  
    // Prepare table data
    const patientData = transactionData.asset?.data?.data?.patientData || {};
    const tableData = [
      ["Age", `${patientData.age || "N/A"} years`],
      ["Sex", patientData.sex === 1 ? "Male" : "Female"],
      ["Chest Pain Type", ["Typical Angina", "Atypical Angina", "Non-Anginal", "Asymptomatic"][patientData.cp] || "N/A"],
      ["Resting BP", `${patientData.trestbps || "N/A"} mmHg`],
      ["Cholesterol", `${patientData.chol || "N/A"} mg/dL`],
      ["Fasting Blood Sugar", patientData.fbs === 1 ? "≥ 120 mg/dL (High)" : "< 120 mg/dL (Normal)"],
      ["Resting ECG", ["Normal", "ST-T Abnormality", "Left Ventricular Hypertrophy"][patientData.restecg] || "N/A"],
      ["Max Heart Rate", `${patientData.thalach || "N/A"} bpm`],
      ["Exercise Induced Angina", patientData.exang === 1 ? "Yes" : "No"],
      ["ST Depression", patientData.oldpeak || "N/A"],
      ["Slope of ST Segment", ["Upsloping", "Flat", "Downsloping"][patientData.slope] || "N/A"],
      ["Major Vessels", patientData.ca || "N/A"],
      ["Thalassemia", ["Normal", "Fixed Defect", "Reversible Defect"][patientData.thal] || "N/A"],
    ];
  
    // Add table to PDF
    doc.autoTable({
      startY: 125,
      head: [["Parameter", "Value"]],
      body: tableData,
      theme: "grid",
      styles: { fontSize: 11 },
      headStyles: { fillColor: [211, 63, 73] }, // Red header
    });
  
    // Save PDF
    doc.save(`Heart_Disease_Prediction_Report_${transactionData.id}.pdf`);
};

  


  return (
    <div className="p-6">
      {loading ? (
        <p className="text-gray-600">Fetching user details and transaction history...</p>
      ) : patientInfo ? (
        <div>
          {transactions.length > 0 ? (
            <div className="flex flex-col gap-4">
              {transactions.map((tx, index) => (
                <div
                  key={index}
                  className="bg-white shadow-md rounded-lg p-4 border border-gray-200 cursor-pointer hover:shadow-lg transition"
                  onClick={() => handleTransactionClick(tx)}
                >
                  <p className="text-gray-800 font-semibold">ID: {tx.id || "N/A"}</p>
                  <p className="text-gray-600">
                    Timestamp: {tx.metadata?.timestamp ? new Date(tx.metadata.timestamp).toLocaleString() : "No Timestamp Available"}
                  </p>
                  <p className="text-gray-600">
                    Prediction: {tx.asset?.data?.data?.prediction || "No Prediction Data"}
                  </p>
                  <p className="text-gray-600">
                    Probability: {tx.asset?.data?.data?.probability
                      ? (tx.asset.data.data.probability * 100).toFixed(2) + "%"
                      : "No Probability Data"}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">No past health history records found.</p>
          )}
        </div>
      ) : (
        <p className="text-gray-600">User not found.</p>
      )}

      {/* Dialog (Modal) for Viewing Transaction Details */}
      {selectedTransaction && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50">
        <div className="bg-white rounded-lg p-6 w-[500px] max-h-[90vh] shadow-lg relative overflow-y-auto">
          <button
            className="absolute top-2 right-2 text-gray-600 hover:text-gray-900"
            onClick={closeDialog}
          >
            ✖
          </button>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Transaction Details</h2>
      
          <p><strong>ID:</strong> {selectedTransaction.id || "N/A"}</p>
          <p><strong>Timestamp:</strong> {selectedTransaction.metadata?.timestamp ? new Date(selectedTransaction.metadata.timestamp).toLocaleString() : "No Timestamp Available"}</p>
      
          <h3 className="text-md font-semibold text-gray-800 mt-4">🔍 Prediction Details</h3>
          <p><strong>Prediction:</strong> {selectedTransaction.asset?.data?.data?.prediction || "No Prediction Data"}</p>
          <p><strong>Probability:</strong> {selectedTransaction.asset?.data?.data?.probability
            ? (selectedTransaction.asset.data.data.probability * 100).toFixed(2) + "%"
            : "No Probability Data"}
          </p>
      
          <h3 className="text-md font-semibold text-gray-800 mt-4">🩺 Patient Data</h3>
          {selectedTransaction.asset?.data?.data?.patientData ? (
            <table className="w-full border-collapse border border-gray-300 mt-2">
              <tbody>
                {[
                  ["Age", `${selectedTransaction.asset.data.data.patientData.age} years`],
                  ["Sex", selectedTransaction.asset.data.data.patientData.sex === 1 ? "Male" : "Female"],
                  ["Chest Pain Type", ["Typical Angina", "Atypical Angina", "Non-Anginal", "Asymptomatic"][selectedTransaction.asset.data.data.patientData.cp]],
                  ["Resting BP", `${selectedTransaction.asset.data.data.patientData.trestbps} mmHg`],
                  ["Cholesterol", `${selectedTransaction.asset.data.data.patientData.chol} mg/dL`],
                  ["Fasting Blood Sugar", selectedTransaction.asset.data.data.patientData.fbs === 1 ? "≥ 120 mg/dL (High)" : "< 120 mg/dL (Normal)"],
                  ["Resting ECG", ["Normal", "ST-T Abnormality", "Left Ventricular Hypertrophy"][selectedTransaction.asset.data.data.patientData.restecg]],
                  ["Max Heart Rate", `${selectedTransaction.asset.data.data.patientData.thalach} bpm`],
                  ["Exercise Induced Angina", selectedTransaction.asset.data.data.patientData.exang === 1 ? "Yes" : "No"],
                  ["ST Depression", selectedTransaction.asset.data.data.patientData.oldpeak],
                  ["Slope of ST Segment", ["Upsloping", "Flat", "Downsloping"][selectedTransaction.asset.data.data.patientData.slope]],
                  ["Major Vessels", selectedTransaction.asset.data.data.patientData.ca],
                  ["Thalassemia", ["Normal", "Fixed Defect", "Reversible Defect"][selectedTransaction.asset.data.data.patientData.thal]],
                ].map(([label, value], index) => (
                  <tr key={index} className="border border-gray-300">
                    <td className="px-3 py-2 font-semibold text-gray-700">{label}</td>
                    <td className="px-3 py-2 text-gray-600">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No patient data available.</p>
          )}
          
      
          {/* Download as PDF Button */}
          <button
            className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            onClick={() => downloadPDF(selectedTransaction)}
          >
            📄 Download as PDF
          </button>
        </div>
      </div>
      
      
      )}
    </div>
  );
};

export default TransactionDetails;
