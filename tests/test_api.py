import os
import sys
import unittest
import io
import json
from PIL import Image

# Add backend directory to sys.path
current_dir = os.path.dirname(os.path.abspath(__file__))
project_dir = os.path.dirname(current_dir)
backend_dir = os.path.join(project_dir, "backend")
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from predict import Predictor
from database import init_db, SessionLocal, User, DetectionRecord
import main
from visualization import generate_hazard_visualization

class TestInferencePipeline(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        init_db()
        cls.predictor = Predictor()
        cls.db = SessionLocal()

    @classmethod
    def tearDownClass(cls):
        cls.db.close()

    def test_predictor_loaded(self):
        """Verifies that the PyTorch MobileNetV2 model and configuration are loaded."""
        self.assertIsNotNone(self.predictor.model)
        self.assertIsNotNone(self.predictor.config)
        self.assertEqual(len(self.predictor.idx_to_class), 2)
        self.assertIn("normal", self.predictor.idx_to_class.values())
        self.assertIn("hazard_detected", self.predictor.idx_to_class.values())

    def test_prediction_output_structure(self):
        """Verifies that an image produces structured, well-typed prediction metrics."""
        img = Image.new("RGB", (224, 224), color=(50, 100, 150))
        result = self.predictor.predict_image(img)

        self.assertIn("predicted_class", result)
        self.assertIn(result["predicted_class"], ["normal", "hazard_detected"])
        self.assertIn("confidence", result)
        self.assertTrue(0.0 <= result["confidence"] <= 1.0)
        
        self.assertIn("probabilities", result)
        self.assertIn("normal", result["probabilities"])
        self.assertIn("hazard_detected", result["probabilities"])
        
        self.assertIn("risk_assessment", result)
        self.assertIn("risk_level", result["risk_assessment"])
        self.assertIn("alarm_triggered", result["risk_assessment"])
        self.assertIn("limitations_notice", result)

    def test_greyscale_and_rgba_conversion(self):
        """Verifies that non-RGB images are safely converted and handled."""
        gray_img = Image.new("L", (100, 100), color=128)
        result = self.predictor.predict_image(gray_img)
        self.assertIn(result["predicted_class"], ["normal", "hazard_detected"])

        rgba_img = Image.new("RGBA", (150, 150), color=(255, 0, 0, 128))
        result_rgba = self.predictor.predict_image(rgba_img)
        self.assertIn(result_rgba["predicted_class"], ["normal", "hazard_detected"])

    def test_evaluation_report_exists(self):
        """Verifies that evaluation_results.json exists and contains genuine test metrics."""
        report_path = os.path.join(project_dir, "results", "evaluation_results.json")
        self.assertTrue(os.path.exists(report_path))
        with open(report_path, "r") as f:
            data = json.load(f)
        self.assertIn("overall_accuracy", data)
        self.assertIn("confusion_matrix", data)
        self.assertIn("per_class", data)
        self.assertEqual(data["total_test_images"], 117)

    def test_backend_health_and_info(self):
        """Verifies health check and model info backend handlers."""
        health = main.health_check()
        self.assertEqual(health["status"], "healthy")

        info = main.get_model_info()
        self.assertIn("model_architecture", info)
        self.assertEqual(info["model_architecture"], "MobileNetV2")

    def test_backend_auth_and_dashboard(self):
        """Verifies authentication and dashboard stats calculation."""
        login_res = main.login({"email": "admin@safety.org", "password": "admin123"}, db=self.db)
        self.assertIn("access_token", login_res)

        stats = main.get_dashboard_stats(db=self.db)
        self.assertIn("total_images", stats)
        self.assertIn("leakage_predictions", stats)
        self.assertIn("safe_predictions", stats)
        self.assertIn("detections_over_time", stats)

    def test_visualization_generation(self):
        """Verifies that the explainability overlay generator produces a valid image file."""
        test_img_path = os.path.join(backend_dir, "storage", "test_sample.jpg")
        test_vis_path = os.path.join(backend_dir, "storage", "test_sample_vis.jpg")
        
        # Create test input image
        img = Image.new("RGB", (300, 300), color=(180, 80, 40))
        img.save(test_img_path)

        out_path = generate_hazard_visualization(
            image_path=test_img_path,
            output_path=test_vis_path,
            is_hazard=True,
            confidence=0.95
        )
        self.assertTrue(os.path.exists(out_path))
        self.assertTrue(os.path.getsize(out_path) > 0)

        # Cleanup
        if os.path.exists(test_img_path):
            os.remove(test_img_path)
        if os.path.exists(test_vis_path):
            os.remove(test_vis_path)

if __name__ == "__main__":
    unittest.main()
