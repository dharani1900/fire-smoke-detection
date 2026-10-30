import os
import json
import torch
import numpy as np
from torch.utils.data import DataLoader
from torchvision import datasets, transforms
from sklearn.metrics import (
    accuracy_score,
    precision_recall_fscore_support,
    confusion_matrix,
    classification_report
)

from model import build_model

def evaluate():
    project_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    dataset_dir = os.path.join(project_dir, "dataset")
    models_dir = os.path.join(project_dir, "models")
    results_dir = os.path.join(project_dir, "results")

    model_path = os.path.join(models_dir, "best_model.pth")
    config_path = os.path.join(models_dir, "model_config.json")

    if not os.path.exists(model_path) or not os.path.exists(config_path):
        raise FileNotFoundError(f"Model checkpoint not found. Train first with train.py")

    with open(config_path, "r") as f:
        config = json.load(f)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"[*] Evaluation device: {device}")

    # Pure evaluation transforms - NO augmentation
    test_transform = transforms.Compose([
        transforms.Resize(tuple(config["image_size"])),
        transforms.ToTensor(),
        transforms.Normalize(mean=config["normalization"]["mean"], std=config["normalization"]["std"])
    ])

    test_path = os.path.join(dataset_dir, "test")
    test_dataset = datasets.ImageFolder(test_path, transform=test_transform)
    test_loader = DataLoader(test_dataset, batch_size=16, shuffle=False, num_workers=0)

    class_to_idx = test_dataset.class_to_idx
    target_names = [k for k, v in sorted(class_to_idx.items(), key=lambda item: item[1])]
    print(f"[*] Test classes: {class_to_idx}")

    model = build_model(num_classes=len(class_to_idx), pretrained=False)
    model.load_state_dict(torch.load(model_path, map_location=device))
    model.to(device)
    model.eval()

    all_preds = []
    all_labels = []
    all_probs = []

    with torch.no_grad():
        for images, labels in test_loader:
            images = images.to(device)
            outputs = model(images)
            probs = torch.softmax(outputs, dim=1)
            _, preds = torch.max(outputs, 1)

            all_preds.extend(preds.cpu().numpy())
            all_labels.extend(labels.numpy())
            all_probs.extend(probs.cpu().numpy()[:, 1]) # probability of hazard class

    all_preds = np.array(all_preds)
    all_labels = np.array(all_labels)

    # Calculate exact metrics
    acc = float(accuracy_score(all_labels, all_preds))
    prec, rec, f1, sup = precision_recall_fscore_support(all_labels, all_preds, average=None, zero_division=0)
    macro_prec, macro_rec, macro_f1, _ = precision_recall_fscore_support(all_labels, all_preds, average='macro', zero_division=0)
    weighted_prec, weighted_rec, weighted_f1, _ = precision_recall_fscore_support(all_labels, all_preds, average='weighted', zero_division=0)
    
    cm = confusion_matrix(all_labels, all_preds)

    # Detailed per-class metrics dictionary
    per_class_metrics = {}
    for idx, name in enumerate(target_names):
        per_class_metrics[name] = {
            "precision": round(float(prec[idx]), 4),
            "recall": round(float(rec[idx]), 4),
            "f1_score": round(float(f1[idx]), 4),
            "support": int(sup[idx])
        }

    # Binary confusion components (0: normal, 1: hazard_detected)
    tn, fp, fn, tp = cm.ravel()

    report = {
        "evaluation_dataset": "held-out independent test set",
        "total_test_images": len(all_labels),
        "test_distribution": {
            target_names[0]: int(np.sum(all_labels == 0)),
            target_names[1]: int(np.sum(all_labels == 1))
        },
        "overall_accuracy": round(acc, 4),
        "macro_avg": {
            "precision": round(float(macro_prec), 4),
            "recall": round(float(macro_rec), 4),
            "f1_score": round(float(macro_f1), 4)
        },
        "weighted_avg": {
            "precision": round(float(weighted_prec), 4),
            "recall": round(float(weighted_rec), 4),
            "f1_score": round(float(weighted_f1), 4)
        },
        "per_class": per_class_metrics,
        "confusion_matrix": {
            "matrix": cm.tolist(),
            "labels": target_names,
            "true_negatives": int(tn),
            "false_positives": int(fp),
            "false_negatives": int(fn),
            "true_positives": int(tp)
        },
        "hazard_detection_recall": round(float(rec[1]), 4),
        "limitations": [
            "Test set consists of 117 maritime & harbor surveillance images.",
            "Visual features correlate with visible smoke and flame patterns, not invisible chemical gas molecules.",
            "Performance under extreme weather conditions (dense sea fog, night CCTV without illumination) may vary.",
            "Does not replace physical gas chromatography or industrial gas detector instruments."
        ]
    }

    report_path = os.path.join(results_dir, "evaluation_results.json")
    with open(report_path, "w") as f:
        json.dump(report, f, indent=2)

    print("\n" + "="*50)
    print("      HELD-OUT TEST SET EVALUATION REPORT")
    print("="*50)
    print(f"Total Test Images: {len(all_labels)}")
    print(f"Overall Accuracy:  {acc*100:.2f}%\n")
    print("Per-Class Metrics:")
    for name, m in per_class_metrics.items():
        print(f"  [{name.upper()}]")
        print(f"    - Precision: {m['precision']:.4f}")
        print(f"    - Recall:    {m['recall']:.4f}")
        print(f"    - F1-Score:  {m['f1_score']:.4f}")
        print(f"    - Support:   {m['support']}")

    print("\nConfusion Matrix:")
    print(f"               Predicted {target_names[0]:<15} Predicted {target_names[1]}")
    print(f"Actual {target_names[0]:<15} {tn:<24} {fp} (False Positives)")
    print(f"Actual {target_names[1]:<15} {fn:<24} {tp} (True Positives)")
    print("\nSummary:")
    print(f"  - Hazard Recall (Safety Critical): {rec[1]*100:.2f}%")
    print(f"  - False Negatives (Missed Hazards): {fn}")
    print(f"  - False Positives (False Alarms):   {fp}")
    print("="*50)
    print(f"[*] Full report saved to: {report_path}\n")

    return report

if __name__ == "__main__":
    evaluate()
