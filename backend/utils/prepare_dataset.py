import os
import shutil
from collections import Counter
from PIL import Image

def prepare_splits():
    raw_root = r"C:\Users\DHARANI\.gemini\antigravity\scratch\mini_project\dataset\original\archive\gas leak - fire detection 2.v1i.yolov8"
    dest_root = r"C:\Users\DHARANI\.gemini\antigravity\scratch\mini_project\dataset"

    splits_map = {
        "train": "train",
        "valid": "validation",
        "test": "test"
    }

    classes = ["fire", "gassmoke", "ship"]
    
    # Initialize destination directories
    for target_split in ["train", "validation", "test"]:
        for cat in ["normal", "hazard_detected"]:
            os.makedirs(os.path.join(dest_root, target_split, cat), exist_ok=True)

    summary = {}
    unannotated_files = []
    skipped_corrupt = []

    for src_split, target_split in splits_map.items():
        img_dir = os.path.join(raw_root, src_split, "images")
        lbl_dir = os.path.join(raw_root, src_split, "labels")

        counts = Counter()
        files = [f for f in os.listdir(img_dir) if f.lower().endswith((".jpg", ".jpeg", ".png", ".webp"))]

        for f in files:
            src_img_path = os.path.join(img_dir, f)
            # Use extended path on Windows for safety
            if not src_img_path.startswith("\\\\?\\"):
                ext_src_path = "\\\\?\\" + os.path.abspath(src_img_path)
            else:
                ext_src_path = src_img_path

            # Verify image can be opened and decoded
            try:
                with Image.open(ext_src_path) as im:
                    im.verify()
                # Re-open to read format & mode since verify closes file
                with Image.open(ext_src_path) as im:
                    im.convert("RGB")
            except Exception as e:
                skipped_corrupt.append((src_split, f, str(e)))
                continue

            lbl_filename = os.path.splitext(f)[0] + ".txt"
            lbl_path = os.path.join(lbl_dir, lbl_filename)
            if not lbl_path.startswith("\\\\?\\"):
                ext_lbl_path = "\\\\?\\" + os.path.abspath(lbl_path)
            else:
                ext_lbl_path = lbl_path

            classes_present = set()
            if os.path.exists(ext_lbl_path):
                with open(ext_lbl_path, "r", encoding="utf-8", errors="ignore") as lf:
                    for line in lf:
                        parts = line.strip().split()
                        if parts:
                            try:
                                cid = int(parts[0])
                                classes_present.add(cid)
                            except ValueError:
                                pass

            has_fire = 0 in classes_present
            has_smoke = 1 in classes_present
            has_ship = 2 in classes_present

            # Determine category:
            if has_fire or has_smoke:
                category = "hazard_detected"
            elif has_ship:
                category = "normal"
            else:
                # Unannotated or background frame - exclude per user instructions
                unannotated_files.append((src_split, f))
                continue

            # Shorten destination filename to avoid Windows MAX_PATH issues
            # We preserve an index and hash suffix
            target_filename = f"{category}_{f[-35:]}" if len(f) > 35 else f"{category}_{f}"
            target_path = os.path.join(dest_root, target_split, category, target_filename)

            # Copy image
            shutil.copyfile(ext_src_path, target_path)
            counts[category] += 1

        summary[target_split] = counts

    print("=== DATASET PREPARATION COMPLETED ===")
    print(f"Excluded unannotated images: {len(unannotated_files)}")
    for s, f in unannotated_files:
        print(f"  - [{s}] {f}")
    print(f"Corrupted images skipped: {len(skipped_corrupt)}")
    for s, f, err in skipped_corrupt:
        print(f"  - [{s}] {f}: {err}")

    print("\nVerified Clean Dataset Splits:")
    total_imgs = 0
    for s, counts in summary.items():
        print(f"Split: {s}")
        print(f"  - normal: {counts['normal']}")
        print(f"  - hazard_detected: {counts['hazard_detected']}")
        print(f"  - total: {counts['normal'] + counts['hazard_detected']}")
        total_imgs += counts['normal'] + counts['hazard_detected']

    print(f"\nGrand Total Clean Structured Images: {total_imgs}")

if __name__ == "__main__":
    prepare_splits()
