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

    # Merge all results
    logger.info(f"Total raw jobs found: {len(all_results)}")

    # Post-processing Filter: Enforce hours_old
    final_results = []
    from datetime import datetime, timedelta
    
    # Helper for relative dates
    def parse_job_date(date_str):
        if not date_str or str(date_str).lower() == 'none' or str(date_str) == '':
            return None
            
        date_str = str(date_str).strip()
        
        # 1. Try ISO format YYYY-MM-DD
        try:
            return datetime.strptime(date_str, "%Y-%m-%d")
        except:
            pass
            
        # 2. Try DD-MM-YYYY
        try:
            return datetime.strptime(date_str, "%d-%m-%Y")
        except:
            pass

        # 3. Try Relative Dates (e.g. "2 days ago", "just now", "14 hours ago")
        lower = date_str.lower()
        now = datetime.now()
        
        if "just now" in lower or "today" in lower:
            return now
            
        if "yesterday" in lower:
            return now - timedelta(days=1)
            
        # "X hours ago" or "X minutes ago"
        if "hour" in lower:
            try:
                import re
                hours = int(re.search(r'(\d+)', lower).group(1))
                return now - timedelta(hours=hours)
            except:
                pass
        
        if "minute" in lower: # Treat as now/very recent
            return now
            
        if "day" in lower:
            # "3 days ago", "30+ days ago"
            try:
                import re
                days = int(re.search(r'(\d+)', lower).group(1))
                return now - timedelta(days=days)
            except:
                pass
                
        return None

    cutoff = datetime.now() - timedelta(hours=hours_old)
    
    for job in all_results:
        d_str = job.get('date_posted')
        
        job_date = parse_job_date(str(d_str))
        
        if job_date:
            # Compare
            if job_date >= cutoff:
                final_results.append(job)
        else:
            # If we can't parse date, verify if it is safe to include
            # For now, append it to be safe.
            final_results.append(job)

    logger.info(f"Filtered jobs (last {hours_old}h): {len(final_results)}")
    
    if not final_results:
        return get_mock_jobs(query, location)
        
    return final_results

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
