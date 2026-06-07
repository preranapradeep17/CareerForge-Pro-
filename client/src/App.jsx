import { useEffect, useEffectEvent, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { NavLink, Navigate, Outlet, Route, Routes, useNavigate } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import './App.css';
import { TEMPLATES, TEMPLATE_LIST } from './templates';
import {
  TOKEN_KEY,
  clearCredentials,
  setCredentials,
  setUser,
} from './store/authSlice';
import {
  setTemplate,
  updateResumeField,
  setAiLoading,
  setAiError,
  setSummaryResult,
  setAtsResult,
  setSkillsResult,
  setJdResult,
  setBulletResult,
} from './store/resumeSlice';
import { scoreResumeAgainstJD } from './utils/atsScorer';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const AUTO_SAVE_DELAY_MS = 1500;
const TEMPLATE_OPTIONS = ['classic', 'modern', 'minimal'];

const initialRegister = { name: '', email: '', password: '', confirmPassword: '' };
const initialLogin = { email: '', password: '' };

const landingFeatures = [
  {
    title: 'ATS Analysis',
    copy: 'See keyword match, formatting quality, and completion score before you apply.',
  },
  {
    title: 'JD Analyzer',
    copy: 'Extract hard skills, action verbs, and domain terms directly from a job description.',
  },
  {
    title: 'Resume Builder',
    copy: 'Write, preview, autosave, and export a polished A4 resume from one focused workspace.',
  },
  {
    title: 'Cover Letter Generator',
    copy: 'Turn resume signals and a target role into a tailored first-draft cover letter fast.',
  },
];

const pricingTiers = [
  { name: 'Starter', price: 'Free', detail: 'One resume, ATS scoring, and AI suggestions.' },
  { name: 'Pro', price: '$12/mo', detail: 'Multiple resumes, PDF export, cover letters, and AI tools.' },
  { name: 'Career+', price: '$24/mo', detail: 'Advanced templates, premium coaching insights, and analytics.' },
];

const testimonials = [
  {
    quote: 'CareerForge Pro helped me tighten my resume and explain my impact more clearly.',
    name: 'Aanya S.',
    role: 'Frontend Developer',
  },
  {
    quote: 'The ATS checks and JD analysis made each application feel much more intentional.',
    name: 'Rahul K.',
    role: 'Product Analyst',
  },
];

const sidebarLinks = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/resume-builder', label: 'Resumes' },
  { to: '/ai', label: 'AI Assistant' },
  { to: '/templates', label: 'Templates' },
  { to: '/cover-letter', label: 'Cover Letters' },
  { to: '/settings', label: 'Settings' },
];

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
    throw new Error(data.message || 'AI request failed');
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
  const { resumeData, atsScore, template, ai } = useSelector((state) => state.resume);

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
    dispatch(updateResumeField({ field: 'fullName', value: resume.personalInfo?.fullName || '' }));
    dispatch(updateResumeField({ field: 'title', value: resume.targetJD || '' }));
    dispatch(updateResumeField({ field: 'summary', value: resume.personalInfo?.summary || '' }));
    dispatch(updateResumeField({
      field: 'skills',
      value: Array.isArray(resume.skills) ? resume.skills.join(', ') : '',
    }));
    dispatch(setTemplate(resume.template || 'classic'));
    toast.success('Resume loaded in builder');
    navigate('/resume-builder');
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
        throw new Error('Failed to export PDF');
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
    personalInfo: {
      fullName: resumeData.fullName,
      summary: resumeData.summary,
      email: user?.email || '',
      phone: '',
      location: '',
    },
    experience: [],
    education: [],
    skills: resumeData.skills
      .split(',')
      .map((skill) => skill.trim())
      .filter(Boolean),
    projects: [],
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
      toast.success('PDF exported');
    } catch (error) {
      toast.error(error.message);
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
      toast.success('Resume parsed successfully');
    } catch (error) {
      toast.error(error.message);
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

  const handleApplyImprovedSummary = () => {
    if (ai.summaryResult?.improvedSummary) {
      dispatch(updateResumeField({ field: 'summary', value: ai.summaryResult.improvedSummary }));
      toast.success('Summary applied to resume');
    }
  };

  return {
    user,
    token,
    isLoggedIn,
    resumeData,
    atsScore,
    template,
    ai,
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
    versions,
    loadingVersions,
    fetchVersions,
    handleSaveVersion,
    handleRestoreVersion,
    handleDeleteVersion,
    resumeId,
  };
}

function ProtectedRoute({ isLoggedIn }) {
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

function ProtectedLayout({ app }) {
  const { user, loading, handleLogout, isUpgradeModalOpen, setIsUpgradeModalOpen, handleUpgrade } = app;
  return (
    <div className="workspace-shell">
      <aside className="workspace-sidebar">
        <div className="brand-lockup">
          <div className="brand-mark">CF</div>
          <div>
            <h1>CareerForge Pro</h1>
            <p>AI-Powered Resume Intelligence</p>
          </div>
        </div>

        <nav className="workspace-nav">
          {sidebarLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                isActive ? 'workspace-nav__link workspace-nav__link--active' : 'workspace-nav__link'
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="workspace-sidebar__footer">
          <div className="user-badge">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong>{user?.name || 'CareerForge User'}</strong>
              {user?.plan === 'pro'
                ? <span className="pro-badge">✦ Pro</span>
                : <span className="free-badge">Free</span>
              }
            </div>
            <span>{user?.email || 'No email loaded yet'}</span>
          </div>
          <button type="button" className="ghost-button" onClick={() => handleLogout()}>
            Logout
          </button>
        </div>
      </aside>

      <div className="workspace-main">
        <Outlet />
      </div>
      {isUpgradeModalOpen && (
        <UpgradeModal onClose={() => setIsUpgradeModalOpen(false)} onUpgrade={handleUpgrade} isLoading={loading} />
      )}
    </div>
  );
}

function LandingPage({ isLoggedIn }) {
  return (
    <main className="marketing-shell">
      <header className="marketing-nav">
        <div className="brand-lockup brand-lockup--marketing">
          <div className="brand-mark">CF</div>
          <div>
            <h1>CareerForge Pro</h1>
            <p>Build ATS-friendly resumes with AI</p>
          </div>
        </div>

        <nav className="marketing-nav__links">
          <a href="#features">Features</a>
          <a href="#templates">Templates</a>
          <a href="#pricing">Pricing</a>
          <NavLink to="/login">Login</NavLink>
          <NavLink to={isLoggedIn ? '/dashboard' : '/register'} className="primary-link">
            {isLoggedIn ? 'Go to App' : 'Sign Up'}
          </NavLink>
        </nav>
      </header>

      <section className="hero-panel">
        <div className="hero-copy">
          <span className="eyebrow">CareerForge Pro</span>
          <h2>Build ATS-Friendly Resumes with AI</h2>
          <p>
            Create polished resumes, match them to job descriptions, improve bullet points,
            and export recruiter-ready PDFs from one focused platform.
          </p>
          <div className="hero-actions">
            <NavLink to={isLoggedIn ? '/dashboard' : '/register'} className="primary-button">
              Get Started
            </NavLink>
            <a href="#features" className="secondary-button">Watch Demo</a>
          </div>
        </div>

        <div className="hero-metrics">
          <div className="stat-card">
            <span>ATS Score</span>
            <strong>82%</strong>
          </div>
          <div className="stat-card">
            <span>Keyword Match</span>
            <strong>76%</strong>
          </div>
          <div className="stat-card">
            <span>PDF Ready</span>
            <strong>A4 Export</strong>
          </div>
        </div>
      </section>

      <section id="features" className="marketing-section">
        <div className="section-heading">
          <span className="eyebrow">Features</span>
          <h3>Everything you need to go from draft to application-ready.</h3>
        </div>
        <div className="feature-grid">
          {landingFeatures.map((feature) => (
            <article key={feature.title} className="feature-card">
              <h4>{feature.title}</h4>
              <p>{feature.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="templates" className="marketing-section">
        <div className="section-heading">
          <span className="eyebrow">Templates</span>
          <h3>Classic, modern, executive, and minimal layouts.</h3>
        </div>
        <div className="template-showcase">
          {TEMPLATE_OPTIONS.map((template) => (
            <div key={template} className={`template-card template-card--${template}`}>
              <span>{template}</span>
            </div>
          ))}
        </div>
      </section>

      <section id="pricing" className="marketing-section">
        <div className="section-heading">
          <span className="eyebrow">Pricing</span>
          <h3>Start free, then scale your job search toolkit.</h3>
        </div>
        <div className="pricing-grid">
          {pricingTiers.map((tier) => (
            <article key={tier.name} className="pricing-card">
              <h4>{tier.name}</h4>
              <strong>{tier.price}</strong>
              <p>{tier.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="marketing-section">
        <div className="section-heading">
          <span className="eyebrow">Testimonials</span>
          <h3>Job seekers use CareerForge Pro to sound sharper and apply smarter.</h3>
        </div>
        <div className="testimonial-grid">
          {testimonials.map((item) => (
            <article key={item.name} className="testimonial-card">
              <p>"{item.quote}"</p>
              <strong>{item.name}</strong>
              <span>{item.role}</span>
            </article>
          ))}
        </div>
      </section>

      <footer className="marketing-footer">
        <p>CareerForge Pro helps candidates present their best work with confidence.</p>
      </footer>
    </main>
  );
}

function LoginPage({ app }) {
  return (
    <AuthShell
      title="Welcome Back"
      subtitle="Login to continue building stronger applications."
      footerCopy="Don't have an account?"
      footerLink="/register"
      footerLabel="Create Account"
    >
      <form className="auth-form" onSubmit={app.handleLogin}>
        <label>
          Email
          <input
            type="email"
            name="email"
            value={app.loginForm.email}
            onChange={app.handleLoginChange}
            placeholder="you@example.com"
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
            name="password"
            value={app.loginForm.password}
            onChange={app.handleLoginChange}
            placeholder="Enter your password"
            required
          />
        </label>
        <button type="submit" className="primary-button primary-button--full" disabled={app.loading}>
          {app.loading ? 'Logging in...' : 'Login'}
        </button>
        <span className="auth-muted">Forgot Password?</span>
      </form>
    </AuthShell>
  );
}

function RegisterPage({ app }) {
  return (
    <AuthShell
      title="Create Account"
      subtitle="Set up CareerForge Pro and start building your job search system."
      footerCopy="Already have an account?"
      footerLink="/login"
      footerLabel="Login"
    >
      <form className="auth-form" onSubmit={app.handleRegister}>
        <label>
          Full Name
          <input
            type="text"
            name="name"
            value={app.registerForm.name}
            onChange={app.handleRegisterChange}
            placeholder="Prerana Pradeep"
            required
          />
        </label>
        <label>
          Email
          <input
            type="email"
            name="email"
            value={app.registerForm.email}
            onChange={app.handleRegisterChange}
            placeholder="you@example.com"
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
            name="password"
            value={app.registerForm.password}
            onChange={app.handleRegisterChange}
            placeholder="Create a password"
            required
            minLength={6}
          />
        </label>
        <label>
          Confirm Password
          <input
            type="password"
            name="confirmPassword"
            value={app.registerForm.confirmPassword}
            onChange={app.handleRegisterChange}
            placeholder="Confirm your password"
            required
          />
        </label>
        <button type="submit" className="primary-button primary-button--full" disabled={app.loading}>
          {app.loading ? 'Creating account...' : 'Create Account'}
        </button>
      </form>
    </AuthShell>
  );
}

function AuthShell({ title, subtitle, children, footerCopy, footerLink, footerLabel }) {
  return (
    <main className="auth-shell">
      <section className="auth-card">
        <div className="brand-lockup brand-lockup--center">
          <div className="brand-mark">CF</div>
          <div>
            <h1>CareerForge Pro</h1>
            <p>AI-Powered Resume Intelligence</p>
          </div>
        </div>
        <div className="auth-copy">
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
        {children}
        <p className="auth-footer">
          {footerCopy} <NavLink to={footerLink}>{footerLabel}</NavLink>
        </p>
      </section>
    </main>
  );
}

function DashboardPage({ app }) {
  const metricCards = [
    { label: 'ATS Score', value: `${app.atsScore}%`, note: 'Resume readiness score' },
    { label: 'Keyword Match', value: `${app.keywordMatchScore}%`, note: 'Alignment with target role' },
    { label: 'Resumes Created', value: `${app.user?.resumeCount ?? (app.hasResumeContent ? 1 : 0)}`, note: 'Saved in your workspace' },
    { label: 'Job Matches', value: `${app.jobMatches}`, note: 'Signals pulled from AI analysis' },
  ];

  const activity = [
    app.lastSavedAt ? `Resume saved at ${app.lastSavedAt.toLocaleTimeString()}` : 'Start editing your resume to trigger autosave.',
    app.ai.summaryResult ? 'AI summary suggestions are ready to apply.' : 'Run AI summary improvement for sharper positioning.',
    app.ai.jdResult ? 'Latest JD analysis has extracted role-specific keywords.' : 'Paste a JD to unlock keyword mapping.',
  ];

  return (
    <div className="page-shell">
      <header className="page-header">
        <div>
          <span className="eyebrow">Dashboard</span>
          <h2>Welcome {app.user?.name?.split(' ')[0] || 'there'}</h2>
          <p>Track your resume performance, AI signals, and recent activity from one place.</p>
        </div>
        <button type="button" className="ghost-button" onClick={() => app.fetchProfile()}>
          Refresh Profile
        </button>
      </header>

      <section className="metric-grid">
        {metricCards.map((card) => (
          <article key={card.label} className="metric-surface">
            <span>{card.label}</span>
            <strong>{card.value}</strong>
            <p>{card.note}</p>
          </article>
        ))}
      </section>

      <section className="dashboard-grid">
        <article className="surface-card" style={{ gridColumn: 'span 2' }}>
          <div className="surface-card__header">
            <h3>Your Resumes</h3>
            <NavLink to="/resume-builder" className="primary-button" style={{ padding: '0.45rem 1rem', fontSize: '0.82rem' }}>
              Create New Resume
            </NavLink>
          </div>
          {app.loadingResumes ? (
            <p className="ai-helper">Loading resumes from database...</p>
          ) : app.resumes.length > 0 ? (
            <div className="settings-grid" style={{ marginTop: '1.2rem', gap: '1.2rem' }}>
              {app.resumes.map((resume) => (
                <div key={resume._id} className="surface-card" style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(151, 182, 255, 0.1)', padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.8rem', borderRadius: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ margin: 0, fontSize: '1.1rem', fontFamily: "'Space Grotesk', sans-serif" }}>{resume.personalInfo?.fullName || 'Untitled Resume'}</h4>
                    <span className="status-pill status-pill--accent" style={{ fontSize: '0.7rem', textTransform: 'uppercase' }}>{resume.template}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--muted)' }}>
                    Target Role: {resume.targetJD || 'General Role'}
                  </p>
                  <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--muted)' }}>
                    ATS Score: <strong style={{ color: 'white' }}>{resume.atsScore}%</strong>
                  </p>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.6rem' }}>
                    <button
                      type="button"
                      className="primary-button"
                      style={{ padding: '0.45rem 0.9rem', fontSize: '0.76rem', flex: 1 }}
                      onClick={() => app.handleLoadResume(resume)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="secondary-button"
                      style={{ padding: '0.45rem 0.9rem', fontSize: '0.76rem', flex: 1 }}
                      onClick={() => app.handleExportPdfDirectly(resume)}
                    >
                      Export PDF
                    </button>
                    <button
                      type="button"
                      className="ghost-button"
                      style={{ padding: '0.45rem 0.9rem', fontSize: '0.76rem', borderColor: 'var(--danger)', color: 'var(--danger)' }}
                      onClick={() => app.handleDeleteResume(resume._id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="ai-helper" style={{ textAlign: 'center', padding: '2rem' }}>
              You haven't created any resumes yet. Clear the form or click "Create New Resume" to begin.
            </p>
          )}
        </article>

        <article className="surface-card">
          <div className="surface-card__header">
            <h3>AI Suggestions</h3>
            <NavLink to="/ai">Open Assistant</NavLink>
          </div>
          <ul className="insight-list">
            <li>Use JD Analyzer to pull recruiter vocabulary directly from target roles.</li>
            <li>Apply suggested skills to improve resume coverage quickly.</li>
            <li>Export the updated resume as an A4 PDF when your preview looks right.</li>
          </ul>
        </article>

        <article className="surface-card">
          <div className="surface-card__header">
            <h3>Recent Activity</h3>
            <NavLink to="/resume-builder">Open Builder</NavLink>
          </div>
          <ul className="insight-list">
            {activity.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>

        {app.user?.plan !== 'pro' && (
          <article className="upgrade-cta-card" style={{ gridColumn: 'span 2' }}>
            <h3 className="upgrade-cta-card__title">✦ Unlock CareerForge Pro</h3>
            <p className="upgrade-cta-card__body">
              You're on the free Starter plan. Upgrade to Pro to unlock PDF exports, unlimited resumes, cover letter generation, and full AI optimization tools.
            </p>
            <ul className="upgrade-cta-card__features">
              <li className="upgrade-cta-card__feature">✓ Unlimited Resumes</li>
              <li className="upgrade-cta-card__feature">✓ A4 PDF Export</li>
              <li className="upgrade-cta-card__feature">✓ Cover Letter AI</li>
              <li className="upgrade-cta-card__feature">✓ JD Analyzer</li>
              <li className="upgrade-cta-card__feature">✓ Bullet Rewriter</li>
            </ul>
            <div>
              <button
                type="button"
                className="primary-button"
                onClick={app.handleUpgrade}
                disabled={app.loading}
                id="dashboard-upgrade-btn"
              >
                {app.loading ? 'Opening Stripe...' : 'Upgrade to Pro — $12/mo'}
              </button>
            </div>
          </article>
        )}
      </section>
    </div>
  );
}

function ResumeBuilderPage({ app }) {
  return (
    <div className="page-shell">
      <header className="page-header">
        <div>
          <span className="eyebrow">Resume Builder</span>
          <h2>Editor and live preview</h2>
          <p>Autosave, switch templates, parse an existing PDF, and export the finished version.</p>
        </div>
        <div className="header-actions">
          <NavLink to="/ai" className="ghost-link">AI Optimization</NavLink>
          <button
            type="button"
            className="primary-button"
            onClick={app.handleExportPdf}
            disabled={app.isExportingPdf}
          >
            {app.isExportingPdf ? 'Exporting...' : 'Export PDF'}
          </button>
        </div>
      </header>

      <section className="builder-grid">
        <div style={{ display: 'grid', gap: '1rem' }}>
          <form className="surface-card builder-form">
            <div className="surface-card__header">
              <h3>Resume Content</h3>
              <span className="status-pill">
                {app.isSaving
                  ? 'Auto-saving...'
                  : app.saveError
                    ? `Error: ${app.saveError}`
                    : app.lastSavedAt
                      ? `Saved at ${app.lastSavedAt.toLocaleTimeString()}`
                      : 'Ready to save'}
              </span>
            </div>

            <label>
              Upload Resume (PDF)
              <input
                type="file"
                accept="application/pdf"
                onChange={app.handleResumeUpload}
                disabled={app.isParsingResume}
              />
            </label>

            <label>
              Full Name
              <input
                type="text"
                name="fullName"
                value={app.resumeData.fullName}
                onChange={app.handleResumeChange}
                placeholder="Your full name"
              />
            </label>

            <label>
              Target Job Title
              <input
                type="text"
                name="title"
                value={app.resumeData.title}
                onChange={app.handleResumeChange}
                placeholder="Frontend Developer"
              />
            </label>

            <label>
              Professional Summary
              <textarea
                name="summary"
                value={app.resumeData.summary}
                onChange={app.handleResumeChange}
                rows={6}
                placeholder="Write a sharp professional summary."
              />
            </label>

            <label>
              Skills (comma separated)
              <input
                type="text"
                name="skills"
                value={app.resumeData.skills}
                onChange={app.handleResumeChange}
                placeholder="React, Node.js, MongoDB"
              />
            </label>

            <div style={{ display: 'grid', gap: '0.55rem' }}>
              <span style={{ color: '#d8e5fb', fontSize: '0.92rem' }}>Resume Template</span>
              <div className="template-switcher">
                {TEMPLATE_LIST.map((tpl) => (
                  <button
                    key={tpl.key}
                    type="button"
                    className={`template-switcher__btn${app.template === tpl.key ? ' template-switcher__btn--active' : ''}`}
                    onClick={() => app.setTemplate(tpl.key)}
                  >
                    <span
                      className="template-switcher__swatch"
                      style={{ background: tpl.accent }}
                    />
                    <span className="template-switcher__name">{tpl.label}</span>
                    {app.template === tpl.key && (
                      <span className="template-switcher__tick">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </form>

          <VersionHistorySection app={app} />
        </div>

        <article className="surface-card builder-preview">
          <div className="surface-card__header">
            <h3>Live Preview</h3>
            <span className="status-pill status-pill--accent">ATS Score: {app.atsScore}%</span>
          </div>
          <ResumePreview
            resumeData={app.resumeData}
            template={app.template}
            atsScore={app.atsScore}
          />
        </article>
      </section>
    </div>
  );
}

function AIAssistantPage({ app }) {
  const tabs = [
    ['summary', 'Improve Summary'],
    ['ats', 'ATS Optimizer'],
    ['skills', 'Suggest Skills'],
    ['jd', 'JD Analyzer'],
    ['bullet', 'Bullet Rewriter'],
  ];

  return (
    <div className="page-shell">
      <header className="page-header">
        <div>
          <span className="eyebrow">AI Career Assistant</span>
          <h2>Optimize your resume against real job targets</h2>
          <p>Use focused tools to sharpen positioning, surface keywords, and improve outcomes.</p>
        </div>
      </header>

      <section className="surface-card ai-shell">
        <div className="ai-tabs" role="tablist">
          {tabs.map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={app.activeAiTab === value}
              className={app.activeAiTab === value ? 'ai-tab ai-tab--active' : 'ai-tab'}
              onClick={() => app.setActiveAiTab(value)}
            >
              {label}
            </button>
          ))}
        </div>

        {app.activeAiTab === 'summary' && (
          <div className="ai-panel-body">
            <p className="ai-helper">Refine your summary so it sounds more targeted and recruiter-friendly.</p>
            <button type="button" className="primary-button" onClick={app.handleImproveSummary} disabled={app.ai.loading}>
              {app.ai.loading ? 'Improving...' : 'Improve Summary'}
            </button>
            {app.ai.summaryResult && (
              <div className="ai-result-card">
                <div className="surface-card__header">
                  <h3>Improved Summary</h3>
                  <button type="button" className="ghost-button" onClick={app.handleApplyImprovedSummary}>
                    Apply to Resume
                  </button>
                </div>
                <p className="ai-improved-text">{app.ai.summaryResult.improvedSummary}</p>
                {app.ai.summaryResult.tips?.length > 0 && (
                  <ul className="insight-list">
                    {app.ai.summaryResult.tips.map((tip) => (
                      <li key={tip}>{tip}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}

        {app.activeAiTab === 'ats' && (
          <div className="ai-panel-body">
            <textarea
              className="ai-jd-textarea"
              rows={6}
              value={app.jobDescription}
              onChange={(event) => app.setJobDescription(event.target.value)}
              placeholder="Paste a job description to score your resume."
            />
            <button type="button" className="primary-button" onClick={app.handleAtsAnalysis}>
              Run ATS Analysis
            </button>
            {app.ai.atsResult && (
              <div className="ai-result-card">
                <div className="metric-grid metric-grid--compact">
                  <article className="metric-surface">
                    <span>ATS Score</span>
                    <strong>{app.ai.atsResult.atsScore}%</strong>
                    <p>{app.ai.atsResult.overallFeedback}</p>
                  </article>
                  <article className="metric-surface">
                    <span>Keyword Match</span>
                    <strong>{app.ai.atsResult.breakdown?.keywordMatch ?? 0}%</strong>
                    <p>Most important weighting in this scoring model.</p>
                  </article>
                </div>
                {app.ai.atsResult.missingKeywords?.length > 0 && (
                  <ChipRow title="Missing Keywords" items={app.ai.atsResult.missingKeywords} className="chip chip--missing" />
                )}
                {app.ai.atsResult.suggestions?.length > 0 && (
                  <ul className="insight-list">
                    {app.ai.atsResult.suggestions.map((suggestion) => (
                      <li key={suggestion}>{suggestion}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}

        {app.activeAiTab === 'skills' && (
          <div className="ai-panel-body">
            <p className="ai-helper">Generate missing skill ideas based on your target role and current stack.</p>
            <button type="button" className="primary-button" onClick={app.handleSuggestSkills} disabled={app.ai.loading}>
              {app.ai.loading ? 'Thinking...' : 'Suggest Skills'}
            </button>
            {app.ai.skillsResult && (
              <div className="ai-result-card">
                {app.ai.skillsResult.reason && <p className="ai-helper">{app.ai.skillsResult.reason}</p>}
                <div className="skill-suggestions">
                  {app.ai.skillsResult.suggestedSkills?.map((item) => (
                    <div key={item.skill} className="skill-suggestion-item">
                      <button type="button" className="chip chip--add" onClick={() => app.handleAddSuggestedSkill(item.skill)}>
                        + {item.skill}
                      </button>
                      <span className="skill-why">{item.why}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {app.activeAiTab === 'jd' && (
          <div className="ai-panel-body">
            <textarea
              className="ai-jd-textarea"
              rows={6}
              value={app.jobDescription}
              onChange={(event) => app.setJobDescription(event.target.value)}
              placeholder="Paste a job description to extract recruiter keywords."
            />
            <button type="button" className="primary-button" onClick={app.handleAnalyzeJD} disabled={app.ai.loading}>
              {app.ai.loading ? 'Analyzing...' : 'Analyze Job Description'}
            </button>
            {app.ai.jdResult && (
              <div className="ai-result-card">
                <ChipRow title="Hard Skills" items={app.ai.jdResult.hardSkills} className="chip chip--hard" />
                <ChipRow title="Soft Skills" items={app.ai.jdResult.softSkills} className="chip chip--soft" />
                <ChipRow title="Action Verbs" items={app.ai.jdResult.actionVerbs} className="chip chip--verb" />
                <ChipRow title="Domain" items={app.ai.jdResult.domain} className="chip chip--domain" />
                <ChipRow title="Seniority Level" items={app.ai.jdResult.seniorityLevel} className="chip chip--level" />
              </div>
            )}
          </div>
        )}

        {app.activeAiTab === 'bullet' && (
          <div className="ai-panel-body">
            <textarea
              className="ai-jd-textarea"
              rows={3}
              value={app.originalBullet}
              onChange={(event) => app.setOriginalBullet(event.target.value)}
              placeholder="Original bullet point"
            />
            <input
              type="text"
              value={app.targetKeywords}
              onChange={(event) => app.setTargetKeywords(event.target.value)}
              placeholder="Target keywords (comma separated)"
            />
            <textarea
              className="ai-jd-textarea"
              rows={5}
              value={app.jobDescription}
              onChange={(event) => app.setJobDescription(event.target.value)}
              placeholder="Optional job description context"
            />
            <button type="button" className="primary-button" onClick={app.handleRewriteBullet} disabled={app.ai.loading}>
              {app.ai.loading ? 'Rewriting...' : 'Rewrite Bullet'}
            </button>
            {app.ai.bulletResult && (
              <div className="ai-result-card">
                <p className="ai-improved-text">{app.ai.bulletResult.rewrittenBullet}</p>
                {app.ai.bulletResult.keywordsUsed?.length > 0 && (
                  <ChipRow title="Keywords Used" items={app.ai.bulletResult.keywordsUsed} className="chip chip--hard" />
                )}
                {app.ai.bulletResult.improvementNotes?.length > 0 && (
                  <ul className="insight-list">
                    {app.ai.bulletResult.improvementNotes.map((note) => (
                      <li key={note}>{note}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}

        {app.ai.error && <div className="ai-error">{app.ai.error}</div>}
      </section>
    </div>
  );
}

function TemplatesPage({ app }) {
  return (
    <div className="page-shell">
      <header className="page-header">
        <div>
          <span className="eyebrow">Templates</span>
          <h2>Choose the look that fits your target role</h2>
          <p>Preview each layout, then switch directly into the resume builder with one click.</p>
        </div>
      </header>

      <section className="template-gallery">
        {TEMPLATE_LIST.map((tpl) => {
          const isActive = app.template === tpl.key;
          return (
            <article
              key={tpl.key}
              className={`template-gallery__card${isActive ? ' template-gallery__card--active' : ''}`}
            >
              {/* Live miniature preview */}
              <div className="template-thumb-wrap">
                <div className="template-thumb-scale">
                  <ResumePreview
                    resumeData={app.resumeData}
                    template={tpl.key}
                    atsScore={app.atsScore}
                  />
                </div>
                {isActive && (
                  <div className="template-thumb-badge">Active</div>
                )}
              </div>

              {/* Card footer */}
              <div className="template-gallery__footer">
                <div>
                  <h3 className="template-gallery__name">{tpl.label}</h3>
                  <p className="template-gallery__tagline">{tpl.tagline}</p>
                </div>
                <div className="header-actions">
                  {!isActive ? (
                    <button
                      type="button"
                      className="primary-button"
                      onClick={() => app.setTemplate(tpl.key)}
                    >
                      Use Template
                    </button>
                  ) : (
                    <NavLink to="/resume-builder" className="ghost-link">
                      Open Builder
                    </NavLink>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}

function CoverLetterPage({ app }) {
  const [letterJobDescription, setLetterJobDescription] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!letterJobDescription.trim()) {
      toast.error('Paste a job description first');
      return;
    }

    if (app.user?.plan !== 'pro') {
      app.setIsUpgradeModalOpen(true);
      return;
    }

    setIsGenerating(true);
    const toastId = toast.loading('Generating cover letter with Gemini AI...');

    try {
      const skillsArray = app.resumeData.skills
        .split(',')
        .map((skill) => skill.trim())
        .filter(Boolean);

      const response = await fetch(`${API_BASE}/ai/generate-cover-letter`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${app.token}`,
        },
        body: JSON.stringify({
          resumeData: {
            fullName: app.resumeData.fullName || app.user?.name || 'Applicant',
            title: app.resumeData.title || 'Target Role',
            summary: app.resumeData.summary || '',
            skills: skillsArray,
          },
          jobDescription: letterJobDescription.trim(),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to generate cover letter');
      }

      setCoverLetter(data.coverLetter || '');
      toast.success('Cover letter generated', { id: toastId });
    } catch (error) {
      toast.error(error.message, { id: toastId });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="page-shell">
      <header className="page-header">
        <div>
          <span className="eyebrow">Cover Letter</span>
          <h2>Generate a tailored first draft</h2>
          <p>Use your resume data plus a target JD to create an editable cover letter fast.</p>
        </div>
      </header>

      <section className="builder-grid">
        <article className="surface-card builder-form">
          <div className="surface-card__header">
            <h3>Generator Inputs</h3>
            <span className="status-pill">Resume Selected</span>
          </div>
          <label>
            Job Description
            <textarea
              rows={10}
              value={letterJobDescription}
              onChange={(event) => setLetterJobDescription(event.target.value)}
              placeholder="Paste the target role description here."
            />
          </label>
          <button
            type="button"
            className="primary-button"
            onClick={handleGenerate}
            disabled={isGenerating}
          >
            {isGenerating ? 'Generating...' : 'Generate with Gemini'}
          </button>
        </article>

        <article className="surface-card builder-preview">
          <div className="surface-card__header">
            <h3>Editable Cover Letter</h3>
            <span className="status-pill status-pill--accent">Ready to refine</span>
          </div>
          <textarea
            className="cover-letter-output"
            rows={18}
            value={coverLetter}
            onChange={(event) => setCoverLetter(event.target.value)}
            placeholder="Your generated cover letter appears here."
          />
        </article>
      </section>
    </div>
  );
}

function SettingsPage({ app }) {
  return (
    <div className="page-shell">
      <header className="page-header">
        <div>
          <span className="eyebrow">Settings</span>
          <h2>Manage your account</h2>
          <p>Profile, password, subscription visibility, and account safety all live here.</p>
        </div>
      </header>

      <section className="settings-grid">
        <article className="surface-card">
          <h3>Profile</h3>
          <div className="subscription-info-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="subscription-info-item">
              <span className="subscription-info-item__label">Name</span>
              <span className="subscription-info-item__value">{app.user?.name || '—'}</span>
            </div>
            <div className="subscription-info-item">
              <span className="subscription-info-item__label">Email</span>
              <span className="subscription-info-item__value" style={{ fontSize: '0.82rem', wordBreak: 'break-all' }}>{app.user?.email || '—'}</span>
            </div>
          </div>
        </article>
        <article className="surface-card">
          <h3>Password</h3>
          <p>Use a unique password and rotate it regularly when you are job searching actively.</p>
        </article>
        <article className="surface-card">
          <h3>Subscription</h3>
          <PlanStatusSection app={app} />
        </article>
        <article className="surface-card surface-card--danger">
          <h3>Delete Account</h3>
          <p>Keep destructive account actions here so users always know where to find them.</p>
        </article>
      </section>
    </div>
  );
}

function ResumePreview({ resumeData, template, atsScore }) {
  const TemplateComponent = TEMPLATES[template] ?? TEMPLATES.classic;
  return <TemplateComponent resumeData={resumeData} atsScore={atsScore} />;
}

function ChipRow({ title, items, className }) {
  return (
    <div className="ai-keywords ai-keywords--section">
      <div className="surface-card__header">
        <h3>{title}</h3>
      </div>
      <div className="chip-row">
        {Array.isArray(items) && items.length > 0 ? (
          items.map((item, index) => (
            <span key={`${title}-${index}`} className={className}>{item}</span>
          ))
        ) : (
          <span className="chip chip--empty">No clear tags found</span>
        )}
      </div>
    </div>
  );
}

function getPlanStatusClass(status) {
  if (!status || status === 'inactive') return 'inactive';
  if (status === 'active') return 'active';
  if (status === 'trialing') return 'trialing';
  if (status === 'past_due') return 'past_due';
  if (status === 'canceled' || status === 'unpaid') return 'inactive';
  return 'inactive';
}

function PlanStatusSection({ app }) {
  const { user, loading, handleUpgrade, handleManageBilling } = app;
  const isPro = user?.plan === 'pro';
  const statusKey = getPlanStatusClass(user?.planStatus);
  const renewalDate = user?.planCurrentPeriodEnd
    ? new Date(user.planCurrentPeriodEnd).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : null;

  return (
    <>
      <div className="subscription-info-grid">
        <div className="subscription-info-item">
          <span className="subscription-info-item__label">Current Plan</span>
          <span className="subscription-info-item__value">
            {isPro ? 'Pro — $12/mo' : 'Starter — Free'}
          </span>
        </div>
        <div className="subscription-info-item">
          <span className="subscription-info-item__label">Status</span>
          <span className={`plan-status-badge plan-status-badge--${statusKey}`}>
            {statusKey === 'active' && '●'} {user?.planStatus || 'inactive'}
          </span>
        </div>
        <div className="subscription-info-item">
          <span className="subscription-info-item__label">Resumes Created</span>
          <span className="subscription-info-item__value">{user?.resumeCount ?? 0}</span>
        </div>
        {isPro && (
          <div className="subscription-info-item">
            <span className="subscription-info-item__label">
              {user?.planStatus === 'canceled' ? 'Access Until' : 'Renews On'}
            </span>
            <span className="subscription-info-item__value" style={{ fontSize: '0.82rem' }}>
              {renewalDate || '—'}
            </span>
          </div>
        )}
      </div>

      {!isPro ? (
        <button
          type="button"
          className="primary-button"
          style={{ width: '100%' }}
          onClick={handleUpgrade}
          disabled={loading}
          id="settings-upgrade-btn"
        >
          {loading ? 'Opening Stripe...' : '✦ Upgrade to Pro — $12/mo'}
        </button>
      ) : (
        <>
          <p style={{ color: 'var(--success)', fontWeight: '600', margin: '0 0 0.75rem' }}>
            ✓ Pro Plan is Active
          </p>
          <button
            type="button"
            className="secondary-button"
            style={{ width: '100%' }}
            onClick={handleManageBilling}
            disabled={loading}
            id="settings-billing-portal-btn"
          >
            {loading ? 'Opening Stripe...' : 'Manage Billing & Invoices'}
          </button>
        </>
      )}
    </>
  );
}

const UPGRADE_BENEFITS = [
  { icon: '📄', text: 'Unlimited Resumes (Starter limit: 1)' },
  { icon: '⬇️', text: 'A4 PDF Downloads — recruiter-ready exports' },
  { icon: '🎯', text: 'JD Analyzer — extract recruiter keywords instantly' },
  { icon: '✍️', text: 'AI Bullet Rewriter & quantified achievements' },
  { icon: '💌', text: 'Cover Letter Generator powered by Gemini AI' },
];

function UpgradeModal({ onClose, onUpgrade, isLoading }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-surface" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <span className="eyebrow" style={{ marginBottom: '0.4rem', display: 'block' }}>Unlock Pro</span>
            <h3>CareerForge Pro</h3>
          </div>
          <button type="button" className="modal-close-button" onClick={onClose} aria-label="Close modal">
            ✕
          </button>
        </div>

        <div className="modal-shimmer-line" />

        <p className="ai-helper">Everything you need to go from draft to job-ready — in one focused platform.</p>

        <ul className="modal-benefits">
          {UPGRADE_BENEFITS.map((benefit) => (
            <li key={benefit.text} className="modal-benefit-item">
              <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{benefit.icon}</span>
              <span>{benefit.text}</span>
            </li>
          ))}
        </ul>

        <div className="modal-pricing">
          <strong>$12.00 / month</strong>
          <span>Cancel anytime — no lock-in, no hidden fees.</span>
        </div>

        <div className="modal-actions">
          <button
            type="button"
            className="primary-button"
            onClick={onUpgrade}
            disabled={isLoading}
            id="upgrade-modal-cta-btn"
          >
            {isLoading ? 'Opening Stripe...' : '✦ Upgrade Now — $12/mo'}
          </button>
          <button type="button" className="ghost-button" onClick={onClose}>
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
}

function VersionHistorySection({ app }) {
  if (!app.resumeId) {
    return (
      <article className="surface-card">
        <div className="surface-card__header">
          <h3>Version History</h3>
        </div>
        <p className="ai-helper">Save your resume first to activate version history snapshots.</p>
      </article>
    );
  }

  return (
    <article className="surface-card">
      <div className="surface-card__header">
        <h3>Version History</h3>
        <button
          type="button"
          className="primary-button"
          style={{ padding: '0.45rem 0.9rem', fontSize: '0.78rem' }}
          onClick={app.handleSaveVersion}
        >
          Save Snapshot
        </button>
      </div>
      {app.loadingVersions ? (
        <p className="ai-helper">Loading snapshots...</p>
      ) : app.versions.length > 0 ? (
        <ul className="insight-list" style={{ marginTop: '1.2rem', listStyle: 'none', paddingLeft: 0, display: 'grid', gap: '0.8rem' }}>
          {app.versions.map((ver) => (
            <li key={ver._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.8rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '12px', border: '1px solid rgba(151, 182, 255, 0.08)' }}>
              <div>
                <strong style={{ display: 'block', fontSize: '0.92rem' }}>{ver.versionName}</strong>
                <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                  {new Date(ver.createdAt).toLocaleString()}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <button
                  type="button"
                  className="ghost-button"
                  style={{ padding: '0.25rem 0.6rem', fontSize: '0.74rem' }}
                  onClick={() => app.handleRestoreVersion(ver._id)}
                >
                  Restore
                </button>
                <button
                  type="button"
                  className="ghost-button"
                  style={{ padding: '0.25rem 0.6rem', fontSize: '0.74rem', borderColor: 'var(--danger)', color: 'var(--danger)' }}
                  onClick={() => app.handleDeleteVersion(ver._id)}
                >
                  ✕
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="ai-helper" style={{ marginTop: '1rem' }}>No snapshots saved yet. Capture your first version snapshot above!</p>
      )}
    </article>
  );
}

export default App;
