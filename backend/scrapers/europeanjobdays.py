import logging
from playwright.sync_api import sync_playwright
from datetime import datetime

logger = logging.getLogger(__name__)

def scrape_europeanjobdays(query: str) -> list:
    """
    Scrapes jobs from EuropeanJobDays.eu using Playwright.
    """
    results = []
    logger.info(f"Scraping EuropeanJobDays for '{query}'...")

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page(
                user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            )
            
            url = f"https://europeanjobdays.eu/en/jobs?keywords={query}"
            logger.info(f"Navigating to {url}")
            
            page.goto(url, timeout=60000)
            try:
                page.wait_for_load_state("networkidle", timeout=30000)
            except:
                logger.warning("Timeout waiting for networkidle, continuing...")
            
            # Selector identified from research: .teaser-item
            try:
                page.wait_for_selector(".teaser-item", timeout=10000)
            except:
                logger.warning("Timeout waiting for .teaser-item selector")

            job_items = page.query_selector_all(".teaser-item")
            
            logger.info(f"EuropeanJobDays: Found {len(job_items)} job items")
            
            for item in job_items[:10]:
                try:
                    # Title
                    title_el = item.query_selector(".teaser-item__text .heading a")
                    title = title_el.inner_text().strip() if title_el else "Unknown Title"
                    link = "https://europeanjobdays.eu" + title_el.get_attribute("href") if title_el else "#"
                    
                    # Company
                    company_el = item.query_selector(".company-logo img")
                    if company_el:
                         company = company_el.get_attribute("alt")
                    else:
                         # Try text fallback in the metadata group
                         company_text_el = item.query_selector(".teaser-item__text .group.type-inline.mb-5 span:nth-of-type(3) a")
                         company = company_text_el.inner_text().strip() if company_text_el else "European Employer"

                    # Location - parse from fields
                    location = "Europe"
                    # Find field label "Workplace:"
                    fields_text = item.inner_text()
                    if "Workplace:" in fields_text:
                        # Simple parse approach since structure is flat text in inner_text usually
                        # But safer to find the specific element
                        # The structure is label -> value
                        # Let's try to find the container that has "Workplace:"
                        # <span class="field..."><span class="field__label">Workplace:</span><span class="field__value">Norway, Oslo</span></span>
                        
                        # We can iterate through field labels
                        labels = item.query_selector_all(".field__label")
                        for label in labels:
                            if "Workplace:" in label.inner_text():
                                # The value is the next sibling or parent's second child
                                parent = label.evaluate("el => el.parentElement")
                                # Value is likely in .field__value
                                val_el = label.evaluate("el => el.parentElement.querySelector('.field__value')")
                                if val_el:
                                    location = val_el['textContent'].strip() # workaround since evaluate returns object/dict if not careful? No wait.
                                    # Actually better:
                                    location = page.evaluate("el => el.parentElement.querySelector('.field__value').textContent", label).strip()
                                break
                    
                    # Date
                    date_posted = datetime.now().strftime("%Y-%m-%d")
                    date_el = item.query_selector(".teaser-item__text .group.type-inline.mb-5 span:first-child .field__value")
                    if date_el:
                        date_posted = date_el.inner_text().strip()

                    results.append({
                        "title": title,
                        "company": company,
                        "location": location,
                        "description": f"European Job Days: {title} in {location}",
                        "url": link,
                        "date_posted": date_posted,
                        "source": "EuropeanJobDays"
                    })
                except Exception as e:
                    logger.warning(f"Error parsing item: {e}")
                    continue

            browser.close()

    except Exception as e:
        logger.error(f"EuropeanJobDays scrape failed: {e}")
        
    return results
