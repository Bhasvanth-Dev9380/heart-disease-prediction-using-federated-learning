import streamlit as st
import pandas as pd
import numpy as np
import pickle
from sklearn.preprocessing import StandardScaler

# Load global models (Federated Models in Context)
with open("global_model1.pkl", "rb") as f:
    federated_models = pickle.load(f)

# Load scaler
scaler = StandardScaler()

# Modern UI with a federated learning context
st.set_page_config(
    page_title="Federated Learning Heart Disease Prediction",
    page_icon="💓",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Title and instructions
st.title("💓 Federated Learning Heart Disease Prediction App")
st.markdown("""
This application uses a **federated learning approach** with multiple machine learning models deployed across various data nodes to predict the likelihood of heart disease. 
The prediction is an averaged result from federated models for improved accuracy and privacy.
""")
st.write("---")

# Sidebar for user input
st.sidebar.header("Enter Patient Features")
st.sidebar.markdown("""
Provide the patient's clinical and demographic details to predict the likelihood of heart disease using our federated learning model.
""")

# User input for prediction
# User input for prediction
def user_input_features():
    st.sidebar.header("Patient Information")
    with st.sidebar.expander("Demographic Details", expanded=True):
        age = st.number_input("Age", min_value=1, max_value=120, value=30)
        sex = st.radio("Sex", options=[0, 1], format_func=lambda x: "Male" if x == 1 else "Female")

    with st.sidebar.expander("Clinical Measurements", expanded=True):
        cp = st.slider("Chest Pain Type (cp)", 0, 3, 1, help="0: Typical Angina, 1: Atypical Angina, 2: Non-Anginal Pain, 3: Asymptomatic")
        trestbps = st.number_input("Resting Blood Pressure (trestbps)", 80, 200, value=120, help="Measured in mm Hg")
        chol = st.number_input("Cholesterol (chol)", 100, 400, value=200, help="Measured in mg/dL")
        fbs = st.radio("Fasting Blood Sugar > 120 mg/dl (fbs)", [0, 1], format_func=lambda x: "Yes" if x == 1 else "No")

    with st.sidebar.expander("Electrocardiographic and Exercise Results", expanded=True):
        restecg = st.slider("Resting Electrocardiographic Results (restecg)", 0, 2, 1, help="0: Normal, 1: ST-T Wave Abnormality, 2: Left Ventricular Hypertrophy")
        thalach = st.number_input("Maximum Heart Rate Achieved (thalach)", 60, 220, value=150, help="Measured in bpm")
        exang = st.radio("Exercise Induced Angina (exang)", [0, 1], format_func=lambda x: "Yes" if x == 1 else "No")
        oldpeak = st.slider("ST Depression Induced by Exercise (oldpeak)", 0.0, 6.0, 1.0, step=0.1, help="ST depression induced by exercise relative to rest")
        slope = st.slider("Slope of the Peak Exercise ST Segment (slope)", 0, 2, 1, help="0: Upsloping, 1: Flat, 2: Downsloping")

    with st.sidebar.expander("Other Parameters", expanded=True):
        ca = st.slider("Number of Major Vessels (ca)", 0, 4, 0, help="Number of major vessels colored by fluoroscopy (0-4)")
        thal = st.slider("Thalassemia (thal)", 0, 3, 2, help="0: Normal, 1: Fixed Defect, 2: Reversible Defect")

    features = pd.DataFrame({
        "age": [age],
        "sex": [sex],
        "cp": [cp],
        "trestbps": [trestbps],
        "chol": [chol],
        "fbs": [fbs],
        "restecg": [restecg],
        "thalach": [thalach],
        "exang": [exang],
        "oldpeak": [oldpeak],
        "slope": [slope],
        "ca": [ca],
        "thal": [thal]
    })
    return features


# Gather user input
input_features = user_input_features()



# Display input data
st.subheader("🔍 Input Features")

# Editable table using st.columns for horizontal input
columns = st.columns(len(input_features.columns))

# Update the original DataFrame directly
for i, column_name in enumerate(input_features.columns):
    with columns[i]:
        input_features[column_name] = st.text_input(
            label=f"{column_name}",
            value=str(input_features[column_name].values[0]),
            key=f"edit_{column_name}"
        )





# Prediction
if st.button("Predict"):
    st.subheader("🔮 Prediction Results")
    with st.spinner("Analyzing with Federated Models..."):
        # Scale-sensitive models need scaled inputs
        input_scaled = scaler.fit_transform(input_features)

        # Predictions and probabilities from all models
        predictions = []
        probabilities = []

        for name, model in federated_models.items():
            if name in ["KNN", "Logistic Regression", "SVC"]:
                prob = model.predict_proba(input_scaled)[:, 1]
            else:
                prob = model.predict_proba(input_features)[:, 1]

            # Append predictions and probabilities
            predictions.append(model.predict(input_features if name not in ["KNN", "Logistic Regression", "SVC"] else input_scaled))
            probabilities.append(prob)

        # Averaging probabilities for final prediction
        avg_prob = np.mean(probabilities, axis=0)
        final_prediction = 1 if avg_prob >= 0.5 else 0

        # Display results
        result_text = "Positive" if final_prediction == 1 else "Negative"
        st.success(f"Heart Disease Prediction: **{result_text}**")
        st.metric("Federated Average Probability of Heart Disease", f"{avg_prob[0]:.2f}")

        # Display individual model details
        st.write("---")
        st.subheader("Local Models-wise probabilty(from the federated learning setup)")
        model_data = {
            "Local Model": [],  # Changed "Model" to "Local Model"
            "Probability of Heart Disease": []
        }
        for name, prob in zip(federated_models.keys(), probabilities):
            model_data["Local Model"].append(name)  # Updated the key name to match the header
            model_data["Probability of Heart Disease"].append(f"{prob[0]:.2f}")
        st.table(pd.DataFrame(model_data))

        # Show explanation
        st.write("---")
        st.markdown("""
        **How Federated Learning Works**:
        - Each model represents a node in a federated setup, trained independently on local datasets.
        - The predictions are aggregated securely to ensure privacy and achieve robust results.
        """)


# Footer
st.write("---")
st.markdown("""
💡 **Disclaimer**: This application is for educational purposes and should not be used for medical diagnosis or treatment decisions.
""")
