const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'in', 'is', 'it',
  'of', 'on', 'or', 'that', 'the', 'to', 'with', 'you', 'your', 'will', 'we', 'our',
  'this', 'those', 'these', 'their', 'them', 'they', 'about', 'into', 'across',
]);

const ACTION_VERBS = [
  'developed', 'built', 'implemented', 'designed', 'optimized', 'led', 'created',
  'managed', 'improved', 'delivered', 'engineered', 'automated', 'launched',
];

const normalizeWord = (word) => word.toLowerCase().replace(/[^a-z0-9+#.-]/g, '');

const extractKeywords = (jobDescription) => {
  const rawWords = String(jobDescription || '')
    .split(/\s+/)
    .map(normalizeWord)
    .filter((w) => w.length >= 3 && !STOP_WORDS.has(w));

  const freq = new Map();
  for (const word of rawWords) {
    freq.set(word, (freq.get(word) || 0) + 1);
  }

  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([word]) => word);
};

const scoreFormatting = (resumeText) => {
  const text = String(resumeText || '').trim();
  if (!text) return 0;

  let score = 35;
  if (text.length >= 120) score += 20;
  if (text.length >= 240) score += 10;
  if (/\d+%|\d+\+/.test(text)) score += 15;
  if (ACTION_VERBS.some((verb) => text.toLowerCase().includes(verb))) score += 10;
  if (!/[^\w\s,.;:%()+\-/#]/.test(text)) score += 10;

  return Math.min(100, score);
};

const scoreCompleteness = (resumeData) => {
  const fields = [
    resumeData.fullName,
    resumeData.title,
    resumeData.summary,
    resumeData.skills,
  ];
  const completed = fields.filter((value) => String(value || '').trim().length > 0).length;
  return Math.round((completed / fields.length) * 100);
};

export const scoreResumeAgainstJD = ({ resumeData, jobDescription }) => {
  const resumeText = [
    resumeData.fullName,
    resumeData.title,
    resumeData.summary,
    resumeData.skills,
  ].join(' ').toLowerCase();

  const jdKeywords = extractKeywords(jobDescription);
  const matchedKeywords = jdKeywords.filter((kw) => resumeText.includes(kw));
  const missingKeywords = jdKeywords.filter((kw) => !resumeText.includes(kw)).slice(0, 8);

  const keywordMatchScore = jdKeywords.length
    ? Math.round((matchedKeywords.length / jdKeywords.length) * 100)
    : 0;
  const formattingScore = scoreFormatting(resumeText);
  const completenessScore = scoreCompleteness(resumeData);

  const atsScore = Math.round(
    keywordMatchScore * 0.6
    + formattingScore * 0.25
    + completenessScore * 0.15
  );

  return {
    atsScore,
    breakdown: {
      keywordMatch: keywordMatchScore,
      formatting: formattingScore,
      completeness: completenessScore,
      weights: {
        keywordMatch: 60,
        formatting: 25,
        completeness: 15,
      },
    },
    missingKeywords,
    suggestions: [
      'Include missing JD keywords naturally in summary and skills.',
      'Start bullets with strong action verbs and include measurable outcomes.',
      'Keep formatting clean and consistent for ATS parsing.',
    ],
    overallFeedback:
      atsScore >= 80
        ? 'Strong ATS alignment. Fine-tune with a few targeted keywords.'
        : atsScore >= 60
          ? 'Moderate ATS alignment. Improve keyword match and quantified impact.'
          : 'Low ATS alignment. Add role-specific keywords and clearer achievement statements.',
  };
};

