import logging
import csv
from typing import List, Dict
from jobspy import scrape_jobs
from .scrapers.visasponsor import scrape_visasponsor
from .scrapers.europeanjobdays import scrape_europeanjobdays

logger = logging.getLogger(__name__)

def search_jobs_in_germany(query: str, location: str = "Germany", hours_old: int = 72) -> List[Dict[str, str]]:
    """
    Searches for jobs in Germany using python-jobspy and custom scrapers.
    Scrapes Indeed, LinkedIn, Glassdoor, VisaSponsor, and EuropeanJobDays.
    """
    logger.info(f"Scraping jobs for {query} in {location} (last {hours_old}h)...")
    
    all_results = []
    
    # 1. JobSpy Scraper (Indeed, LinkedIn, Glassdoor)
    try:
        jobs_df = scrape_jobs(
            site_name=["indeed", "linkedin", "glassdoor"],
            search_term=query,
            location=location,
            results_wanted=10,
            hours_old=hours_old,
            country_indeed='Germany'
        )
        
        jobs_df = jobs_df.fillna("")
        
        for index, row in jobs_df.iterrows():
            title = row.get('title')
            if not title:
                continue

            all_results.append({
                "title": title,
                "company": row.get('company') or "Unknown Company",
                "location": row.get('location') or location,
                "description": row.get('description') or f"View full details at {row.get('job_url')}",
                "url": row.get('job_url') or "#",
                "date_posted": str(row.get('date_posted')) if row.get('date_posted') else None,
                "source": row.get('site', 'JobSpy')
            })
            
    except Exception as e:
        logger.error(f"JobSpy scraping failed: {e}")

    # 2. VisaSponsor Scraper
    try:
        vs_results = scrape_visasponsor(query, location)
        all_results.extend(vs_results)
    except Exception as e:
        logger.error(f"VisaSponsor integration failed: {e}")

    # 3. EuropeanJobDays Scraper
    try:
        # EuropeanJobDays search seems location agnostic or hard to filter by city in URL, 
        # but we pass query.
        ejd_results = scrape_europeanjobdays(query)
        all_results.extend(ejd_results)
    except Exception as e:
        logger.error(f"EuropeanJobDays integration failed: {e}")

    logger.info(f"Total jobs found from all sources: {len(all_results)}")
    
    if not all_results:
        return get_mock_jobs(query, location)
        
    return all_results

def get_mock_jobs(query, location):
    return [
        {
            "title": f"Senior {query} (Backups)",
            "company": "Tech Corp GmbH",
            "location": location,
            "description": "Scraping failed. This is a fallback result.",
            "url": "https://example.com",
            "date_posted": "2023-01-01",
            "source": "Mock"
        }
    ]
