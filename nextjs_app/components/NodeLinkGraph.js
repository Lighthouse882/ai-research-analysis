'use client';

import { useRef, useEffect, useMemo, useState } from 'react';
import * as d3 from 'd3';

const FIELD_COLORS = {
  'Computer Vision': '#22d3ee',
  'Natural Language Processing': '#f472b6',
  'Robotics': '#4ade80',
  'Theory': '#fbbf24',
  'Reinforcement Learning': '#fbbf24',
};

export default function NodeLinkGraph({
  nodeLinkData,
  selectedCountry,
  selectedYear,
  selectedSubfield,
  onSubfieldSelect,
}) {
  const svgRef = useRef(null);
  const tooltipRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 500, height: 230 });
  const [expandedFields, setExpandedFields] = useState([]);

  // Get data for selected country AND year
  const graphData = useMemo(() => {
    if (!selectedCountry || !nodeLinkData || !nodeLinkData[selectedCountry]) {
      return { nodes: [], links: [] };
    }
    // New structure: nodeLinkData[country][year]
    const countryData = nodeLinkData[selectedCountry];
    if (countryData[String(selectedYear)]) {
      return countryData[String(selectedYear)];
    }
    // Fallback for old format (no year dimension)
    if (countryData.nodes) {
      return countryData;
    }
    return { nodes: [], links: [] };
  }, [nodeLinkData, selectedCountry, selectedYear]);

  // DEBUG: Log the actual data structure
  useEffect(() => {
    if (graphData.nodes.length > 0) {
      console.log('=== NODE DATA DEBUG ===');
      console.log('Total nodes:', graphData.nodes.length);
      console.log('Main nodes:', graphData.nodes.filter(n => n.type === 'main').map(n => n.id));
      console.log('Sub nodes sample:', graphData.nodes.filter(n => n.type === 'sub').slice(0, 3));
      console.log('All node types:', [...new Set(graphData.nodes.map(n => n.type))]);
      console.log('All parent values:', [...new Set(graphData.nodes.filter(n => n.parent).map(n => n.parent))]);
      console.log('Expanded fields:', expandedFields);
      
      if (expandedFields.length > 0) {
        const matching = graphData.nodes.filter(n => n.type === 'sub' && expandedFields.includes(n.parent));
        console.log('Matching sub nodes for expanded:', matching.length, matching.map(n => n.id));
      }
    }
  }, [graphData, expandedFields]);

  // Reset expanded fields when country changes (but NOT when year changes to preserve expand state)
  useEffect(() => {
    setExpandedFields([]);
  }, [selectedCountry]);
  
  // Debug: log when graphData changes
  useEffect(() => {
    if (graphData.nodes.length > 0) {
      const cvNode = graphData.nodes.find(n => n.id === 'Computer Vision');
      console.log(`Year ${selectedYear}: CV count = ${cvNode?.count}`);
    }
  }, [graphData, selectedYear]);

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
    if (!svgRef.current || !graphData.nodes.length) return;

    const svg = d3.select(svgRef.current);
    const { width, height } = dimensions;

    svg.selectAll('*').remove();

    // Create or get tooltip div
    let tooltip = d3.select(tooltipRef.current);
    if (tooltip.empty()) {
      tooltip = d3.select('body').append('div')
        .attr('class', 'node-tooltip')
        .style('position', 'absolute')
        .style('visibility', 'hidden')
        .style('background', 'rgba(10, 14, 26, 0.95)')
        .style('border', '1px solid #1e2a45')
        .style('border-radius', '4px')
        .style('padding', '6px 10px')
        .style('font-size', '11px')
        .style('color', '#e2e8f0')
        .style('pointer-events', 'none')
        .style('z-index', '1000');
    }

    const mainNodes = graphData.nodes.filter(n => n.type === 'main');
    const allSubNodes = graphData.nodes.filter(n => n.type === 'sub');
    const visibleSubNodes = allSubNodes.filter(n => expandedFields.includes(n.parent));
    
    console.log('RENDER: main=', mainNodes.length, 'sub=', visibleSubNodes.length, 'expanded=', expandedFields, 'year=', selectedYear);
    
    const visibleNodes = [...mainNodes, ...visibleSubNodes].map(n => ({ ...n }));
    const visibleLinks = graphData.links
      .filter(l => expandedFields.includes(l.source))
      .map(l => ({ ...l }));

    const g = svg.append('g');

    // Use ALL nodes for scale calculation (not just visible) for consistency
    const maxMainCount = d3.max(mainNodes, d => d.count) || 1;
    const maxSubCount = d3.max(allSubNodes, d => d.count) || 1;
    
    // Separate scales for main and sub nodes
    // Main nodes: larger range (25-55px radius)
    const mainSizeScale = d3.scaleSqrt().domain([0, maxMainCount]).range([25, 55]);
    // Sub nodes: smaller range (10-30px radius)  
    const subSizeScale = d3.scaleSqrt().domain([0, maxSubCount]).range([10, 30]);
    
    // Helper function to get node radius
    const getNodeRadius = (d) => {
      if (d.type === 'main') {
        return mainSizeScale(d.count);
      } else {
        return subSizeScale(d.count);
      }
    };

    const simulation = d3.forceSimulation(visibleNodes)
      .force('link', d3.forceLink(visibleLinks).id(d => d.id).distance(70).strength(0.6))
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(d => getNodeRadius(d) + 8));

    const link = g.selectAll('.link')
      .data(visibleLinks)
      .join('path')
      .attr('class', 'link')
      .attr('stroke', d => {
        const sourceId = typeof d.source === 'object' ? d.source.id : d.source;
        return FIELD_COLORS[sourceId] || '#1e2a45';
      })
      .attr('stroke-width', 1.5)
      .attr('stroke-opacity', 0.4)
      .attr('fill', 'none');

    const node = g.selectAll('.node')
      .data(visibleNodes)
      .join('g')
      .attr('class', 'node')
      .style('cursor', 'pointer')
      .call(d3.drag()
        .on('start', (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x; d.fy = d.y;
        })
        .on('drag', (event, d) => { d.fx = event.x; d.fy = event.y; })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null; d.fy = null;
        }));

    // Main node circles with tooltip
    node.filter(d => d.type === 'main').each(function(d) {
      const fieldId = d.id;
      const isExpanded = expandedFields.includes(fieldId);
      const radius = getNodeRadius(d);
      
      d3.select(this).append('circle')
        .attr('r', radius)
        .attr('fill', FIELD_COLORS[fieldId] || '#64748b')
        .attr('fill-opacity', isExpanded ? 1 : 0.7)
        .attr('stroke', isExpanded ? '#fff' : (FIELD_COLORS[fieldId] || '#64748b'))
        .attr('stroke-width', isExpanded ? 3 : 1.5)
        .on('click', (event) => {
          event.stopPropagation();
          console.log('CLICK on:', fieldId, 'current expanded:', expandedFields);
          setExpandedFields(prev => {
            const newState = prev.includes(fieldId) 
              ? prev.filter(f => f !== fieldId) 
              : [...prev, fieldId];
            console.log('NEW STATE:', newState);
            return newState;
          });
        })
        .on('mouseover', (event) => {
          tooltip
            .style('visibility', 'visible')
            .html(`<strong>${fieldId}</strong><br/>${d.count.toLocaleString()} papers<br/><span style="color:#94a3b8;font-size:10px">Click to ${isExpanded ? 'collapse' : 'expand'}</span>`);
        })
        .on('mousemove', (event) => {
          tooltip
            .style('top', (event.pageY - 35) + 'px')
            .style('left', (event.pageX + 10) + 'px');
        })
        .on('mouseout', () => {
          tooltip.style('visibility', 'hidden');
        });
    });

    // Sub node circles with tooltip
    node.filter(d => d.type === 'sub').each(function(d) {
      const nodeGroup = d3.select(this);
      const radius = getNodeRadius(d);
      
      // Add circle
      nodeGroup.append('circle')
        .attr('r', radius)
        .attr('fill', d3.color(FIELD_COLORS[d.parent] || '#64748b').brighter(0.6).toString())
        .attr('fill-opacity', d.id === selectedSubfield ? 1 : 0.7)
        .attr('stroke', d.id === selectedSubfield ? '#fff' : 'none')
        .attr('stroke-width', 2);
      
      // Add hover events to entire group
      nodeGroup
        .on('click', (event) => {
          event.stopPropagation();
          onSubfieldSelect(d.id);
        })
        .on('mouseover', (event) => {
          tooltip
            .style('visibility', 'visible')
            .html(`<strong>${d.id}</strong><br/>${d.count.toLocaleString()} papers`);
        })
        .on('mousemove', (event) => {
          tooltip
            .style('top', (event.pageY - 35) + 'px')
            .style('left', (event.pageX + 10) + 'px');
        })
        .on('mouseout', () => {
          tooltip.style('visibility', 'hidden');
        });
    });

    // Labels for main nodes (below circle)
    node.filter(d => d.type === 'main')
      .append('text')
      .attr('dy', d => getNodeRadius(d) + 12)
      .attr('text-anchor', 'middle')
      .attr('fill', '#e2e8f0')
      .attr('font-size', 9)
      .attr('pointer-events', 'none')
      .text(d => d.id === 'Natural Language Processing' ? 'NLP' : d.id === 'Reinforcement Learning' ? 'RL' : d.id);

    // Labels for sub nodes (name below)
    node.filter(d => d.type === 'sub')
      .append('text')
      .attr('dy', d => getNodeRadius(d) + 10)
      .attr('text-anchor', 'middle')
      .attr('fill', '#94a3b8')
      .attr('font-size', 7)
      .attr('pointer-events', 'none')
      .text(d => d.id.length > 12 ? d.id.slice(0, 11) + '…' : d.id);

    // Count labels for main nodes (inside circle)
    node.filter(d => d.type === 'main' && d.count > 0)
      .append('text')
      .attr('dy', 4)
      .attr('text-anchor', 'middle')
      .attr('fill', '#0a0e1a')
      .attr('font-size', d => Math.max(8, getNodeRadius(d) * 0.3))
      .attr('font-weight', 600)
      .attr('pointer-events', 'none')
      .text(d => d.count >= 1000 ? `${Math.round(d.count/1000)}K` : d.count);

    // Count labels for sub nodes (inside circle)
    node.filter(d => d.type === 'sub' && d.count > 0)
      .append('text')
      .attr('dy', 3)
      .attr('text-anchor', 'middle')
      .attr('fill', '#0a0e1a')
      .attr('font-size', d => Math.max(6, getNodeRadius(d) * 0.35))
      .attr('font-weight', 600)
      .attr('pointer-events', 'none')
      .text(d => d.count >= 1000 ? `${Math.round(d.count/1000)}K` : d.count);

    simulation.on('tick', () => {
      visibleNodes.forEach(d => {
        const r = getNodeRadius(d);
        d.x = Math.max(r + 5, Math.min(width - r - 5, d.x));
        d.y = Math.max(r + 5, Math.min(height - r - 25, d.y));
      });
      
      link.attr('d', d => {
        const sx = d.source.x, sy = d.source.y, tx = d.target.x, ty = d.target.y;
        return `M${sx},${sy}Q${(sx+tx)/2},${(sy+ty)/2 - 20} ${tx},${ty}`;
      });
      
      node.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    return () => simulation.stop();
  }, [graphData, dimensions, expandedFields, selectedSubfield, selectedYear, onSubfieldSelect]);

  // Calculate total papers for display
  const totalPapers = useMemo(() => {
    return graphData.nodes
      .filter(n => n.type === 'main')
      .reduce((sum, n) => sum + n.count, 0);
  }, [graphData]);

  if (!selectedCountry) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-viz-muted text-sm">
        <p>Select a country to explore</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      <svg ref={svgRef} width={dimensions.width} height={dimensions.height} className="w-full h-full" />
      <div ref={tooltipRef} />
      <div className="absolute top-1 right-2 text-[10px] text-viz-muted">
        {selectedYear} · {totalPapers.toLocaleString()} papers
      </div>
      <div className="absolute bottom-1 left-2 text-[9px] text-viz-muted/70">
        {expandedFields.length > 0 ? expandedFields.join(', ') : 'Click node to expand'}
      </div>
    </div>
  );
}