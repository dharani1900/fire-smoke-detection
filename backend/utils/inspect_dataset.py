import os
from collections import Counter
from PIL import Image

dataset_root = r"C:\Users\DHARANI\.gemini\antigravity\scratch\mini_project\dataset\original\archive\gas leak - fire detection 2.v1i.yolov8"
splits = ["train", "valid", "test"]
classes = ["fire", "gassmoke", "ship"]

split_stats = {}
image_types = Counter()
corrupt_files = []

for s in splits:
    img_dir = os.path.join(dataset_root, s, "images")
    lbl_dir = os.path.join(dataset_root, s, "labels")
    
    if not os.path.exists(img_dir):
        continue
        
    files = [f for f in os.listdir(img_dir) if f.lower().endswith((".jpg", ".jpeg", ".png", ".webp"))]
    
    combo_counts = Counter()
    box_counts = Counter()
    
    for f in files:
        fp = os.path.join(img_dir, f)
        try:
            with Image.open(fp) as im:
                image_types[im.format] += 1
        except Exception as e:
            corrupt_files.append((s, f, str(e)))
            continue
            
        lf_path = os.path.join(lbl_dir, os.path.splitext(f)[0] + ".txt")
        present_classes = set()
        if os.path.exists(lf_path):
            with open(lf_path, "r") as lf:
                for line in lf:
                    parts = line.strip().split()
                    if parts:
                        cid = int(parts[0])
                        box_counts[classes[cid]] += 1
                        present_classes.add(classes[cid])
        
        has_fire = "fire" in present_classes
        has_smoke = "gassmoke" in present_classes
        has_ship = "ship" in present_classes
        
        if has_fire and has_smoke:
            combo = "fire + smoke"
        elif has_fire:
            combo = "fire only"
        elif has_smoke:
            combo = "smoke only"
        elif has_ship:
            combo = "normal ship (no hazard)"
        else:
            combo = "background / unannotated"
            
        combo_counts[combo] += 1
        
    split_stats[s] = {
        "total_images": len(files),
        "combos": combo_counts,
        "boxes": box_counts
    }

print("=== DATASET SPLIT STATISTICS ===")
overall_combos = Counter()
overall_boxes = Counter()
total_all = 0

for s, stats in split_stats.items():
    print(f"\nSplit: {s} (Total Images: {stats['total_images']})")
    print("  Image-level categories:")
    for combo, cnt in stats["combos"].most_common():
        print(f"    - {combo}: {cnt} images")
        overall_combos[combo] += cnt
    print("  Bounding box instances:")
    for cls, cnt in stats["boxes"].items():
        print(f"    - {cls}: {cnt} boxes")
        overall_boxes[cls] += cnt
    total_all += stats["total_images"]

print("\n=== OVERALL DATASET SUMMARY ===")
print(f"Total Images: {total_all}")
print("Overall image-level breakdown:")
for combo, cnt in overall_combos.most_common():
    print(f"  {combo}: {cnt} images ({cnt/total_all*100:.1f}%)")

print("\nOverall bounding boxes:")
for cls, cnt in overall_boxes.items():
    print(f"  {cls}: {cnt} boxes")

print("\nImage Formats:", dict(image_types))
print("Corrupted Images Count:", len(corrupt_files))
if corrupt_files:
    print("Corrupt file examples:", corrupt_files[:5])
