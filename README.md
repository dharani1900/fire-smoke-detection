# Industrial & Maritime Fire and Smoke Hazard Detection System
**Project: `mini_project`**  
*A separate, dedicated computer vision project for real-world optical fire and combustion smoke hazard classification using PyTorch MobileNetV2, FastAPI, and React.*

---

## 1. Project Overview

This project implements an end-to-end computer vision pipeline to screen maritime vessel and industrial facility images for visible combustion hazards (open fire flames and billowing smoke plumes).

### Core Features:
* **Deep Transfer Learning**: MobileNetV2 architecture fine-tuned on real-world maritime/port surveillance and press incident photography.
* **Imbalance Handling**: Inverse class-frequency weighted `CrossEntropyLoss` (1.0 vs 2.55) to prevent majority-class bias and prioritize high safety-critical recall.
* **FastAPI Backend**: REST endpoints for health monitoring, model metadata, test evaluation reports, and live image inference with input validation and 10MB size limits.
* **Modern React Frontend**: Dark industrial theme with real-time inference, confidence gauges, risk action protocols, and an interactive test evaluation dashboard.
* **Strict Scientific Boundaries**: Explicit operational notices that the system evaluates optical RGB imagery for visible fire/smoke and **does NOT measure invisible gas concentrations, chemical leakage, or replace certified industrial gas detectors**.

---

## 2. Dataset Structure & Verified Counts

The dataset consists of **1,193 genuine, uncorrupted real-world photographs** (excluding 2 unannotated background frames):

```text
mini_project/dataset/
├── train/
│   ├── normal/            (603 images)
│   └── hazard_detected/   (236 images)
├── validation/
│   ├── normal/            (169 images)
│   └── hazard_detected/   (68 images)
└── test/
    ├── normal/            (83 images)
    └── hazard_detected/   (34 images)
```

* **Class 0 (`normal`):** Vessels and industrial harbor facilities with **no visible fire or smoke**.
* **Class 1 (`hazard_detected`):** Active open flames, combustion smoke plumes, or concurrent fire and smoke.

---

## 3. Measured Held-Out Test Set Evaluation Results

Evaluated once on the independent held-out test partition (**117 unseen images**):

| Metric | Score | Support |
| :--- | :---: | :---: |
| **Overall Accuracy** | **99.15%** | 117 images |
| **Hazard Class Precision** | **97.14%** (0.9714) | 34 images |
| **Hazard Class Recall** | **100.00%** (1.0000) | 34 images |
| **Hazard Class F1-Score** | **98.55%** (0.9855) | 34 images |
| **Normal Class Precision** | **100.00%** (1.0000) | 83 images |
| **Normal Class Recall** | **98.80%** (0.9880) | 83 images |
| **Normal Class F1-Score** | **99.39%** (0.9939) | 83 images |

### Confusion Matrix:
| Actual \ Predicted | Predicted Hazard | Predicted Normal |
| :--- | :---: | :---: |
| **Actual Hazard** | **34** (True Positives) | **0** (False Negatives / Missed Hazards) |
| **Actual Normal** | **1** (False Positive) | **82** (True Negatives) |

*Full metrics stored in:* `mini_project/results/evaluation_results.json`

---

## 4. Setup & Running Instructions

### Prerequisites
* Python 3.10+
* Node.js 18+

### Step 1: Run the FastAPI Backend (Port 8001)
From the project directory:
```powershell
cd C:\Users\DHARANI\.gemini\antigravity\scratch\mini_project
# Activate your Python virtual environment (e.g., using chemical_monitor venv)
C:\Users\DHARANI\.gemini\antigravity\scratch\chemical_monitor\backend\venv\Scripts\activate

# Start API server
python backend/main.py
```
* Backend API available at: `http://127.0.0.1:8001`
* Interactive API docs: `http://127.0.0.1:8001/docs`

### Step 2: Run the React Frontend (Port 5174)
Open a second terminal:
```powershell
cd C:\Users\DHARANI\.gemini\antigravity\scratch\mini_project\frontend
npm run dev
```
* Open your browser at: `http://localhost:5174`

---

## 5. Model Retraining and Evaluation Commands

If you wish to re-run the pipeline from scratch:
```powershell
# 1. Structure splits from raw dataset
python backend/utils/prepare_dataset.py

# 2. Train MobileNetV2 classifier
python backend/train.py

# 3. Evaluate on held-out test set
python backend/evaluate.py

# 4. Run unit tests
python -m unittest tests/test_api.py
```

---

## 6. API Endpoints

* `GET /api/health` — Checks service and model loading status.
* `POST /api/predict` — Multipart file upload (`JPG`, `PNG`, `WEBP` up to 10MB); returns classification label, confidence, risk protocol, and limitations notice.
* `GET /api/model-info` — Returns architecture, class weights, best validation loss, and training configuration.
* `GET /api/metrics` — Returns the verified held-out test evaluation report and confusion matrix.

---

## 7. Known System Limitations

1. **Optical Image Scope:** The classifier recognizes visual features of smoke plumes and fire flames. It cannot identify colorless gases or measure ppm gas concentration.
2. **Domain Specificity:** The model was trained on maritime vessels, docks, and outdoor CCTV incident scenes. Performance on indoor rooms or small laboratory cabinets may differ without fine-tuning.
3. **Safety Advisory:** This software serves as an automated visual screening aid and does not substitute for certified fire alarms, human inspections, or physical gas chromatography sensors.
