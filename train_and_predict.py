"""
Trains a model that DECIDES the recovery action -- replacing the hardcoded
switch-statement logic with a learned function.

Target:  action_taken  (retry_now / retry_delayed / prompt_update_card /
                         no_action_respect_revoke / stop_max_attempts_reached)
Inputs:  error_reason, method, bank_code, card_network, amount,
         customer_tenure_days, hour_of_day, attempt_number,
         total_past_failures, total_past_successes, mandate_age_days

Usage: python train_and_predict.py
"""

import os
from dotenv import load_dotenv
load_dotenv()

import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, classification_report
from supabase import create_client

# ---- 1. Connect ----
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    raise ValueError("Set SUPABASE_URL and SUPABASE_SERVICE_KEY as environment variables first")

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# ---- 2. Pull transactions + customer_profiles + recovery_actions (need action_taken as target) ----
print("Fetching transactions...")
txns = supabase.table("transactions").select("*").eq("status", "failed").execute()
df = pd.DataFrame(txns.data)

print("Fetching customer profiles...")
profiles = supabase.table("customer_profiles").select("*").execute()
profiles_df = pd.DataFrame(profiles.data)

print("Fetching recovery_actions (has our target: action_taken)...")
actions = supabase.table("recovery_actions").select("*").execute()
actions_df = pd.DataFrame(actions.data)

# ---- 3. Merge ----
df = df.merge(profiles_df, on="customer_id", how="left")
df = df.merge(actions_df, left_on="id", right_on="transaction_id", how="inner", suffixes=("", "_ra"))

df["total_past_failures"] = df["total_past_failures"].fillna(0)
df["total_past_successes"] = df["total_past_successes"].fillna(0)
df = df[df["action_taken"].notna()]

print(f"Training on {len(df)} transactions")

# ---- 4. Encode features -- NOTE: action_taken and outcome are NOT in this list, they are excluded from input ----
cat_cols = ["error_reason", "method", "bank_code", "card_network"]
for c in cat_cols:
    df[c + "_enc"] = LabelEncoder().fit_transform(df[c].astype(str))

le_target = LabelEncoder()
df["target"] = le_target.fit_transform(df["action_taken"].astype(str))

features = [c + "_enc" for c in cat_cols] + [
    "amount", "customer_tenure_days", "hour_of_day", "attempt_number",
    "total_past_failures", "total_past_successes", "mandate_age_days"
]
features = [f for f in features if f in df.columns]
df[features] = df[features].fillna(0)

X = df[features]
y = df["target"]

# ---- 5. Train/test split + train ----
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=42, stratify=y)
clf = RandomForestClassifier(n_estimators=300, max_depth=10, random_state=42, class_weight="balanced")
clf.fit(X_train, y_train)

y_pred = clf.predict(X_test)
acc = accuracy_score(y_test, y_pred)
print(f"\nTest accuracy (predicting the recovery ACTION): {acc:.3f}")
print(classification_report(y_test, y_pred, target_names=le_target.classes_))

print("=== FEATURE IMPORTANCE (what drives the model's decision) ===")
importances = sorted(zip(features, clf.feature_importances_), key=lambda x: -x[1])
for feat, imp in importances:
    print(f"{feat}: {imp:.3f}")

# ---- 6. Model DECIDES the action for every transaction + confidence ----
all_preds = clf.predict(df[features])
all_probs = clf.predict_proba(df[features])
confidence_scores = all_probs.max(axis=1)
predicted_actions = le_target.inverse_transform(all_preds)

df["model_decided_action"] = predicted_actions
df["model_confidence"] = confidence_scores

# ---- 7. Write the MODEL's decision back into recovery_actions using bulk upsert ----
print("\nWriting model-decided actions back to Supabase recovery_actions table...")
existing_res = supabase.table("recovery_actions").select("id, transaction_id").execute()
existing_map = {r["transaction_id"]: r["id"] for r in (existing_res.data or [])}

payloads = []
for _, row in df.iterrows():
    tx_id = row["id"]
    payload = {
        "transaction_id": tx_id,
        "predicted_category": row["error_reason"],
        "action_taken": row["model_decided_action"],
        "confidence_score": round(float(row["model_confidence"]), 3),
        "reasoning": f"Model-decided action (confidence {row['model_confidence']:.2f}), based on error_reason={row['error_reason']}, history, and timing patterns."
    }
    if tx_id in existing_map:
        payload["id"] = existing_map[tx_id]
    payloads.append(payload)

supabase.table("recovery_actions").upsert(payloads).execute()
print(f"Updated {len(payloads)} rows -- action_taken is now decided by the trained model, not a hardcoded rule.")

# ---- 8. Plain-English summary ----
print("\n" + "="*60)
print("PLAIN-ENGLISH SUMMARY")
print("="*60)
print(f"The model looked at {len(df)} past failed payments and learned")
print(f"what action to take, just by studying the pattern -- no hardcoded rules.")
print(f"\nWhen tested on payments it had never seen before, it picked the")
print(f"correct action {acc*100:.0f}% of the time.")
print(f"\nThe single biggest factor in its decision was: '{importances[0][0]}'")
print(f"(responsible for {importances[0][1]*100:.0f}% of its decision-making).")
top_action = df['model_decided_action'].value_counts().idxmax()
print(f"\nMost common decision it made: '{top_action}'")
print(f"({(df['model_decided_action']==top_action).sum()} out of {len(df)} cases)")
missing_actions = set(le_target.classes_) - set(df['model_decided_action'].unique())
if missing_actions:
    print(f"\nNOTE: these possible actions never got used: {missing_actions}")
    print(f"(likely means your data never included a case that should trigger them)")
print("="*60)