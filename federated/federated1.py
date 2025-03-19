import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.naive_bayes import GaussianNB
from sklearn.preprocessing import StandardScaler
from sklearn.neighbors import KNeighborsClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.svm import SVC
import numpy as np
import pickle
import copy

# Load dataset
data = pd.read_csv('../heart.csv')

# Map users to rows (simulating clients)
data['User'] = data.index + 1  # Assuming first row is User 1, second row is User 2, etc.

# Identify users with heart disease
users_with_heart_disease = data[data['target'] == 1]['User']
print("Users with heart disease:", users_with_heart_disease.tolist())

# Partition data into clients (simulating federated nodes)
num_clients = 5
client_data = np.array_split(data, num_clients)

# Global Model Initialization
global_model_prototypes = {
    'Random Forest': RandomForestClassifier(random_state=9),
    'Naive Bayes': GaussianNB(),
    'Gradient Boosting': GradientBoostingClassifier(),
    'KNN': KNeighborsClassifier(),
    'Logistic Regression': LogisticRegression(),
    'SVC': SVC(probability=True)
}

# Scaling mechanism for scale-sensitive models
scaler = StandardScaler()

# Federated Learning Parameters
NUM_ROUNDS = 5  # Number of communication rounds
global_models = copy.deepcopy(global_model_prototypes)

# Helper function for averaging weights
def federated_averaging(local_weights, client_sizes):
    """Perform Federated Averaging of model weights."""
    total_samples = sum(client_sizes)
    averaged_weights = copy.deepcopy(local_weights[0])

    for key in averaged_weights.keys():
        averaged_weights[key] = sum(
            client_size * local_weights[i][key] / total_samples for i, client_size in enumerate(client_sizes)
        )
    return averaged_weights

# Helper function to extract model weights
def extract_model_weights(model):
    """Extract weights of the model as a dictionary."""
    if hasattr(model, 'coef_'):
        return {'coef_': model.coef_, 'intercept_': model.intercept_}
    elif hasattr(model, 'feature_importances_'):
        return {'feature_importances_': model.feature_importances_}
    else:
        return {}

# Helper function to set model weights
def set_model_weights(model, weights):
    """Set weights of the model from a dictionary."""
    if hasattr(model, 'coef_'):
        model.coef_ = weights['coef_']
        model.intercept_ = weights['intercept_']
    else:
        # For models like RandomForest, we cannot directly set the weights.
        # Instead, re-train the model after aggregation.
        pass

# Federated Learning Process
for round_num in range(NUM_ROUNDS):
    print(f"\n=== Communication Round {round_num + 1} ===")
    local_weights = []
    client_sizes = []

    for client_id, client_df in enumerate(client_data):
        print(f"Training on client {client_id + 1}")

        # Split client data into features and labels
        X_client = client_df.drop(['target', 'User'], axis=1)
        y_client = client_df['target']
        X_train_client, X_test_client, y_train_client, y_test_client = train_test_split(
            X_client, y_client, test_size=0.4, random_state=9
        )
        client_sizes.append(len(X_train_client))

        # Train local models
        local_model_weights = {}
        for name, global_model in global_models.items():
            model = copy.deepcopy(global_model)
            if name in ['KNN', 'Logistic Regression', 'SVC']:
                X_train_scaled = scaler.fit_transform(X_train_client)
                model.fit(X_train_scaled, y_train_client)
            else:
                model.fit(X_train_client, y_train_client)

            # Extract model weights
            local_model_weights[name] = extract_model_weights(model)

        local_weights.append(local_model_weights)

    # Aggregate models
    for name in global_models.keys():
        aggregated_weights = federated_averaging(
            [local_weights[i][name] for i in range(num_clients)],
            client_sizes
        )
        set_model_weights(global_models[name], aggregated_weights)

        # Re-fit the global model with one client's data to initialize properly
        if name in ['KNN', 'Logistic Regression', 'SVC']:
            global_models[name].fit(scaler.fit_transform(X_client), y_client)
        else:
            global_models[name].fit(X_client, y_client)

    print(f"\nGlobal Models after Round {round_num + 1}:")
    for name, model in global_models.items():
        print(f"{name}: Trained with Federated Averaging")

# Evaluate Global Models
print("\n=== Final Global Model Evaluation ===")
X, y = data.drop(['target', 'User'], axis=1), data['target']
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.4, random_state=9)
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

for name, model in global_models.items():
    if name in ['KNN', 'Logistic Regression', 'SVC']:
        acc = model.score(X_test_scaled, y_test)
    else:
        acc = model.score(X_test, y_test)
    print(f"{name} Accuracy: {acc:.2f}")

# Save the Federated Models
with open("../federated_models.pkl", "wb") as f:
    pickle.dump(global_models, f)
print("\nFederated models saved to 'federated_models.pkl'")
