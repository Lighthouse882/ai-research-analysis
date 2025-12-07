'use client';

import { useMemo, useState, useEffect, useRef } from 'react';

const COUNTRY_COLORS = [
  '#22d3ee', '#f472b6', '#4ade80', '#fbbf24', '#a78bfa', '#fb7185',
];

export default function Controls({
  selectedYear,
  yearRange,
  viewMode,
  comparedCountries,
  countrySummary,
  onYearChange,
  onViewModeChange,
  onRemoveComparison,
  onClearComparisons,
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState(800); // ms per year
  const intervalRef = useRef(null);

  // Animation logic
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        onYearChange(prev => {
          const next = prev + 1;
          if (next > 2025) {
            setIsPlaying(false);
            return 2011; // Loop back
          }
          return next;
        });
      }, playSpeed);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, playSpeed, onYearChange]);

  // Handle year change from parent (for animation)
  const handleYearChangeInternal = (year) => {
    onYearChange(year);
  };

  const comparedCountryNames = useMemo(() => {
    return comparedCountries.map((code, index) => {
      const country = countrySummary.find((c) => c.country_code === code);
      return { 
        code, 
        name: country?.country || code,
        color: COUNTRY_COLORS[index % COUNTRY_COLORS.length]
      };
    });
  }, [comparedCountries, countrySummary]);

  const togglePlay = () => {
    if (!isPlaying && selectedYear === 2025) {
      onYearChange(2010); // Reset to start if at end
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="viz-panel">
      <div className="p-4 flex flex-wrap items-center gap-4 md:gap-6">
        {/* Year Slider with Play Button */}
        <div className="flex-1 min-w-[250px]">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-mono text-viz-muted uppercase tracking-wider">
              Year
            </label>
            <div className="flex items-center gap-2">
              <span className="font-mono text-viz-accent font-semibold text-lg">{selectedYear}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Play/Pause Button */}
            <button
              onClick={togglePlay}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                isPlaying 
                  ? 'bg-viz-highlight text-white' 
                  : 'bg-viz-border hover:bg-viz-accent hover:text-viz-bg'
              }`}
              title={isPlaying ? 'Pause' : 'Play animation'}
            >
              {isPlaying ? (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="6" y="4" width="4" height="16" />
                  <rect x="14" y="4" width="4" height="16" />
                </svg>
              ) : (
                <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>
            
            {/* Slider */}
            <div className="flex-1">
              <input
                type="range"
                min={2010}
                max={2025}
                value={selectedYear}
                onChange={(e) => {
                  setIsPlaying(false);
                  handleYearChangeInternal(parseInt(e.target.value));
                }}
                className="year-slider"
              />
              <div className="flex justify-between text-[10px] text-viz-muted font-mono mt-1">
                <span>2010</span>
                <span>2025</span>
              </div>
            </div>
            
            {/* Speed Control */}
            {isPlaying && (
              <select
                value={playSpeed}
                onChange={(e) => setPlaySpeed(Number(e.target.value))}
                className="bg-viz-border text-viz-text text-xs rounded px-2 py-1 border-none outline-none"
              >
                <option value={1200}>0.5x</option>
                <option value={800}>1x</option>
                <option value={400}>2x</option>
                <option value={200}>4x</option>
              </select>
            )}
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-viz-muted uppercase tracking-wider mr-2">View</span>
          <button
            onClick={() => onViewModeChange('absolute')}
            className={`viz-button ${viewMode === 'absolute' ? 'active' : ''}`}
          >
            Paper Count
          </button>
          <button
            onClick={() => onViewModeChange('growth')}
            className={`viz-button ${viewMode === 'growth' ? 'active' : ''}`}
          >
            Growth Rate
          </button>
        </div>

        {/* Compared Countries Tags */}
        {comparedCountryNames.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono text-viz-muted uppercase tracking-wider">
              Comparing:
            </span>
            {comparedCountryNames.map(({ code, name, color }) => (
              <span
                key={code}
                className="inline-flex items-center gap-1.5 px-2 py-1 bg-viz-border rounded text-xs font-mono"
                style={{ borderLeft: `3px solid ${color}` }}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                {name}
                <button
                  onClick={() => onRemoveComparison(code)}
                  className="text-viz-muted hover:text-viz-highlight ml-1"
                  title={`Remove ${name}`}
                >
                  ×
                </button>
              </span>
            ))}
            <button
              onClick={onClearComparisons}
              className="text-xs text-viz-muted hover:text-viz-highlight font-mono px-2 py-1 rounded hover:bg-viz-border transition-colors"
              title="Clear all selections"
            >
              Clear all
            </button>
          </div>
        )}
      </div>
    </div>
  );
}