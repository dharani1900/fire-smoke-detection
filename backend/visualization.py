import os
import cv2
import numpy as np
from PIL import Image

def generate_hazard_visualization(
    image_path: str,
    output_path: str,
    is_hazard: bool = True,
    confidence: float = 0.85
) -> str:
    """
    Generates an explainable AI Grad-CAM / simulated hazard plume visualization overlay.
    Preserves original image, adds semi-transparent multi-colored thermal plume (blue->cyan->yellow->orange->red),
    draws an intensity legend, and burns in an explicit scientific disclaimer banner.
    """
    img_bgr = cv2.imread(image_path)
    if img_bgr is None:
        raise ValueError(f"Could not read image from {image_path}")

    height, width = img_bgr.shape[:2]

    if not is_hazard:
        # For safe / normal conditions, add green status banner
        overlay = img_bgr.copy()
        banner_h = max(35, int(height * 0.07))
        cv2.rectangle(overlay, (0, height - banner_h), (width, height), (34, 197, 94), -1)
        combined = cv2.addWeighted(overlay, 0.85, img_bgr, 0.15, 0)
        cv2.putText(
            combined,
            "SAFE STATUS - NO COMBUSTION HAZARDS DETECTED",
            (15, height - int(banner_h * 0.3)),
            cv2.FONT_HERSHEY_SIMPLEX,
            max(0.45, width / 1200.0),
            (255, 255, 255),
            2,
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
        cv2.putText(blended, "Simulated Risk Density", (legend_x, legend_y - 6), cv2.FONT_HERSHEY_SIMPLEX, 0.38, (226, 232, 240), 1, cv2.LINE_AA)

        for i in range(legend_w):
            val = int(255 * (i / legend_w))
            color = cv2.applyColorMap(np.array([[val]], dtype=np.uint8), cv2.COLORMAP_JET)[0][0]
            cv2.line(blended, (legend_x + i, legend_y), (legend_x + i, legend_y + legend_h), color.tolist(), 1)

        cv2.putText(blended, "Low", (legend_x, legend_y + legend_h + 14), cv2.FONT_HERSHEY_SIMPLEX, 0.32, (148, 163, 184), 1, cv2.LINE_AA)
        cv2.putText(blended, "High", (legend_x + legend_w - 25, legend_y + legend_h + 14), cv2.FONT_HERSHEY_SIMPLEX, 0.32, (148, 163, 184), 1, cv2.LINE_AA)

    # Red warning disclaimer banner burned into artifact
    banner_height = 40
    banner = np.zeros((banner_height, width, 3), dtype=np.uint8)
    banner[:] = (229, 57, 53) # Danger Red (BGR)

    cv2.putText(
        banner,
        "AI-SIMULATED HAZARD VISUALIZATION -- NOT A REAL GAS MEASUREMENT",
        (12, 26),
        cv2.FONT_HERSHEY_SIMPLEX,
        max(0.42, width / 1300.0),
        (255, 255, 255),
        2,
        cv2.LINE_AA
    )

    final_img = np.vstack([blended, banner])
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    cv2.imwrite(output_path, final_img)
    return output_path
