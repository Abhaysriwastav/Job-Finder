import logging
from playwright.sync_api import sync_playwright
import re
from datetime import datetime

logger = logging.getLogger(__name__)

def scrape_visasponsor(query: str, location: str = "Germany") -> list:
    """
    Scrapes jobs from VisaSponsor.jobs using Playwright.
    """
    results = []
    logger.info(f"Scraping VisaSponsor for '{query}' in '{location}'...")

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page(
                user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            )

            # Construct URL
            # Example: https://visasponsor.jobs/api/jobs?country=Germany&classification=Engineering&keyword=python&showMoreOptions=false
            # We map generic location to country parameter best effort
            country_param = location if location else "Germany"
            
            url = f"https://visasponsor.jobs/api/jobs?country={country_param}&keyword={query}&showMoreOptions=false"
            logger.info(f"Navigating to {url}")
            
            page.goto(url, timeout=60000)
            page.wait_for_load_state("networkidle")
            
            # Selector identified from research: div with class containing 'job'
            # Specific class observed: 'd-flex flex-column rounded-3 h-100 shadow job'
            # The A tag wraps the div, so we should query for the A tag directly or find parent
            
            # Strategy: Find all A tags that contain a .job div
            job_cards = page.query_selector_all("a:has(div[class*='job'])")
            if not job_cards:
                 # Fallback: maybe the A tag IS the card or is inside?
                 # Let's try finding the div and getting parent
                 divs = page.query_selector_all("div[class*='job'][class*='shadow']")
                 job_cards = [div.evaluate("el => el.closest('a')") for div in divs]
                 job_cards = [el for el in job_cards if el] # filter nones
            
            logger.info(f"Found {len(job_cards)} job cards via A tag strategy")
            
            for card in job_cards[:10]: # Limit to 10 for performance
                try:
                    # Title matches .fs-5.fw-medium
                    title_el = card.query_selector(".fs-5.fw-medium")
                    title = title_el.inner_text().strip() if title_el else "Unknown Title"
                    
                    # Company matches .employer-name
                    company_el = card.query_selector(".employer-name")
                    company = company_el.inner_text().strip() if company_el else "Unknown Company"
                    
                    # Link
                    href = card.get_attribute("href")
                    link = f"https://visasponsor.jobs{href}" if href and href.startswith("/") else (href or "#")

                    # Location matches div.col-11.sub-font or similar
                    location_el = card.query_selector(".col-11.sub-font")
                    if location_el:
                         # It has spans with "Munich, ", "Bavaria, ", etc.
                         location_text = location_el.inner_text().replace("\n", "").strip()
                    else:
                         location_text = location
                    
                    # Date
                    date_posted = datetime.now().strftime("%Y-%m-%d")
                    # Try to find specific date text like "31-01-2026"
                    # It's in the last div .sub-font .mt-auto
                    try:
                        date_el = card.query_selector("div.sub-font.mt-auto span:last-child")
                        if date_el:
                            date_text = date_el.inner_text().strip()
                            # Parse DD-MM-YYYY if possible
                            date_posted = date_text
                    except:
                        pass

                    results.append({
                        "title": title,
                        "company": company,
                        "location": location_text,
                        "description": f"Visa Sponsored Job: {title} at {company}",
                        "url": link,
                        "date_posted": date_posted,
                        "source": "VisaSponsor"
                    })
                except Exception as e:
                    logger.warning(f"Error parsing card: {e}")
                    continue

            browser.close()
            
    except Exception as e:
        logger.error(f"VisaSponsor scrape failed: {e}")
        
    return results
