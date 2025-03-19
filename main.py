import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.naive_bayes import GaussianNB
from sklearn.preprocessing import StandardScaler
from sklearn.neighbors import KNeighborsClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.svm import SVC
from sklearn.metrics import recall_score, roc_curve, roc_auc_score
from sklearn.model_selection import GridSearchCV
import matplotlib.pyplot as plt
import numpy as np
import seaborn as sns

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

# Scale-Insensitive Models
Rf = RandomForestClassifier(random_state=9)
Rf.fit(X_train, y_train)

Nb = GaussianNB()
Nb.fit(X_train, y_train)

Gb = GradientBoostingClassifier()
Gb.fit(X_train, y_train)

# Scale-Sensitive Models
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

Knn = KNeighborsClassifier()
Knn.fit(X_train_scaled, y_train)

Lr = LogisticRegression()
Lr.fit(X_train_scaled, y_train)

Sv = SVC(probability=True)
Sv.fit(X_train_scaled, y_train)

# Accuracy Score
print('Random Forest Accuracy:', Rf.score(X_test, y_test))
print('Naive Bayes Accuracy:', Nb.score(X_test, y_test))
print('Gradient Boosting Accuracy:', Gb.score(X_test, y_test))
print('KNN Accuracy:', Knn.score(X_train_scaled, y_train))
print('Logistic Regression Accuracy:', Lr.score(X_train_scaled, y_train))
print('SVC Accuracy:', Sv.score(X_train_scaled, y_train))

# Recall Score
y_pred = Rf.predict(X_test)
print('Random Forest Recall:', recall_score(y_test, y_pred))

y_pred = Nb.predict(X_test)
print('Naive Bayes Recall:', recall_score(y_test, y_pred))

y_pred = Gb.predict(X_test)
print('Gradient Boosting Recall:', recall_score(y_test, y_pred))

y_pred = Knn.predict(X_test_scaled)
print('KNN Recall:', recall_score(y_test, y_pred))

y_pred = Lr.predict(X_test_scaled)
print('Logistic Regression Recall:', recall_score(y_test, y_pred))

y_pred = Sv.predict(X_test_scaled)
print('SVC Recall:', recall_score(y_test, y_pred))

# ROC Curve and AUC
models = {'Random Forest': Rf, 'Naive Bayes': Nb, 'Gradient Boosting': Gb,
          'KNN': Knn, 'Logistic Regression': Lr, 'SVC': Sv}

for name, model in models.items():
    try:
        if name in ['KNN', 'Logistic Regression', 'SVC']:
            y_probs = model.predict_proba(X_test_scaled)[:, 1]
        else:
            y_probs = model.predict_proba(X_test)[:, 1]
        fpr, tpr, thresholds = roc_curve(y_test, y_probs)
        plt.plot(fpr, tpr, label=f"{name} AUC: {roc_auc_score(y_test, y_probs):.2f}")
    except AttributeError:
        pass  # Handle models without `predict_proba`

plt.xlabel('False Positive Rate')
plt.ylabel('True Positive Rate')
plt.title('ROC Curve')
plt.legend()
plt.show()

# Hyperparameter Tuning for Random Forest
param_grid = {
    'n_estimators': [100, 200, 500, 600, 700]
}
grid_search = GridSearchCV(RandomForestClassifier(random_state=9), param_grid, cv=3, n_jobs=-1, verbose=2)
grid_search.fit(X_train, y_train)

best_forest = grid_search.best_estimator_
print('Best Random Forest:', best_forest)

y_probs = best_forest.predict_proba(X_test)[:, 1]
fpr, tpr, thresholds = roc_curve(y_test, y_probs)
plt.plot(fpr, tpr)
plt.xlabel('False Positive Rate')
plt.ylabel('True Positive Rate')
plt.title('ROC Curve - Tuned Random Forest')
plt.show()

# Recall Score of Best Random Forest
y_pred = best_forest.predict(X_test)
print('Best Random Forest Recall:', recall_score(y_test, y_pred))

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
