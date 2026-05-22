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
  },
});

export const { updateResumeField, setTemplate, resetResume } = resumeSlice.actions;
export default resumeSlice.reducer;
