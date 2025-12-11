"""
Python inference script for the fine-tuned model
Called by Node.js service to get AI responses
"""

import sys
import json
import os
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM
from peft import PeftModel
from dotenv import load_dotenv

load_dotenv()

# Configuration
MODEL_PATH = os.getenv("MODEL_PATH", "./models/fine-tuned-model")
BASE_MODEL = os.getenv("BASE_MODEL", "microsoft/Phi-3-mini-4k-instruct")

# Load model and tokenizer (cached after first load)
_model = None
_tokenizer = None

def load_model():
    """Load the fine-tuned model (cached)"""
    global _model, _tokenizer
    
    if _model is None:
        _tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH, trust_remote_code=True)
        base_model = AutoModelForCausalLM.from_pretrained(
            BASE_MODEL,
            trust_remote_code=True,
            torch_dtype=torch.float32,
            device_map="auto"
        )
        _model = PeftModel.from_pretrained(base_model, MODEL_PATH)
        _model.eval()
    
    return _model, _tokenizer

def get_response(question):
    """Get AI response for a question"""
    try:
        model, tokenizer = load_model()
        
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
        response = response.split("<|assistant|>")[-1].strip()
        
        return {
            "response": response,
            "confidence": 0.9,
            "model": "fine-tuned"
        }

    except Exception as e:
        return {
            "response": "I apologize, but I'm having trouble processing your request right now. Please contact our support team.",
            "confidence": 0.0,
            "error": str(e)
        }

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No question provided"}))
        sys.exit(1)
    
    question = sys.argv[1]
    result = get_response(question)
    print(json.dumps(result))
