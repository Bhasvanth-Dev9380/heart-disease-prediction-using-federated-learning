import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.naive_bayes import GaussianNB
from sklearn.preprocessing import StandardScaler
from sklearn.neighbors import KNeighborsClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.svm import SVC
from sklearn.metrics import recall_score, roc_curve, roc_auc_score, accuracy_score
from sklearn.model_selection import GridSearchCV
import matplotlib.pyplot as plt
import numpy as np
import seaborn as sns
import pickle

# Load dataset
data = pd.read_csv('heart.csv')

# Map users to rows
data['User'] = data.index + 1  # Assuming first row is User 1, second row is User 2, etc.

# Identify users with heart disease
users_with_heart_disease = data[data['target'] == 1]['User']
print("Users with heart disease:", users_with_heart_disease.tolist())

# Split data
X, y = data.drop(['target', 'User'], axis=1), data['target']
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.4, random_state=9)

# Initialize global model dictionary
global_models = {}

# Scale-Insensitive Models
Rf = RandomForestClassifier(random_state=9)
Rf.fit(X_train, y_train)
global_models['Random Forest'] = Rf

Nb = GaussianNB()
Nb.fit(X_train, y_train)
global_models['Naive Bayes'] = Nb

Gb = GradientBoostingClassifier()
Gb.fit(X_train, y_train)
global_models['Gradient Boosting'] = Gb

# Scale-Sensitive Models
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

Knn = KNeighborsClassifier()
Knn.fit(X_train_scaled, y_train)
global_models['KNN'] = Knn

Lr = LogisticRegression()
Lr.fit(X_train_scaled, y_train)
global_models['Logistic Regression'] = Lr

Sv = SVC(probability=True)
Sv.fit(X_train_scaled, y_train)
global_models['SVC'] = Sv

# Evaluate Global Models
print("Accuracy Scores:")
for name, model in global_models.items():
    if name in ['KNN', 'Logistic Regression', 'SVC']:
        acc = model.score(X_test_scaled, y_test)
    else:
        acc = model.score(X_test, y_test)
    print(f"{name} Accuracy: {acc:.2f}")

# Recall Scores for Global Models
print("\nRecall Scores:")
for name, model in global_models.items():
    if name in ['KNN', 'Logistic Regression', 'SVC']:
        y_pred = model.predict(X_test_scaled)
    else:
        y_pred = model.predict(X_test)
    recall = recall_score(y_test, y_pred)
    print(f"{name} Recall: {recall:.2f}")

# ROC Curve and AUC for Global Models
plt.figure(figsize=(10, 8))
print("\nROC Curve and AUC:")
for name, model in global_models.items():
    try:
        if name in ['KNN', 'Logistic Regression', 'SVC']:
            y_probs = model.predict_proba(X_test_scaled)[:, 1]
        else:
            y_probs = model.predict_proba(X_test)[:, 1]
        fpr, tpr, _ = roc_curve(y_test, y_probs)
        auc_score = roc_auc_score(y_test, y_probs)
        print(f"{name} AUC: {auc_score:.2f}")
        plt.plot(fpr, tpr, label=f"{name} AUC: {auc_score:.2f}")
    except AttributeError:
        print(f"{name} does not support predict_proba.")

plt.xlabel('False Positive Rate')
plt.ylabel('True Positive Rate')
plt.title('ROC Curve for Global Models')
plt.legend()
plt.show()

# Hyperparameter Tuning for Random Forest
param_grid = {
    'n_estimators': [100, 200, 500, 600, 700]
}
grid_search = GridSearchCV(RandomForestClassifier(random_state=9), param_grid, cv=3, n_jobs=-1, verbose=2)
grid_search.fit(X_train, y_train)

best_forest = grid_search.best_estimator_
print('\nBest Random Forest:', best_forest)

# Evaluate Best Random Forest
y_probs = best_forest.predict_proba(X_test)[:, 1]
fpr, tpr, _ = roc_curve(y_test, y_probs)
auc_score = roc_auc_score(y_test, y_probs)
plt.plot(fpr, tpr, label=f"Tuned RF AUC: {auc_score:.2f}")
plt.xlabel('False Positive Rate')
plt.ylabel('True Positive Rate')
plt.title('ROC Curve - Tuned Random Forest')
plt.legend()
plt.show()

# Recall Score of Best Random Forest
y_pred = best_forest.predict(X_test)
recall = recall_score(y_test, y_pred)
print('Tuned Random Forest Recall:', recall)

# Feature Importances
feature_importances = best_forest.feature_importances_
features = best_forest.feature_names_in_
sorted_indices = np.argsort(feature_importances)[::-1]
sorted_features = features[sorted_indices]
sorted_importances = feature_importances[sorted_indices]

colors = plt.cm.YlGn(sorted_importances / sorted_importances.max())
plt.barh(sorted_features, sorted_importances, color=colors)
plt.xlabel('Feature Importance')
plt.ylabel('Features')
plt.title('Feature Importance')
plt.show()

# Correlation Heatmap
plt.figure(figsize=(12, 10))
sns.heatmap(abs(data.corr()), annot=True, cmap='YlGn')
plt.title('Correlation Heatmap')
plt.show()

# Save the Global Model
print("\nGlobal Model Values Before Saving:")
for name, model in global_models.items():
    print(f"{name}: {model}")

with open("global_model.pkl", "wb") as f:
    pickle.dump(global_models, f)
print("\nGlobal models saved to 'global_model.pkl'")

# Federated Model Implementation
federated_models = {}

for name, model in global_models.items():
    if name in ['KNN', 'Logistic Regression', 'SVC']:
        model.fit(X_train_scaled, y_train)
        federated_models[name] = model
    else:
        model.fit(X_train, y_train)
        federated_models[name] = model

# Print Federated Model Values Before Saving
print("\nFederated Model Values Before Saving:")
for name, model in federated_models.items():
    print(f"{name}: {model}")

# Save the Federated Models
with open("global_model1.pkl", "wb") as f:
    pickle.dump(federated_models, f)
print("\nFederated models saved to 'global_model1.pkl'")
