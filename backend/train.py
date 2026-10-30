import os
import json
import time
import random
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from torchvision import datasets, transforms
from sklearn.metrics import accuracy_score, precision_recall_fscore_support

from model import build_model

def set_seed(seed=42):
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)

def get_transforms():
    # Only training data receives data augmentation
    train_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.RandomHorizontalFlip(p=0.5),
        transforms.RandomRotation(degrees=10),
        transforms.ColorJitter(brightness=0.1, contrast=0.1),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])

    # Validation and test data NEVER receive data augmentation
    val_test_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])

    return train_transform, val_test_transform

def train(epochs: int = 8, batch_size: int = 16, lr: float = 0.0002):
    set_seed(42)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"[*] Training device: {device}")

    project_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    dataset_dir = os.path.join(project_dir, "dataset")
    models_dir = os.path.join(project_dir, "models")
    results_dir = os.path.join(project_dir, "results")
    os.makedirs(models_dir, exist_ok=True)
    os.makedirs(results_dir, exist_ok=True)

    train_transform, val_transform = get_transforms()

    train_path = os.path.join(dataset_dir, "train")
    val_path = os.path.join(dataset_dir, "validation")

    train_dataset = datasets.ImageFolder(train_path, transform=train_transform)
    val_dataset = datasets.ImageFolder(val_path, transform=val_transform)

    class_to_idx = train_dataset.class_to_idx
    idx_to_class = {v: k for k, v in class_to_idx.items()}
    print(f"[*] Class mapping: {class_to_idx}")

    # Count samples per class in training set
    train_targets = [sample[1] for sample in train_dataset.samples]
    class_counts = np.bincount(train_targets)
    print(f"[*] Training class counts (0: normal, 1: hazard): {class_counts}")

    # Compute class weights to address 603 vs 236 imbalance
    total_samples = len(train_targets)
    weights = [total_samples / (len(class_counts) * c) for c in class_counts]
    class_weights = torch.tensor(weights, dtype=torch.float32).to(device)
    print(f"[*] Calculated class weights for loss: {class_weights.tolist()}")

    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True, num_workers=0)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False, num_workers=0)

    model = build_model(num_classes=len(class_to_idx), pretrained=True)
    model.to(device)

    criterion = nn.CrossEntropyLoss(weight=class_weights)
    # Fine-tune classifier and top feature layer with AdamW
    params_to_update = [p for p in model.parameters() if p.requires_grad]
    optimizer = optim.AdamW(params_to_update, lr=lr, weight_decay=1e-3)
    scheduler = optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode='min', factor=0.5, patience=2)

    best_val_loss = float('inf')
    best_model_path = os.path.join(models_dir, "best_model.pth")
    history = []

    print(f"\n[*] Starting training for {epochs} epochs...")
    start_time = time.time()

    for epoch in range(1, epochs + 1):
        # Training Phase
        model.train()
        running_loss = 0.0
        train_preds, train_labels = [], []

        for images, labels in train_loader:
            images, labels = images.to(device), labels.to(device)
            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()

            running_loss += loss.item() * images.size(0)
            _, preds = torch.max(outputs, 1)
            train_preds.extend(preds.cpu().numpy())
            train_labels.extend(labels.cpu().numpy())

        epoch_train_loss = running_loss / len(train_dataset)
        epoch_train_acc = accuracy_score(train_labels, train_preds)

        # Validation Phase
        model.eval()
        val_running_loss = 0.0
        val_preds, val_labels = [], []

        with torch.no_grad():
            for images, labels in val_loader:
                images, labels = images.to(device), labels.to(device)
                outputs = model(images)
                loss = criterion(outputs, labels)

                val_running_loss += loss.item() * images.size(0)
                _, preds = torch.max(outputs, 1)
                val_preds.extend(preds.cpu().numpy())
                val_labels.extend(labels.cpu().numpy())

        epoch_val_loss = val_running_loss / len(val_dataset)
        epoch_val_acc = accuracy_score(val_labels, val_preds)

        prec, rec, f1, _ = precision_recall_fscore_support(val_labels, val_preds, average='binary', zero_division=0)

        scheduler.step(epoch_val_loss)

        epoch_record = {
            "epoch": epoch,
            "train_loss": round(epoch_train_loss, 4),
            "train_accuracy": round(epoch_train_acc, 4),
            "val_loss": round(epoch_val_loss, 4),
            "val_accuracy": round(epoch_val_acc, 4),
            "val_hazard_precision": round(float(prec), 4),
            "val_hazard_recall": round(float(rec), 4),
            "val_hazard_f1": round(float(f1), 4)
        }
        history.append(epoch_record)

        print(f"Epoch {epoch:02d}/{epochs:02d} | Train Loss: {epoch_train_loss:.4f} Acc: {epoch_train_acc:.4f} | Val Loss: {epoch_val_loss:.4f} Acc: {epoch_val_acc:.4f} Hazard-Recall: {rec:.4f} F1: {f1:.4f}")

        # Save best model based on validation loss
        if epoch_val_loss < best_val_loss:
            best_val_loss = epoch_val_loss
            torch.save(model.state_dict(), best_model_path)
            print(f"  [+] Saved new best model checkpoint to {best_model_path}")

    elapsed_time = round(time.time() - start_time, 2)
    print(f"\n[*] Training finished in {elapsed_time}s. Best Val Loss: {best_val_loss:.4f}")

    # Save model metadata and config
    config = {
        "model_architecture": "MobileNetV2",
        "num_classes": len(class_to_idx),
        "class_to_idx": class_to_idx,
        "idx_to_class": idx_to_class,
        "image_size": [224, 224],
        "normalization": {
            "mean": [0.485, 0.456, 0.406],
            "std": [0.229, 0.224, 0.225]
        },
        "class_weights": weights,
        "epochs_trained": epochs,
        "batch_size": batch_size,
        "learning_rate": lr,
        "training_time_seconds": elapsed_time,
        "best_val_loss": round(best_val_loss, 4),
        "history": history
    }

    config_path = os.path.join(models_dir, "model_config.json")
    with open(config_path, "w") as f:
        json.dump(config, f, indent=2)

    curves_path = os.path.join(results_dir, "training_history.json")
    with open(curves_path, "w") as f:
        json.dump(history, f, indent=2)

    print(f"[*] Configuration saved to {config_path}")
    print(f"[*] Training history saved to {curves_path}")

if __name__ == "__main__":
    train(epochs=8, batch_size=16, lr=0.0002)
