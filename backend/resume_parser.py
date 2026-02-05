from pdfminer.high_level import extract_text
import logging

logger = logging.getLogger(__name__)

def parse_resume(file_path: str) -> str:
    """
    Extracts text from a PDF resume file.
    """
    try:
        text = extract_text(file_path)
        # Basic cleanup: remove excessive whitespace
        clean_text = "\n".join([line.strip() for line in text.split("\n") if line.strip()])
        return clean_text
    except Exception as e:
        logger.error(f"Failed to parse resume: {e}")
        return ""
