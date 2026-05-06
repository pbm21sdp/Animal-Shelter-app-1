import os
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
from transformers import CLIPProcessor, CLIPModel
from PIL import Image
import json
from datetime import datetime
import warnings
warnings.filterwarnings('ignore')

print("="*60)
print("PAWS CLIP FINE-TUNING SCRIPT")
print("="*60)

# ── Configuration ──────────────────────────────────────────────
DATASET_DIR = os.path.join(os.path.dirname(__file__), 'dataset')
MODEL_OUTPUT_DIR = os.path.join(os.path.dirname(__file__), 'models', 'clip_finetuned')
BASE_MODEL = "openai/clip-vit-base-patch32"
BATCH_SIZE = 8
NUM_EPOCHS = 5
LEARNING_RATE = 1e-5
IMAGE_SIZE = 224
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

print(f"Device: {DEVICE}")
print(f"Dataset: {DATASET_DIR}")
print(f"Output: {MODEL_OUTPUT_DIR}")

# ── Label maps for each category ──────────────────────────────
CATEGORY_LABELS = {
    "1_species": ["a photo of a cat", "a photo of a dog", "a photo of a puppy", "a photo of a kitten", "a photo of a rabbit", "a photo of a guinea pig", "a photo of a hamster"],
    "2_dog_breed": ["a golden retriever", "a german shepherd", "a labrador retriever", "a siberian husky", "a beagle", "a chihuahua", "a mixed breed dog"],
    "3_cat_breed": ["a persian cat", "a siamese cat", "a maine coon cat", "a tabby cat", "a domestic shorthair cat", "a mixed breed cat"],
    "4_color": ["a brown animal", "a white animal", "a black animal", "a gray animal", "an orange animal", "a golden animal", "a black and white animal", "a multicolored animal"],
    "5_size": ["a very small animal under 5kg", "a small animal 5 to 10kg", "a medium sized animal", "a large animal over 25kg"],
    "6_age": ["a newborn baby animal under 3 months", "a young animal 3 to 12 months", "a young adult animal 1 to 3 years", "a mature adult animal 3 to 7 years", "a senior animal over 7 years"],
    "7_fur_length": ["a short haired animal", "a medium haired animal", "a long haired animal", "a hairless animal"],
    "8_fur_pattern": ["a solid colored animal", "a tabby striped animal", "a spotted animal", "a calico animal", "a tuxedo black and white animal", "a bicolor animal"],
}

# Map folder names to label indices
FOLDER_TO_LABEL = {
    "1_species": {"cat": 0, "dog": 1, "puppy": 2, "kitten": 3, "rabbit": 4, "guinea_pig": 5, "hamster": 6},
    "2_dog_breed": {"golden_retriever": 0, "german_shepherd": 1, "labrador": 2, "husky": 3, "beagle": 4, "chihuahua": 5, "mixed_breed_dog": 6},
    "3_cat_breed": {"persian": 0, "siamese": 1, "maine_coon": 2, "tabby": 3, "domestic_shorthair": 4, "mixed_breed_cat": 5},
    "4_color": {"brown": 0, "white": 1, "black": 2, "gray": 3, "orange": 4, "golden": 5, "black_and_white": 6, "multicolor": 7},
    "5_size": {"very_small": 0, "small": 1, "medium": 2, "large": 3},
    "6_age": {"baby_under_3months": 0, "young_3_12months": 1, "adult_1_3years": 2, "mature_3_7years": 3, "senior_over_7years": 4},
    "7_fur_length": {"short_hair": 0, "medium_hair": 1, "long_hair": 2, "hairless": 3},
    "8_fur_pattern": {"solid": 0, "tabby_striped": 1, "spotted": 2, "calico": 3, "tuxedo": 4, "bicolor": 5},
}


class AnimalDataset(Dataset):
    def __init__(self, split='train'):
        self.samples = []
        self.processor = CLIPProcessor.from_pretrained(BASE_MODEL)
        split_dir = os.path.join(DATASET_DIR, split)

        if not os.path.exists(split_dir):
            print(f"WARNING: {split_dir} does not exist")
            return

        for category in os.listdir(split_dir):
            cat_dir = os.path.join(split_dir, category)
            if not os.path.isdir(cat_dir) or category not in FOLDER_TO_LABEL:
                continue
            labels_map = FOLDER_TO_LABEL[category]
            texts = CATEGORY_LABELS[category]

            for class_name in os.listdir(cat_dir):
                class_dir = os.path.join(cat_dir, class_name)
                if not os.path.isdir(class_dir) or class_name not in labels_map:
                    continue
                label_idx = labels_map[class_name]
                label_text = texts[label_idx]

                for fname in os.listdir(class_dir):
                    if fname.lower().endswith(('.jpg', '.jpeg', '.png', '.webp')):
                        self.samples.append({
                            'image_path': os.path.join(class_dir, fname),
                            'text': label_text,
                            'category': category,
                            'label': label_idx
                        })

        print(f"Loaded {len(self.samples)} samples for {split}")

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        sample = self.samples[idx]
        try:
            image = Image.open(sample['image_path']).convert('RGB')
            inputs = self.processor(
                text=[sample['text']],
                images=image,
                return_tensors='pt',
                padding=True,
                truncation=True
            )
            return {
                'pixel_values': inputs['pixel_values'].squeeze(0),
                'input_ids': inputs['input_ids'].squeeze(0),
                'attention_mask': inputs['attention_mask'].squeeze(0),
                'label': torch.tensor(sample['label'], dtype=torch.long),
                'category': sample['category']
            }
        except Exception as e:
            print(f"Error loading {sample['image_path']}: {e}")
            return self.__getitem__((idx + 1) % len(self.samples))


def collate_fn(batch):
    max_len = max(b['input_ids'].shape[0] for b in batch)
    input_ids = torch.zeros(len(batch), max_len, dtype=torch.long)
    attention_mask = torch.zeros(len(batch), max_len, dtype=torch.long)
    for i, b in enumerate(batch):
        l = b['input_ids'].shape[0]
        input_ids[i, :l] = b['input_ids']
        attention_mask[i, :l] = b['attention_mask']
    return {
        'pixel_values': torch.stack([b['pixel_values'] for b in batch]),
        'input_ids': input_ids,
        'attention_mask': attention_mask,
        'labels': torch.stack([b['label'] for b in batch]),
    }


def train():
    print("\nLoading CLIP model...")
    model = CLIPModel.from_pretrained(BASE_MODEL)
    model = model.to(DEVICE)

    print("Loading dataset...")
    train_dataset = AnimalDataset('train')
    val_dataset = AnimalDataset('val')

    if len(train_dataset) == 0:
        print("ERROR: No training data found. Please add images to dataset/train/")
        print("See dataset/README.md for collection instructions.")
        return

    train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True, collate_fn=collate_fn)
    val_loader = DataLoader(val_dataset, batch_size=BATCH_SIZE, shuffle=False, collate_fn=collate_fn)

    optimizer = torch.optim.AdamW(model.parameters(), lr=LEARNING_RATE, weight_decay=0.01)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=NUM_EPOCHS)
    loss_fn = nn.CrossEntropyLoss()

    best_val_loss = float('inf')
    history = {'train_loss': [], 'val_loss': [], 'val_accuracy': [], 'started': datetime.now().isoformat()}

    print(f"\nStarting training for {NUM_EPOCHS} epochs...")
    print(f"Training samples:   {len(train_dataset)}")
    print(f"Validation samples: {len(val_dataset)}")
    print(f"Batch size: {BATCH_SIZE} | LR: {LEARNING_RATE} | Device: {DEVICE}")
    print("="*60)

    for epoch in range(NUM_EPOCHS):
        model.train()
        total_loss = 0
        batches = 0

        for batch_idx, batch in enumerate(train_loader):
            pixel_values = batch['pixel_values'].to(DEVICE)
            input_ids = batch['input_ids'].to(DEVICE)
            attention_mask = batch['attention_mask'].to(DEVICE)

            outputs = model(pixel_values=pixel_values, input_ids=input_ids, attention_mask=attention_mask)
            logits = outputs.logits_per_image

            labels = torch.arange(len(pixel_values)).to(DEVICE)
            loss = (loss_fn(logits, labels) + loss_fn(logits.T, labels)) / 2

            optimizer.zero_grad()
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            optimizer.step()

            total_loss += loss.item()
            batches += 1

            if batch_idx % 10 == 0:
                print(f"Epoch {epoch+1}/{NUM_EPOCHS} | Batch {batch_idx}/{len(train_loader)} | Loss: {loss.item():.4f}")

        avg_train_loss = total_loss / max(batches, 1)

        # Validation
        model.eval()
        val_loss = 0
        correct = 0
        total = 0

        with torch.no_grad():
            for batch in val_loader:
                pixel_values = batch['pixel_values'].to(DEVICE)
                input_ids = batch['input_ids'].to(DEVICE)
                attention_mask = batch['attention_mask'].to(DEVICE)

                outputs = model(pixel_values=pixel_values, input_ids=input_ids, attention_mask=attention_mask)
                logits = outputs.logits_per_image

                contrastive_labels = torch.arange(len(pixel_values)).to(DEVICE)
                loss = (loss_fn(logits, contrastive_labels) + loss_fn(logits.T, contrastive_labels)) / 2
                val_loss += loss.item()

                preds = logits.argmax(dim=1)
                correct += (preds == contrastive_labels).sum().item()
                total += len(pixel_values)

        avg_val_loss = val_loss / max(len(val_loader), 1)
        accuracy = correct / max(total, 1) * 100

        history['train_loss'].append(avg_train_loss)
        history['val_loss'].append(avg_val_loss)
        history['val_accuracy'].append(accuracy)

        print(f"\nEpoch {epoch+1}/{NUM_EPOCHS} complete")
        print(f"  Train Loss:   {avg_train_loss:.4f}")
        print(f"  Val Loss:     {avg_val_loss:.4f}")
        print(f"  Val Accuracy: {accuracy:.1f}%")

        scheduler.step()

        if avg_val_loss < best_val_loss:
            best_val_loss = avg_val_loss
            os.makedirs(MODEL_OUTPUT_DIR, exist_ok=True)
            model.save_pretrained(MODEL_OUTPUT_DIR)
            print(f"  ✓ Best model saved to {MODEL_OUTPUT_DIR}")

    history['completed'] = datetime.now().isoformat()
    history['best_val_loss'] = best_val_loss
    os.makedirs(MODEL_OUTPUT_DIR, exist_ok=True)
    with open(os.path.join(MODEL_OUTPUT_DIR, 'training_history.json'), 'w') as f:
        json.dump(history, f, indent=2)

    print("\n" + "="*60)
    print("TRAINING COMPLETE")
    print(f"Best validation loss: {best_val_loss:.4f}")
    print(f"Model saved to: {MODEL_OUTPUT_DIR}")
    print("Run evaluate_clip.py to compare vs base CLIP")
    print("="*60)


if __name__ == '__main__':
    train()
