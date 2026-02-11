import logging
import csv
from typing import List, Dict
from jobspy import scrape_jobs

logger = logging.getLogger(__name__)

def search_jobs_in_germany(query: str, location: str = "Germany", hours_old: int = 72) -> List[Dict[str, str]]:
    """
    Searches for jobs in Germany using python-jobspy.
    Scrapes Indeed, LinkedIn, and Glassdoor.
    """
    logger.info(f"Scraping jobs for {query} in {location} (last {hours_old}h)...")
    
    try:
        # Scrape jobs from multiple sites
        jobs_df = scrape_jobs(
            site_name=["indeed", "linkedin", "glassdoor"],
            search_term=query,
            location=location,
            results_wanted=10,
            hours_old=hours_old,
            country_indeed='Germany'
        )
        
        
        # Pydantic doesn't like NaN, so fill them with empty strings
        jobs_df = jobs_df.fillna("")

        results = []
        
        # Convert DataFrame to list of dicts matching our frontend format
        for index, row in jobs_df.iterrows():
            # Basic validation
            title = row.get('title')
            if not title:
                continue

            results.append({
                "title": title,
                "company": row.get('company') or "Unknown Company",
                "location": row.get('location') or location,
                # Description might be truncated or missing in some scrapes, handle gracefully
                "description": row.get('description') or f"View full details at {row.get('job_url')}",
                "url": row.get('job_url') or "#",
                "date_posted": str(row.get('date_posted')) if row.get('date_posted') else None
            })
            
        logger.info(f"Found {len(results)} jobs.")
        return results

    except Exception as e:
        logger.error(f"Error scraping jobs: {e}")
        # Fallback to mock if scraping fails completely (e.g. blocking)
        return get_mock_jobs(query, location)

def get_mock_jobs(query, location):
    return [
        {
            "title": f"Senior {query} (Mock/Fallback)",
            "company": "Tech Corp GmbH",
            "location": location,
            "location": location,
            "description": "Scraping failed or was blocked. This is a fallback result. Real scraping can be brittle.",
            "url": "https://example.com",
            "date_posted": "2023-01-01"
        }
    ]
