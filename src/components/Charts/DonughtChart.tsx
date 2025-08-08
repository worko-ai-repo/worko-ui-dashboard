import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { CorporateHomePieChartDataDto } from '@Interfaces/CorporateHomeDto';

/**
 * Props interface for the DonutChart component
 * @interface PolarAreaChartProps
 */
interface PolarAreaChartProps {
  /** Array of data objects containing value, color, and other properties for each chart segment */
  data: CorporateHomePieChartDataDto[];
  /** Optional width of the SVG canvas (defaults to 200px) */
  width?: number;
  /** Optional height of the SVG canvas (defaults to 200px) */
  height?: number;
}

/**
 * DonutChart Component - Creates a polar area chart (also called rose chart) with donut-style center
 * 
 * This component creates a chart where:
 * - All segments have equal angles (360° divided by number of data points)
 * - The radius of each segment varies based on the data value (polar area style)
 * - Includes 3D gradient effects, animations, and hover interactions
 * - Has a hollow center like a donut chart
 * 
 * @param {PolarAreaChartProps} props - Component props
 * @returns {JSX.Element} SVG-based donut/polar area chart
 */
export const DonutChart: React.FC<PolarAreaChartProps> = ({ 
  data, 
  width = 200, 
  height = 200 
}) => {
  // Reference to the SVG element for D3 manipulation
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    // Early return if no SVG element or no data to prevent errors
    if (!svgRef.current || !data.length) return;

    // Select the SVG element and clear any existing content
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // CHART DIMENSIONS AND SCALING
    // Calculate the maximum radius that fits within the canvas
    const radius = Math.min(width, height) / 2;
    // Inner radius creates the "donut hole" (20% of total radius)
    const innerRadius = radius * 0.3;
    
    // Create a scale that maps data values to radial distances
    // This makes segments with higher values extend further from center
    const maxValue = d3.max(data, (d: CorporateHomePieChartDataDto) => d.value) || 1;
    const radiusScale = d3.scaleLinear()
      .domain([0, maxValue]) // Input range: 0 to maximum data value
      .range([innerRadius, radius * 0.8]); // Output range: inner radius to 80% of total radius

    // Create a group element and center it in the middle of the SVG
    const g = svg.append('g')
      .attr('transform', `translate(${width/2},${height/2})`);

    // SEGMENT CREATION
    // Calculate equal angles for each segment (polar area chart style)
    const anglePerSegment = (2 * Math.PI) / data.length;
    
    // Create each segment of the chart
    data.forEach((dataPoint, index) => {
      // Calculate start and end angles for this segment
      const startAngle = index * anglePerSegment;
      const endAngle = (index + 1) * anglePerSegment;
      
      // Calculate outer radius based on data value using our scale
      const outerRadius = radiusScale(dataPoint.value);
      
      // Create D3 arc generator with calculated dimensions
      const arc = d3.arc()
        .innerRadius(innerRadius) // Constant inner radius for donut hole
        .outerRadius(outerRadius) // Variable outer radius based on data
        .startAngle(startAngle)
        .endAngle(endAngle)
        .cornerRadius(2); // Slightly rounded corners for modern look

      // 3D GRADIENT EFFECT CREATION
      // Create unique gradient ID for this segment
      const gradientId = `gradient-${index}`;
      const gradient = svg.append('defs')
        .append('radialGradient')
        .attr('id', gradientId)
        .attr('cx', '30%') // Offset center to create 3D lighting effect
        .attr('cy', '30%');
      
      // Light color at center (simulates light source)
      gradient.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', d3.color(dataPoint.color)?.brighter(0.3)?.toString() || dataPoint.color);
      
      // Darker color at edges (simulates shadow)
      gradient.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', d3.color(dataPoint.color)?.darker(0.2)?.toString() || dataPoint.color);

      // MAIN SEGMENT PATH CREATION
      const path = g.append('path')
        .attr('d', arc as any) // Generate path data from arc
        .attr('fill', `url(#${gradientId})`) // Apply gradient fill
        .attr('stroke', 'white') // White border between segments
        .attr('stroke-width', 0)
        .style('opacity', 0.9) // Slightly transparent for modern look
        .style('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'); // Subtle shadow

      // GROWTH ANIMATION
      // Animate each segment growing from center outward
      path
        .transition()
        .duration(800) // Animation duration
        .delay(index * 200) // Stagger animations for each segment
        .attrTween('d', function() {
          // Interpolate from inner radius to final outer radius
          const interpolateOuter = d3.interpolate(innerRadius, outerRadius);
          return function(t: number) {
            // Create arc with current interpolated radius
            const currentArc = d3.arc()
              .innerRadius(innerRadius)
              .outerRadius(interpolateOuter(t)+30) // Animated outer radius
              .startAngle(startAngle)
              .endAngle(endAngle)
              .cornerRadius(2);
            return currentArc(null as any) || '';
          };
        });

      // HOVER INTERACTIONS
      path
        .on('mouseover', function(this: SVGPathElement) {
          // On hover: make segment fully opaque, slightly larger, and change cursor to pointer
          d3.select(this)
        .transition()
        .duration(200)
        .style('opacity', 1)
        .attr('transform', 'scale(1.1)')
        .style('cursor', 'pointer');
        })
        .on('mouseout', function(this: SVGPathElement) {
          // On mouse leave: return to original state
          d3.select(this)
            .transition()
            .duration(200)
            .style('opacity', 0.9)
            .attr('transform', 'scale(1)');
        });

      // INNER SHADOW EFFECT
      // Create a subtle inner shadow near the donut hole for depth
      const innerShadowArc = d3.arc()
        .innerRadius(innerRadius)
        .outerRadius(innerRadius + 18) // Small band just outside inner radius
        .startAngle(startAngle)
        .endAngle(endAngle);

      g.append('path')
        .attr('d', innerShadowArc as any)
        .attr('fill', d3.color(dataPoint.color)?.darker(0.9)?.toString() || dataPoint.color)
        .style('opacity', 0.3) // Start more visible
        .transition()
        .duration(800)
        .delay(index * 200)
        .style('opacity', 0.2); // Fade to subtle
    });

    // CENTER CIRCLE (DONUT HOLE)
    // Create the white center circle that makes this a "donut" chart
    g.append('circle')
      .attr('r', 0) // Start with radius 0
      .attr('fill', '#f8fafc') // Light gray background
      .attr('stroke', '#e2e8f0') // Subtle border
      .attr('stroke-width', 1)
      .transition()
      .duration(600) // Animate circle growing
      .delay(400) // Start after some segments have appeared
      .attr('r', innerRadius); // Grow to full inner radius

  }, [data, width, height]); // Re-run effect when props change

  return (
    <svg 
      ref={svgRef} 
      width={width} 
      height={height}
      className="overflow-visible" // Allow drop shadows to show outside SVG bounds
    />
  );
};