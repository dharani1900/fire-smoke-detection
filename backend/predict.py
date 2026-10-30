import os
import json
from typing import Dict, Any, Union
from io import BytesIO
from PIL import Image
import torch
from torchvision import transforms

from model import build_model

def find_models_dir() -> str:
    """Finds canonical models directory across local and deployed cloud environments."""
    if os.environ.get("MODELS_DIR") and os.path.isdir(os.environ["MODELS_DIR"]):
        return os.environ["MODELS_DIR"]
    
    current_file_dir = os.path.dirname(os.path.abspath(__file__))
    parent_models = os.path.join(os.path.dirname(current_file_dir), "models")
    if os.path.isdir(parent_models) and os.path.exists(os.path.join(parent_models, "best_model.pth")):
        return parent_models

    cwd_models = os.path.join(os.getcwd(), "models")
    if os.path.isdir(cwd_models) and os.path.exists(os.path.join(cwd_models, "best_model.pth")):
        return cwd_models

    local_models = os.path.join(current_file_dir, "models")
    if os.path.isdir(local_models) and os.path.exists(os.path.join(local_models, "best_model.pth")):
        return local_models

    return parent_models

class Predictor:
    def __init__(self, model_path: str = None, config_path: str = None):
        models_dir = find_models_dir()
        
        self.model_path = model_path or os.path.join(models_dir, "best_model.pth")
        self.config_path = config_path or os.path.join(models_dir, "model_config.json")
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        
        self.model = None
        self.config = None
        self.transform = None
        self.idx_to_class = {}
        
        self._load()

    def _load(self):
        if not os.path.exists(self.model_path) or not os.path.exists(self.config_path):
            raise FileNotFoundError(f"Model or config not found at {self.model_path}")
            
        with open(self.config_path, "r") as f:
            self.config = json.load(f)
            
        self.idx_to_class = {int(k): v for k, v in self.config["idx_to_class"].items()}
        num_classes = self.config["num_classes"]
        
        self.model = build_model(num_classes=num_classes, pretrained=False)
        self.model.load_state_dict(torch.load(self.model_path, map_location=self.device))
        self.model.to(self.device)
        self.model.eval()
        
        # Build evaluation transform
        mean = self.config["normalization"]["mean"]
        std = self.config["normalization"]["std"]
        img_size = tuple(self.config["image_size"])
        
        self.transform = transforms.Compose([
            transforms.Resize(img_size),
            transforms.ToTensor(),
            transforms.Normalize(mean=mean, std=std)
        ])

    def predict_image(self, image_input: Union[str, bytes, BytesIO, Image.Image]) -> Dict[str, Any]:
        """
        Runs inference on an input image.
        Returns predicted class, confidence, softmax probabilities, risk assessment, and limitations.
        """
        if self.model is None:
            self._load()

        # Handle different input types
        if isinstance(image_input, torch.Tensor):
            tensor = image_input.to(self.device)
            if tensor.dim() == 3:
                tensor = tensor.unsqueeze(0)
        else:
            if isinstance(image_input, (str, os.PathLike)):
                img = Image.open(image_input)
            elif isinstance(image_input, bytes):
                img = Image.open(BytesIO(image_input))
            elif isinstance(image_input, BytesIO):
                img = Image.open(image_input)
            elif isinstance(image_input, Image.Image):
                img = image_input
            else:
                raise ValueError("Unsupported image input type.")

            # Ensure 3-channel RGB format
            if img.mode != "RGB":
                img = img.convert("RGB")

            tensor = self.transform(img).unsqueeze(0).to(self.device)

        with torch.no_grad():
            outputs = self.model(tensor)
            probs = torch.softmax(outputs, dim=1)[0].cpu().numpy()
            pred_idx = int(torch.argmax(outputs, dim=1).item())

        predicted_class = self.idx_to_class[pred_idx]
        confidence = float(probs[pred_idx])

        # Format probability distribution
        probabilities = {
            self.idx_to_class[i]: round(float(probs[i]), 4)
            for i in range(len(probs))
        }

        # Derive operational risk assessment
        if predicted_class == "hazard_detected":
            risk_level = "High Risk / Active Hazard"
            action_recommended = "Immediate visual confirmation required. Deploy safety personnel / verify infrared or sensor data."
            alarm_triggered = True
        else:
            risk_level = "Nominal / Normal Conditions"
            action_recommended = "Standard continuous monitoring."
            alarm_triggered = False

        return {
            "predicted_class": predicted_class,
            "confidence": round(confidence, 4),
            "probabilities": probabilities,
            "risk_assessment": {
                "risk_level": risk_level,
                "alarm_triggered": alarm_triggered,
                "action_recommended": action_recommended
            },
            "model_metadata": {
                "architecture": self.config.get("model_architecture", "MobileNetV2"),
                "best_val_loss": self.config.get("best_val_loss"),
                "input_resolution": self.config.get("image_size", [224, 224])
            },
            "limitations_notice": (
                "Notice: This prediction is based on optical RGB visual patterns (smoke/flame) "
                "from maritime & industrial imagery. It does not measure chemical gas concentrations "
                "or detect colorless/invisible hazardous vapors."
            )
        }

if __name__ == "__main__":
    predictor = Predictor()
    print("Predictor successfully initialized.")
