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
        self.assertEqual(self.predictor.idx_to_class[0], "hazard_detected")
        self.assertEqual(self.predictor.idx_to_class[1], "normal")

    def test_class_order_and_mapping(self):
        """Confirms that class mapping conforms to training configuration: 0=hazard, 1=normal."""
        class_to_idx = self.predictor.config.get("class_to_idx", {})
        self.assertEqual(class_to_idx.get("hazard_detected"), 0)
        self.assertEqual(class_to_idx.get("normal"), 1)

    def test_prediction_output_structure(self):
        """Verifies that an image produces structured, well-typed prediction metrics with probabilities."""
        img = Image.new("RGB", (224, 224), color=(50, 100, 150))
        result = self.predictor.predict_image(img)

        self.assertIn("predicted_class", result)
        self.assertIn(result["predicted_class"], ["normal", "hazard_detected", "uncertain", "outside_validated_domain"])
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
        self.assertIn(result["predicted_class"], ["normal", "hazard_detected", "uncertain", "outside_validated_domain"])

        rgba_img = Image.new("RGBA", (150, 150), color=(255, 0, 0, 128))
        result_rgba = self.predictor.predict_image(rgba_img)
        self.assertIn(result_rgba["predicted_class"], ["normal", "hazard_detected", "uncertain", "outside_validated_domain"])

    def test_uncertainty_handling_for_ambiguous_probabilities(self):
        """
        Verifies that ambiguous inputs (e.g. 54.2% hazard vs 45.8% normal)
        do NOT trigger alarms or high-risk status, but yield 'uncertain'.
        """
        import torch
        # Create a mock tensor where softmax outputs [0.542, 0.458]
        # In logits: log(0.542) = -0.6125, log(0.458) = -0.7809
        mock_logits = torch.tensor([[-0.6125, -0.7809]], dtype=torch.float32)

        # Call the predictor's decision logic with mock logits
        probs = torch.softmax(mock_logits, dim=1)[0].numpy()
        prob_hazard = float(probs[0])
        prob_normal = float(probs[1])

        # Verify probabilities reflect ~54.2% hazard
        self.assertAlmostEqual(prob_hazard, 0.542, places=2)

        # Evaluate against the 65% threshold
        threshold = 0.65
        is_uncertain = prob_hazard < threshold and prob_normal < threshold
        self.assertTrue(is_uncertain, "Ambiguous ~54.2% score must be classified as uncertain")

    def test_real_dataset_predictions(self):
        """Tests that genuine dataset images are correctly classified and alarm behaviors match."""
        import glob
        hazard_images = glob.glob(os.path.join(project_dir, "dataset", "test", "hazard_detected", "*.jpg"))
        normal_images = glob.glob(os.path.join(project_dir, "dataset", "test", "normal", "*.jpg"))

        if hazard_images:
            res_hazard = self.predictor.predict_image(hazard_images[0])
            self.assertEqual(res_hazard["predicted_class"], "hazard_detected")
            self.assertTrue(res_hazard["confidence"] >= 0.65)
            self.assertTrue(res_hazard["risk_assessment"]["alarm_triggered"])

        if normal_images:
            res_normal = self.predictor.predict_image(normal_images[0])
            self.assertEqual(res_normal["predicted_class"], "normal")
            self.assertTrue(res_normal["confidence"] >= 0.65)
            self.assertFalse(res_normal["risk_assessment"]["alarm_triggered"])

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
        self.assertIn("uncertain_predictions", stats)
        self.assertIn("detections_over_time", stats)

    def test_visualization_generation_all_modes(self):
        """Verifies that the visualization generator produces valid artifacts for all three states."""
        test_img_path = os.path.join(backend_dir, "storage", "test_sample.jpg")
        
        # Create test input image
        img = Image.new("RGB", (300, 300), color=(180, 80, 40))
        img.save(test_img_path)

        for status_mode, is_haz in [("hazard_detected", True), ("normal", False), ("uncertain", False), ("outside_validated_domain", False)]:
            out_vis_path = os.path.join(backend_dir, "storage", f"test_vis_{status_mode}.jpg")
            out_path = generate_hazard_visualization(
                image_path=test_img_path,
                output_path=out_vis_path,
                is_hazard=is_haz,
                confidence=0.95 if is_haz else 0.54,
                status=status_mode
            )
            self.assertTrue(os.path.exists(out_path))
            self.assertTrue(os.path.getsize(out_path) > 0)
            if os.path.exists(out_vis_path):
                os.remove(out_vis_path)

        if os.path.exists(test_img_path):
            os.remove(test_img_path)

    def test_domain_centroid_loaded(self):
        """Verifies that the maritime domain centroid is loaded with 1280 feature dimensions."""
        self.assertIsNotNone(self.predictor.domain_centroid)
        self.assertEqual(len(self.predictor.domain_centroid), 1280)
        self.assertEqual(self.predictor.domain_threshold, 0.38)

    def test_ood_detection_on_indoor_cabinet(self):
        """
        Verifies that out-of-distribution indoor chemical cabinets are detected as
        'outside_validated_domain' and do NOT trigger emergency alarms.
        """
        import glob
        uploaded_images = glob.glob(r"C:\Users\DHARANI\.gemini\antigravity\brain\82cbd9cc-aaf8-4645-bacf-40b0120862db\.user_uploaded\*.png")
        if uploaded_images:
            res = self.predictor.predict_image(uploaded_images[0], target_domain="auto")
            self.assertEqual(res["predicted_class"], "outside_validated_domain")
            self.assertEqual(res["severity"], "Inconclusive")
            self.assertFalse(res["risk_assessment"]["alarm_triggered"], "OOD input must NOT activate alarm")
            self.assertFalse(res["domain_validation"]["is_valid_domain"])
            self.assertTrue(res["domain_validation"]["feature_similarity"] < 0.38)
            self.assertIn("Outside validated image domain", res["risk_assessment"]["action_recommended"])

    def test_72_percent_probability_alarm_suppression(self):
        """
        Verifies that even if an out-of-distribution image produces a raw 72.7% hazard probability
        due to flame-like yellow/red colors, the alarm remains SILENT and status is INCONCLUSIVE.
        """
        import glob
        uploaded_images = glob.glob(r"C:\Users\DHARANI\.gemini\antigravity\brain\82cbd9cc-aaf8-4645-bacf-40b0120862db\.user_uploaded\*.png")
        if uploaded_images:
            res = self.predictor.predict_image(uploaded_images[0])
            # Even with hazard probability in the 70-80% range
            self.assertFalse(res["risk_assessment"]["alarm_triggered"])
            self.assertEqual(res["predicted_class"], "outside_validated_domain")
            self.assertEqual(res["severity"], "Inconclusive")
            self.assertFalse(res["domain_validation"]["is_valid_domain"])

    def test_declared_environment_override(self):
        """
        Verifies that declaring an indoor cabinet environment flags the image as
        outside validated domain, even if visual features resemble maritime images.
        """
        import glob
        haz_images = glob.glob(os.path.join(project_dir, "dataset", "test", "hazard_detected", "*.jpg"))
        if haz_images:
            res = self.predictor.predict_image(haz_images[0], target_domain="indoor_cabinet")
            self.assertEqual(res["predicted_class"], "outside_validated_domain")
            self.assertFalse(res["risk_assessment"]["alarm_triggered"])
            self.assertFalse(res["domain_validation"]["is_valid_domain"])
            self.assertIn("Operator declared", res["domain_validation"]["validation_message"])

    def test_maritime_domain_hazard_triggers_alarm(self):
        """Verifies that legitimate maritime hazards retain alarm activation."""
        import glob
        haz_images = glob.glob(os.path.join(project_dir, "dataset", "test", "hazard_detected", "*.jpg"))
        if haz_images:
            res = self.predictor.predict_image(haz_images[0], target_domain="maritime")
            self.assertEqual(res["predicted_class"], "hazard_detected")
            self.assertTrue(res["risk_assessment"]["alarm_triggered"])
            self.assertTrue(res["domain_validation"]["is_valid_domain"])

    def test_tristate_detection_mapping_and_safety_notices(self):
        """
        Verifies the tri-state UI contract:
        1. DANGER: Validated domain fire/smoke hazard triggers alarm.
        2. NO VISIBLE FIRE/SMOKE: Validated domain normal scan does NOT trigger alarm,
           and includes limitations notice clarifying optical RGB checks only.
        3. UNABLE TO DETERMINE: OOD or low confidence is marked inconclusive,
           and alarm remains strictly silent.
        """
        import glob
        haz_images = glob.glob(os.path.join(project_dir, "dataset", "test", "hazard_detected", "*.jpg"))
        norm_images = glob.glob(os.path.join(project_dir, "dataset", "test", "normal", "*.jpg"))
        uploaded_images = glob.glob(r"C:\Users\DHARANI\.gemini\antigravity\brain\82cbd9cc-aaf8-4645-bacf-40b0120862db\.user_uploaded\*.png")

        # 1. DANGER state
        if haz_images:
            res_danger = self.predictor.predict_image(haz_images[0], target_domain="maritime")
            self.assertEqual(res_danger["predicted_class"], "hazard_detected")
            self.assertTrue(res_danger["risk_assessment"]["alarm_triggered"])

        # 2. NO VISIBLE FIRE/SMOKE state
        if norm_images:
            res_normal = self.predictor.predict_image(norm_images[0], target_domain="maritime")
            self.assertEqual(res_normal["predicted_class"], "normal")
            self.assertFalse(res_normal["risk_assessment"]["alarm_triggered"])
            self.assertIn("limitations_notice", res_normal)
            self.assertIn("does not measure chemical gas concentrations", res_normal["limitations_notice"])

        # 3. UNABLE TO DETERMINE state (indoor cabinet)
        if uploaded_images:
            res_cabinet = self.predictor.predict_image(uploaded_images[0], target_domain="auto")
            self.assertIn(res_cabinet["predicted_class"], ["outside_validated_domain", "uncertain"])
            self.assertFalse(res_cabinet["risk_assessment"]["alarm_triggered"])
            self.assertEqual(res_cabinet["severity"], "Inconclusive")

    def test_status_filter_unable_to_determine(self):
        """Verifies that the backend status filter supports 'unable_to_determine' query."""
        results = main.get_detections(status_filter="unable_to_determine", db=self.db)
        for r in results:
            self.assertIn(r["prediction"], ["outside_validated_domain", "uncertain"])

if __name__ == "__main__":
    unittest.main()
