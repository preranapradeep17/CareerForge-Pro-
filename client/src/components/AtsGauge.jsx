import React from 'react';

export function AtsBadge({ score }) {
  let color = '#fb7185'; // Red
  let bg = 'rgba(251, 113, 133, 0.1)';
  let border = 'rgba(251, 113, 133, 0.24)';
  let emoji = '🔴';

  if (score >= 85) {
    color = '#2dd4bf'; // Teal/Green
    bg = 'rgba(45, 212, 191, 0.1)';
    border = 'rgba(45, 212, 191, 0.3)';
    emoji = '🟢';
  } else if (score >= 70) {
    color = '#fbbf24'; // Yellow
    bg = 'rgba(250, 204, 21, 0.12)';
    border = 'rgba(250, 204, 21, 0.28)';
    emoji = '🟡';
  }

  return (
    <span
      className="ats-badge"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.35rem',
        padding: '0.3rem 0.75rem',
        borderRadius: '999px',
        fontSize: '0.78rem',
        fontWeight: '700',
        color,
        background: bg,
        border: `1px solid ${border}`,
        fontFamily: "'Space Grotesk', sans-serif",
      }}
    >
      <span>{emoji}</span> {score}% ATS Match
    </span>
  );
}

export default function AtsGauge({ score, size = 52 }) {
  const radius = (size - 10) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;

  const getColor = (s) => {
    if (s >= 85) return '#2dd4bf'; // Teal/Green
    if (s >= 70) return '#fbbf24'; // Yellow/Amber
    return '#fb7185'; // Crimson/Red
  };

  const getGradientId = (s) => {
    if (s >= 85) return 'tealGrad';
    if (s >= 70) return 'amberGrad';
    return 'redGrad';
  };

  return (
    <div
      className="ats-gauge-container"
      style={{
        width: size,
        height: size,
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justify: 'center',
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{
          transform: 'rotate(-90deg)',
          position: 'absolute',
          top: 0,
          left: 0,
        }}
      >
        <defs>
          <linearGradient id="tealGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#14b8a6" />
            <stop offset="100%" stopColor="#2dd4bf" />
          </linearGradient>
          <linearGradient id="amberGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#fbbf24" />
          </linearGradient>
          <linearGradient id="redGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f43f5e" />
            <stop offset="100%" stopColor="#fb7185" />
          </linearGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor={getColor(score)} floodOpacity="0.4" />
          </filter>
        </defs>
        
        {/* Track Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255, 255, 255, 0.08)"
          strokeWidth="4.5"
          fill="transparent"
        />

        {/* Value/Indicator Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={`url(#${getGradientId(score)})`}
          strokeWidth="4.5"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          filter="url(#glow)"
          style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }}
        />
      </svg>
      <span
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: '0.86rem',
          fontWeight: '800',
          color: getColor(score),
          zIndex: 1,
          textShadow: `0 0 10px rgba(${score >= 85 ? '45,212,191' : score >= 70 ? '251,191,36' : '251,113,133'}, 0.2)`
        }}
      >
        {score}%
      </span>
    </div>
  );
}
