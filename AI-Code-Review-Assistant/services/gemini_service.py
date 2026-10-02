import os
import json
import re
from google import genai
from config import Config

def get_gemini_client():
    api_key = Config.GEMINI_API_KEY or os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY is missing. Please set it in your .env file.")
    return genai.Client(api_key=api_key)

def generate_response(prompt: str, system_instruction: str = None) -> str:
    try:
        client = get_gemini_client()
        config = {}
        if system_instruction:
            config["system_instruction"] = system_instruction
        
        response = client.models.generate_content(
            model="gemini-3.8-flash",
            contents=prompt,
            config=config if config else None
        )
        return response.text or ""
    except Exception as e:
        raise RuntimeError(f"Gemini API request failed: {str(e)}")

def generate_json_response(prompt: str, system_instruction: str = None) -> dict:
    try:
        client = get_gemini_client()
        config = {
            "response_mime_type": "application/json"
        }
        if system_instruction:
            config["system_instruction"] = system_instruction
            
        response = client.models.generate_content(
            model="gemini-3.8-flash",
            contents=prompt,
            config=config
        )
        text = response.text or "{}"
        
        # Safe JSON parse with markdown stripping
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            cleaned = re.sub(r"^```(?:json)?\s*", "", text.strip())
            cleaned = re.sub(r"\s*```$", "", cleaned).strip()
            return json.loads(cleaned)
    except Exception as e:
        raise RuntimeError(f"Failed to generate valid JSON from Gemini: {str(e)}")
