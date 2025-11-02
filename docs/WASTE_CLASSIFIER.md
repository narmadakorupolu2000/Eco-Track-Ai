# 🗑️ AI Waste Classifier - User Guide

## Overview
The AI Waste Classifier uses Perplexity AI's advanced vision model to identify waste items and provide proper disposal recommendations.

---

## 🎯 How to Use

### Step 1: Access the Classifier
Navigate to **Waste Classifier** from the main navigation menu.

### Step 2: Upload an Image
- Click **"Choose File"** or **drag & drop** an image
- Supported formats: JPG, PNG, WebP
- Max size: 5MB
- Best results: Clear, well-lit photos of single items

### Step 3: Get Classification
- Click **"Classify Waste"**
- AI analyzes the image (takes 2-5 seconds)
- Results show:
  - Waste type (Plastic, Metal, Glass, Organic, E-Waste, Hazardous)
  - Disposal method (Recycle, Compost, Trash, Special Disposal)
  - Detailed recommendations
  - Environmental impact

### Step 4: Save to History
- Classification automatically saves to your dashboard
- View past classifications in **Dashboard → Waste Classification History**
- Track items classified over time

---

## 🔬 Supported Waste Types

| Type | Examples | Disposal Method |
|------|----------|----------------|
| **Plastic** | Bottles, containers, bags, packaging | ♻️ Recycle (check local guidelines) |
| **Metal** | Cans, foil, scrap metal | ♻️ Recycle |
| **Glass** | Bottles, jars, containers | ♻️ Recycle |
| **Paper** | Cardboard, newspapers, magazines | ♻️ Recycle |
| **Organic** | Food scraps, yard waste | 🌱 Compost |
| **E-Waste** | Electronics, batteries, cables | ⚡ Special disposal center |
| **Hazardous** | Chemicals, paints, cleaners | ⚠️ Hazardous waste facility |

---

## 💡 Tips for Best Results

### ✅ Do:
- Use clear, focused images
- Good lighting (natural light works best)
- Single item per photo
- Clean, visible labels
- Close-up shots

### ❌ Avoid:
- Blurry or dark photos
- Multiple items in one image
- Extreme angles
- Items covered by other objects
- Very dirty or damaged items

---

## 🤖 AI Model Details

- **Model:** Perplexity AI `sonar-pro` (with vision)
- **Accuracy:** ~85-95% (depends on image quality)
- **Processing Time:** 2-5 seconds
- **Language:** English (supports multiple languages in responses)

---

## 📊 Environmental Impact

Each classification includes:
- **Carbon footprint** of disposal method
- **Recycling benefit** (if applicable)
- **Alternative disposal** options
- **Eco-friendly tips**

### Example Impact Data:
```
Plastic Bottle (500ml):
- Recycling: -0.15 kg CO2e saved
- Landfill: +0.45 kg CO2e emitted
- Recommendation: Rinse and recycle ♻️
```

---

## 🚀 Advanced Features

### Batch Classification (Coming Soon)
- Upload multiple images at once
- Compare disposal methods
- Bulk categorization

### Smart Suggestions
- Based on your location's recycling rules
- Nearby recycling centers
- Drop-off locations for special items

---

## ❓ FAQ

**Q: What if the AI can't identify my item?**
A: Try taking a clearer photo or manually select the waste type.

**Q: Does it work offline?**
A: No, requires internet connection for AI processing.

**Q: Can I classify food waste?**
A: Yes! Upload photos of food scraps to get composting recommendations.

**Q: Is my data stored?**
A: Images are NOT stored. Only classification results are saved to your account.

**Q: Can I delete classification history?**
A: Yes, from your dashboard settings.

---

## 🔗 Related Features
- **[Carbon Tracking](./CARBON_TRACKING.md)** - Log waste disposal activities
- **[Dashboard](./DASHBOARD.md)** - View classification history
- **[EcoChat](./ECOCHAT.md)** - Ask questions about waste disposal

---

**Need help?** Visit the [EcoChat](http://localhost:3000/eco-chat) and ask our AI assistant!
