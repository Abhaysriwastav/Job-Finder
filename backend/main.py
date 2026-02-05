from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import shutil
import os
import logging
from resume_parser import parse_resume
from job_search import search_jobs_in_germany
from tailor import tailor_resume

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Job Tailor API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all for dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Job(BaseModel):
    title: str
    company: str
    location: str
    description: str
    url: Optional[str] = None

class TailorRequest(BaseModel):
    resume_text: str
    job_description: str

@app.get("/")
def read_root():
    return {"message": "Job Tailor API is running"}

@app.post("/upload-resume/")
async def upload_resume(file: UploadFile = File(...)):
    try:
        # Save temp file
        file_location = f"temp_{file.filename}"
        with open(file_location, "wb+") as file_object:
            shutil.copyfileobj(file.file, file_object)
        
        # Parse text
        text = parse_resume(file_location)
        
        # Cleanup
        os.remove(file_location)
        
        return {"filename": file.filename, "extracted_text": text}
    except Exception as e:
        logger.error(f"Error uploading resume: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Persistence Path
DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
MASTER_RESUME_PATH = os.path.join(DATA_DIR, "master_resume.json")
import json

@app.post("/save-master-resume/")
async def save_master_resume(file: UploadFile = File(...)):
    """Uploads, extracts, and SAVES the resume text permanently."""
    try:
        # 1. Save temp file
        file_location = f"temp_{file.filename}"
        with open(file_location, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # 2. Extract Text
        extracted_text = parse_resume(file_location)
        
        # 3. Cleanup temp file
        os.remove(file_location)
        
        # 4. Save to persistent storage
        resume_data = {
            "filename": file.filename,
            "text": extracted_text
        }
        with open(MASTER_RESUME_PATH, "w") as f:
            json.dump(resume_data, f)
            
        return {"filename": file.filename, "extracted_text": extracted_text, "message": "Master Resume Saved!"}

    except Exception as e:
        logger.error(f"Error saving master resume: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/get-master-resume/")
async def get_master_resume():
    """Retrieves the saved master resume if it exists."""
    if os.path.exists(MASTER_RESUME_PATH):
        try:
            with open(MASTER_RESUME_PATH, "r") as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Error reading master resume: {e}")
    return {"filename": None, "text": None}


# Tracking Persistence
TRACKED_JOBS_PATH = os.path.join(DATA_DIR, "tracked_jobs.json")

class TrackedJob(BaseModel):
    id: str # unique id (e.g. title+company)
    title: str
    company: str
    location: str
    description: str
    url: Optional[str] = None
    status: str = "Saved" # Saved, Drafting, Applied, Interview, Offer, Rejected
    date_saved: str
    notes: Optional[str] = ""
    match_score: Optional[int] = 0

def load_tracked_jobs():
    if os.path.exists(TRACKED_JOBS_PATH):
        try:
            with open(TRACKED_JOBS_PATH, "r") as f:
                return json.load(f)
        except:
            return []
    return []

def save_tracked_jobs(jobs):
    with open(TRACKED_JOBS_PATH, "w") as f:
        json.dump(jobs, f, indent=2)

@app.get("/tracked-jobs/")
def get_tracked_jobs():
    return load_tracked_jobs()

@app.post("/track-job/")
def track_job(job: TrackedJob):
    jobs = load_tracked_jobs()
    # Check if exists
    for j in jobs:
        if j['id'] == job.id:
            return {"message": "Job already tracked", "job": j}
    
    jobs.append(job.dict())
    save_tracked_jobs(jobs)
    return {"message": "Job tracked successfully", "job": job}

@app.patch("/update-job-status/{job_id}")
def update_job_status(job_id: str, status: str):
    jobs = load_tracked_jobs()
    for job in jobs:
        if job['id'] == job_id:
            job['status'] = status
            save_tracked_jobs(jobs)
            return {"message": f"Status updated to {status}", "job": job}
    raise HTTPException(status_code=404, detail="Job not found")

@app.delete("/tracked-jobs/{job_id}")
def delete_tracked_job(job_id: str):
    jobs = load_tracked_jobs()
    new_jobs = [j for j in jobs if j['id'] != job_id]
    save_tracked_jobs(new_jobs)
    return {"message": "Job removed"}

@app.get("/search-jobs/", response_model=List[Job])
def search_jobs(query: str, location: str = "Germany"):
    try:
        jobs = search_jobs_in_germany(query, location)
        return jobs
    except Exception as e:
        logger.error(f"Error searching jobs: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/tailor-resume/")
def tailor_resume_endpoint(request: TailorRequest):
    try:
        tailored_content = tailor_resume(request.resume_text, request.job_description)
        return {"tailored_resume": tailored_content}
    except Exception as e:
        logger.error(f"Error tailoring resume: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Cold Email Generator
from email_generator import generate_cold_email

class ColdEmailRequest(BaseModel):
    resume_text: str
    job_description: str
    hiring_manager_name: Optional[str] = None
    platform: str = "Email" # Email or LinkedIn

@app.post("/generate-cold-email/")
def generate_cold_email_endpoint(request: ColdEmailRequest):
    try:
        email_content = generate_cold_email(
            request.resume_text, 
            request.job_description, 
            request.hiring_manager_name, 
            request.platform
        )
        return {"email_content": email_content}
    except Exception as e:
        logger.error(f"Error generating cold email: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Interview Prep
from interview_prep import generate_interview_prep

class InterviewPrepRequest(BaseModel):
    resume_text: str
    job_description: str

@app.post("/generate-interview-prep/")
def generate_interview_prep_endpoint(request: InterviewPrepRequest):
    try:
        prep_content = generate_interview_prep(request.resume_text, request.job_description)
        return prep_content
    except Exception as e:
        logger.error(f"Error generating interview prep: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Saved Searches & Automated Scraping
TRACKED_SEARCHES_PATH = os.path.join(DATA_DIR, "tracked_searches.json")

class TrackedSearch(BaseModel):
    id: str # unique id
    query: str
    location: str

def load_tracked_searches():
    if os.path.exists(TRACKED_SEARCHES_PATH):
        try:
            with open(TRACKED_SEARCHES_PATH, "r") as f:
                return json.load(f)
        except:
            return []
    return []

def save_tracked_searches(searches):
    with open(TRACKED_SEARCHES_PATH, "w") as f:
        json.dump(searches, f, indent=2)

@app.get("/saved-searches/")
def get_saved_searches():
    return load_tracked_searches()

@app.post("/saved-searches/")
def save_search(search: TrackedSearch):
    searches = load_tracked_searches()
    # Avoid duplicates
    for s in searches:
        if s['query'].lower() == search.query.lower() and s['location'].lower() == search.location.lower():
             return {"message": "Search already saved", "search": s}
    
    searches.append(search.dict())
    save_tracked_searches(searches)
    return {"message": "Search saved", "search": search}

@app.delete("/saved-searches/{search_id}")
def delete_saved_search(search_id: str):
    searches = load_tracked_searches()
    new_searches = [s for s in searches if s['id'] != search_id]
    save_tracked_searches(new_searches)
    return {"message": "Search removed"}

@app.post("/run-automated-search/")
def run_automated_search():
    searches = load_tracked_searches()
    all_results = []
    
    logger.info(f"Running automated search for {len(searches)} queries...")
    
    for search in searches:
        try:
            logger.info(f"Automated scraping: {search['query']} in {search['location']}")
            jobs = search_jobs_in_germany(search['query'], search['location'])
            # Tag them so UI knows source
            for job in jobs:
                job['source_query'] = search['query']
            all_results.extend(jobs)
        except Exception as e:
            logger.error(f"Failed to scrape for {search['query']}: {e}")
            
    # Deduplicate by URL or Title+Company
    unique_results = []
    seen = set()
    for job in all_results:
        key = job['title'] + job['company']
        if key not in seen:
            seen.add(key)
            unique_results.append(job)
            
    return unique_results

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
