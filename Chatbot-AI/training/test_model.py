"""
Test the fine-tuned model with sample queries
"""

import os
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM
from peft import PeftModel
from dotenv import load_dotenv

load_dotenv()

MODEL_PATH = os.getenv("MODEL_PATH", "./models/fine-tuned-model")
BASE_MODEL = os.getenv("BASE_MODEL", "microsoft/Phi-3-mini-4k-instruct")

print("🔍 Loading fine-tuned model for testing...")

# Load tokenizer
tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH, trust_remote_code=True)

# Load base model and adapter
base_model = AutoModelForCausalLM.from_pretrained(
    BASE_MODEL,
    trust_remote_code=True,
    torch_dtype=torch.float32,
    device_map="auto"
)

model = PeftModel.from_pretrained(base_model, MODEL_PATH)
model.eval()

def ask_question(question):
    """Ask a question to the model"""
    prompt = f"""<|system|>You are a helpful assistant for Bhuramal Bhagirath Prasad, a premium dry fruits business. Provide accurate, friendly, and helpful responses about products, pricing, delivery, and policies.<|end|>
<|user|>{question}<|end|>
<|assistant|>"""
    
    inputs = tokenizer(prompt, return_tensors="pt", truncation=True, max_length=512)
    
    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            max_new_tokens=150,
            temperature=0.7,
            do_sample=True,
            top_p=0.9,
            pad_token_id=tokenizer.eos_token_id
        )
    
    response = tokenizer.decode(outputs[0], skip_special_tokens=True)
    # Extract only the assistant's response
    response = response.split("<|assistant|>")[-1].strip()
    
    return response

# Test queries
test_queries = [
    "What products do you sell?",
    "Tell me about almonds",
    "How much do cashews cost?",
    "Do you deliver?",
    "What is your return policy?",
    "Are your products fresh?"
]

print("\n" + "="*60)
print("TESTING FINE-TUNED MODEL")
print("="*60 + "\n")

for query in test_queries:
    print(f"Q: {query}")
    response = ask_question(query)
    print(f"A: {response}")
    print("-" * 60)

print("\n✅ Testing complete!")
