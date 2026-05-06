# Dataset Collection Guide

## Sources for photos
- Unsplash (unsplash.com) — search terms below
- Pexels (pexels.com)
- Pixabay (pixabay.com)
- Photos already uploaded to Paws platform

## Search terms per category

### Species
- cat: "street cat", "stray cat", "domestic cat"
- dog: "street dog", "stray dog", "domestic dog"
- puppy: "puppy", "young dog", "baby dog"
- kitten: "kitten", "baby cat", "young cat"
- rabbit: "rabbit pet", "domestic rabbit"
- guinea_pig: "guinea pig", "cavy pet"
- hamster: "hamster pet"

### Dog breeds
- golden_retriever: "golden retriever dog"
- german_shepherd: "german shepherd dog"
- labrador: "labrador retriever"
- husky: "siberian husky"
- beagle: "beagle dog"
- chihuahua: "chihuahua dog"
- mixed_breed_dog: "mixed breed dog", "mutt dog"

### Cat breeds
- persian: "persian cat"
- siamese: "siamese cat"
- maine_coon: "maine coon cat"
- tabby: "tabby cat", "striped cat"
- domestic_shorthair: "domestic shorthair cat"
- mixed_breed_cat: "mixed breed cat", "domestic cat"

### Colors
- brown: "brown dog", "brown cat"
- white: "white dog", "white cat"
- black: "black dog", "black cat"
- gray: "gray cat", "grey dog"
- orange: "orange cat", "ginger cat"
- golden: "golden dog", "golden retriever"
- black_and_white: "tuxedo cat", "black white dog"
- multicolor: "calico cat", "multicolor dog"

### Size (use photos where size is clear, include context/human for scale)
- very_small: dogs under 5kg, small cats, tiny breeds
- small: dogs 5-10kg, average cats
- medium: dogs 10-25kg
- large: dogs over 25kg, large breeds

### Age (approximate visual appearance)
- baby_under_3months: newborns to 3 months — tiny, eyes barely open, very round faces
- young_3_12months: still puppy/kitten-like proportions, large paws/ears
- adult_1_3years: clearly adult but young-looking, bright eyes
- mature_3_7years: middle-aged, settled appearance
- senior_over_7years: visibly older, gray muzzle, calmer expression

### Fur length
- short_hair: smooth coat, skin visible through fur
- medium_hair: moderate length, not fluffy, not smooth
- long_hair: flowing coat, clearly long
- hairless: sphinx cats, hairless breeds

### Fur pattern
- solid: single uniform color
- tabby_striped: striped pattern (cats mainly)
- spotted: distinct spots (bengal, dalmatian)
- calico: three-color patches (orange/black/white)
- tuxedo: black body with white chest/paws
- bicolor: two distinct colors in patches

## Rules for photos
- One animal clearly visible per photo
- Animal occupies at least 30% of frame
- Clear, in-focus photo
- JPG or PNG format
- Any resolution (will be resized to 224x224 automatically)
- Do NOT include the same photo in both train/ and val/
- Avoid watermarked images

## Target counts
| Folder | Train | Val |
|--------|-------|-----|
| 1_species (per class) | 30-80 | 15-20 |
| 2_dog_breed (per class) | 60 | 15 |
| 3_cat_breed (per class) | 50-80 | 15 |
| 4_color (per class) | 60 | 15 |
| 5_size (per class) | 50-60 | 15 |
| 6_age (per class) | 50-60 | 15 |
| 7_fur_length (per class) | 60 | 15 |
| 8_fur_pattern (per class) | 50-60 | 15 |

## Minimum dataset size
- Total photos needed: ~2500 for training + ~500 for validation
- Expected fine-tuning time on CPU: 4-8 hours
- Expected fine-tuning time on GPU: 30-60 minutes
- Expected accuracy improvement: 15-30% over base CLIP

## After collecting photos
Run fine-tuning:
```bash
cd backend/ml-service
venv/Scripts/activate
python finetune_clip.py
```

Run evaluation (compares base vs fine-tuned):
```bash
python evaluate_clip.py
```
