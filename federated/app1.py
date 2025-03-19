import streamlit as st
import pandas as pd
import numpy as np
import pickle
from sklearn.preprocessing import StandardScaler

# Load the federated models
with open("../federated_models.pkl", "rb") as f:
    federated_models = pickle.load(f)

# Initialize the scaler
scaler = StandardScaler()

# Feature names expected by the model
feature_names = [
    'age', 'sex', 'cp', 'trestbps', 'chol', 'fbs', 'restecg', 'thalach',
    'exang', 'oldpeak', 'slope', 'ca', 'thal'
]

# Streamlit app
st.set_page_config(
    page_title="Federated Learning Heart Disease Prediction",
    page_icon="💓",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Header Section
st.title("💓 Heart Disease Prediction App")
st.markdown("""
Welcome to the **Heart Disease Prediction App** powered by **Federated Learning**!  
This app predicts the likelihood of heart disease using multiple machine learning models trained in a federated setup.
""")

# Section: About Federated Learning
st.subheader("What is Federated Learning?")
with st.expander("Learn more about Federated Learning"):
    st.markdown("""
    Federated learning is a **decentralized machine learning approach** where models are trained on local data at multiple nodes (e.g., hospitals or devices). 
    The insights (model weights) are then aggregated at a central server without sharing the raw data.  
    - **Local Training**: Each node trains its own model on its local dataset.  
    - **Global Model**: A central model aggregates insights from all local models.  
    - **Federated Learning**: Combines local training and global aggregation to improve privacy and model accuracy.  
    """)

# Sidebar: Input Form
st.sidebar.header("📋 Input Patient Data")
st.sidebar.markdown("Provide the following patient details to predict heart disease.")

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
        restecg = st.slider("Resting ECG Results (restecg)", 0, 2, 1, help="0: Normal, 1: ST-T Wave Abnormality, 2: Left Ventricular Hypertrophy")
        thalach = st.number_input("Maximum Heart Rate Achieved (thalach)", 60, 220, value=150, help="Measured in bpm")
        exang = st.radio("Exercise Induced Angina (exang)", [0, 1], format_func=lambda x: "Yes" if x == 1 else "No")
        oldpeak = st.slider("ST Depression (oldpeak)", 0.0, 6.0, 1.0, step=0.1, help="ST depression induced by exercise relative to rest")
        slope = st.slider("Slope of Peak ST Segment (slope)", 0, 2, 1, help="0: Upsloping, 1: Flat, 2: Downsloping")

    with st.sidebar.expander("Other Parameters", expanded=True):
        ca = st.slider("Number of Major Vessels (ca)", 0, 4, 0, help="Number of major vessels colored by fluoroscopy (0-4)")
        thal = st.slider("Thalassemia (thal)", 0, 3, 2, help="0: Normal, 1: Fixed Defect, 2: Reversible Defect")

    data = {
        'age': age, 'sex': sex, 'cp': cp, 'trestbps': trestbps, 'chol': chol,
        'fbs': fbs, 'restecg': restecg, 'thalach': thalach, 'exang': exang,
        'oldpeak': oldpeak, 'slope': slope, 'ca': ca, 'thal': thal
    }
    return pd.DataFrame(data, index=[0])

# Gather user input
input_features = user_input_features()

# Display input data
st.subheader("🔍 Input Features")
columns = st.columns(len(input_features.columns))

# Editable table for inputs
for i, column_name in enumerate(input_features.columns):
    with columns[i]:
        input_features[column_name] = st.text_input(
            label=f"{column_name}",
            value=str(input_features[column_name].values[0]),
            key=f"edit_{column_name}"
        )

col1, col2, col3 = st.columns(3)
# Prediction Button
if st.button("🔍 Predict Heart Disease"):
    with col1:
        st.subheader("Local Learning")
        st.markdown("**Each model was trained locally on subsets of the data.**")
        st.markdown("This ensures patient data privacy during model training.")

    with col2:
        st.subheader("Global Learning")
        st.markdown("**The models were aggregated into a global model.**")
        st.markdown("This combines insights from all local models into a unified global model.")

    with col3:
        st.subheader("Federated Learning")
        st.markdown("**A combination of local and global techniques.**")
        st.markdown("This approach improves both privacy and performance.")

    # Prediction results
    st.subheader("🩺 Prediction Results")
    with st.spinner("Analyzing with Federated Models..."):
        predictions = []
        probabilities = []

        for name, model in federated_models.items():
            if name in ["KNN", "Logistic Regression", "SVC"]:
                scaled_input = scaler.fit_transform(input_features[feature_names])
                prob = model.predict_proba(scaled_input)[:, 1]
            else:
                prob = model.predict_proba(input_features[feature_names])[:, 1]

            predictions.append(model.predict(input_features if name not in ["KNN", "Logistic Regression", "SVC"] else scaled_input))
            probabilities.append(prob)

        avg_prob = np.mean(probabilities, axis=0)
        final_prediction = 1 if avg_prob >= 0.5 else 0

        st.success(f"Heart Disease Prediction: {'Positive' if final_prediction == 1 else 'Negative'}")
        st.metric("Federated Average Probability", f"{avg_prob[0]:.2f}")

        st.write("---")
        st.subheader("Local Model-wise Probabilities")
        results = {
            "Model": list(federated_models.keys()),
            "Probability": [f"{prob[0]:.2f}" for prob in probabilities]
        }
        st.table(pd.DataFrame(results))

st.write("---")
st.markdown("💡 **Disclaimer**: This application is for educational purposes only.")
