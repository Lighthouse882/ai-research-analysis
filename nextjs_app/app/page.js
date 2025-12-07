'use client';

import { useState, useEffect, useCallback } from 'react';
import MapView from '../components/MapView';
import TimeSeriesPanel from '../components/TimeSeriesPanel';
import NodeLinkGraph from '../components/NodeLinkGraph';
import Controls from '../components/Controls';

export default function Home() {
  // Cover page state
  const [showCover, setShowCover] = useState(true);
  
  // Data state
  const [countryYearData, setCountryYearData] = useState([]);
  const [countrySummary, setCountrySummary] = useState([]);
  const [subfieldData, setSubfieldData] = useState([]);
  const [nodeLinkData, setNodeLinkData] = useState({});
  const [worldGeo, setWorldGeo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Interaction state
  const [selectedYear, setSelectedYear] = useState(2010);
  const [yearRange, setYearRange] = useState([2010, 2025]);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [comparedCountries, setComparedCountries] = useState([]);
  const [selectedSubfield, setSelectedSubfield] = useState(null);
  const [hoveredCountry, setHoveredCountry] = useState(null);
  const [viewMode, setViewMode] = useState('absolute');

  // Load data only after cover is dismissed
  useEffect(() => {
    if (showCover) return; // Don't load data while cover is shown
    
    async function loadData() {
      try {
        setLoading(true);
        const [cyRes, summaryRes, subfieldRes, nodeLinkRes, geoRes] = await Promise.all([
          fetch('/ai_papers_country_year.json'),
          fetch('/ai_papers_country_summary.json'),
          fetch('/ai_papers_country_year_subfield.json'),
          fetch('/node_link_by_country_year.json'),  // Use year-based data
          fetch('/world-50m.json'),
        ]);

        if (!cyRes.ok || !summaryRes.ok || !subfieldRes.ok || !nodeLinkRes.ok || !geoRes.ok) {
          throw new Error('Failed to load one or more data files');
        }

        const [cy, summary, subfield, nodeLink, geo] = await Promise.all([
          cyRes.json(), summaryRes.json(), subfieldRes.json(), nodeLinkRes.json(), geoRes.json(),
        ]);

        setCountryYearData(cy);
        setCountrySummary(summary);
        setSubfieldData(subfield);
        setNodeLinkData(nodeLink);
        setWorldGeo(geo);
        setLoading(false);
      } catch (err) {
        console.error('Data loading error:', err);
        setError(err.message);
        setLoading(false);
      }
    }
    loadData();
  }, [showCover]);

  // Handler: Select a country
  const handleCountrySelect = useCallback((countryCode) => {
    if (countryCode === selectedCountry) {
      // Double-click same country = deselect
      setSelectedCountry(null);
    } else {
      setSelectedCountry(countryCode);
      if (!comparedCountries.includes(countryCode)) {
        setComparedCountries((prev) => [...prev.slice(-4), countryCode]);
      }
    }
  }, [selectedCountry, comparedCountries]);

  // Handler: Clear all selections (click on empty map area)
  const handleClearSelection = useCallback(() => {
    setSelectedCountry(null);
    setComparedCountries([]);
    setSelectedSubfield(null);
  }, []);

  // Handler: Remove country from comparison
  const handleRemoveComparison = useCallback((countryCode) => {
    setComparedCountries((prev) => prev.filter((c) => c !== countryCode));
    if (selectedCountry === countryCode) {
      setSelectedCountry(null);
    }
  }, [selectedCountry]);

  // Handler: Clear all comparisons
  const handleClearComparisons = useCallback(() => {
    setComparedCountries([]);
    setSelectedCountry(null);
  }, []);

  // Handler: Year change (supports both direct value and functional update for animation)
  const handleYearChange = useCallback((yearOrFn) => {
    if (typeof yearOrFn === 'function') {
      setSelectedYear(yearOrFn);
    } else {
      setSelectedYear(yearOrFn);
    }
  }, []);

  // Handler: Time brush change
  const handleYearRangeChange = useCallback((range) => {
    setYearRange(range);
  }, []);

  // Handler: Subfield selection
  const handleSubfieldSelect = useCallback((subfield) => {
    setSelectedSubfield(subfield === selectedSubfield ? null : subfield);
  }, [selectedSubfield]);

  // Handler: Hover
  const handleCountryHover = useCallback((countryCode) => {
    setHoveredCountry(countryCode);
  }, []);

  // Cover page component
  if (showCover) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0e1a] via-[#131928] to-[#0a0e1a]">
        <div className="text-center max-w-2xl px-6">
          {/* Logo/Title */}
          <div className="mb-12">
            <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight mb-4">
            </h1>
            <div className="w-24 h-1 bg-gradient-to-r from-viz-accent to-viz-highlight mx-auto rounded-full"></div>
          </div>

          {/* Three Questions */}
          <div className="space-y-6 mb-12">
            <div className="group p-4 rounded-lg border border-viz-border/50 bg-viz-surface/30 hover:border-viz-accent/50 transition-all duration-300">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-viz-accent/20 flex items-center justify-center text-viz-accent text-lg">
                </div>
                <p className="text-lg md:text-xl text-viz-text text-left">
                  Do you want to know about <span className="text-viz-accent font-semibold">AI research trends</span>?
                </p>
              </div>
            </div>

            <div className="group p-4 rounded-lg border border-viz-border/50 bg-viz-surface/30 hover:border-viz-highlight/50 transition-all duration-300">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-viz-highlight/20 flex items-center justify-center text-viz-highlight text-lg">
                </div>
                <p className="text-lg md:text-xl text-viz-text text-left">
                  Do you want to know how AI research became <span className="text-viz-highlight font-semibold">globalized</span>?
                </p>
              </div>
            </div>

            <div className="group p-4 rounded-lg border border-viz-border/50 bg-viz-surface/30 hover:border-green-400/50 transition-all duration-300">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-green-400/20 flex items-center justify-center text-green-400 text-lg">
                </div>
                <p className="text-lg md:text-xl text-viz-text text-left">
                  Do you want to step into <span className="text-green-400 font-semibold">hot research fields</span>?
                </p>
              </div>
            </div>
          </div>

          {/* Enter Button */}
          <button
            onClick={() => setShowCover(false)}
            className="group relative px-8 py-4 bg-gradient-to-r from-viz-accent to-viz-highlight text-viz-bg font-display font-semibold text-lg rounded-lg overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-viz-accent/25"
          >
            <span className="relative z-10">Explore Now</span>
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
          </button>

          {/* Subtle footer */}
          <p className="mt-8 text-viz-muted text-sm">
            Presented by Zifan Zhao & Firestone Lappland
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-viz-muted font-mono text-sm">Loading visualization data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-viz-highlight text-4xl mb-4">⚠</div>
          <h2 className="text-xl font-display font-semibold mb-2">Data Loading Error</h2>
          <p className="text-viz-muted mb-4">{error}</p>
          <p className="text-sm text-viz-muted">
            Make sure data files are in the <code className="bg-viz-border px-1 rounded">/public</code> folder.
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen p-4 md:p-6">
      {/* Header */}
      <header className="mb-6">
        <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight">
          Global AI Research
          <span className="text-viz-accent ml-2">2010–2025</span>
        </h1>
        <p className="text-viz-muted mt-1 text-sm md:text-base">
          Interactive visualization of AI paper distribution by country, year, and research area
        </p>
      </header>

      {/* Controls Bar */}
      <Controls
        selectedYear={selectedYear}
        yearRange={yearRange}
        viewMode={viewMode}
        comparedCountries={comparedCountries}
        countrySummary={countrySummary}
        onYearChange={handleYearChange}
        onViewModeChange={setViewMode}
        onRemoveComparison={handleRemoveComparison}
        onClearComparisons={handleClearComparisons}
      />

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mt-4">
        {/* Map View */}
        <div className="lg:col-span-7">
          <div className="viz-panel h-[500px] md:h-[600px]">
            <div className="viz-panel-header">
              <span className="viz-panel-title">Geographical Distribution</span>
              <span className="text-viz-muted text-xs font-mono">
                Year: {selectedYear} | {viewMode === 'absolute' ? 'Paper Count' : 'Growth Rate'}
              </span>
            </div>
            <div className="viz-panel-content h-[calc(100%-60px)]">
              <MapView
                data={countryYearData}
                summary={countrySummary}
                geoData={worldGeo}
                selectedYear={selectedYear}
                selectedCountry={selectedCountry}
                comparedCountries={comparedCountries}
                hoveredCountry={hoveredCountry}
                viewMode={viewMode}
                selectedSubfield={selectedSubfield}
                subfieldData={subfieldData}
                onCountrySelect={handleCountrySelect}
                onCountryHover={handleCountryHover}
                onClearSelection={handleClearSelection}
              />
            </div>
          </div>
        </div>

        {/* Side Panels */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Time Series Panel */}
          <div className="viz-panel h-[280px] md:h-[300px]">
            <div className="viz-panel-header">
              <span className="viz-panel-title">
                {viewMode === 'growth' ? 'Paper Growth Rate Over Time' : 'Paper Count Over Time'}
              </span>
              {comparedCountries.length > 0 && (
                <span className="text-viz-accent text-xs font-mono">
                  {comparedCountries.length} countries selected
                </span>
              )}
            </div>
            <div className="viz-panel-content h-[calc(100%-60px)]">
              <TimeSeriesPanel
                data={countryYearData}
                subfieldData={subfieldData}
                comparedCountries={comparedCountries}
                selectedCountry={selectedCountry}
                selectedSubfield={selectedSubfield}
                selectedYear={selectedYear}
                yearRange={yearRange}
                onYearRangeChange={handleYearRangeChange}
                onCountrySelect={handleCountrySelect}
                viewMode={viewMode}
              />
            </div>
          </div>

          {/* Node-Link Graph */}
          <div className="viz-panel h-[280px] md:h-[290px]">
            <div className="viz-panel-header">
              <span className="viz-panel-title">Research Fields</span>
              {selectedCountry && (
                <span className="text-viz-highlight text-xs font-mono">
                  {countrySummary.find((c) => c.country_code === selectedCountry)?.country || selectedCountry}
                </span>
              )}
            </div>
            <div className="viz-panel-content h-[calc(100%-60px)]">
              <NodeLinkGraph
                nodeLinkData={nodeLinkData}
                selectedCountry={selectedCountry}
                selectedYear={selectedYear}
                selectedSubfield={selectedSubfield}
                onSubfieldSelect={handleSubfieldSelect}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-6 pt-4 border-t border-viz-border text-center text-viz-muted text-xs">
        Data source: <a href="https://openalex.org" className="text-viz-accent hover:underline" target="_blank" rel="noopener noreferrer">OpenAlex</a>
        {' · '}
        NYU Data Visualization Course Project
        {' · '}
        Zifan Zhao & Firestone Lappland
      </footer>
    </main>
  );
}