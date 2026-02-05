import requests
import json
import logging

logger = logging.getLogger(__name__)

def generate_interview_prep(resume_text: str, job_description: str):
    """
    Generates interview preparation questions and answers using a local LLM (Ollama/Mistral).
    Returns a structured JSON object with Technical and Behavioral sections.
    """
    
    prompt = f"""
    You are an expert technical interviewer and career coach.
    Based on the Candidate's Resume and the Job Description, generate a preparation guide.
    
    JOB DESCRIPTION:
    {job_description[:2000]}...
    
    CANDIDATE RESUME:
    {resume_text[:2000]}...
    
    TASK:
    Generate a JSON response with 2 sections:
    1. "technical_questions": List of 3 likely technical questions based on the JD's stack, with brief "Key Talking Points" for the answer.
    2. "behavioral_questions": List of 2 behavioral questions (e.g. STAR method) that fit this role, with a "Suggested Story" from the resume to use.
    
    OUTPUT FORMAT (JSON ONLY):
    {{
      "technical_questions": [
        {{ "question": "...", "answer_tips": "..." }},
        ...
      ],
      "behavioral_questions": [
        {{ "question": "...", "suggested_story": "..." }},
        ...
      ]
    }}
    
    Ensure the JSON is valid and do not include markdown formatting like ```json.
    """

    try:
        url = "http://localhost:11434/api/generate"
        payload = {
            "model": "mistral",
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": 0.5,
                "num_ctx": 4096
            },
            "format": "json" # Force JSON mode if model supports it
        }
        
        response = requests.post(url, json=payload)
        response.raise_for_status()
        
        data = response.json()
        raw_response = data.get("response", "{}")
        
        # Parse JSON from LLM
        try:
            prep_data = json.loads(raw_response)
        except json.JSONDecodeError:
            # Fallback simple cleaning if strict JSON fails
            clean_text = raw_response.replace("```json", "").replace("```", "").strip()
            prep_data = json.loads(clean_text)
            
        return prep_data

    except Exception as e:
        logger.error(f"Failed to generate interview prep: {e}")
        return {
            "technical_questions": [{"question": "Error generating questions.", "answer_tips": str(e)}],
            "behavioral_questions": []
        }
