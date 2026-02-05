import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Upload, Search, FileText, CheckCircle, AlertCircle, Copy, ExternalLink, Zap, Clock, MapPin, Briefcase, ChevronDown, MoreHorizontal, Trash2, Mail, Mic, PieChart, BarChart, Bookmark } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { Button } from './components/Button';

// Error Boundary
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg">
          <h2 className="font-bold">Something went wrong.</h2>
          <p>Please reload the page.</p>
          <button onClick={() => this.setState({ hasError: false })} className="mt-2 text-sm underline">Dismiss</button>
        </div>
      );
    }
    return this.props.children;
  }
}

const PREDEFINED_ROLES = [
  "AI / LLM Application Developer",
  "Full-Stack Software Engineer (Python/Django)",
  "Web & E-commerce Architect",
  "Integration Engineer / API Specialist",
  "Junior Python Engineer",
  "Python Backend Engineer"
];

function App() {
  const [resumeText, setResumeText] = useState(null);
  const [resumeName, setResumeName] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('Germany');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // New: Store tailored results by ID to show in table
  const [tailoredResults, setTailoredResults] = useState({});
  const [tailoringJobId, setTailoringJobId] = useState(null);

  // Active Tailored Modal State
  const [activeModalData, setActiveModalData] = useState(null);
  const [modalMode, setModalMode] = useState('visual'); // 'visual' | 'text'

  const [error, setError] = useState(null);

  // New State for Kanban & Tracking
  const [trackedJobs, setTrackedJobs] = useState([]);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'board'

  // Automated Scraping State
  const [savedSearches, setSavedSearches] = useState([]);
  const [showSavedSearches, setShowSavedSearches] = useState(false);
  const [isAutomatedSearchRunning, setIsAutomatedSearchRunning] = useState(false);

  // Cold Email State
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailJobData, setEmailJobData] = useState(null);
  const [generatedEmail, setGeneratedEmail] = useState("");
  const [hiringManager, setHiringManager] = useState("");
  const [emailPlatform, setEmailPlatform] = useState("Email");
  const [generatingEmail, setGeneratingEmail] = useState(false);

  // Interview Prep State
  const [prepModalOpen, setPrepModalOpen] = useState(false);
  const [prepData, setPrepData] = useState(null);
  const [generatingPrep, setGeneratingPrep] = useState(false);
  const [prepJobData, setPrepJobData] = useState(null);

  const API_URL = 'http://localhost:8000';

  useEffect(() => {
    const fetchMasterResume = async () => {
      try {
        const res = await axios.get(`${API_URL}/get-master-resume/`);
        if (res.data.text) {
          setResumeText(res.data.text);
          setResumeName(res.data.filename || "Master Resume");
        }
      } catch (err) {
        console.error("Could not fetch master resume", err);
      }
    };
    fetchMasterResume();
  }, []);

  // Load Tracked Jobs
  useEffect(() => {
    fetchTrackedJobs();
    fetchSavedSearches();
  }, []);

  const fetchTrackedJobs = async () => {
    try {
      const res = await axios.get(`${API_URL}/tracked-jobs/`);
      setTrackedJobs(res.data);
    } catch (err) {
      console.error("Failed to load tracked jobs", err);
    }
  };

  const fetchSavedSearches = async () => {
    try {
      const res = await axios.get(`${API_URL}/saved-searches/`);
      setSavedSearches(res.data);
    } catch (err) {
      console.error("Failed to load saved searches", err);
    }
  };

  const handleSaveSearch = async () => {
    if (!searchQuery) return;
    try {
      const id = Date.now().toString(); // simple ID
      await axios.post(`${API_URL}/saved-searches/`, {
        id,
        query: searchQuery,
        location: location
      });
      fetchSavedSearches();
      alert("Search configuration saved!");
    } catch (err) {
      setError("Failed to save search.");
    }
  };

  const handleDeleteSearch = async (id) => {
    try {
      await axios.delete(`${API_URL}/saved-searches/${id}`);
      fetchSavedSearches();
    } catch (err) {
      setError("Failed to remove search.");
    }
  };

  const handleRunAutomatedSearch = async () => {
    setIsAutomatedSearchRunning(true);
    setError(null);
    try {
      const res = await axios.post(`${API_URL}/run-automated-search/`);
      setJobs(res.data); // Show results in list view
      setViewMode('list');
      alert(`Automated run complete! Found ${res.data.length} jobs.`);
    } catch (err) {
      setError("Automated search failed. Check backend logs.");
    } finally {
      setIsAutomatedSearchRunning(false);
    }
  };

  const handleTrackJob = async (job) => {
    try {
      // Sanitize ID: Remove special chars to avoid URL issues
      const cleanId = (job.title + "_" + job.company).replace(/[^a-zA-Z0-9_-]/g, '');
      const payload = {
        id: cleanId,
        title: job.title,
        company: job.company,
        location: job.location,
        description: job.description,
        url: job.url,
        date_saved: new Date().toISOString().split('T')[0],
        status: "Saved"
      };

      await axios.post(`${API_URL}/track-job/`, payload);
      fetchTrackedJobs(); // reload
    } catch (err) {
      setError("Could not save job.");
    }
  };

  const handleUpdateStatus = async (jobId, newStatus) => {
    try {
      await axios.patch(`${API_URL}/update-job-status/${encodeURIComponent(jobId)}`, null, {
        params: { status: newStatus }
      });
      fetchTrackedJobs();
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (!confirm("Are you sure you want to remove this job from your board?")) return;
    try {
      await axios.delete(`${API_URL}/tracked-jobs/${encodeURIComponent(jobId)}`);
      fetchTrackedJobs();
    } catch (err) {
      console.error("Failed to delete job", err);
    }
  };

  const openEmailModal = (job) => {
    setEmailJobData(job);
    setGeneratedEmail("");
    setHiringManager("");
    setEmailModalOpen(true);
  };

  const handleGenerateEmail = async () => {
    if (!resumeText) {
      setError("Please upload a resume first.");
      return;
    }
    setGeneratingEmail(true);
    try {
      const res = await axios.post(`${API_URL}/generate-cold-email/`, {
        resume_text: resumeText,
        job_description: emailJobData.description,
        hiring_manager_name: hiringManager,
        platform: emailPlatform
      });
      setGeneratedEmail(res.data.email_content);
    } catch (err) {
      console.error(err);
      setError("Failed to generate email.");
    } finally {
      setGeneratingEmail(false);
    }
  };

  const openPrepModal = (job) => {
    setPrepJobData(job);
    setPrepData(null);
    setPrepModalOpen(true);
  };

  const handleGeneratePrep = async () => {
    if (!resumeText) {
      setError("Please upload a resume first.");
      return;
    }
    setGeneratingPrep(true);
    try {
      const res = await axios.post(`${API_URL}/generate-interview-prep/`, {
        resume_text: resumeText,
        job_description: prepJobData.description
      });
      setPrepData(res.data);
    } catch (err) {
      console.error(err);
      setError("Failed to generate interview prep.");
    } finally {
      setGeneratingPrep(false);
    }
  };

  const onDrop = async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post(`${API_URL}/save-master-resume/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResumeText(res.data.extracted_text);
      setResumeName(res.data.filename);
    } catch (err) {
      setError("Failed to upload output. Ensure backend is running.");
    } finally {
      setUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: false
  });

  const handleSearch = async (e, overrideQuery = null) => {
    if (e) e.preventDefault();
    const queryToUse = overrideQuery || searchQuery;
    if (!queryToUse) return;

    if (overrideQuery) setSearchQuery(overrideQuery);

    setLoading(true);
    setError(null);
    setJobs([]);
    setTailoredResults({}); // Clear old results
    try {
      const res = await axios.get(`${API_URL}/search-jobs/`, {
        params: { query: queryToUse, location }
      });
      setJobs(res.data);
    } catch (err) {
      setError("Failed to fetch jobs.");
    } finally {
      setLoading(false);
    }
  };

  const handleTailor = async (job) => {
    if (!resumeText) {
      setError("Please upload a resume first.");
      return;
    }

    const jobId = job.title + job.company;
    setTailoringJobId(jobId);

    try {
      const res = await axios.post(`${API_URL}/tailor-resume/`, {
        resume_text: resumeText,
        job_description: job.description
      });

      // Parse here to store structured data
      let parsedData = null;
      try {
        // Safe parsing logic
        const contentStr = typeof res.data.tailored_resume === 'string'
          ? res.data.tailored_resume
          : JSON.stringify(res.data.tailored_resume);

        const normalizedText = contentStr.replace(/\r\n/g, '\n');
        const codeBlockMatch = normalizedText.match(/```json\s*(\{[\s\S]*?\})\s*```/);
        const jsonString = codeBlockMatch ? codeBlockMatch[1] : (normalizedText.match(/\{[\s\S]*\}/)?.[0] || normalizedText);
        parsedData = JSON.parse(jsonString);
      } catch (e) {
        console.warn("Parse error", e);
      }

      // Store result
      const resultObj = {
        raw: res.data.tailored_resume,
        parsed: parsedData
      };

      setTailoredResults(prev => ({
        ...prev,
        [jobId]: resultObj
      }));

      // Open modal immediately
      setActiveModalData(resultObj);

    } catch (err) {
      setError("Failed to tailor resume: " + err.message);
    } finally {
      setTailoringJobId(null);
    }
  };

  const openResult = (jobId) => {
    if (tailoredResults[jobId]) {
      setActiveModalData(tailoredResults[jobId]);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  // Helper to get Status Badge Style
  const getStatusBadge = (status) => {
    const styles = {
      'New': 'bg-purple-100 text-purple-700',
      'Applied': 'bg-blue-100 text-blue-700',
      'Rejected': 'bg-red-100 text-red-700',
      'Interview': 'bg-yellow-100 text-yellow-700'
    };
    return styles[status] || styles['New'];
  };

  // DND Handlers
  const handleDragStart = (e, jobId) => {
    e.dataTransfer.setData("text/plain", jobId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e) => {
    e.preventDefault(); // Necessary for onDrop to trigger
    e.currentTarget.classList.add('bg-blue-50');
  };

  const handleDragLeave = (e) => {
    e.currentTarget.classList.remove('bg-blue-50');
  };

  const handleDrop = (e, targetColumn) => {
    e.preventDefault();
    e.currentTarget.classList.remove('bg-blue-50');
    const jobId = e.dataTransfer.getData("text/plain");
    if (jobId) {
      handleUpdateStatus(jobId, targetColumn);
    }
  };

  const KANBAN_COLUMNS = ["Saved", "Drafting", "Applied", "Interview", "Offer"];

  return (
    <div className="min-h-screen bg-gray-50/50 font-sans text-gray-900">
      {/* Top Navigation */}
      <header className="border-b border-gray-200 sticky top-0 z-20 bg-white/80 backdrop-blur-md">
        <div className="max-w-[1600px] mx-auto px-6 py-3 flex justify-between items-center">

          {/* Logo / Title */}
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-md shadow-sm">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight text-gray-900">Job <span className="text-blue-600">Finder</span></h1>
              <p className="text-xs text-gray-500 font-medium">Workspace / Career Dashboard</p>
            </div>
          </div>

          {/* Center: View Toggle */}
          <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Briefcase className="w-4 h-4" /> Search & List
            </button>
            <button
              onClick={() => setViewMode('board')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${viewMode === 'board' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Clock className="w-4 h-4" /> Board View
            </button>
            <button
              onClick={() => setViewMode('analytics')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${viewMode === 'analytics' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <PieChart className="w-4 h-4" /> Analytics
            </button>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            <div
              {...getRootProps()}
              className={`transition-all cursor-pointer flex items-center gap-2 px-3 py-1.5 rounded-md border text-sm font-medium
                  ${resumeName ? 'bg-green-50 border-green-200 text-green-700' : 'bg-white border-gray-200 hover:bg-gray-50'}
                `}
            >
              <input {...getInputProps()} />
              {uploading ? <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" /> : <div className={`w-2 h-2 rounded-full ${resumeName ? 'bg-green-500' : 'bg-gray-400'}`} />}
              {resumeName ? "Master Resume Active" : "Upload Resume"}
            </div>

            <a
              href="https://app.enhancv.com/job-applications"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-3 py-1.5 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-gray-800 transition-colors shadow-sm"
            >
              <ExternalLink className="w-4 h-4" />
              Enhancv
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1600px] mx-auto px-6 py-8">

        {/* Error Banner */}
        {error && (
          <div className="mb-6 bg-red-50 text-red-700 p-3 rounded-lg flex items-center gap-2 border border-red-200 text-sm">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        {viewMode === 'list' ? (
          <>
            {/* LIST VIEW (Search & Results) */}
            <div className="mb-8 space-y-4 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex flex-col md:flex-row gap-4">
                <form onSubmit={(e) => handleSearch(e)} className="flex-1 flex gap-2 w-full max-w-2xl bg-white shadow-sm border border-gray-200 rounded-lg p-1 focus-within:ring-2 focus-within:ring-blue-100 transition-shadow">
                  <Search className="w-5 h-5 text-gray-400 my-auto ml-3" />
                  <input
                    type="text"
                    placeholder="Search for position..."
                    className="flex-1 py-4 px-2 outline-none text-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <div className="h-6 w-px bg-gray-200 my-auto"></div>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-32 py-2 px-3 outline-none text-sm text-gray-600"
                  />
                  <Button type="submit" loading={loading} className="py-1 px-4 h-auto text-sm bg-blue-600 hover:bg-blue-700 rounded-md shadow-none">Search</Button>
                </form>

                {/* Save Search Button */}
                <button
                  onClick={handleSaveSearch}
                  className="px-3 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg hover:border-yellow-400 hover:text-yellow-600 transition-colors shadow-sm"
                  title="Save this search configuration"
                >
                  <Bookmark className="w-5 h-5" />
                </button>

                {/* Manage Searches Toggle */}
                <button
                  onClick={() => setShowSavedSearches(!showSavedSearches)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors shadow-sm flex items-center gap-2
                        ${showSavedSearches ? 'bg-gray-800 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}
                    `}
                >
                  <Zap className="w-4 h-4" /> Auto-Scraper ({savedSearches.length})
                </button>
              </div>

              {/* SAVED SEARCHES PANEL */}
              {showSavedSearches && (
                <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-md animate-in slide-in-from-top-2">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                      <Zap className="w-5 h-5 text-orange-500" />
                      Automated Scraping
                    </h3>
                    <Button
                      onClick={handleRunAutomatedSearch}
                      loading={isAutomatedSearchRunning}
                      className="bg-gradient-to-r from-orange-500 to-red-600 text-white border-0 shadow-lg hover:from-orange-600 hover:to-red-700"
                    >
                      {isAutomatedSearchRunning ? "Scraping..." : "Run All Scrapers"}
                    </Button>
                  </div>

                  {savedSearches.length === 0 ? (
                    <p className="text-gray-400 text-sm italic">No saved searches yet. Perform a search and click the bookmark icon.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {savedSearches.map(search => (
                        <div key={search.id} className="flex justify-between items-center p-3 bg-gray-50 border border-gray-100 rounded-lg group">
                          <div>
                            <div className="font-semibold text-gray-900 text-sm">{search.query}</div>
                            <div className="text-xs text-gray-500">{search.location}</div>
                          </div>
                          <button
                            onClick={() => handleDeleteSearch(search.id)}
                            className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {PREDEFINED_ROLES.map((role, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSearch(null, role)}
                    className="px-3 py-1.5 bg-white border border-gray-200 text-gray-600 text-xs font-medium rounded-full hover:border-blue-300 hover:text-blue-600 hover:shadow-sm transition-all shadow-sm"
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>

            {/* DATA TABLE */}
            <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm animate-in fade-in">
              <div className="grid grid-cols-12 gap-4 bg-gray-50/50 border-b border-gray-200 px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <div className="col-span-1 flex items-center"><input type="checkbox" className="rounded border-gray-300" /></div>
                <div className="col-span-3">Position</div>
                <div className="col-span-2">Company</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-1">Saved</div>
                <div className="col-span-2">Resume / Match</div>
                <div className="col-span-1 text-right">Actions</div>
              </div>

              {loading ? (
                <div className="p-12 flex justify-center items-center text-gray-400 gap-3">
                  <div className="animate-spin w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full" />
                  <span className="text-sm">Fetching latest jobs...</span>
                </div>
              ) : jobs.length === 0 ? (
                <div className="p-12 flex flex-col items-center justify-center text-gray-400 gap-2">
                  <Search className="w-8 h-8 opacity-20" />
                  <span className="text-sm">No new jobs found. Check the Board for saved items.</span>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {jobs.map((job, index) => {
                    const jobId = job.title + job.company;
                    const result = tailoredResults[jobId];
                    const isProcessing = tailoringJobId === jobId;
                    const score = result?.parsed?.Match_Score;
                    const isTracked = trackedJobs.some(tj => tj.id === jobId);

                    return (
                      <div key={index} className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-gray-50/50 transition-colors group">
                        <div className="col-span-1 flex items-center">
                          <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-0" />
                        </div>

                        <div className="col-span-3">
                          <div className="font-medium text-gray-900 text-sm truncate pr-4">{job.title}</div>
                          <div className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3" /> {job.location}
                          </div>
                        </div>

                        <div className="col-span-2 flex items-center gap-2">
                          <div className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 uppercase">
                            {job.company.substring(0, 1)}
                          </div>
                          <span className="text-sm text-gray-700 truncate">{job.company}</span>
                        </div>

                        <div className="col-span-2">
                          {isTracked ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-700 border border-green-100">
                              <CheckCircle className="w-3 h-3 mr-1" /> Saved
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                              New
                            </span>
                          )}
                        </div>

                        <div className="col-span-1 text-xs text-gray-500">Today</div>

                        <div className="col-span-2">
                          {isProcessing ? (
                            <div className="flex items-center gap-2 text-xs text-blue-600">
                              <div className="animate-spin w-3 h-3 border-2 border-current border-t-transparent rounded-full" />
                              Analyzing...
                            </div>
                          ) : result ? (
                            <button
                              onClick={() => openResult(jobId)}
                              className={`flex items-center gap-2 px-2 py-1 rounded border transition-all text-xs font-semibold
                                                        ${score >= 80 ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100' :
                                  score >= 50 ? 'bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100' :
                                    'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'}
                                                    `}
                            >
                              <div className={`w-2 h-2 rounded-full ${score >= 80 ? 'bg-green-500' : score >= 50 ? 'bg-yellow-500' : 'bg-gray-500'}`} />
                              {score ? `${score}% Match` : 'View Result'}
                            </button>
                          ) : (
                            <button
                              onClick={() => handleTailor(job)}
                              className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 opacity-100 transition-opacity"
                            >
                              <Zap className="w-3 h-3" />
                              Tailor Resume
                            </button>
                          )}
                        </div>

                        <div className="col-span-1 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {/* Prep Button */}
                          <button
                            onClick={() => openPrepModal(job)}
                            className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded"
                            title="Interview Prep"
                          >
                            <Mic className="w-4 h-4" />
                          </button>

                          {/* Email Button for List View */}
                          <button
                            onClick={() => openEmailModal(job)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                            title="Write Cold Email"
                          >
                            <Mail className="w-4 h-4" />
                          </button>

                          {!isTracked && (
                            <button
                              onClick={() => handleTrackJob(job)}
                              className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded"
                              title="Save to Board"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                          {job.url && (
                            <a href={job.url} target="_blank" rel="noreferrer" className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded">
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        ) : viewMode === 'analytics' ? (
          /* ANALYTICS VIEW */
          <div className="animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <PieChart className="w-6 h-6 text-purple-600" />
              Your Job Funnel
            </h2>

            {(() => {
              const getFunnelStats = () => {
                if (!trackedJobs) return { saved: 0, applied: 0, interviews: 0, offers: 0 };
                const saved = trackedJobs.length;
                const applied = trackedJobs.filter(j => ['Applied', 'Interview', 'Offer'].includes(j.status)).length;
                const interviews = trackedJobs.filter(j => ['Interview', 'Offer'].includes(j.status)).length;
                const offers = trackedJobs.filter(j => j.status === 'Offer').length;
                return { saved, applied, interviews, offers };
              };

              const calculateConversion = (part, total) => {
                if (!total) return 0;
                return Math.round((part / total) * 100);
              };

              const stats = getFunnelStats();
              return (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                  <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center text-center">
                    <div className="text-4xl font-bold text-gray-900 mb-1">{stats.saved}</div>
                    <div className="text-sm text-gray-500 uppercase font-semibold">Jobs Saved</div>
                    <div className="mt-4 w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-gray-400 h-full w-full" />
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center text-center">
                    <div className="text-4xl font-bold text-blue-600 mb-1">{stats.applied}</div>
                    <div className="text-sm text-gray-500 uppercase font-semibold">Applied</div>
                    <div className="mt-4 w-full bg-blue-100 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-blue-500 h-full transition-all duration-1000" style={{ width: `${calculateConversion(stats.applied, stats.saved)}%` }} />
                    </div>
                    <div className="text-xs text-gray-400 mt-2">{calculateConversion(stats.applied, stats.saved)}% Conversion</div>
                  </div>

                  <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center text-center">
                    <div className="text-4xl font-bold text-purple-600 mb-1">{stats.interviews}</div>
                    <div className="text-sm text-gray-500 uppercase font-semibold">Interviews</div>
                    <div className="mt-4 w-full bg-purple-100 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-purple-500 h-full transition-all duration-1000" style={{ width: `${calculateConversion(stats.interviews, stats.applied)}%` }} />
                    </div>
                    <div className="text-xs text-gray-400 mt-2">{calculateConversion(stats.interviews, stats.applied)}% Success Rate</div>
                  </div>

                  <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center text-center">
                    <div className="text-4xl font-bold text-green-600 mb-1">{stats.offers}</div>
                    <div className="text-sm text-gray-500 uppercase font-semibold">Offers</div>
                    <div className="mt-4 w-full bg-green-100 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-green-500 h-full transition-all duration-1000" style={{ width: `${calculateConversion(stats.offers, stats.interviews)}%` }} />
                    </div>
                    <div className="text-xs text-gray-400 mt-2">Target Goal</div>
                  </div>
                </div>
              );
            })()}

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-8 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-blue-900 mb-2">Insight: Improve your Interview Rate</h3>
                <p className="text-blue-700 max-w-xl">
                  You have a significant drop-off between applications and interviews.
                  Try customizing your resume more heavily for each role (aim for &gt;80% Match Score)
                  and using the Cover Letter generator to stand out.
                </p>
              </div>
              <Button onClick={() => setViewMode('list')} className="bg-blue-600 hover:bg-blue-700 text-white">Find More Jobs</Button>
            </div>
          </div>
        ) : (
          /* KANBAN BOARD VIEW */
          <div className="h-[calc(100vh-140px)] overflow-x-auto pb-4">
            <div className="flex gap-6 h-full min-w-[1000px]">
              {KANBAN_COLUMNS.map((column) => (
                <div key={column} className="flex-1 flex flex-col min-w-[280px] bg-gray-100/50 rounded-xl border border-gray-200/60 p-2">
                  <div className="flex items-center justify-between px-3 py-3 mb-2">
                    <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full 
                                        ${column === 'Saved' ? 'bg-gray-400' :
                          column === 'Applied' ? 'bg-blue-500' :
                            column === 'Interview' ? 'bg-purple-500' :
                              column === 'Offer' ? 'bg-green-500' : 'bg-orange-400'}`}
                      />
                      {column}
                    </h3>
                    <span className="bg-gray-200 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {trackedJobs.filter(j => j.status === column).length}
                    </span>
                  </div>

                  <div
                    className="flex-1 overflow-y-auto space-y-3 px-1 custom-scrollbar min-h-[500px]"
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, column)}
                  >
                    {trackedJobs.filter(j => j.status === column).map((job) => (
                      <div
                        key={job.id}
                        draggable="true"
                        onDragStart={(e) => handleDragStart(e, job.id)}
                        className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all group relative cursor-grab active:cursor-grabbing"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold text-gray-900 text-sm leading-tight pr-4">{job.title}</h4>

                          {/* DELETE ACTION */}
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {/* Prep Button for Kanban */}
                            <button
                              onMouseDown={(e) => e.stopPropagation()}
                              onClick={(e) => { e.stopPropagation(); openPrepModal(job); }}
                              className="text-gray-300 hover:text-purple-500 hover:bg-purple-50 p-0.5 rounded transition-colors"
                              title="Interview Prep"
                            >
                              <Mic className="w-4 h-4" />
                            </button>

                            {/* Email Button for Kanban View */}
                            <button
                              onMouseDown={(e) => e.stopPropagation()}
                              onClick={(e) => { e.stopPropagation(); openEmailModal(job); }}
                              className="text-gray-300 hover:text-blue-500 hover:bg-blue-50 p-0.5 rounded transition-colors"
                              title="Write Cold Email"
                            >
                              <Mail className="w-4 h-4" />
                            </button>
                            <button
                              onMouseDown={(e) => e.stopPropagation()}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteJob(job.id);
                              }}
                              className="text-gray-300 hover:text-red-500 hover:bg-red-50 p-0.5 rounded transition-colors"
                              title="Remove Job"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 mb-3">{job.company}</div>

                        <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-50">
                          <span className="text-[10px] text-gray-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> 2d ago
                          </span>

                          {/* Status Mover Buttons */}
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {column !== 'Saved' && (
                              <button
                                onMouseDown={(e) => e.stopPropagation()}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUpdateStatus(job.id, KANBAN_COLUMNS[KANBAN_COLUMNS.indexOf(column) - 1]);
                                }}
                                className="p-1 px-2 bg-gray-50 text-gray-600 rounded text-[10px] font-medium border border-gray-100 hover:bg-gray-100"
                                title="Move Back"
                              >
                                ←
                              </button>
                            )}
                            {column !== 'Offer' && (
                              <button
                                onMouseDown={(e) => e.stopPropagation()}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUpdateStatus(job.id, KANBAN_COLUMNS[KANBAN_COLUMNS.indexOf(column) + 1]);
                                }}
                                className="p-1 px-2 bg-blue-50 text-blue-600 rounded text-[10px] font-medium border border-blue-100 hover:bg-blue-100"
                                title={`Move to ${KANBAN_COLUMNS[KANBAN_COLUMNS.indexOf(column) + 1]}`}
                              >
                                Move {KANBAN_COLUMNS[KANBAN_COLUMNS.indexOf(column) + 1]} →
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {trackedJobs.filter(j => j.status === column).length === 0 && (
                      <div className="h-24 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center text-gray-400 text-xs">
                        Drag items here
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Tailored Result Modal */}
      {activeModalData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200 backdrop-blur-sm">
          <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden scale-100 animate-in zoom-in-95 duration-200 border border-gray-200 font-sans">

            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${activeModalData?.parsed?.Match_Score >= 70 ? 'bg-green-500' : 'bg-orange-500'}`} />
                  <h2 className="font-semibold text-gray-800">Optimization Report</h2>
                </div>

                {/* View Mode Toggle */}
                <div className="flex bg-gray-200 p-0.5 rounded-lg border border-gray-300">
                  <button
                    onClick={() => setModalMode('visual')}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${modalMode === 'visual' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Visual
                  </button>
                  <button
                    onClick={() => setModalMode('text')}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${modalMode === 'text' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Text
                  </button>
                </div>
              </div>
              <button onClick={() => setActiveModalData(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <ChevronDown className="w-6 h-6 rotate-180" />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-8 bg-white text-gray-800">
              <ErrorBoundary>
                {(() => {
                  const parsedData = activeModalData.parsed;

                  // Fallback: Render Raw content safely
                  if (!parsedData) {
                    let rawContent = activeModalData.raw;
                    if (typeof rawContent === 'object') {
                      rawContent = JSON.stringify(rawContent, null, 2);
                    }
                    return <pre className="text-xs whitespace-pre-wrap font-mono p-4 bg-gray-50 rounded">{rawContent}</pre>;
                  }

                  // TEXT MODE RENDERER
                  if (modalMode === 'text') {
                    // Construct plain text representation
                    let plainText = `PROFESSIONAL SUMMARY\n\n${parsedData.Tailored_Summary}\n\n`;
                    plainText += `EXPERIENCE\n\n`;

                    if (Array.isArray(parsedData.Tailored_Experience)) {
                      parsedData.Tailored_Experience.forEach(exp => {
                        plainText += `${exp.Job_Title} | ${exp.Company}\n`;
                        plainText += `${exp.Duration}\n`;
                        if (exp.Responsibilities) {
                          exp.Responsibilities.forEach(r => plainText += `- ${r}\n`);
                        }
                        plainText += `\n`;
                      });
                    } else {
                      plainText += parsedData.Tailored_Experience;
                    }

                    return (
                      <div className="h-full flex flex-col">
                        <p className="text-sm text-gray-500 mb-2">Copy this text directly into your Enhancv resume.</p>
                        <textarea
                          className="flex-1 w-full p-4 bg-gray-50 border border-gray-200 rounded-lg text-sm font-mono leading-relaxed focus:ring-2 focus:ring-blue-100 outline-none resize-none"
                          value={plainText}
                          readOnly
                        />
                      </div>
                    );
                  }

                  // VISUAL MODE RENDERER
                  return (
                    <div className="space-y-8">
                      {/* Score Header */}
                      <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 flex items-center gap-6">
                        <div className="text-5xl font-bold tracking-tighter text-blue-600">
                          {parsedData.Match_Score}%
                        </div>
                        <div className="flex-1 border-l border-gray-200 pl-6">
                          <h3 className="font-semibold text-gray-900 mb-1">Match Analysis</h3>
                          <p className="text-sm text-gray-600 leading-relaxed">
                            Your tailored profile strongly aligns with the job requirements. Use the sections below to update your specialized resume.
                          </p>
                        </div>
                      </div>

                      {/* Content Sections */}
                      <div className="grid gap-6">
                        <div className="group relative border border-gray-200 rounded-lg p-5 hover:border-blue-300 transition-colors">
                          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="outline" className="h-8 text-xs gap-1" onClick={() => copyToClipboard(parsedData.Tailored_Summary)}>
                              <Copy className="w-3 h-3" /> Copy
                            </Button>
                          </div>
                          <h4 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-3 text-blue-600">Professional Summary</h4>
                          <p className="text-sm leading-relaxed text-gray-700">{parsedData.Tailored_Summary}</p>
                        </div>

                        {parsedData.Tailored_Experience && (
                          <div className="group relative border border-gray-200 rounded-lg p-5 hover:border-blue-300 transition-colors">
                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="outline"
                                className="h-8 text-xs gap-1"
                                onClick={() => copyToClipboard(
                                  typeof parsedData.Tailored_Experience === 'string'
                                    ? parsedData.Tailored_Experience
                                    : JSON.stringify(parsedData.Tailored_Experience, null, 2)
                                )}
                              >
                                <Copy className="w-3 h-3" /> Copy
                              </Button>
                            </div>
                            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-3 text-blue-600">Optimized Experience</h4>

                            {Array.isArray(parsedData.Tailored_Experience) ? (
                              <div className="space-y-6">
                                {parsedData.Tailored_Experience.map((exp, idx) => (
                                  <div key={idx} className="border-l-2 border-gray-100 pl-4 py-1">
                                    <h5 className="font-semibold text-gray-900">{exp.Job_Title}</h5>
                                    <div className="text-xs text-gray-500 mb-2">{exp.Company} • {exp.Duration}</div>
                                    <ul className="list-disc list-outside ml-4 space-y-1">
                                      {exp.Responsibilities?.map((resp, rIdx) => (
                                        <li key={rIdx} className="text-sm text-gray-700 leading-relaxed pl-1">{resp}</li>
                                      ))}
                                    </ul>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="prose prose-sm text-gray-700 max-w-none whitespace-pre-wrap font-regular">
                                {parsedData.Tailored_Experience}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </ErrorBoundary>
            </div>

            <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setActiveModalData(null)}>Close</Button>
              <Button onClick={() => copyToClipboard(activeModalData.raw)}>Copy JSON</Button>
            </div>
          </div>
        </div>
      )}

      {/* Cold Email Modal */}
      {emailModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <Mail className="w-5 h-5 text-blue-600" />
                Cold Email Generator
              </h3>
              <button onClick={() => setEmailModalOpen(false)} className="text-gray-400 hover:text-gray-600"><ChevronDown className="w-6 h-6 rotate-180" /></button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Hiring Manager (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Jane Doe"
                    className="w-full p-2 border border-gray-300 rounded-md text-sm outline-none focus:border-blue-500"
                    value={hiringManager}
                    onChange={(e) => setHiringManager(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Platform</label>
                  <select
                    className="w-full p-2 border border-gray-300 rounded-md text-sm outline-none focus:border-blue-500"
                    value={emailPlatform}
                    onChange={(e) => setEmailPlatform(e.target.value)}
                  >
                    <option value="Email">Email (Concise)</option>
                    <option value="LinkedIn">LinkedIn Note (300 chars)</option>
                    <option value="Cover Letter">Formal Cover Letter (Full Page)</option>
                  </select>
                </div>
              </div>

              {!generatedEmail ? (
                <div className="text-center py-8">
                  <Button onClick={handleGenerateEmail} loading={generatingEmail} className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-md">
                    <Zap className="w-4 h-4 mr-2" /> Generate Magic Draft
                  </Button>
                  <p className="text-xs text-gray-400 mt-2">Uses AI to match your resume achievements to the job description.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-gray-700">Draft Content</h4>
                  <textarea
                    className="w-full h-48 p-4 bg-gray-50 border border-gray-200 rounded-lg text-sm font-mono leading-relaxed outline-none focus:ring-2 focus:ring-blue-100 resize-none"
                    value={generatedEmail}
                    onChange={(e) => setGeneratedEmail(e.target.value)}
                  />
                  <div className="flex justify-end gap-2">
                    <Button variant="secondary" onClick={() => setGeneratedEmail("")}>Regenerate</Button>
                    <Button onClick={() => copyToClipboard(generatedEmail)}>
                      <Copy className="w-4 h-4 mr-2" /> Copy to Clipboard
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Interview Prep Modal */}
      {prepModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <Mic className="w-5 h-5 text-purple-600" />
                Interview Coach
              </h3>
              <button onClick={() => setPrepModalOpen(false)} className="text-gray-400 hover:text-gray-600"><ChevronDown className="w-6 h-6 rotate-180" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 bg-gray-50/50">
              {!prepData ? (
                <div className="text-center py-12">
                  <h4 className="text-lg font-semibold text-gray-700 mb-2">Ready to practice?</h4>
                  <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">I will analyze the job description and your resume to generate likely technical questions and behavioral stories.</p>
                  <Button onClick={handleGeneratePrep} loading={generatingPrep} className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg mx-auto">
                    <Mic className="w-4 h-4 mr-2" /> Generate Interview Guide
                  </Button>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Technical Section */}
                  <div>
                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Zap className="w-4 h-4" /> Technical Questions
                    </h4>
                    <div className="grid gap-4">
                      {prepData.technical_questions?.map((q, idx) => (
                        <div key={idx} className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                          <p className="font-semibold text-gray-900 mb-3">Q: {q.question}</p>
                          <div className="text-sm text-gray-600 bg-purple-50 p-3 rounded border border-purple-100 italic">
                            💡 Tip: {q.answer_tips}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Behavioral Section */}
                  <div>
                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Briefcase className="w-4 h-4" /> Behavioral / STAR
                    </h4>
                    <div className="grid gap-4">
                      {prepData.behavioral_questions?.map((q, idx) => (
                        <div key={idx} className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                          <p className="font-semibold text-gray-900 mb-3">Q: {q.question}</p>
                          <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded border border-blue-100">
                            📖 <strong>Your Story:</strong> {q.suggested_story}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;
