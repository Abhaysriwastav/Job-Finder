import logging
from playwright.sync_api import sync_playwright

logger = logging.getLogger(__name__)

def apply_to_linkedin(job_url: str):
    """
    Launches a visible browser for the user to apply to a job.
    This is an "Assisted Apply" - it navigates to the job and tries to help,
    but ultimately relies on the user for login and complex forms.
    """
    logger.info(f"Starting Assisted Apply for: {job_url}")
    
    with sync_playwright() as p:
        # Launch browser in HEADED mode so user can see and interact
        browser = p.chromium.launch(headless=False, slow_mo=1000)
        context = browser.new_context(
             viewport={'width': 1280, 'height': 800},
             user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
        page = context.new_page()

        try:
            logger.info("Navigating to job url...")
            page.goto(job_url, timeout=60000)
            
            # Check if we need to login
            if "linkedin.com/login" in page.url or "auth" in page.url:
                 logger.info("User needs to login. Waiting for user interaction...")
                 # We keep the browser open. In a real script we might wait, 
                 # but for this "Assistant" mode, we just aim to get them to the page.
            
            # Try to find "Easy Apply" button
            # Note: Selectors change often. This is a best-effort.
            try:
                easy_apply_button = page.get_by_role("button", name="Easy Apply", exact=False).first
                if easy_apply_button.is_visible():
                    logger.info("Found Easy Apply button! highlighting it.")
                    easy_apply_button.highlight()
                    # Optional: easy_apply_button.click() 
                    # We might want to let the user click it to be safe from bot detection
                else:
                    logger.info("Easy Apply button not found (might be already applied or 'Apply' on company site).")
            except Exception as e:
                logger.warning(f"Could not highlight Easy Apply button: {e}")

            logger.info("Browser is open. keeping it open for a bit for the user...")
            # Keep browser open for a significant time or until closed by user
            # In a synchronous request this handles poor, but better tailored for a background task
            # For this MVP, we sleep a bit then close, OR we rely on a different architecture.
            # BETTER MVP: Just open it and wait for a long time or until detached.
            
            page.wait_for_timeout(300000) # Wait 5 minutes for user to do stuff
            
        except Exception as e:
            logger.error(f"Error in apply bot: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    # Test
    url = "https://www.linkedin.com/jobs/view/some-job-id"
    apply_to_linkedin(url)
