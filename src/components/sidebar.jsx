import React from "react";
import { AiOutlineInfoCircle } from "react-icons/ai";
import "../App.css";  // Import from App.css

const Sidebar = ({ formData, handleChange, handleSubmit, loading }) => {
  return (
    <aside className="sidebar">
      <h2>📋 Input Patient Data</h2>
      <p>Provide the following details to predict heart disease.</p>

      {/* Patient Information */}
      <div className="input-card">
        <h3>🧑‍⚕️ Demographic Details</h3>
        <label>Age: <strong>{formData.age}</strong></label>
        <input type="range" className="red-slider" name="age" min="1" max="120" value={formData.age} onChange={handleChange} />

        <label>Sex</label>
        <div className="radio-group">
          <label><input type="radio" name="sex" value="0" checked={formData.sex === 0} onChange={handleChange} /> Female</label>
          <label><input type="radio" name="sex" value="1" checked={formData.sex === 1} onChange={handleChange} /> Male</label>
        </div>
      </div>

      {/* Clinical Measurements */}
      <div className="input-card">
        <h3>🩺 Clinical Measurements</h3>
        <label>Chest Pain Type (cp) <AiOutlineInfoCircle />: <strong>{formData.cp}</strong></label>
        <input type="range" className="red-slider" name="cp" min="0" max="3" value={formData.cp} onChange={handleChange} />

        <label>Resting Blood Pressure (trestbps): <strong>{formData.trestbps} mmHg</strong></label>
        <input type="range" className="red-slider" name="trestbps" min="80" max="200" value={formData.trestbps} onChange={handleChange} />

        <label>Cholesterol (chol): <strong>{formData.chol} mg/dL</strong></label>
        <input type="range" className="red-slider" name="chol" min="100" max="400" value={formData.chol} onChange={handleChange} />

        <label>Fasting Blood Sugar (fbs)</label>
        <div className="radio-group">
          <label><input type="radio" name="fbs" value="0" checked={formData.fbs === 0} onChange={handleChange} /> No</label>
          <label><input type="radio" name="fbs" value="1" checked={formData.fbs === 1} onChange={handleChange} /> Yes</label>
        </div>
      </div>

      {/* Electrocardiographic and Exercise Results */}
      <div className="input-card">
        <h3>⚡ Electrocardiographic & Exercise Results</h3>
        <label>Resting ECG Results (restecg): <strong>{formData.restecg}</strong></label>
        <input type="range" className="red-slider" name="restecg" min="0" max="2" value={formData.restecg} onChange={handleChange} />

        <label>Maximum Heart Rate Achieved (thalach): <strong>{formData.thalach} bpm</strong></label>
        <input type="range" className="red-slider" name="thalach" min="60" max="220" value={formData.thalach} onChange={handleChange} />

        <label>Exercise Induced Angina (exang)</label>
        <div className="radio-group">
          <label><input type="radio" name="exang" value="0" checked={formData.exang === 0} onChange={handleChange} /> No</label>
          <label><input type="radio" name="exang" value="1" checked={formData.exang === 1} onChange={handleChange} /> Yes</label>
        </div>

        <label>ST Depression (oldpeak): <strong>{formData.oldpeak}</strong></label>
        <input type="range" className="red-slider" name="oldpeak" min="0" max="6" step="0.1" value={formData.oldpeak} onChange={handleChange} />

        <label>Slope of Peak ST Segment (slope): <strong>{formData.slope}</strong></label>
        <input type="range" className="red-slider" name="slope" min="0" max="2" value={formData.slope} onChange={handleChange} />
      </div>

      {/* Other Parameters */}
      <div className="input-card">
        <h3>🔬 Other Parameters</h3>
        <label>Number of Major Vessels (ca): <strong>{formData.ca}</strong></label>
        <input type="range" className="red-slider" name="ca" min="0" max="4" value={formData.ca} onChange={handleChange} />

        <label>Thalassemia (thal): <strong>{formData.thal}</strong></label>
        <input type="range" className="red-slider" name="thal" min="0" max="3" value={formData.thal} onChange={handleChange} />
      </div>

      {/* Predict Button */}
      <button className="predict-button" onClick={handleSubmit} disabled={loading}>
        {loading ? "Predicting..." : "🔍 Predict Heart Disease"}
      </button>
    </aside>
  );
};

export default Sidebar;
