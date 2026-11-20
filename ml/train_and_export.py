import json
import os
import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from skl2onnx import convert_sklearn
from skl2onnx.common.data_types import FloatTensorType, StringTensorType

DATA_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "character_problems.json")
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "backend", "models_ai")
os.makedirs(OUTPUT_DIR, exist_ok=True)

with open(DATA_PATH, encoding="utf-8") as f:
    raw_data = json.load(f)

print(f"Loaded {len(raw_data)} incidents from {DATA_PATH}")

# -------------------------------------------------------------
# 1. ROUTING HINT MODEL
# -------------------------------------------------------------
# Train on text features -> assignedGroupName
df_routing = []
for d in raw_data:
    group = d.get("assignedGroupName", "")
    # Exclude coordinator group from training labels if possible, or keep if that's the only one
    if not group:
        continue
    text = f"{d.get('productName', '')} {d.get('service', '')} {d.get('scenarioName', '')} {d.get('header', '')} {d.get('description', '')}"
    df_routing.append({
        "text": text,
        "group": group
    })

df = pd.DataFrame(df_routing)
print(f"Routing training samples: {len(df)}, unique groups: {df['group'].nunique()}")

# TF-IDF Vectorizer + LogisticRegression
vectorizer = TfidfVectorizer(max_features=300, ngram_range=(1, 2))
X_text = vectorizer.fit_transform(df["text"]).toarray()
y = df["group"]

routing_clf = LogisticRegression(max_iter=500, C=1.0)
routing_clf.fit(X_text, y)

classes = list(routing_clf.classes_)
vocab = vectorizer.vocabulary_
idf = vectorizer.idf_.tolist()
weights = routing_clf.coef_.tolist()
intercept = routing_clf.intercept_.tolist()

# Export pure json model for Go native fast evaluation
routing_json = {
    "model_name": "routing_hint",
    "classes": classes,
    "vocab": {k: int(v) for k, v in vocab.items()},
    "idf": idf,
    "weights": weights,
    "intercept": intercept
}

with open(os.path.join(OUTPUT_DIR, "routing_hint_model.json"), "w", encoding="utf-8") as f:
    json.dump(routing_json, f, ensure_ascii=False, indent=2)

print("Exported routing_hint_model.json")

# Also export ONNX for routing
initial_type_routing = [('float_input', FloatTensorType([None, X_text.shape[1]]))]
onnx_routing = convert_sklearn(routing_clf, initial_types=initial_type_routing)
with open(os.path.join(OUTPUT_DIR, "routing_hint.onnx"), "wb") as f:
    f.write(onnx_routing.SerializeToString())
print("Exported routing_hint.onnx")

# -------------------------------------------------------------
# 2. RISK ASSESSMENT MODEL
# -------------------------------------------------------------
# Features:
# [priorityId, urgencyId, impactId, isClientService (0/1), hasCriticalKeywords (0/1), ageHours, hasSLA_Risk]
# Synthetic/calibrated training data based on domain rules + data
CRITICAL_KEYWORDS = ["отказ", "авария", "массовый", "недоступен", "падение", "критический", "срочно", "блок", "dead", "fatal", "outage"]

X_risk = []
y_risk = []

# Generate balanced samples covering spectrum of incidents
for p in [1, 2, 3, 4]:
    for u in [1, 2, 3, 4]:
        for imp in [1, 2, 3, 4]:
            for is_client in [0, 1]:
                for has_kw in [0, 1]:
                    # Domain score calculation:
                    score = (p * 0.3) + (u * 0.25) + (imp * 0.25) + (is_client * 0.1) + (has_kw * 0.1)
                    # Normalize roughly 1..4 -> probability 0..1
                    prob = max(0.01, min(0.99, (score - 1.0) / 3.0))
                    # Add data points
                    X_risk.append([float(p), float(u), float(imp), float(is_client), float(has_kw)])
                    y_risk.append(1 if prob > 0.6 else 0)

X_risk = np.array(X_risk, dtype=np.float32)
y_risk = np.array(y_risk, dtype=np.int32)

risk_clf = LogisticRegression(max_iter=500)
risk_clf.fit(X_risk, y_risk)

initial_type_risk = [('float_input', FloatTensorType([None, 5]))]
onnx_risk = convert_sklearn(risk_clf, initial_types=initial_type_risk)
with open(os.path.join(OUTPUT_DIR, "risk_assessment.onnx"), "wb") as f:
    f.write(onnx_risk.SerializeToString())
print("Exported risk_assessment.onnx")

risk_json = {
    "model_name": "risk_assessment",
    "features": ["priorityId", "urgencyId", "impactId", "isClientService", "hasCriticalKeywords"],
    "weights": risk_clf.coef_.tolist(),
    "intercept": risk_clf.intercept_.tolist(),
    "classes": risk_clf.classes_.tolist(),
    "critical_keywords": CRITICAL_KEYWORDS
}

with open(os.path.join(OUTPUT_DIR, "risk_assessment_model.json"), "w", encoding="utf-8") as f:
    json.dump(risk_json, f, ensure_ascii=False, indent=2)

print("Exported risk_assessment_model.json")
print("ML training and ONNX export completed successfully!")
