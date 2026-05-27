import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  resumeData: {
    fullName: '',
    title: '',
    summary: '',
    skills: '',
  },
  atsScore: 0,
  template: 'classic',
  // ─── AI State ─────────────────────────────────────────────────────────────
  ai: {
    loading: false,
    error: '',
    // improve-summary result
    summaryResult: null,   // { improvedSummary, tips[] }
    // ats-analysis result
    atsResult: null,       // { atsScore, missingKeywords[], suggestions[], overallFeedback }
    // suggest-skills result
    skillsResult: null,    // { suggestedSkills[{ skill, why }], reason }
  },
};

const computeAtsScore = (data) => {
  const fields = [data.fullName, data.title, data.summary, data.skills];
  const completedFields = fields.filter((value) => value.trim().length > 0).length;
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
    clearAiResults: (state) => {
      state.ai = initialState.ai;
    },
  },
});

export const {
  updateResumeField,
  setTemplate,
  resetResume,
  setAiLoading,
  setAiError,
  setSummaryResult,
  setAtsResult,
  setSkillsResult,
  clearAiResults,
} = resumeSlice.actions;

export default resumeSlice.reducer;
