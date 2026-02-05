# Job Finder & AI Resume Tailor 🚀

**Job Finder** is a powerful, local-first Career Dashboard that helps you **Find, Track, and Tailor** your applications for the German job market (and beyond). It combines real-time job scraping with local AI (Ollama) to rewrite your resume for every single application.

![Job Finder Dashboard](https://github.com/Abhaysriwastav/Job-Finder/assets/placeholder/dashboard.png)

## ✨ Features

- **🔎 Real-Time Job Scraping**: Aggregates live listings from **Indeed, LinkedIn, and Glassdoor** (using `jobspy`).
- **🤖 AI Resume Tailoring**: Instantly rewrites your *Summary* and *Experience* sections to match a specific job description using **Mistral** (via Ollama).
- **📋 Kanban Board Tracking**: meaningful drag-and-drop workflow (`Saved` → `Applied` → `Interview` → `Offer`).
- **⚡ Automated Monitoring**: "Set and Forget" saved searches that run in the background and auto-populate your board.
- **📊 Analytics Dashboard**: Visualize your conversion rates and identify bottlenecks in your funnel.
- **✉️ Cold Email Generator**: AI-assisted writing for reaching out to hiring managers directly.
- **🎙️ Interview Prep Agent**: Generates technical and behavioral questions based on the specific job description.
- **🔒 Local & Private**: All data (resumes, job lists) is stored locally. No external databases.

## 🛠️ Tech Stack

- **Frontend**: React, Vite, Tailwind CSS v4, Lucide Icons, Framer Motion.
- **Backend**: Python, FastAPI, JobSpy (Scraper), Ollama (AI).
- **Data**: JSON-based local persistence.

## 🚀 Getting Started

### Prerequisites

1.  **Git** & **Node.js** installed.
2.  **Python 3.10+**.
3.  **Ollama** installed and running locally:
    ```bash
    ollama serve
    ollama pull mistral
    ```
    *(Note: You can swap `mistral` for `llama3` in `backend/main.py` if desired)*

### Installation

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/Abhaysriwastav/Job-Finder.git
    cd Job-Finder
    ```

2.  **Backend Setup**
    ```bash
    cd backend
    python -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate
    pip install -r requirements.txt
    ```

3.  **Frontend Setup**
    ```bash
    cd ../frontend
    npm install
    ```

### Running the App

You need to run both the backend and frontend terminals.

**Terminal 1 (Backend):**
```bash
cd backend
source venv/bin/activate
uvicorn main:app --reload
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## 📖 Usage Guide

1.  **Upload Resume**: Drag & drop your master PDF resume.
2.  **Search Jobs**: Enter a role (e.g., "Python Developer") and location.
3.  **Auto-Scraper**: Click the **Bookmark** icon to save a search. Open the **Zap** panel to run batch scrapers.
4.  **Tailor**: Click the **Lightning Bolt** on any job to generate a custom resume version.
5.  **Track**: Switch to **Board View** to manage your application lifecycle.

## 🤝 Contributing

Contributions are welcome! Please fork the repo and submit a PR.

## 📄 License

MIT License.
