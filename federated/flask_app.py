from flask import Flask, request, jsonify
import pandas as pd
import numpy as np
import pickle
from sklearn.preprocessing import StandardScaler
from flask_cors import CORS  # Import CORS

# Initialize Flask app
app = Flask(__name__)



# Enable CORS for all routes
CORS(app)

# Load the federated models
with open("../federated_models.pkl", "rb") as f:
    federated_models = pickle.load(f)

# Initialize the scaler
scaler = StandardScaler()

# Feature names expected by the model
FEATURE_NAMES = [
    'age', 'sex', 'cp', 'trestbps', 'chol', 'fbs', 'restecg', 'thalach',
    'exang', 'oldpeak', 'slope', 'ca', 'thal'
]

@app.route('/')
def home():
    return jsonify({"message": "Heart Disease Prediction API is running!"})

@app.route('/predict', methods=['POST'])
def predict():
    try:
        # Get input JSON
        data = request.json

        # Validate if required features are present
        if not all(feature in data for feature in FEATURE_NAMES):
            return jsonify({"error": "Missing one or more required input fields"}), 400

        # Convert input data to DataFrame
        input_features = pd.DataFrame([data])

        # Predictions from each model
        predictions = []
        probabilities = []

        # Run each federated model
        for name, model in federated_models.items():
            if name in ["KNN", "Logistic Regression", "SVC"]:
                # Scale input for specific models
                scaled_input = scaler.fit_transform(input_features[FEATURE_NAMES])
                prob = model.predict_proba(scaled_input)[:, 1]
            else:
                prob = model.predict_proba(input_features[FEATURE_NAMES])[:, 1]

            predictions.append(model.predict(input_features if name not in ["KNN", "Logistic Regression", "SVC"] else scaled_input))
            probabilities.append(prob)

        # Calculate Federated Average Probability
        avg_prob = np.mean(probabilities, axis=0)
        final_prediction = int(avg_prob >= 0.5)

        # Prepare response
        response = {
            "Heart Disease Prediction": "Positive" if final_prediction == 1 else "Negative",
            "Federated Average Probability": round(float(avg_prob[0]), 2),
            "Model Probabilities": {model: round(float(prob[0]), 2) for model, prob in zip(federated_models.keys(), probabilities)}
        }

        return jsonify(response)

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Run Flask app
if __name__ == '__main__':
    app.run(debug=True, host="0.0.0.0", port=5000)
