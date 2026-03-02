import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { CorporateHomeChartDataDto } from '@Interfaces/CorporateHomeDto';

interface ChartData {
  year: string;
  value: number;
}


interface LineChartProps {
  data: CorporateHomeChartDataDto[];
  width?: number;
  height?: number;
}

export const BarChart: React.FC<LineChartProps> = ({ 
  data, 
  width = 350, 
  height = 180 
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Use positive margins so the chart fits within the given
    // width/height and all stages (x-axis labels) remain visible.
    const margin = { top: 20, right: 20, bottom: 40, left: 40 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    const xScale = d3.scalePoint()
      .domain(data.map(d => d.year))
      .range([0, innerWidth])
      .padding(0.1);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.value) || 0])
      .range([innerHeight, 0]);

    // Grid lines
    const yTicks = yScale.ticks(5);
    g.selectAll('.grid-line')
      .data(yTicks)
      .enter()
      .append('line')
      .attr('class', 'grid-line')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', d => yScale(d))
      .attr('y2', d => yScale(d))
      .attr('stroke', '#e2e8f0')
      .attr('stroke-width', 1);

    // Line generator
    const line = d3.line<ChartData>()
      .x(d => xScale(d.year) || 0)
      .y(d => yScale(d.value))
      .curve(d3.curveMonotoneX);

    // Add the line path
    const path = g.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', '#14B8A6')
      .attr('stroke-width', 3)
      .attr('d', line);

    // Animate the line
    const totalLength = path.node()?.getTotalLength() || 0;
    path
      .attr('stroke-dasharray', `${totalLength} ${totalLength}`)
      .attr('stroke-dashoffset', totalLength)
      .transition()
      .duration(1500)
      .ease(d3.easeLinear)
      .attr('stroke-dashoffset', 0);

    // Add dots
    g.selectAll('.dot')
      .data(data)
      .enter()
      .append('circle')
      .attr('class', 'dot')
      .attr('cx', d => xScale(d.year) || 0)
      .attr('cy', d => yScale(d.value))
      .attr('r', 0)
      .attr('fill', '#14B8A6')
      .transition()
      .delay(1000)
      .duration(500)
      .attr('r', 4);

    // Add hover effects
    g.selectAll('.dot')
      .on('mouseover', function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', 6)
          .attr('fill', '#0D9488')
          .style('cursor', 'pointer');
        
        // Tooltip
        const tooltip = g.append('g')
          .attr('class', 'tooltip')
          .attr('transform', `translate(${xScale((d as ChartData).year)},${yScale((d as ChartData).value) - 10})`);
        
        tooltip.append('rect')
          .attr('x', -20)
          .attr('y', -25)
          .attr('width', 40)
          .attr('height', 20)
          .attr('fill', '#1F2937')
          .attr('rx', 4);
        
        tooltip.append('text')
          .attr('text-anchor', 'middle')
          .attr('y', -10)
          .attr('fill', 'white')
          .attr('font-size', '12px')
          .text((d as ChartData).value);
      })
      .on('mouseout', function() {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', 4)
          .attr('fill', '#14B8A6');
        
        g.select('.tooltip').remove();
      });

    // X-axis
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale))
      .selectAll('text')
      .style('font-size', '12px')
      .style('fill', '#94A3B8')
      .style('font-family', 'Poppins');

    // Y-axis
    g.append('g')
      .call(d3.axisLeft(yScale).ticks(5))
      .selectAll('text')
      .style('font-size', '12px')
      .style('fill', '#94A3B8')
      .style('font-family', 'Poppins');

    // Style axes
    g.selectAll('.domain')
      .attr('stroke', '#e2e8f0');
    
    g.selectAll('.tick line')
      .attr('stroke', '#e2e8f0');

  }, [data, width, height]);

  return (
    <svg 
      ref={svgRef} 
      width={width} 
      height={height}
      className="overflow-visible  w-full h-full"
    />
  );
};