import os
import torch
from transformers import CLIPProcessor, CLIPModel
from PIL import Image
import json

BASE_MODEL = "openai/clip-vit-base-patch32"
FINETUNED_MODEL = os.path.join(os.path.dirname(__file__), 'models', 'clip_finetuned')
DATASET_DIR = os.path.join(os.path.dirname(__file__), 'dataset', 'val')
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

CATEGORY_LABELS = {
    "1_species": ["a photo of a cat", "a photo of a dog", "a photo of a puppy", "a photo of a kitten", "a photo of a rabbit", "a photo of a guinea pig", "a photo of a hamster"],
    "2_dog_breed": [
        "a photo of a beagle dog",
        "a photo of a boxer dog",
        "a photo of a chihuahua dog",
        "a photo of an english cocker spaniel dog",
        "a photo of a german shepherd dog",
        "a photo of a golden retriever dog",
        "a photo of a havanese dog",
        "a photo of a husky dog",
        "a photo of a labrador dog",
        "a photo of a maltese dog",
        "a photo of a mixed breed dog",
        "a photo of a newfoundland dog",
        "a photo of a yorkshire terrier dog",
    ],
    "3_cat_breed": [
        "a photo of a bengal cat",
        "a photo of a birman cat",
        "a photo of a bombay cat",
        "a photo of a british shorthair cat",
        "a photo of a domestic shorthair cat",
        "a photo of a maine coon cat",
        "a photo of a mixed breed cat",
        "a photo of a persian cat",
        "a photo of a ragdoll cat",
        "a photo of a russian blue cat",
        "a photo of a siamese cat",
        "a photo of a sphynx cat",
        "a photo of a tabby cat",
    ],
    "4_color": ["a brown animal", "a white animal", "a black animal", "a gray animal", "an orange animal", "a golden animal", "a black and white animal", "a multicolored animal"],
    "5_size": ["a very small animal under 5kg", "a small animal 5 to 10kg", "a medium sized animal", "a large animal over 25kg"],
    "6_age": ["a newborn baby animal under 3 months", "a young animal 3 to 12 months", "a young adult animal 1 to 3 years", "a mature adult animal 3 to 7 years", "a senior animal over 7 years"],
    "7_fur_length": [
        "an animal with no fur, hairless",
        "an animal with long fur",
        "an animal with medium length fur",
        "an animal with short fur",
    ],
    "8_fur_pattern": [
        "an animal with bicolor fur pattern",
        "an animal with calico fur pattern",
        "an animal with solid colored fur",
        "an animal with spotted fur pattern",
        "an animal with tabby striped fur pattern",
        "an animal with tricolor fur pattern",
        "an animal with tuxedo fur pattern",
    ],
}

FOLDER_TO_LABEL = {
    "1_species": {"cat": 0, "dog": 1, "puppy": 2, "kitten": 3, "rabbit": 4, "guinea_pig": 5, "hamster": 6},
    "2_dog_breed": {
        "beagle": 0, "boxer": 1, "chihuahua": 2, "english_cocker_spaniel": 3,
        "german_shepherd": 4, "golden_retriever": 5, "havanese": 6, "husky": 7,
        "labrador": 8, "maltese": 9, "mixed_breed": 10, "newfoundland": 11, "yorkshire_terrier": 12,
    },
    "3_cat_breed": {
        "bengal": 0, "birman": 1, "bombay": 2, "british_shorthair": 3,
        "domestic_shorthair": 4, "maine_coon": 5, "mixed_breed": 6, "persian": 7,
        "ragdoll": 8, "russian_blue": 9, "siamese": 10, "sphynx": 11, "tabby": 12,
    },
    "4_color": {"brown": 0, "white": 1, "black": 2, "gray": 3, "orange": 4, "golden": 5, "black_and_white": 6, "multicolor": 7},
    "5_size": {"very_small": 0, "small": 1, "medium": 2, "large": 3},
    "6_age": {"baby_under_3months": 0, "young_3_12months": 1, "adult_1_3years": 2, "mature_3_7years": 3, "senior_over_7years": 4},
    "7_fur_length": {"hairless": 0, "long": 1, "medium": 2, "short": 3},
    "8_fur_pattern": {"bicolor": 0, "calico": 1, "solid": 2, "spotted": 3, "tabby": 4, "tricolor": 5, "tuxedo": 6},
}


def evaluate_model(model, processor, category, labels, folder_map):
    cat_dir = os.path.join(DATASET_DIR, category)
    if not os.path.exists(cat_dir):
        return None
    correct = 0
    total = 0
    per_class = {}

    for class_name, true_label in folder_map.items():
        class_dir = os.path.join(cat_dir, class_name)
        if not os.path.exists(class_dir):
            continue
        class_correct = 0
        class_total = 0
        for fname in os.listdir(class_dir):
            if not fname.lower().endswith(('.jpg', '.jpeg', '.png')):
                continue
            try:
                image = Image.open(os.path.join(class_dir, fname)).convert('RGB')
                inputs = processor(text=labels, images=image, return_tensors='pt', padding=True)
                with torch.no_grad():
                    outputs = model(**inputs)
                pred = outputs.logits_per_image.softmax(dim=1).argmax().item()
                if pred == true_label:
                    correct += 1
                    class_correct += 1
                total += 1
                class_total += 1
            except Exception:
                pass
        if class_total > 0:
            per_class[class_name] = round(class_correct / class_total * 100, 1)

    return {
        'correct': correct,
        'total': total,
        'accuracy': round(correct / total * 100, 1) if total > 0 else 0,
        'per_class': per_class
    }


print("="*60)
print("PAWS CLIP EVALUATION")
print("="*60)
print(f"Device: {DEVICE}")
print(f"Val dataset: {DATASET_DIR}\n")

print("Loading base CLIP model...")
base_model = CLIPModel.from_pretrained(BASE_MODEL).to(DEVICE)
base_processor = CLIPProcessor.from_pretrained(BASE_MODEL)

results = {'base_clip': {}, 'finetuned_clip': {}}

print("\n=== BASE CLIP EVALUATION ===")
for cat, labels in CATEGORY_LABELS.items():
    if cat in FOLDER_TO_LABEL:
        r = evaluate_model(base_model, base_processor, cat, labels, FOLDER_TO_LABEL[cat])
        if r and r['total'] > 0:
            results['base_clip'][cat] = r
            print(f"  {cat}: {r['accuracy']:.1f}% ({r['correct']}/{r['total']})")
        elif r:
            print(f"  {cat}: no images found in val/")

del base_model  # free memory before loading fine-tuned

if os.path.exists(FINETUNED_MODEL):
    print("\nLoading fine-tuned model...")
    ft_model = CLIPModel.from_pretrained(FINETUNED_MODEL).to(DEVICE)
    ft_processor = CLIPProcessor.from_pretrained(BASE_MODEL)

    print("\n=== FINE-TUNED CLIP EVALUATION ===")
    for cat, labels in CATEGORY_LABELS.items():
        if cat in FOLDER_TO_LABEL:
            r = evaluate_model(ft_model, ft_processor, cat, labels, FOLDER_TO_LABEL[cat])
            if r and r['total'] > 0:
                results['finetuned_clip'][cat] = r
                print(f"  {cat}: {r['accuracy']:.1f}% ({r['correct']}/{r['total']})")

    print("\n=== IMPROVEMENT SUMMARY ===")
    for cat in results['base_clip']:
        if cat in results['finetuned_clip']:
            base_acc = results['base_clip'][cat]['accuracy']
            ft_acc = results['finetuned_clip'][cat]['accuracy']
            diff = ft_acc - base_acc
            arrow = '^' if diff > 0 else ('v' if diff < 0 else '-')
            print(f"  {cat}: {base_acc:.1f}% -> {ft_acc:.1f}%  {arrow} {'+' if diff >= 0 else ''}{diff:.1f}%")

    # Check training history
    history_path = os.path.join(FINETUNED_MODEL, 'training_history.json')
    if os.path.exists(history_path):
        with open(history_path) as f:
            history = json.load(f)
        print(f"\nTraining history:")
        print(f"  Epochs: {len(history.get('train_loss', []))}")
        print(f"  Best val loss: {history.get('best_val_loss', 'N/A')}")
        if history.get('val_accuracy'):
            print(f"  Final val accuracy: {history['val_accuracy'][-1]:.1f}%")
else:
    print(f"\nNo fine-tuned model found at {FINETUNED_MODEL}")
    print("Run finetune_clip.py first after collecting dataset images.")

output_path = os.path.join(os.path.dirname(__file__), 'evaluation_results.json')
with open(output_path, 'w') as f:
    json.dump(results, f, indent=2)
print(f"\nFull results saved to {output_path}")
print("="*60)
