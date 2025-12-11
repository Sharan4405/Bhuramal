# Fine-Tuned AI Chatbot for Dry Fruits Business

Custom AI chatbot trained specifically for Bhuramal Bhagirath Prasad's dry fruits business using fine-tuned open-source models.

## Architecture

- **Base Model**: Microsoft Phi-3 Mini (lightweight, runs on CPU)
- **Fine-tuning**: LoRA (Low-Rank Adaptation) for efficient training
- **Framework**: Transformers + PyTorch
- **Inference**: Node.js REST API

## Features

- Custom trained on your product catalog
- Business-specific knowledge (pricing, products, policies)
- Natural conversation flow
- Fast inference (optimized for production)
- No external API dependency

## Setup

### 1. Install Node.js Dependencies
```bash
npm install
```

### 2. Install Python Dependencies
```bash
pip install -r requirements.txt
```

### 3. Configure Environment
```bash
cp .env.example .env
# Edit .env with your settings
```

### 4. Prepare Training Data
```bash
npm run prepare-data
```

### 5. Fine-tune the Model
```bash
npm run train
```

### 6. Start the Server
```bash
npm run dev
```

## Directory Structure

```
Chatbot-AI/
├── src/
│   ├── index.js              # Express server
│   ├── routes/
│   │   └── chat.js           # Chat endpoints
│   ├── services/
│   │   └── modelService.js   # Model inference
│   └── utils/
│       └── prepareTrainingData.js
├── training/
│   ├── fine_tune.py          # Training script
│   ├── test_model.py         # Testing script
│   └── data/
│       ├── training_data.jsonl  # Training examples
│       └── business_knowledge.json
├── models/
│   └── fine-tuned-model/     # Saved model after training
└── requirements.txt
```

## Training Data Format

Create custom Q&A pairs in `training/data/training_data.jsonl`:

```jsonl
{"instruction": "What dry fruits do you sell?", "response": "We offer premium almonds, cashews, pistachios, walnuts, raisins, dates, and more."}
{"instruction": "What is the price of almonds?", "response": "Our premium almonds are priced at ₹800 per kg."}
```

## API Usage

### POST /api/chat
```json
{
  "message": "What types of cashews do you have?",
  "userId": "919876543210"
}
```

**Response:**
```json
{
  "success": true,
  "response": "We have premium whole cashews (W180, W240, W320) and broken cashews...",
  "confidence": 0.92
}
```

## Model Options

1. **Phi-3 Mini** (Recommended for CPU) - 3.8B parameters, fast
2. **Llama 3.2** - 3B parameters, high quality
3. **Mistral 7B** - Best quality, needs GPU
4. **GPT-2** - Smallest, fastest, lower quality

## Fine-tuning Process

1. **Data Collection**: Gather business FAQs, product info, policies
2. **Preprocessing**: Convert to training format
3. **Fine-tuning**: Use LoRA for efficient training (2-4 hours on CPU)
4. **Evaluation**: Test with sample queries
5. **Deployment**: Load model in Node.js service

## Integration with Main ChatBot

The main ChatBot calls this service when user selects "Support & Queries".
