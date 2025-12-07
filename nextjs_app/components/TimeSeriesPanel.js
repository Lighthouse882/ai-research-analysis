'use client';

import { useRef, useEffect, useMemo, useState } from 'react';
import * as d3 from 'd3';

const COUNTRY_COLORS = [
  '#22d3ee', '#f472b6', '#4ade80', '#fbbf24', '#a78bfa', '#fb7185',
];

export default function TimeSeriesPanel({
  data,
  subfieldData,
  comparedCountries,
  selectedCountry,
  selectedSubfield,
  selectedYear,
  yearRange,
  onYearRangeChange,
  onCountrySelect,
  viewMode = 'absolute', // 'absolute' or 'growth'
}) {
  const svgRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 500, height: 220 });

  const timeSeriesData = useMemo(() => {
    if (!data.length) return [];

    const sourceData = selectedSubfield && subfieldData.length
      ? subfieldData.filter((d) => d.subfield === selectedSubfield)
      : data;

    if (comparedCountries.length === 0) return [];

    return comparedCountries.map((code, i) => {
      const countryData = sourceData
        .filter((d) => d.country_code === code)
        .sort((a, b) => a.year - b.year);

      // Calculate values based on view mode
      let values;
      if (viewMode === 'growth') {
        // Calculate year-over-year growth rate (%)
        values = countryData.map((d, idx) => {
          if (idx === 0) {
            return { year: d.year, value: 0 }; // First year has no growth rate
          }
          const prevPapers = countryData[idx - 1].papers;
          const growthRate = prevPapers > 0 
            ? ((d.papers - prevPapers) / prevPapers) * 100 
            : 0;
          return { year: d.year, value: growthRate };
        });
      } else {
        values = countryData.map((d) => ({ year: d.year, value: d.papers }));
      }

      return {
        code,
        name: countryData[0]?.country || code,
        color: COUNTRY_COLORS[i % COUNTRY_COLORS.length],
        values,
      };
    });
  }, [data, subfieldData, comparedCountries, selectedSubfield, viewMode]);

  useEffect(() => {
    const container = svgRef.current?.parentElement;
    if (!container) return;
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setDimensions({ width, height });
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!svgRef.current || !timeSeriesData.length) return;

    const svg = d3.select(svgRef.current);
    const { width, height } = dimensions;

    svg.selectAll('*').remove();

    const margin = { top: 20, right: 100, bottom: 35, left: 55 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const xScale = d3.scaleLinear().domain([2010, 2025]).range([0, innerWidth]);
    
    // For growth mode, filter out first year (no growth rate) for domain calculation
    const allValues = timeSeriesData.flatMap((d) => 
      viewMode === 'growth' 
        ? d.values.filter(v => v.year > 2010).map((v) => v.value)
        : d.values.map((v) => v.value)
    );
    
    let yMin, yMax;
    if (viewMode === 'growth') {
      yMin = Math.min(0, d3.min(allValues) || 0);
      yMax = d3.max(allValues) || 50;
      // Add padding
      const padding = (yMax - yMin) * 0.1;
      yMin = yMin - padding;
      yMax = yMax + padding;
    } else {
      yMin = 0;
      yMax = (d3.max(allValues) || 1) * 1.1;
    }
    
    const yScale = d3.scaleLinear().domain([yMin, yMax]).range([innerHeight, 0]).nice();

    // Grid
    g.append('g').attr('class', 'grid')
      .selectAll('line').data(yScale.ticks(5)).join('line')
      .attr('x1', 0).attr('x2', innerWidth)
      .attr('y1', d => yScale(d)).attr('y2', d => yScale(d))
      .attr('stroke', '#1e2a45').attr('stroke-dasharray', '2,4');

    // Zero line for growth mode
    if (viewMode === 'growth' && yMin < 0) {
      g.append('line')
        .attr('x1', 0).attr('x2', innerWidth)
        .attr('y1', yScale(0)).attr('y2', yScale(0))
        .attr('stroke', '#64748b').attr('stroke-width', 1);
    }

    // X Axis
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale).tickFormat(d3.format('d')).ticks(8))
      .attr('class', 'axis-tick')
      .select('.domain').attr('stroke', '#1e2a45');

    // Y Axis
    g.append('g')
      .call(d3.axisLeft(yScale).ticks(5).tickFormat(d => {
        if (viewMode === 'growth') {
          return `${d.toFixed(0)}%`;
        }
        if (d >= 1000000) return `${d / 1000000}M`;
        if (d >= 1000) return `${d / 1000}K`;
        return d;
      }))
      .attr('class', 'axis-tick')
      .select('.domain').attr('stroke', '#1e2a45');

    g.append('text')
      .attr('class', 'axis-label')
      .attr('transform', 'rotate(-90)')
      .attr('x', -innerHeight / 2)
      .attr('y', -40)
      .attr('text-anchor', 'middle')
      .text(viewMode === 'growth' ? 'YoY Growth Rate' : 'Papers');

    const line = d3.line()
      .x(d => xScale(d.year))
      .y(d => yScale(d.value))
      .defined(d => viewMode !== 'growth' || d.year > 2010) // Skip first year in growth mode
      .curve(d3.curveMonotoneX);

    // Lines and dots
    timeSeriesData.forEach((series, i) => {
      const isHighlighted = series.code === selectedCountry;
      
      // Filter values for growth mode (skip first year)
      const displayValues = viewMode === 'growth' 
        ? series.values.filter(v => v.year > 2010)
        : series.values;

      g.append('path')
        .datum(displayValues)
        .attr('d', line)
        .attr('stroke', series.color)
        .attr('stroke-opacity', isHighlighted ? 1 : 0.8)
        .attr('stroke-width', isHighlighted ? 3 : 2)
        .attr('fill', 'none');

      g.selectAll(`.dot-${i}`)
        .data(displayValues)
        .join('circle')
        .attr('cx', d => xScale(d.year))
        .attr('cy', d => yScale(d.value))
        .attr('r', isHighlighted ? 4 : 3)
        .attr('fill', series.color)
        .attr('stroke', '#0a0e1a')
        .attr('stroke-width', 1)
        .style('cursor', 'pointer')
        .on('click', () => onCountrySelect(series.code));
    });

    // Current year indicator line
    if (selectedYear >= 2010 && selectedYear <= 2025) {
      g.append('line')
        .attr('x1', xScale(selectedYear))
        .attr('x2', xScale(selectedYear))
        .attr('y1', 0)
        .attr('y2', innerHeight)
        .attr('stroke', '#f472b6')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '4,4')
        .attr('opacity', 0.8);
      
      // Year label
      g.append('text')
        .attr('x', xScale(selectedYear))
        .attr('y', -5)
        .attr('text-anchor', 'middle')
        .attr('fill', '#f472b6')
        .attr('font-size', 11)
        .attr('font-weight', 600)
        .attr('font-family', 'JetBrains Mono, monospace')
        .text(selectedYear);
      
      // Value labels at current year (skip 2010 in growth mode)
      if (viewMode !== 'growth' || selectedYear > 2010) {
        timeSeriesData.forEach(series => {
          const yearPoint = series.values.find(v => v.year === selectedYear);
          if (yearPoint && (viewMode !== 'growth' || selectedYear > 2010)) {
            g.append('circle')
              .attr('cx', xScale(selectedYear))
              .attr('cy', yScale(yearPoint.value))
              .attr('r', 6)
              .attr('fill', series.color)
              .attr('stroke', '#fff')
              .attr('stroke-width', 2);
          }
        });
      }
    }

    // Legend
    const legend = g.append('g').attr('transform', `translate(${innerWidth + 10}, 0)`);

    timeSeriesData.forEach((series, i) => {
      const isHighlighted = series.code === selectedCountry;
      const legendItem = legend.append('g')
        .attr('transform', `translate(0, ${i * 22})`)
        .style('cursor', 'pointer')
        .on('click', () => onCountrySelect(series.code));

      legendItem.append('rect')
        .attr('width', 12).attr('height', 12).attr('rx', 2)
        .attr('fill', series.color)
        .attr('opacity', isHighlighted ? 1 : 0.8);

      legendItem.append('text')
        .attr('x', 16).attr('y', 10)
        .attr('fill', isHighlighted ? '#e2e8f0' : '#94a3b8')
        .attr('font-size', 11)
        .attr('font-weight', isHighlighted ? 600 : 400)
        .attr('font-family', 'Space Grotesk, sans-serif')
        .text(series.name.length > 10 ? series.name.slice(0, 10) + '…' : series.name);
    });

  }, [timeSeriesData, dimensions, selectedCountry, selectedYear, onCountrySelect, viewMode]);

  if (!timeSeriesData.length) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-viz-muted text-sm">
        <svg className="w-12 h-12 mb-3 opacity-30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M3 3v18h18" />
          <path d="M7 16l4-4 4 4 5-6" />
        </svg>
        <p>Click countries on the map to compare trends</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <svg ref={svgRef} width={dimensions.width} height={dimensions.height} className="w-full h-full" />
    </div>
  );
}