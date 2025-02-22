from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
from bs4 import BeautifulSoup
from transformers import GPT2LMHeadModel, GPT2Tokenizer
import torch
import os
import json

app = Flask(__name__)
CORS(app, resources={r"/ask": {"origins": "http://localhost:3000"}})  # Allow CORS for localhost:3000

# Load GPT-2 model and tokenizer
model_name = "gpt2"
tokenizer = GPT2Tokenizer.from_pretrained(model_name)
tokenizer.pad_token = tokenizer.eos_token
model = GPT2LMHeadModel.from_pretrained(model_name)

# Cache file
CACHE_FILE = "alphonse_cache.json"

# Fetch web data (or use cache)
def fetch_web_data(query):
    cache = load_cache()
    query_key = query.lower().strip()
    if query_key in cache:
        return cache[query_key], True
    try:
        url = f"https://duckduckgo.com/html/?q={query.replace(' ', '+')}"
        headers = {"User-Agent": "Mozilla/5.0"}
        response = requests.get(url, headers=headers, timeout=10)
        soup = BeautifulSoup(response.text, "html.parser")
        snippets = soup.select(".result__snippet")
        text = " ".join([snippet.get_text() for snippet in snippets[:3]])
        if not text:
            text = "Nothing useful found. The internet’s letting me down today."
        cache[query_key] = text
        save_cache(cache)
        return text, False
    except Exception as e:
        return f"Web’s broken, mate. Error: {str(e)}", False

# Load cache
def load_cache():
    if os.path.exists(CACHE_FILE):
        with open(CACHE_FILE, "r") as f:
            return json.load(f)
    return {}

# Save cache
def save_cache(cache):
    with open(CACHE_FILE, "w") as f:
        json.dump(cache, f)

# Generate response with complete sentences
def generate_response(question, web_text):
    personality = "You’re Alphonse, a witty and sarcastic AI who answers based ONLY on the web data provided, no fluff."
    prompt = f"{personality}\nWeb data: {web_text}\nQuestion: {question}\nAnswer: "
    
    inputs = tokenizer(prompt, return_tensors="pt", padding=True, truncation=True, max_length=200)
    input_ids = inputs["input_ids"]
    attention_mask = inputs["attention_mask"]
    
    generated = input_ids
    for _ in range(50):  # Max 50 new tokens
        outputs = model(generated, attention_mask=attention_mask)
        next_token_logits = outputs.logits[:, -1, :]
        next_token = torch.argmax(next_token_logits, dim=-1).unsqueeze(0)
        generated = torch.cat((generated, next_token), dim=1)
        attention_mask = torch.cat((attention_mask, torch.ones((1, 1))), dim=1)
        decoded_token = tokenizer.decode(next_token[0])
        if decoded_token in ['.', '!', '?']:
            break
    response = tokenizer.decode(generated[0], skip_special_tokens=True)
    return response.split("Answer: ")[-1].strip()

# API endpoint to ask Alphonse a question
@app.route('/ask', methods=['POST'])
def ask_alphonse():
    try:
        data = request.get_json()
        question = data.get('question', '')
        if not question:
            return jsonify({"error": "No question provided"}), 400
        
        web_text, from_cache = fetch_web_data(question)
        answer = generate_response(question, web_text)
        return jsonify({
            "question": question,
            "answer": answer,
            "from_cache": from_cache,
            "web_data": web_text[:100] + "..." if len(web_text) > 100 else web_text
        })
    except Exception as e:
        return jsonify({"error": f"Server error: {str(e)}"}), 500

if __name__ == "__main__":
    app.run(host='localhost', port=5000, debug=True)