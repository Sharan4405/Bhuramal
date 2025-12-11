"""
Fine-tune a language model for dry fruits business chatbot
Using LoRA (Low-Rank Adaptation) for efficient training
"""

import os
import json
import torch
from datasets import load_dataset
from transformers import (
    AutoTokenizer,
    AutoModelForCausalLM,
    TrainingArguments,
    Trainer,
    DataCollatorForLanguageModeling
)
from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training
from dotenv import load_dotenv

load_dotenv()

# Configuration
MODEL_NAME = os.getenv("BASE_MODEL", "microsoft/Phi-3-mini-4k-instruct")
OUTPUT_DIR = "./models/fine-tuned-model"
TRAINING_DATA = "./training/data/training_data.jsonl"
MAX_LENGTH = int(os.getenv("MAX_LENGTH", 512))
BATCH_SIZE = int(os.getenv("BATCH_SIZE", 4))
LEARNING_RATE = float(os.getenv("LEARNING_RATE", 2e-5))
NUM_EPOCHS = int(os.getenv("NUM_EPOCHS", 3))
USE_GPU = os.getenv("USE_GPU", "false").lower() == "true"

print("🚀 Starting fine-tuning process...")
print(f"Base Model: {MODEL_NAME}")
print(f"Device: {'GPU' if USE_GPU and torch.cuda.is_available() else 'CPU'}")

# Load tokenizer and model
print("\n📥 Loading tokenizer and model...")
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME, trust_remote_code=True)
tokenizer.pad_token = tokenizer.eos_token

model = AutoModelForCausalLM.from_pretrained(
    MODEL_NAME,
    trust_remote_code=True,
    torch_dtype=torch.float32,  # Use float32 for CPU
    device_map="auto" if USE_GPU else None
)

# Configure LoRA
print("\n⚙️  Configuring LoRA...")
lora_config = LoraConfig(
    r=16,  # Rank
    lora_alpha=32,
    target_modules=["q_proj", "v_proj", "k_proj", "o_proj"],  # Attention modules
    lora_dropout=0.05,
    bias="none",
    task_type="CAUSAL_LM"
)

model = get_peft_model(model, lora_config)
model.print_trainable_parameters()

# Load and prepare dataset
print("\n📚 Loading training data...")
dataset = load_dataset("json", data_files=TRAINING_DATA, split="train")

def format_instruction(example):
    """Format the data for instruction fine-tuning"""
    prompt = f"""<|system|>You are a helpful assistant for Bhuramal Bhagirath Prasad, a premium dry fruits business. Provide accurate, friendly, and helpful responses about products, pricing, delivery, and policies.<|end|>
<|user|>{example['instruction']}<|end|>
<|assistant|>{example['response']}<|end|>"""
    return {"text": prompt}

# Format dataset
print("\n🔄 Formatting dataset...")
formatted_dataset = dataset.map(format_instruction, remove_columns=dataset.column_names)

def tokenize_function(examples):
    """Tokenize the text"""
    return tokenizer(
        examples["text"],
        truncation=True,
        max_length=MAX_LENGTH,
        padding="max_length"
    )

tokenized_dataset = formatted_dataset.map(
    tokenize_function,
    batched=True,
    remove_columns=["text"]
)

# Training arguments
print("\n⚙️  Setting up training configuration...")
training_args = TrainingArguments(
    output_dir=OUTPUT_DIR,
    num_train_epochs=NUM_EPOCHS,
    per_device_train_batch_size=BATCH_SIZE,
    learning_rate=LEARNING_RATE,
    logging_steps=10,
    save_steps=50,
    save_total_limit=2,
    fp16=False,  # Disable for CPU
    optim="adamw_torch",
    report_to="none",  # Disable wandb/tensorboard
    remove_unused_columns=False,
)

# Data collator
data_collator = DataCollatorForLanguageModeling(
    tokenizer=tokenizer,
    mlm=False  # We're doing causal LM, not masked LM
)

# Initialize trainer
print("\n🏋️  Initializing trainer...")
trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=tokenized_dataset,
    data_collator=data_collator,
)

# Start training
print("\n🔥 Starting training...")
print(f"Training samples: {len(tokenized_dataset)}")
print(f"Epochs: {NUM_EPOCHS}")
print(f"Batch size: {BATCH_SIZE}")
print(f"Learning rate: {LEARNING_RATE}")
print("\nThis may take 2-4 hours on CPU...")

trainer.train()

# Save the final model
print("\n💾 Saving fine-tuned model...")
model.save_pretrained(OUTPUT_DIR)
tokenizer.save_pretrained(OUTPUT_DIR)

print("\n✅ Fine-tuning complete!")
print(f"Model saved to: {OUTPUT_DIR}")
print("\nYou can now use this model for inference.")
