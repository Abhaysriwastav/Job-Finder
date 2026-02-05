import os
from openai import OpenAI
import logging

logger = logging.getLogger(__name__)

def tailor_resume(resume_text: str, job_description: str) -> str:
    """
    Tailors the resume using an LLM to match the job description.
    Supports OpenAI and Ollama.
    """
    # Check for OpenAI Key first, if not present, try Ollama
    api_key = os.getenv("OPENAI_API_KEY")
    base_url = None
    model = "gpt-3.5-turbo"
    
    if not api_key:
        logger.info("No OpenAI API Key found. Attempting to use Ollama via localhost.")
        api_key = "ollama" # Required for client init, but ignored by Ollama
        base_url = "http://localhost:11434/v1"
        model = "mistral:latest" # Explicitly use the tag found in Ollama
        
    import requests
    import json
    import re
    
    try:
        model = "mistral:latest"
        
        prompt = f"""
        You are a professional Resume Optimizer. I will provide a Job Description. Your task is to compare it to my Master Resume provided below.

        Output Requirement: Do not write "Here is your resume." 
        You must output ONLY a valid JSON object in the following format:
        
        {{
            "Match_Score": 85, 
            "Tailored_Summary": "Reshaped summary identifying key overlaps...",
            "Tailored_Experience": "Refined bullet points..."
        }}
        
        Original Resume:
        {resume_text[:2000]}
        
        Job Description:
        {job_description[:2000]}
        """
        
        print(f"DEBUG: Attempting to connect to Ollama at {base_url} with model {model}")
        
        # 1. Try Chat Endpoint (OpenAI Compatible) - raw request
        try:
             response = requests.post(
                "http://localhost:11434/v1/chat/completions",
                json={
                    "model": model,
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.7
                },
                timeout=120
             )
             if response.status_code == 200:
                 response_text = response.json()['choices'][0]['message']['content']
             else:
                 raise Exception(f"Chat endpoint failed: {response.text}")

        except Exception as chat_err:
             print(f"DEBUG: Chat endpoint failed ({chat_err}), trying Native Generate endpoint...")
             # 2. Fallback to Native Generate Endpoint
             response = requests.post(
                "http://localhost:11434/api/generate",
                json={
                    "model": model,
                    "prompt": prompt,
                    "stream": False,
                    "format": "json"
                },
                timeout=120
             )
             if response.status_code != 200:
                 raise Exception(f"Ollama Native API Error: {response.text}")
             response_text = response.json().get('response', '')

        # Robust JSON extraction
        try:
            # Try finding JSON block
            json_match = re.search(r'\{[\s\S]*\}', response_text)
            if json_match:
                json_str = json_match.group(0)
                # Validation check
                json.loads(json_str) 
                return json_str
            else:
                raise ValueError("No JSON found")
                
        except Exception as e:
            logger.warning(f"Failed to parse LLM JSON: {e}. Returning raw text wrapper.")
            # Fallback: Wrap raw output in our schema so frontend doesn't crash
            return json.dumps({
                "Match_Score": 0,
                "Tailored_Summary": "AI output was not valid JSON. Here is the raw response below:",
                "Tailored_Experience": response_text
            })
            
    except Exception as e:
        logger.error(f"Error calling LLM provider: {e}")
        logger.info("Falling back to Mock response.")
        return mock_tailor_resume(resume_text, job_description)

def mock_tailor_resume(resume_text: str, job_description: str) -> str:
    return f"""
    # TAILORED RESUME (MOCK - FALLBACK)
    
    **Note**: Failed to connect to Ollama or OpenAI. Ensure Ollama is running (`ollama serve`) and you have a model pulled (e.g. `ollama run llama3`).
    
    ## Adapted Summary
    Highly skilled professional with experience relevant to the job description provided.
    
    ## Job Analysis
    Based on the job description:
    "{job_description[:100]}..."
    
    I have highlighted your matching skills:
    - Python
    - React
    - Communication
    
    ## Original Resume Context
    {resume_text[:200]}...
    """
