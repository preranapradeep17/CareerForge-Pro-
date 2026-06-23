import { useEffect, useEffectEvent, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Route, Routes, useNavigate, useParams, Navigate } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import './App.css';
import {
  TOKEN_KEY,
  clearCredentials,
  setCredentials,
  setUser,
} from './store/authSlice';
import {
  updateResumeField,
  setAiLoading,
  setAiError,
  setSummaryResult,
  setAtsResult,
  setSkillsResult,
  setJdResult,
  setBulletResult,
  setTemplate,
  addExperience,
  updateExperience,
  removeExperience,
  setExperience,
  addEducation,
  updateEducation,
  removeEducation,
  setEducation,
  addProject,
  updateProject,
  removeProject,
  setProjects,
} from './store/resumeSlice';
import { scoreResumeAgainstJD } from './utils/atsScorer';

// Import Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ResumeBuilderPage from './pages/ResumeBuilderPage';
import AIAssistantPage from './pages/AIAssistantPage';
import TemplatesPage from './pages/TemplatesPage';
import CoverLetterPage from './pages/CoverLetterPage';
import SettingsPage from './pages/SettingsPage';

// Import Components
import { ProtectedRoute, ProtectedLayout } from './components/ProtectedLayout';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';
const AUTO_SAVE_DELAY_MS = 1500;

const initialRegister = { name: '', email: '', password: '', confirmPassword: '' };
const initialLogin = { email: '', password: '' };

const aiPost = async (endpoint, body, token) => {
  const response = await fetch(`${API_BASE}/ai/${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.message || 'AI request failed');
    error.upgradeRequired = data.upgradeRequired;
    throw error;
  }
  return data;
};

function App() {
  console.log('[CareerForge API] Current targeted backend URL:', API_BASE);
  return (
    <>
      <Toaster position="top-right" toastOptions={{ duration: 2800 }} />
      <AppRoutes />
    </>
  );
}

function AppRoutes() {
  const app = useCareerForgeApp();

  return (
    <Routes>
      <Route
        path="/"
        element={<LandingPage isLoggedIn={app.isLoggedIn} />}
      />
      <Route
        path="/login"
        element={<LoginPage app={app} />}
      />
      <Route
        path="/register"
        element={<RegisterPage app={app} />}
      />
      <Route element={<ProtectedRoute isLoggedIn={app.isLoggedIn} />}>
        <Route
          element={<ProtectedLayout app={app} />}
        >
          <Route path="/dashboard" element={<DashboardPage app={app} />} />
          <Route path="/resume-builder" element={<ResumeBuilderPage app={app} />} />
          <Route path="/resume/:id" element={<ResumeBuilderPage app={app} />} />
          <Route path="/ai" element={<AIAssistantPage app={app} />} />
          <Route path="/templates" element={<TemplatesPage app={app} />} />
          <Route path="/cover-letter" element={<CoverLetterPage app={app} />} />
          <Route path="/settings" element={<SettingsPage app={app} />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to={app.isLoggedIn ? '/dashboard' : '/'} replace />} />
    </Routes>
  );
}

function useCareerForgeApp() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, token, isLoggedIn } = useSelector((state) => state.auth);
  const { resumeData, experience, education, projects, atsScore, template, ai } = useSelector((state) => state.resume);

  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));

  const [registerForm, setRegisterForm] = useState(initialRegister);
  const [loginForm, setLoginForm] = useState(initialLogin);
  const [loading, setLoading] = useState(false);
  const [resumeId, setResumeId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [saveError, setSaveError] = useState('');
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [jobDescription, setJobDescription] = useState('');
  const [activeAiTab, setActiveAiTab] = useState('summary');
  const [originalBullet, setOriginalBullet] = useState('');
  const [targetKeywords, setTargetKeywords] = useState('');
  const [isParsingResume, setIsParsingResume] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  const [resumes, setResumes] = useState([]);
  const [loadingResumes, setLoadingResumes] = useState(false);
  const [versions, setVersions] = useState([]);
  const [loadingVersions, setLoadingVersions] = useState(false);

  const fetchResumes = async () => {
    if (!token) return;
    setLoadingResumes(true);
    try {
      const response = await fetch(`${API_BASE}/resumes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setResumes(data.resumes || []);
      }
    } catch (error) {
      console.error('Failed to fetch resumes:', error.message);
    } finally {
      setLoadingResumes(false);
    }
  };

  const runFetchResumes = useEffectEvent(() => {
    fetchResumes();
  });

  useEffect(() => {
    if (isLoggedIn && token) {
      const timer = window.setTimeout(() => runFetchResumes(), 0);
      return () => window.clearTimeout(timer);
    }
  }, [isLoggedIn, token]);

  const handleDeleteResume = async (id) => {
    if (!confirm('Are you sure you want to delete this resume?')) return;
    try {
      const response = await fetch(`${API_BASE}/resumes/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to delete resume');
      toast.success('Resume deleted');
      fetchResumes();
      fetchProfile(token, { silent: true }); // refresh resumeCount
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleLoadResume = (resume) => {
    setResumeId(resume._id);
    dispatch(updateResumeField({ field: 'name', value: resume.name || 'Untitled Resume' }));
    dispatch(updateResumeField({ field: 'fullName', value: resume.personalInfo?.fullName || '' }));
    dispatch(updateResumeField({ field: 'title', value: resume.targetJD || '' }));
    dispatch(updateResumeField({ field: 'summary', value: resume.personalInfo?.summary || '' }));
    dispatch(updateResumeField({
      field: 'skills',
      value: Array.isArray(resume.skills) ? resume.skills.join(', ') : '',
    }));
    dispatch(setTemplate(resume.template || 'classic'));
    dispatch(setExperience(resume.experience || []));
    dispatch(setEducation(resume.education || []));
    dispatch(setProjects(resume.projects || []));
    toast.success('Resume loaded in builder');
    navigate(`/resume/${resume._id}`);
  };

  const handleExportPdfDirectly = async (resume) => {
    if (user?.plan !== 'pro') {
      setIsUpgradeModalOpen(true);
      return;
    }

    const toastId = toast.loading('Exporting PDF...');
    try {
      const response = await fetch(`${API_BASE}/resumes/export/pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          personalInfo: resume.personalInfo,
          experience: resume.experience,
          education: resume.education,
          skills: resume.skills,
          projects: resume.projects,
          atsScore: resume.atsScore,
          template: resume.template,
          targetJD: resume.targetJD,
        }),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to export PDF';
        try {
          const data = await response.json();
          if (data.upgradeRequired) {
            setIsUpgradeModalOpen(true);
          }
          errorMessage = data.message || errorMessage;
        } catch {
          // Ignore parsing error, fall back to default message
        }
        throw new Error(errorMessage);
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      const safeName = (resume.personalInfo?.fullName || 'resume')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'resume';

      link.href = downloadUrl;
      link.download = `${safeName}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
      toast.success('PDF exported', { id: toastId });
    } catch (error) {
      toast.error(error.message, { id: toastId });
    }
  };

  const fetchVersions = async (targetId = resumeId) => {
    if (!token || !targetId) return;
    setLoadingVersions(true);
    try {
      const response = await fetch(`${API_BASE}/resumes/${targetId}/versions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setVersions(data.versions || []);
      }
    } catch (error) {
      console.error('Failed to fetch versions:', error.message);
    } finally {
      setLoadingVersions(false);
    }
  };

  const runFetchVersions = useEffectEvent(() => {
    fetchVersions();
  });

  const runClearVersions = useEffectEvent(() => {
    setVersions([]);
  });

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (resumeId) {
        runFetchVersions();
      } else {
        runClearVersions();
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, [resumeId]);

  const handleSaveVersion = async () => {
    if (!resumeId) {
      toast.error('Save your resume first before capturing snapshots.');
      return;
    }

    const name = prompt('Enter a name for this resume version/snapshot (e.g., "Version with Tailored Summary"):');
    if (!name || !name.trim()) return;

    try {
      const response = await fetch(`${API_BASE}/resumes/${resumeId}/versions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ versionName: name.trim() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to save version snapshot');
      toast.success('Version snapshot saved');
      fetchVersions();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleRestoreVersion = async (versionId) => {
    if (!confirm('Are you sure you want to restore this version? Your current changes will be replaced.')) return;
    try {
      const response = await fetch(`${API_BASE}/resumes/${resumeId}/versions/${versionId}/restore`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to restore version snapshot');

      const restored = data.resume;
      dispatch(updateResumeField({ field: 'fullName', value: restored.personalInfo?.fullName || '' }));
      dispatch(updateResumeField({ field: 'title', value: restored.targetJD || '' }));
      dispatch(updateResumeField({ field: 'summary', value: restored.personalInfo?.summary || '' }));
      dispatch(updateResumeField({
        field: 'skills',
        value: Array.isArray(restored.skills) ? restored.skills.join(', ') : '',
      }));
      dispatch(setTemplate(restored.template || 'classic'));

      toast.success('Resume restored to selected version snapshot');
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleDeleteVersion = async (versionId) => {
    if (!confirm('Delete this version snapshot?')) return;
    try {
      const response = await fetch(`${API_BASE}/resumes/${resumeId}/versions/${versionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to delete snapshot');
      toast.success('Snapshot deleted');
      fetchVersions();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleUpgrade = async () => {
    if (!token) {
      toast.error('Please log in first to upgrade.');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/payments/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to start upgrade flow');
      }
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleManageBilling = async () => {
    if (!token) {
      toast.error('Please log in first to manage billing.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/payments/billing-portal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to open billing portal');
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const hasResumeContent = useMemo(
    () => Object.values(resumeData).some((value) => value.trim().length > 0),
    [resumeData]
  );

  const keywordMatchScore = ai.atsResult?.breakdown?.keywordMatch ?? Math.max(atsScore - 8, 0);
  const jobMatches = ai.jdResult
    ? ai.jdResult.hardSkills.length + ai.jdResult.softSkills.length
    : Math.max(Math.round(atsScore / 10), 1);

  const mapResumePayload = () => ({
    name: resumeData.name || 'Untitled Resume',
    personalInfo: {
      fullName: resumeData.fullName,
      summary: resumeData.summary,
      email: user?.email || '',
      phone: '',
      location: '',
    },
    experience: experience || [],
    education: education || [],
    skills: resumeData.skills
      .split(',')
      .map((skill) => skill.trim())
      .filter(Boolean),
    projects: (projects || []).map((p) => ({
      title: p.title || '',
      description: p.description || '',
      technologies: typeof p.technologies === 'string'
        ? p.technologies.split(',').map((t) => t.trim()).filter(Boolean)
        : Array.isArray(p.technologies) ? p.technologies : [],
      link: p.link || '',
    })),
    atsScore,
    template,
    targetJD: resumeData.title,
  });

  const saveResume = async () => {
    const payload = mapResumePayload();
    setIsSaving(true);
    setSaveError('');

    try {
      const endpoint = resumeId ? `${API_BASE}/resumes/${resumeId}` : `${API_BASE}/resumes`;
      const method = resumeId ? 'PUT' : 'POST';
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok) {
        if (data.upgradeRequired) {
          setIsUpgradeModalOpen(true);
        }
        throw new Error(data.message || 'Failed to auto-save resume');
      }

      if (!resumeId && data.resume?._id) {
        setResumeId(data.resume._id);
      }

      setLastSavedAt(new Date());
      fetchVersions(data.resume?._id || resumeId);
    } catch (error) {
      setSaveError(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = (options = {}) => {
    const { silent = false } = options;
    localStorage.removeItem(TOKEN_KEY);
    dispatch(clearCredentials());
    setResumeId(null);
    setLastSavedAt(null);
    setSaveError('');
    if (!silent) {
      toast.success('Logged out successfully');
    }
    navigate('/login');
  };

  async function fetchProfile(activeToken = token, options = {}) {
    const { silent = false } = options;
    if (!silent) {
      setLoading(true);
    }

    try {
      const response = await fetch(`${API_BASE}/protected/me`, {
        headers: { Authorization: `Bearer ${activeToken}` },
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to load profile');
      }

      dispatch(setUser(data.user));

      if (!silent) {
        toast.success('Profile refreshed');
      }

      return data.user;
    } catch (error) {
      if (error.message.toLowerCase().includes('unauthorized')) {
        toast.error('Session expired. Please login again.');
        handleLogout({ silent: true });
      } else if (!silent) {
        toast.error(error.message);
      }

      return null;
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }

  async function refreshProfileAfterCheckout(activeToken) {
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const refreshedUser = await fetchProfile(activeToken, { silent: true });

      if (refreshedUser?.plan === 'pro') {
        toast.success('Pro plan is active.');
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 1500));
    }

    toast('Payment succeeded. Pro access will update after Stripe confirms the webhook.');
  }

  const runRefreshProfileAfterCheckout = useEffectEvent((activeToken) => {
    refreshProfileAfterCheckout(activeToken);
  });

  useEffect(() => {
    if (!isLoggedIn || !token) return;

    const queryParams = new URLSearchParams(window.location.search);
    const payment = queryParams.get('payment');

    if (payment === 'success') {
      toast.success('Payment completed. Activating Pro access...');
      runRefreshProfileAfterCheckout(token);
      navigate('/dashboard', { replace: true });
    } else if (payment === 'cancel') {
      toast.error('Upgrade process cancelled.');
      navigate('/dashboard', { replace: true });
    }
  }, [isLoggedIn, token, navigate]);

  const runSaveResumeEffect = useEffectEvent(() => {
    saveResume();
  });

  const runSilentLogout = useEffectEvent(() => {
    handleLogout({ silent: true });
  });

  useEffect(() => {
    if (!token) {
      return;
    }

    let isCancelled = false;

    const syncProfile = async () => {
      try {
        const response = await fetch(`${API_BASE}/protected/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to load profile');
        }

        if (!isCancelled) {
          dispatch(setUser(data.user));
        }
      } catch (error) {
        if (!isCancelled && error.message.toLowerCase().includes('unauthorized')) {
          runSilentLogout();
        }
      }
    };

    syncProfile();

    return () => {
      isCancelled = true;
    };
  }, [token, dispatch]);

  useEffect(() => {
    if (!isLoggedIn || !token || !hasResumeContent) {
      return;
    }

    const timeoutId = setTimeout(() => {
      runSaveResumeEffect();
    }, AUTO_SAVE_DELAY_MS);

    return () => clearTimeout(timeoutId);
  }, [resumeData, template, atsScore, isLoggedIn, token, hasResumeContent]);

  const handleRegisterChange = (event) => {
    const { name, value } = event.target;
    setRegisterForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleLoginChange = (event) => {
    const { name, value } = event.target;
    setLoginForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleRegister = async (event) => {
    event.preventDefault();

    if (registerForm.password !== registerForm.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: registerForm.name,
          email: registerForm.email,
          password: registerForm.password,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      setRegisterForm(initialRegister);
      toast.success('Account created successfully');
      navigate('/login');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Invalid credentials');
      }

      localStorage.setItem(TOKEN_KEY, data.token);
      dispatch(setCredentials({ token: data.token, user: data.user }));
      setLoginForm(initialLogin);
      toast.success('Login successful');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/auth/demo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to initialize demo mode');
      }

      localStorage.setItem(TOKEN_KEY, data.token);
      dispatch(setCredentials({ token: data.token, user: data.user }));
      toast.success('Welcome! Logged in as Demo Recruiter (Pro Tier Enabled)');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResumeChange = (event) => {
    const { name, value } = event.target;
    dispatch(updateResumeField({ field: name, value }));
  };

  const handleExportPdf = async () => {
    if (!isLoggedIn || !token) {
      toast.error('Login to export your resume as a PDF');
      return;
    }

    if (user?.plan !== 'pro') {
      setIsUpgradeModalOpen(true);
      return;
    }

    setIsExportingPdf(true);
    const toastId = toast.loading('Generating and downloading PDF...');
    try {
      const response = await fetch(`${API_BASE}/resumes/export/pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(mapResumePayload()),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to export PDF';

        try {
          const data = await response.json();
          if (data.upgradeRequired) {
            setIsUpgradeModalOpen(true);
          }
          errorMessage = data.message || errorMessage;
        } catch {
          errorMessage = 'Failed to export PDF';
        }

        throw new Error(errorMessage);
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      const safeName = (resumeData.fullName || 'resume')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'resume';

      link.href = downloadUrl;
      link.download = `${safeName}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
      toast.success('PDF exported successfully!', { id: toastId });
    } catch (error) {
      toast.error(error.message, { id: toastId });
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleResumeUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!isLoggedIn || !token) {
      toast.error('Please login first to parse your resume');
      event.target.value = '';
      return;
    }

    const formData = new FormData();
    formData.append('resume', file);

    const toastId = toast.loading('Uploading and parsing resume PDF with Gemini...');
    setIsParsingResume(true);
    try {
      const response = await fetch(`${API_BASE}/ai/parse-resume`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to parse resume');
      }

      dispatch(updateResumeField({ field: 'fullName', value: data.fullName || '' }));
      dispatch(updateResumeField({ field: 'title', value: data.title || '' }));
      dispatch(updateResumeField({ field: 'summary', value: data.summary || '' }));
      dispatch(updateResumeField({
        field: 'skills',
        value: Array.isArray(data.skills) ? data.skills.join(', ') : '',
      }));
      toast.success('Resume parsed successfully', { id: toastId });
    } catch (error) {
      toast.error(error.message, { id: toastId });
    } finally {
      setIsParsingResume(false);
      event.target.value = '';
    }
  };

  const handleImproveSummary = async () => {
    if (!resumeData.summary.trim()) {
      toast.error('Add a summary first');
      return;
    }
    if (!resumeData.title.trim()) {
      toast.error('Add your target job title first');
      return;
    }

    dispatch(setAiLoading(true));
    try {
      const result = await aiPost('improve-summary', {
        summary: resumeData.summary,
        jobTitle: resumeData.title,
      }, token);
      dispatch(setSummaryResult(result));
      toast.success('Summary improved');
    } catch (error) {
      dispatch(setAiError(error.message));
      toast.error(error.message);
    }
  };

  const handleAtsAnalysis = async () => {
    if (!jobDescription.trim()) {
      toast.error('Paste a job description first');
      return;
    }

    const result = scoreResumeAgainstJD({ resumeData, jobDescription });
    dispatch(setAtsResult(result));
    toast.success('ATS score updated');
  };

  const handleSuggestSkills = async () => {
    if (!resumeData.title.trim()) {
      toast.error('Add your target job title first');
      return;
    }

    dispatch(setAiLoading(true));
    try {
      const skillsArray = resumeData.skills
        .split(',')
        .map((skill) => skill.trim())
        .filter(Boolean);
      const result = await aiPost('suggest-skills', {
        currentSkills: skillsArray,
        jobTitle: resumeData.title,
      }, token);
      dispatch(setSkillsResult(result));
      toast.success('AI suggestions ready');
    } catch (error) {
      dispatch(setAiError(error.message));
      toast.error(error.message);
    }
  };

  const handleAnalyzeJD = async () => {
    if (!jobDescription.trim()) {
      toast.error('Paste a job description first');
      return;
    }

    if (user?.plan !== 'pro') {
      setIsUpgradeModalOpen(true);
      return;
    }

    dispatch(setAiLoading(true));
    try {
      const result = await aiPost('analyze-jd', { jobDescription }, token);
      dispatch(setJdResult(result));
      toast.success('Job description analyzed');
    } catch (error) {
      if (error.upgradeRequired) {
        setIsUpgradeModalOpen(true);
      }
      dispatch(setAiError(error.message));
      toast.error(error.message);
    }
  };

  const handleRewriteBullet = async () => {
    if (!originalBullet.trim()) {
      toast.error('Add an original bullet first');
      return;
    }

    if (user?.plan !== 'pro') {
      setIsUpgradeModalOpen(true);
      return;
    }

    dispatch(setAiLoading(true));
    try {
      const result = await aiPost('rewrite-bullet', {
        originalBullet,
        jobDescription,
        targetKeywords,
      }, token);
      dispatch(setBulletResult(result));
      toast.success('Bullet rewritten');
    } catch (error) {
      if (error.upgradeRequired) {
        setIsUpgradeModalOpen(true);
      }
      dispatch(setAiError(error.message));
      toast.error(error.message);
    }
  };

  const handleAddSuggestedSkill = (skill) => {
    const current = resumeData.skills
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean);

    if (!current.includes(skill)) {
      dispatch(updateResumeField({ field: 'skills', value: [...current, skill].join(', ') }));
      toast.success(`${skill} added to your resume`);
    }
  };

  const fetchResumeById = async (id) => {
    if (!token || !id) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/resumes/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok && data.resume) {
        setResumeId(data.resume._id);
        dispatch(updateResumeField({ field: 'name', value: data.resume.name || 'Untitled Resume' }));
        dispatch(updateResumeField({ field: 'fullName', value: data.resume.personalInfo?.fullName || '' }));
        dispatch(updateResumeField({ field: 'title', value: data.resume.targetJD || '' }));
        dispatch(updateResumeField({ field: 'summary', value: data.resume.personalInfo?.summary || '' }));
        dispatch(updateResumeField({
          field: 'skills',
          value: Array.isArray(data.resume.skills) ? data.resume.skills.join(', ') : '',
        }));
        dispatch(setTemplate(data.resume.template || 'classic'));
        dispatch(setExperience(data.resume.experience || []));
        dispatch(setEducation(data.resume.education || []));
        dispatch(setProjects((data.resume.projects || []).map((p) => ({
          ...p,
          technologies: Array.isArray(p.technologies) ? p.technologies.join(', ') : (p.technologies || ''),
        }))));
      }
    } catch (error) {
      console.error('Failed to fetch resume by id:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNewResume = () => {
    setResumeId(null);
    dispatch(updateResumeField({ field: 'name', value: 'Untitled Resume' }));
    dispatch(updateResumeField({ field: 'fullName', value: '' }));
    dispatch(updateResumeField({ field: 'title', value: '' }));
    dispatch(updateResumeField({ field: 'summary', value: '' }));
    dispatch(updateResumeField({ field: 'skills', value: '' }));
    dispatch(setTemplate('classic'));
    dispatch(setExperience([]));
    dispatch(setEducation([]));
    dispatch(setProjects([]));
    navigate('/resume-builder');
  };

  const handleApplyImprovedSummary = () => {
    if (ai.summaryResult?.improvedSummary) {
      dispatch(updateResumeField({ field: 'summary', value: ai.summaryResult.improvedSummary }));
      toast.success('Summary applied to resume');
    }
  };

  const handleAddExperience = () => dispatch(addExperience());
  const handleUpdateExperience = (index, field, value) => dispatch(updateExperience({ index, field, value }));
  const handleRemoveExperience = (index) => dispatch(removeExperience(index));

  const handleAddEducation = () => dispatch(addEducation());
  const handleUpdateEducation = (index, field, value) => dispatch(updateEducation({ index, field, value }));
  const handleRemoveEducation = (index) => dispatch(removeEducation(index));

  const handleAddProject = () => dispatch(addProject());
  const handleUpdateProject = (index, field, value) => dispatch(updateProject({ index, field, value }));
  const handleRemoveProject = (index) => dispatch(removeProject(index));

  const handleReorderExperience = (startIndex, endIndex) => {
    const result = Array.from(experience);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    dispatch(setExperience(result));
  };

  const handleReorderEducation = (startIndex, endIndex) => {
    const result = Array.from(education);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    dispatch(setEducation(result));
  };

  const handleReorderProjects = (startIndex, endIndex) => {
    const result = Array.from(projects);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    dispatch(setProjects(result));
  };

  return {
    user,
    token,
    isLoggedIn,
    resumeData,
    experience,
    education,
    projects,
    atsScore,
    template,
    ai,
    theme,
    toggleTheme,
    handleAddExperience,
    handleUpdateExperience,
    handleRemoveExperience,
    handleReorderExperience,
    handleAddEducation,
    handleUpdateEducation,
    handleRemoveEducation,
    handleReorderEducation,
    handleAddProject,
    handleUpdateProject,
    handleRemoveProject,
    handleReorderProjects,
    registerForm,
    loginForm,
    loading,
    isSaving,
    lastSavedAt,
    saveError,
    isExportingPdf,
    jobDescription,
    activeAiTab,
    originalBullet,
    targetKeywords,
    isParsingResume,
    hasResumeContent,
    keywordMatchScore,
    jobMatches,
    setJobDescription,
    setActiveAiTab,
    setOriginalBullet,
    setTargetKeywords,
    setTemplate: (value) => dispatch(setTemplate(value)),
    handleRegisterChange,
    handleLoginChange,
    handleRegister,
    handleLogin,
    handleDemoLogin,
    handleLogout,
    handleResumeChange,
    handleExportPdf,
    handleResumeUpload,
    handleImproveSummary,
    handleAtsAnalysis,
    handleSuggestSkills,
    handleAnalyzeJD,
    handleRewriteBullet,
    handleAddSuggestedSkill,
    handleApplyImprovedSummary,
    fetchProfile,
    isUpgradeModalOpen,
    setIsUpgradeModalOpen,
    handleUpgrade,
    handleManageBilling,
    resumes,
    loadingResumes,
    fetchResumes,
    handleDeleteResume,
    handleLoadResume,
    handleExportPdfDirectly,
    fetchResumeById,
    handleCreateNewResume,
    versions,
    loadingVersions,
    fetchVersions,
    handleSaveVersion,
    handleRestoreVersion,
    handleDeleteVersion,
    resumeId,
  };
}

export default App;
