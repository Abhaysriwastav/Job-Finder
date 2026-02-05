import requests
import json
import logging

logger = logging.getLogger(__name__)

def generate_cold_email(resume_text: str, job_description: str, hiring_manager_name: str = None, platform: str = "Email"):
    """
    Generates a cold email or LinkedIn message using a local LLM (Ollama/Mistral).
    """
    
    # Construct the Prompt
    recipient = hiring_manager_name if hiring_manager_name else "Hiring Manager"
    
    if platform == "LinkedIn":
        limit_instruction = "IMPORTANT: This is for a LinkedIn connection note. MAX 300 CHARACTERS. Be casual but professional."
    elif platform == "Cover Letter":
        limit_instruction = """
        IMPORTANT: This is a FORMAL COVER LETTER. 
        Structure it properly with:
        - Header (Applicant details)
        - Salutation
        - Opening (Enthusiastic statement of interest)
        - Body Paragraph 1 (Relevant Experience mapping to JD)
        - Body Paragraph 2 (Why this company/Team fit)
        - Call to Action (Request for interview)
        - Sign-off
        Length: ~300-400 words. Professional tone.
        """
    else:
        limit_instruction = "Keep it concise (approx 150 words). Standard professional email format."
    
    prompt = f"""
    You are an expert career coach and copywriter. Write a {platform} for me to apply for a job.
    
    CONTEXT:
    - Recipient: {recipient}
    - Platform: {platform}
    - My Resume Summary (Start):
    {resume_text[:1500]}
    - Job Description (Start):
    {job_description[:1500]}
    
    INSTRUCTIONS:
    - {limit_instruction}
    - Analyze the resume and pick the TOP achievements that match the Job Description.
    - No placeholders for missing info unless absolutely necessary.
    - Output ONLY the message content. No preamble.
    """

    try:
        url = "http://localhost:11434/api/generate"
        payload = {
            "model": "mistral",
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": 0.7,
                "num_ctx": 4096
            }
        }
        
        response = requests.post(url, json=payload)
        response.raise_for_status()
        
        data = response.json()
        return data.get("response", "Error: No response from LLM.")

    except Exception as e:
        logger.error(f"Failed to generate email: {e}")
        return f"Error generating email: {str(e)}"
