import os
import cv2
import numpy as np
from PIL import Image

def generate_hazard_visualization(
    image_path: str,
    output_path: str,
    is_hazard: bool = True,
    confidence: float = 0.85,
    status: str = None
) -> str:
    """
    Generates an illustrative visual inspection artifact.
    NOTE: This is an illustrative simulation overlay, NOT a genuine Grad-CAM activation map 
    and NOT a physical chemical gas measurement. Ordinary RGB cameras cannot detect colorless 
    or invisible chemical vapors.
    """
    img_bgr = cv2.imread(image_path)
    if img_bgr is None:
        raise ValueError(f"Could not read image from {image_path}")

    height, width = img_bgr.shape[:2]
    
    # Determine resolved status
    current_status = status or ("hazard_detected" if is_hazard else "normal")

    if current_status == "uncertain":
        # Amber banner for inconclusive / uncertain predictions (no fake plume!)
        overlay = img_bgr.copy()
        banner_h = max(42, int(height * 0.08))
        # Amber / Dark Orange in BGR: (0, 140, 255)
        cv2.rectangle(overlay, (0, height - banner_h), (width, height), (0, 140, 255), -1)
        combined = cv2.addWeighted(overlay, 0.90, img_bgr, 0.10, 0)
        cv2.putText(
            combined,
            "INCONCLUSIVE / UNCERTAIN - MANUAL INSPECTION REQUIRED",
            (15, height - int(banner_h * 0.45)),
            cv2.FONT_HERSHEY_SIMPLEX,
            max(0.42, width / 1250.0),
            (255, 255, 255),
            2,
            cv2.LINE_AA
        )
        cv2.putText(
            combined,
            "Confidence below 65% threshold. RGB camera cannot detect invisible vapors.",
            (15, height - int(banner_h * 0.15)),
            cv2.FONT_HERSHEY_SIMPLEX,
            max(0.34, width / 1500.0),
            (240, 240, 240),
            1,
            cv2.LINE_AA
        )
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        cv2.imwrite(output_path, combined)
        return output_path

    if current_status == "normal" or not is_hazard:
        # Green status banner for verified nominal conditions (no fake plume!)
        overlay = img_bgr.copy()
        banner_h = max(42, int(height * 0.08))
        # Emerald Green in BGR: (34, 197, 94)
        cv2.rectangle(overlay, (0, height - banner_h), (width, height), (34, 197, 94), -1)
        combined = cv2.addWeighted(overlay, 0.90, img_bgr, 0.10, 0)
        cv2.putText(
            combined,
            "SAFE STATUS - NO VISIBLE FIRE OR SMOKE DETECTED",
            (15, height - int(banner_h * 0.45)),
            cv2.FONT_HERSHEY_SIMPLEX,
            max(0.42, width / 1250.0),
            (255, 255, 255),
            2,
            cv2.LINE_AA
        )
        cv2.putText(
            combined,
            "Optical RGB evaluation nominal. Does not measure chemical gas concentration.",
            (15, height - int(banner_h * 0.15)),
            cv2.FONT_HERSHEY_SIMPLEX,
            max(0.34, width / 1500.0),
            (240, 240, 240),
            1,
            cv2.LINE_AA
        )
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        cv2.imwrite(output_path, combined)
        return output_path

    # If hazard predicted: generate simulated thermal/flame risk plume
    x = np.linspace(-2, 2, width)
    y = np.linspace(-2, 2, height)
    xx, yy = np.meshgrid(x, y)
    
    # Plume centered in upper/middle visual field
    heatmap_norm = np.exp(-((xx - 0.1)**2 / 0.7 + (yy + 0.15)**2 / 0.5))
    heatmap_norm = (heatmap_norm - heatmap_norm.min()) / (heatmap_norm.max() - heatmap_norm.min() + 1e-8)

    # Threshold plume shape
    plume_mask = np.clip((heatmap_norm - 0.18) / 0.82, 0, 1)

    # Colorize with JET colormap
    heatmap_uint8 = np.uint8(255 * plume_mask)
    color_plume = cv2.applyColorMap(heatmap_uint8, cv2.COLORMAP_JET)

    # Blend with original
    alpha_channel = (plume_mask * 0.65).astype(np.float32)
    alpha_3d = np.dstack([alpha_channel, alpha_channel, alpha_channel])

    blended = (color_plume.astype(np.float32) * alpha_3d + img_bgr.astype(np.float32) * (1.0 - alpha_3d)).astype(np.uint8)

    # Add plume contour outline
    contours, _ = cv2.findContours(heatmap_uint8, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    cv2.drawContours(blended, contours, -1, (0, 0, 255), 2)

    # Add Intensity Legend Bar (Bottom Right)
    legend_w = min(180, int(width * 0.35))
    legend_h = 18
    legend_x = width - legend_w - 20
    legend_y = height - legend_h - 30

    if legend_y > 40 and legend_x > 20:
        cv2.rectangle(blended, (legend_x - 10, legend_y - 22), (legend_x + legend_w + 10, legend_y + legend_h + 18), (15, 23, 42), -1)
        cv2.putText(blended, "Illustrative Simulation Density", (legend_x, legend_y - 6), cv2.FONT_HERSHEY_SIMPLEX, 0.35, (226, 232, 240), 1, cv2.LINE_AA)

        for i in range(legend_w):
            val = int(255 * (i / legend_w))
            color = cv2.applyColorMap(np.array([[val]], dtype=np.uint8), cv2.COLORMAP_JET)[0][0]
            cv2.line(blended, (legend_x + i, legend_y), (legend_x + i, legend_y + legend_h), color.tolist(), 1)

        cv2.putText(blended, "Low", (legend_x, legend_y + legend_h + 14), cv2.FONT_HERSHEY_SIMPLEX, 0.32, (148, 163, 184), 1, cv2.LINE_AA)
        cv2.putText(blended, "High", (legend_x + legend_w - 25, legend_y + legend_h + 14), cv2.FONT_HERSHEY_SIMPLEX, 0.32, (148, 163, 184), 1, cv2.LINE_AA)

    # Red warning disclaimer banner burned into artifact
    banner_height = 42
    banner = np.zeros((banner_height, width, 3), dtype=np.uint8)
    banner[:] = (229, 57, 53) # Danger Red (BGR)

    cv2.putText(
        banner,
        "ILLUSTRATIVE SIMULATION -- NOT A MEASUREMENT (Optical RGB Only, No Gas Detection)",
        (12, 26),
        cv2.FONT_HERSHEY_SIMPLEX,
        max(0.38, width / 1400.0),
        (255, 255, 255),
        2,
        cv2.LINE_AA
    )

    final_img = np.vstack([blended, banner])
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    cv2.imwrite(output_path, final_img)
    return output_path
