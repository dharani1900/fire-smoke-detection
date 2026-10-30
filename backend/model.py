import torch
import torch.nn as nn
from torchvision import models

def build_model(num_classes: int = 2, pretrained: bool = True) -> nn.Module:
    """
    Builds a MobileNetV2 image classification model.
    Replaces the classification head for binary classification (normal vs hazard_detected).
    """
    weights = models.MobileNet_V2_Weights.DEFAULT if pretrained else None
    model = models.mobilenet_v2(weights=weights)

    # Freeze earlier feature extractor layers for transfer learning stability
    for param in model.features.parameters():
        param.requires_grad = False

    # Unfreeze the last convolutional block in features to adapt to maritime/industrial textures
    for param in model.features[-1].parameters():
        param.requires_grad = True

    in_features = model.classifier[1].in_features
    model.classifier = nn.Sequential(
        nn.Dropout(p=0.3),
        nn.Linear(in_features=in_features, out_features=num_classes)
    )

    return model
