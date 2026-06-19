import { createSlice } from '@reduxjs/toolkit';

const emptyExperience = () => ({
  company: '',
  role: '',
  location: '',
  startDate: '',
  endDate: '',
  currentlyWorking: false,
  description: '',
});

const emptyEducation = () => ({
  institution: '',
  degree: '',
  fieldOfStudy: '',
  startDate: '',
  endDate: '',
  grade: '',
});

const emptyProject = () => ({
  title: '',
  description: '',
  technologies: '',
  link: '',
});

const initialState = {
  resumeData: {
    fullName: '',
    title: '',
    summary: '',
    skills: '',
  },
  experience: [],
  education: [],
  projects: [],
  atsScore: 0,
  template: 'classic',
  // ─── AI State ─────────────────────────────────────────────────────────────
  ai: {
    loading: false,
    error: '',
    summaryResult: null,   // { improvedSummary, tips[] }
    atsResult: null,       // { atsScore, missingKeywords[], suggestions[], overallFeedback }
    skillsResult: null,    // { suggestedSkills[{ skill, why }], reason }
    jdResult: null,        // { hardSkills[], softSkills[], actionVerbs[], domain[], seniorityLevel[] }
    bulletResult: null,    // { rewrittenBullet, keywordsUsed[], improvementNotes[] }
  },
};

const computeAtsScore = (data) => {
  const fields = [data?.fullName, data?.title, data?.summary, data?.skills];
  const completedFields = fields.filter((value) => typeof value === 'string' && value.trim().length > 0).length;
  return Math.round((completedFields / fields.length) * 100);
};

const resumeSlice = createSlice({
  name: 'resume',
  initialState,
  reducers: {
    updateResumeField: (state, action) => {
      const { field, value } = action.payload;
      state.resumeData[field] = value;
      state.atsScore = computeAtsScore(state.resumeData);
    },
    setTemplate: (state, action) => {
      state.template = action.payload;
    },
    resetResume: () => initialState,

    // ─── Experience Actions ────────────────────────────────────────────────
    addExperience: (state) => {
      state.experience.push(emptyExperience());
    },
    updateExperience: (state, action) => {
      const { index, field, value } = action.payload;
      if (state.experience[index] !== undefined) {
        state.experience[index][field] = value;
      }
    },
    removeExperience: (state, action) => {
      state.experience.splice(action.payload, 1);
    },
    setExperience: (state, action) => {
      state.experience = action.payload;
    },

    // ─── Education Actions ─────────────────────────────────────────────────
    addEducation: (state) => {
      state.education.push(emptyEducation());
    },
    updateEducation: (state, action) => {
      const { index, field, value } = action.payload;
      if (state.education[index] !== undefined) {
        state.education[index][field] = value;
      }
    },
    removeEducation: (state, action) => {
      state.education.splice(action.payload, 1);
    },
    setEducation: (state, action) => {
      state.education = action.payload;
    },

    // ─── Projects Actions ──────────────────────────────────────────────────
    addProject: (state) => {
      state.projects.push(emptyProject());
    },
    updateProject: (state, action) => {
      const { index, field, value } = action.payload;
      if (state.projects[index] !== undefined) {
        state.projects[index][field] = value;
      }
    },
    removeProject: (state, action) => {
      state.projects.splice(action.payload, 1);
    },
    setProjects: (state, action) => {
      state.projects = action.payload;
    },

    // ─── AI Actions ──────────────────────────────────────────────────────────
    setAiLoading: (state, action) => {
      state.ai.loading = action.payload;
      if (action.payload) state.ai.error = '';
    },
    setAiError: (state, action) => {
      state.ai.error = action.payload;
      state.ai.loading = false;
    },
    setSummaryResult: (state, action) => {
      state.ai.summaryResult = action.payload;
      state.ai.loading = false;
    },
    setAtsResult: (state, action) => {
      state.ai.atsResult = action.payload;
      state.ai.loading = false;
    },
    setSkillsResult: (state, action) => {
      state.ai.skillsResult = action.payload;
      state.ai.loading = false;
    },
    setJdResult: (state, action) => {
      state.ai.jdResult = action.payload;
      state.ai.loading = false;
    },
    setBulletResult: (state, action) => {
      state.ai.bulletResult = action.payload;
      state.ai.loading = false;
    },
    clearAiResults: (state) => {
      state.ai = initialState.ai;
    },
  },
});

export const {
  updateResumeField,
  setTemplate,
  resetResume,
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
  setAiLoading,
  setAiError,
  setSummaryResult,
  setAtsResult,
  setSkillsResult,
  setJdResult,
  setBulletResult,
  clearAiResults,
} = resumeSlice.actions;

export default resumeSlice.reducer;
