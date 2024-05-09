import logo from './night-background.jpg';
import './App.css';
import * as d3 from 'd3';
import React, { useState, useEffect } from 'react';

// add transitions to the plots (scatterplot, histogram, piechart, treemap, pcp)

function App() {

  const [minRa, setMinRa] = useState();
  const [maxRa, setMaxRa] = useState();
  const [minDec, setMinDec] = useState();
  const [maxDec, setMaxDec] = useState();

  const [histogramData, setHistogramData] = useState([]);
  const [piechartData, setPieChartData] = useState([]);
  const [treemapData, setTreemapData] = useState([]);

  const [gapSize, setGapSize] = useState(0);

  const handleSliderChange = (event) => {
    // console.log(Number(event.target.value));
    setGapSize(Number(event.target.value));
  };

  useEffect(() => {
    drawScatterplot();
    drawHistogram();
    drawPieChart();
    createTreemap();
    fetchParallelCoordinatesData();
  }, [minRa, maxRa, minDec, maxDec, histogramData, piechartData, gapSize, treemapData]);

  async function drawScatterplot() {

    const response = await fetch('http://127.0.0.1:5000/get_star_explanets_scatterplot', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        "min_ra": minRa,
        "max_ra": maxRa,
        "min_dec": minDec,
        "max_dec": maxDec,
        "disc_year": histogramData,
        "discoverymethod": piechartData,
        "disc_facility": treemapData
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    const margin = {top:20, right: 20, bottom: 20, left: 0};

    
    
    // Select the SVG
    const svg = d3.select("#scatterplot-data").style("background-color", "white");
    
    //remove all elements from the svg
    svg.selectAll("*").remove();
    
    const width = +svg.attr("width") - margin.left - margin.right;
    const height = +svg.attr("height") - margin.top - margin.bottom,
    g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    g.append("rect").attr("width", width).attr("height", height).attr("fill", "white");
    // Create scales
    const xScale = d3.scaleLinear()
    .domain([d3.min(data.exoplanets, d => d.ra), d3.max(data.exoplanets, d => d.ra)])
    .range([30, width]);
    const yScale = d3.scaleLinear()
    .domain([d3.min(data.exoplanets, d => d.dec), d3.max(data.exoplanets, d => d.dec)])
    .range([height, 0]);

    // Create circles for exoplanets
    // Define a color scale
    var color = d3.scaleSequential()
      .domain(d3.extent(data.exoplanets, d => d.cluster))
      .interpolator(d3.interpolateRainbow);

    svg.selectAll(".exoplanet")
      .data(data.exoplanets)
      .join("circle")
      .attr("class", "exoplanet")
      .attr("cx", d => xScale(d.ra))
      .attr("cy", d => yScale(d.dec))
      .attr("r", 1)
      .attr("fill", d => color(d.cluster));

    // Create circles for stars
    // svg.selectAll(".star")
    //     .data(data.stars)
    //     .join("circle")
    //     .attr("class", "star")
    //     .attr("cx", d => xScale(d.ra))
    //     .attr("cy", d => yScale(d.dec))
    //     .attr("r", 1)
    //     .attr("fill", "red");

    // Create axes
    const xAxis = d3.axisBottom(xScale);

    svg.append("g")
      .attr("transform", "translate(0, 310)")
      .call(xAxis);

    const yAxis = d3.axisLeft(yScale);

    svg.append("g")
      .attr("transform", "translate(30, 0)")
      .call(yAxis);

    // Create legend
    const legend = svg.append("g")
      .attr("transform", "translate(400, 20)");

    // Append a white rectangle to the legend
    // legend.append("rect")
    //   .attr("width", 90)
    //   .attr("height", 40)
    //   .attr("fill", "white")
    //   .attr("stroke", "black")
    //   .attr("stroke-width", 1);


    // legend.append("circle")
    //   .attr("cx", 10)
    //   .attr("cy", 10)
    //   .attr("r", 5)
    //   .attr("fill", "blue");

    // legend.append("text")
    //   .attr("x", 15)
    //   .attr("y", 15)
    //   .text("Exoplanets");

    // legend.append("circle")
    //   .attr("cx", 10)
    //   .attr("cy", 25)
    //   .attr("r", 5)
    //   .attr("fill", "red");

    // legend.append("text")
    //   .attr("x", 15)
    //   .attr("y", 30)
    //   .text("Stars");
    
    // Create a brush
    const brush = d3.brush()
      .extent([[0, 0], [width, height]])
      .on("start brush end", brushed);

    // Append the brush to the SVG
    svg.append("g")
      .attr("class", "brush")
      .call(brush);

    // Define the brushed function
    function brushed(event) {
      const selection = event.selection;
      if (event.type === "end") {
        const selection = event.selection;
        if (selection) {
          setMinRa(xScale.invert(selection[0][0]));
          setMaxRa(xScale.invert(selection[1][0]));
          setMinDec(yScale.invert(selection[1][1]));
          setMaxDec(yScale.invert(selection[0][1]));
        }
        console.log(minRa, maxRa, minDec, maxDec);
      }
      svg.selectAll("circle")
        .style("fill", function(d) {
          const cx = xScale(d?.ra),
                cy = yScale(d?.dec);
        return (selection && selection[0][0] <= cx && cx <= selection[1][0]
            && selection[0][1] <= cy && cy <= selection[1][1])
            ? "red" : "blue";
        });
    }

    // Append the axis names
    svg.append("text")
      .attr("x", 250)
      .attr("y", 340)
      .text("RA");
    
    svg.append("text")
      .attr("x", 10)
      .attr("y", 150)
      .text("Dec")
      .attr("transform", "rotate(-90, 10, 150)");

  }

  async function drawHistogram() {
    // Fetch the data
    const response = await fetch('http://127.0.0.1:5000/get_year_of_discovery', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        "min_ra": minRa,
        "max_ra": maxRa,
        "min_dec": minDec,
        "max_dec": maxDec,
        "disc_year": histogramData,
        "discoverymethod": piechartData,
        "disc_facility": treemapData
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
  
    // Select the SVG and set the dimensions
    const svg = d3.select("#disc-year-data").style("background-color", "white");
    svg.selectAll("*").remove();

    const margin = {top: 20, right: 20, bottom: 30, left: 40};
    const width = +svg.attr("width") - margin.left - margin.right;
    const height = +svg.attr("height") - margin.top - margin.bottom;

    // Create the histogram data
    const histogram = d3.histogram()
      .value(d => d)
      .domain([d3.min(data.disc_year), d3.max(data.disc_year)])
      .thresholds(d3.range(d3.min(data.disc_year), d3.max(data.disc_year) + 1));

    let bins = histogram(data.disc_year);

    // If there's only one bin, adjust its x0 and x1 values to ensure it has a non-zero width
    if (bins.length === 1) {
      bins[0].x0 -= 0.5;
      bins[0].x1 += 0.5;
    }
    // Create the scales
    const xScale = d3.scaleLinear()
      .domain([d3.min(data.disc_year), d3.max(data.disc_year)])
      .range([0, width]);
    const yScale = d3.scaleLinear()
      .domain([0, d3.max(bins, d => d.length)])
      .range([height, 0]);
  
    // Append a group element to the SVG
    const g = svg.append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
  
    const tooltip = d3.select("body").append("div")
      .style("position", "absolute")
      .style("z-index", "10")
      .style("visibility", "hidden")
      .style("color", "red")
      .text("a simple tooltip");

    // Draw the bars
    g.selectAll("rect")
      .data(bins)
      .enter().append("rect")
      .attr("x", d => xScale(d.x0))
      .attr("y", height)
      .attr("width", d => xScale(d.x1) - xScale(d.x0) - 1)
      .attr("height", 0)
      .on("mouseover", function(event, d) {
        d3.select(this).attr("fill", "orange");
        tooltip.text(`Value: ${d[0]}\nCount: ${d.length}`); // Set the text of the tooltip
        tooltip.style("visibility", "visible");
      })
      .on("mousemove", function(event) {
        tooltip.style("top", (event.pageY-10)+"px").style("left",(event.pageX+10)+"px");
      })
      .on("mouseout", function(event, d) {
        d3.select(this).attr("fill",  d => histogramData.includes(d[0]) ? "red" : "steelblue");
        tooltip.style("visibility", "hidden"); // Hide the tooltip
      })
      .attr("fill", d => histogramData.includes(d[0]) ? "red" : "steelblue")
      .on("click", function(event, d) {
        setHistogramData(oldData => {
          const value = d[0];
          const index = oldData.indexOf(value);

          if (index === -1) {
            // If the value is not in the array, add it
            return [...oldData, value];
          } else {
            // If the value is in the array, remove it
            return oldData.filter((_, i) => i !== index);
          }
        });
        tooltip.style("visibility", "hidden"); // Hide the tooltip

      })
      .transition()
      .duration(500)
      .attr("y", d =>yScale(d.length))
      .attr("height", d => height - yScale(d.length));
  
    // Draw the axes
    g.append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(xScale).tickFormat(d3.format("")));
    g.append("g")
      .call(d3.axisLeft(yScale));
  }

  async function drawPieChart() {
    // Fetch the data
    const response = await fetch('http://127.0.0.1:5000/get_discovery_method', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        "min_ra": minRa,
        "max_ra": maxRa,
        "min_dec": minDec,
        "max_dec": maxDec,
        "disc_year": histogramData,
        "discoverymethod": piechartData,
        "disc_facility": treemapData
      }),
    });
    const data = await response.json();

    // Convert the data to an array of objects
    const dataArray = Object.entries(data.discoverymethod).map(([method, count]) => ({method, count}));
    dataArray.sort((a, b) => b.count - a.count);
    // Select the SVG and set the dimensions
    const svg = d3.select("#disc-method-data").style("background-color", "white");
    svg.selectAll("*").remove();
    const width = +svg.attr("width");
    const height = +svg.attr("height");
    const radius = Math.min(width, height) / 2;

    // Create a color scale
    const color = d3.scaleOrdinal(d3.schemeCategory10);

    // Create the pie chart data
    const pie = d3.pie().value(d => d.count).sort(null).padAngle(gapSize);
    const pieData = pie(dataArray);

    // Append a group element to the SVG
    const g = svg.append("g")
      .attr("transform", "translate(" + width / 3.2 + "," + height / 2 + ")");

    // Create an arc generator
    const arc = d3.arc()
      .innerRadius(radius / 2)
      .outerRadius(radius);

    const tooltip = d3.select("body").append("div")
      .style("position", "absolute")
      .style("z-index", "10")
      .style("visibility", "hidden")
      .style("color", "red")
      .text("a simple tooltip");

    // Draw the arcs
    g.selectAll("path")
      .data(pieData)
      .enter().append("path")
      .attr("d", arc)
      .attr("fill", (d, i) => piechartData.includes(d.data.method) ? "red" : color(d.data.count))
      .on("mouseover", function(event, d) {
        d3.select(this).attr("fill", "orange");
        tooltip.text(`Method: ${d.data.method}\nValue: ${d.data.count}`); // Set the text of the tooltip
        tooltip.style("visibility", "visible"); // Make the tooltip visible
      })
      .on("mousemove", function(event) {
        tooltip.style("top", (event.pageY-10)+"px").style("left",(event.pageX+10)+"px");
      })
      .on("mouseout", function(event, d) {
        d3.select(this).attr("fill", (d, i) => piechartData.includes(d.data.method) ? "red" : color(d.data.count));
        tooltip.style("visibility", "hidden"); // Hide the tooltip
      })
      .on("click", function(event, d) {
        setPieChartData(oldData => {
          const value = d.data;
          const index = oldData.findIndex(data => data === value.method);

          if (index === -1) {
            // If the value is not in the array, add it
            return [...oldData, value.method];
          } else {
            // If the value is in the array, remove it
            return oldData.filter((_, i) => i !== index);
          }
        });
        tooltip.style("visibility", "hidden"); // Hide the tooltip
      })
      .transition()
      .duration(1000)
      .attr("fill", (d, i) => piechartData.includes(d.data.method) ? "red" : color(d.data.count));
    
    // Create a legend
    const legend = svg.append("g")
      .attr("transform", "translate(370, 20)");

    // Append a white rectangle to the legend
    legend.append("rect")
      .attr("width", 228)
      .attr("height", 200)
      .attr("fill", "white")
      .attr("stroke", "black")
      .attr("stroke-width", 1);

    // Append the legend text
    // Sort dataArray in descending order based on count
    dataArray.sort((a, b) => b.count - a.count);

    legend.selectAll("text")
      .data(dataArray)
      .enter().append("text")
      .attr("x", 15)
      .attr("y", (d, i) => 15 + i * 15)
      .text(d => d.method);

    // Append the legend color
    legend.selectAll("circle")
    .data(dataArray)
    .enter().append("circle")
    .attr("cx", 10)
    .attr("cy", (d, i) => 10 + i * 15)
    .attr("r", 5)
    .attr("fill", (d, i) => {
      return piechartData.includes(d.method) ? "red" : color(i);
    })
    .on("mouseover", function(event, d) {
      d3.select(this).attr("fill", "orange");
      tooltip.text(`Method: ${d.method}\nValue: ${d.count}`); // Set the text of the tooltip
      tooltip.style("visibility", "visible"); // Make the tooltip visible
    })
    .on("mousemove", function(event) {
      tooltip.style("top", (event.pageY-10)+"px").style("right",(event.pageX-10)+"px");
    })
    .on("mouseout", function(event, d) {
      d3.select(this).attr("fill", piechartData.includes(d.method) ? "red" : color(d.count));
      tooltip.style("visibility", "hidden"); // Hide the tooltip
    })
    .on("click", function(event, d) {
      setPieChartData(oldData => {
        const value = d.method;
        const index = oldData.findIndex(data => data === value);

        if (index === -1) {
          // If the value is not in the array, add it
          return [...oldData, value];
        } else {
          // If the value is in the array, remove it
          return oldData.filter((_, i) => i !== index);
        }
      });
      tooltip.style("visibility", "hidden"); // Hide the tooltip
    });

  }

  async function createTreemap() {
    const response = await fetch('http://127.0.0.1:5000/get_treemap_data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        "min_ra": minRa,
        "max_ra": maxRa,
        "min_dec": minDec,
        "max_dec": maxDec,
        "disc_year": histogramData,
        "discoverymethod": piechartData,
        "disc_facility": treemapData
      }),
    });
  
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  
    const data = await response.json();

    const svg = d3.select("#treemap").style("background-color", "white");
    svg.selectAll("*").remove();

    const width = +svg.attr("width");
    const height = +svg.attr("height");
    
    const discFacilityData = Object.entries(data.disc_facility).map(([name, value]) => ({name, value}));

    const root = d3.hierarchy({children: discFacilityData})
      .sum(d => d.value)
      .sort((a, b) => b.value - a.value);

    d3.treemap()
      .size([width, height])
      .padding(1)
      (root);

    const g = svg.selectAll(".node")
      .data(root.leaves())
      .enter().append("g")
      .attr("transform", d => `translate(${d.x0},${d.y0})`);

    const color = d3.scaleOrdinal(d3.schemeCategory10);

    const tooltip = d3.select("body").append("div")
    .style("position", "absolute")
    .style("z-index", "10")
    .style("visibility", "hidden")
    .style("color", "white")
    .text("a simple tooltip");

    g.append("rect")
      .attr("width", d => d.x1 - d.x0)
      .attr("height", d => d.y1 - d.y0)
      // .attr("fill", d => color(d.data.value))
      .attr("fill", "white")
      .on("mouseover", function(event, d) {
        tooltip.text(`Name: ${d.data.name}\nValue: ${d.data.value}`); // Set the text of the tooltip
        tooltip.style("visibility", "visible"); // Make the tooltip visible
      })
      .on("mousemove", function(event) {
        tooltip.style("top", (event.pageY-10)+"px").style("left",(event.pageX+10)+"px");
      })
      .on("mouseout", function(event, d) {
        tooltip.style("visibility", "hidden"); // Hide the tooltip
      })
      .on("click", function(d) {
        setTreemapData(oldData => {
          // console.log('d:', d);  // Log the value of d
          const value = d.target.__data__.data.name;
          // console.log('value:', value);  // Log the value of d.name
          // console.log('oldData:', oldData);  // Log the current state
          const index = oldData.findIndex(data => data === value);

          if (index === -1) {
            // If the value is not in the array, add it
            return [...oldData, value];
          } else {
            // If the value is in the array, remove it
            return oldData.filter((_, i) => i !== index);
          }
        })
        tooltip.style("visibility", "hidden"); // Hide the tooltip
      })
      .transition()
      .duration(500)
      .attr("fill", (d, i) => treemapData.includes(d.data.name) ? "red" : color(d.data.value));

    var fontSizeScale = d3.scaleLinear()
      .domain([d3.min(discFacilityData, d => d.value), d3.max(discFacilityData, d => d.value)])
      .range([10, 20]);
    
    g.append("text")
      .attr("x", 3)
      .attr("y", d => fontSizeScale(d.data.value))  
      .style("font-size", d => fontSizeScale(d.data.value) + "px")
      .text(d => d.data.name);

    g.append("text")
      .attr("x", 3)
      .attr("y", d => 2 * fontSizeScale(d.data.value))  
      .style("font-size", d => fontSizeScale(d.data.value) + "px")
      .text(d => d.data.value);
  }

  async function fetchParallelCoordinatesData() {
    const response = await fetch('http://127.0.0.1:5000/get_pcp_plot_data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        "min_ra": minRa,
        "max_ra": maxRa,
        "min_dec": minDec,
        "max_dec": maxDec,
        "disc_year": histogramData,
        "discoverymethod": piechartData,
        "disc_facility": treemapData
      }),
    });
  
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  
    const data = await response.json();
    console.log(data);
    const svg = d3.select("#pcp").style("background-color", "white");
    svg.selectAll("*").remove();

    const dimensions = Object.keys(data.data[0]);
    const color = d3.scaleOrdinal(d3.schemeCategory10);

    const margin = {top: 30, right: 30, bottom: 30, left: 30},
          width = 1000 - margin.left - margin.right,
          height = 350 - margin.top - margin.bottom;

    const x = d3.scalePoint().range([30, width]).domain(dimensions);
    const y = {};

    dimensions.forEach(dimension => {
      const isNumeric = data.data.every(d => !isNaN(d[dimension]));
      if (isNumeric) {
        y[dimension] = d3.scaleLinear()
          .domain(d3.extent(data.data, d => d[dimension]))
          .range([height, 50]);
      } else {
        const domain = Array.from(new Set(data.data.map(d => d[dimension]))); // Get unique values
        y[dimension] = d3.scalePoint()
          .domain(domain)
          .range([height, 50]);
      }
    });

    svg.attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);
    
    let dragging = {};
    let background = svg.append("g");
    let foreground = svg.append("g");
    let g = svg.selectAll(".dimension");

    function position(d) {
      let v = dragging[d];
      return v == null ? x(d) : v;
    }

    function transition(g) {
      return g.transition().duration(500);
    }

    let path = (d) => {
      if (d === undefined) {
        return;
      }

      return line(dimensions.map((p) => {
        if (!(p in d)) {
          console.error(`Data point does not have property '${p}'`);
          return [p, undefined];
        }

        return [p, d[p]];
      }));
    };
    
    const drag = d3.drag()
    .on("start", function(event, d) {
      dragging[d] = x(d);
      background.attr("visibility", "visible");
    })
    .on("drag", function(event, d) {
      dragging[d] = Math.min(width, Math.max(0, event.x));
      foreground.attr("d", path);
      dimensions.sort((a, b) => position(a) - position(b));
      x.domain(dimensions);
      svg.selectAll(".dimension").attr("transform", d => `translate(${position(d)})`);
      
      // Update the position of the lines according to the reordered dimensions
      svg.selectAll(".foreground path")
        .attr("d", function(d) {
          return path(dimensions.map(p => [p, d[p]]));
        });
  
      // Update axis positions
      svg.selectAll(".dimension .axis")
        .attr("transform", function(d) {
          const yCoord = y;
          return `translate(0, ${yCoord})`; // Maintain the y-coordinate
        });
  
      const overlap = dimensions.find((e, i) => i !== dimensions.indexOf(d) && position(e) === position(d));
      if (overlap) {
        const tempIndex = dimensions.indexOf(d);
        const overlapIndex = dimensions.indexOf(overlap);
        dimensions[tempIndex] = overlap;
        dimensions[overlapIndex] = d;
        x.domain(dimensions);
  
        svg.selectAll(".dimension")
          .data(dimensions)
          .transition()
          .duration(500)
          .attr("transform", d => `translate(${position(d)})`)
          .each(function(dimension) {
            d3.select(this).select(".axis")
              .transition()
              .duration(500)
              .call(d3.axisRight().scale(y[dimension]));
          });
  
        // Update the position of the lines according to the reordered dimensions
        svg.selectAll(".foreground path")
          .attr("d", function(d) {
            return path(dimensions.map(p => [p, d[p]]));
          });
      }
    })
    .on("end", function(event, d) {
      delete dragging[d];
      transition(d3.select(this)).attr("transform", `translate(${x(d)})`);
      transition(foreground)
        .attr("d", path)
        .transition()
        .duration(500);
      background
        .attr("d", path)
        .transition()
        .delay(500)
        .duration(500)
        .attr("visibility", null);
      svg.selectAll(".foreground path")
        .attr("d", d => path(d))
        .transition()
        .duration(500);
    });
  
    
    svg.selectAll(".dimension")
      .data(dimensions)
      .enter().append("g")
      .attr("class", "dimension")
      .attr("transform", d => `translate(${x(d)})`)
      .each(function(dimension) {
        d3.select(this).append("g")
          .attr("class", "axis")
          .each(function(d) { d3.select(this).call(d3.axisRight().scale(y[dimension])); })
          .append("text")
          .style("text-anchor", "middle")
          .attr("y", 20)
          .attr("fill", "black")
          .attr("transform", "rotate(0)")
          .text(dimension);
      })
      .call(drag);
    
    function line(d) {
      return d3.line()
        // .curve(d3.curveBasis) // Apply a basis spline
        .curve(d3.curveLinear)
        (d.map(([key, value]) => [x(key), y[key](value)]));
    }

    svg.append("g")
    .attr("class", "foreground")
    .selectAll("path")
    .data(data.data)
    .enter().append("path")
    .attr("d", d => line(dimensions.map(p => [p, d[p]])))
    .style("fill", "none")
    .style("stroke", (d, i) => color(data.cluster_ids[i]))
    .style("stroke-width", "1.5px");

    let extents = new Array(dimensions.length).fill([0, 0]);

    // Add brushing
    svg.selectAll(".dimension")
    .each(function(dimension) {
      d3.select(this).append("g")
        .attr("class", "brush")
        .each(function(d) { 
          d3.select(this).call(d3.brushY()
            .extent([[0, 0], [16, height]]) // Adjust extent
            .on("start", brushstart)
            .on("brush", brush)
            .on("end", brushend)
          ); 
        })
        .selectAll("rect")
        .attr("x", 8) // Adjust rect position
        .attr("width", 16);
    });

    function brushstart(event) {
    event.sourceEvent.stopPropagation();
    }

    // Handles a brush event, toggling the display of foreground lines.
    function brush(event) {
      // Store brushed extents for each dimension
      let brushedExtents = {};
      svg.selectAll(".dimension .brush")
        .filter(function(d) {
          return d3.brushSelection(this);
        })
        .each(function(d) {
          brushedExtents[d] = d3.brushSelection(this).map(y[d].invert);
        });
    
      // Function to check if a data point is within brushed extents
      function withinBrushedExtents(d) {
        return Object.entries(brushedExtents).every(([dimension, extent]) => {
          return extent[1] <= d[dimension] && d[dimension] <= extent[0];
        });
      }
    
      // Select lines passing through the brushed area
      let selectedLines = data.data.filter(withinBrushedExtents);
    
      // Clear existing foreground lines
      foreground.selectAll("path").remove();
    
      // Draw only the selected lines passing through the brushed area
      foreground.selectAll("path")
        .data(selectedLines)
        .enter().append("path")
        .attr("d", d => path(d))
        .style("fill", "none")
        .style("stroke", (d, i) => color(data.cluster_ids[i]))
        .style("stroke-width", "1.5px");
    
      // Hide the non-selected lines
      svg.selectAll(".foreground path")
        .filter(d => !selectedLines.includes(d))
        .remove();
    }    
    
    function brushend(event) {
    if (!event.selection) {
      svg.selectAll(".brush").call(d3.brushY().clear);
      brush(event);
    }
    }
  }


  function resetSelection() {
    console.log("Resetting selections");
    setMinRa();
    setMaxRa();
    setMinDec();
    setMaxDec();
    setHistogramData([]);
    setPieChartData([]);
    setGapSize(0);
    setTreemapData([]);
  }

  return (
    <div className="App">
      <header className="App-header">
        <div style={{
          backgroundImage: `url(${logo})`,
          backgroundPosition: 'center',
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
          height: '100vh',
          width: '100vw'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <h2 style={{ color: 'yellow' }}>StellarScope: ExoPlanets Data Visualization</h2>
            </div>
            <button onClick={resetSelection} style={{ position: 'absolute', right: 0 }}>Reset Selections</button>
          </div>
          <div className="grid-container" id="master" style={{ top: 0, zIndex: 1 }}>
            <div className="container" id="scatterplot-container">
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <h3 style={{ color: 'yellow' }}>ExoPlanets</h3>
                <svg id="scatterplot-data" width="500" height="350"></svg>
              </div>
            </div>

            <div className="container" id="disc-year-container">
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <h3 style={{ color: 'yellow' }}>Year of Discovery</h3>
                <svg id="disc-year-data" width="500" height="350"></svg>
              </div>
            </div>

            <div className="container" id="disc-method-container">
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <h3 style={{ color: 'yellow' }}>Discovery Method</h3>
                <div style={{position: 'relative'}}>
                  <svg id="disc-method-data" width="600" height="350"></svg>
                  <div style={{position: 'absolute', top: '300px', left: '300px'}}>
                    <label htmlFor="gap-slider" style={{color: 'black'}}>Gap between slices:</label>
                    <input type="range" id="gap-slider" min="0" max="0.1" step="0.01" value={gapSize} onChange={handleSliderChange} />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
            <div className="container" id="observatory" style={{ zIndex: 1, marginRight: '20px' }}>
              <h3 style={{color:'yellow', textAlign:'center'}}> Discovery Facility </h3>
              <svg id="treemap" width="700" height="350"></svg>
            </div>
            <div className="container" id="pcp-container" style={{ zIndex: 1 }}>
              <h3 style={{ color: 'yellow', textAlign: 'center' }}>Parallel Coordinate Plot</h3>
              <svg id="pcp" width="1000" height="350"></svg>
            </div>
          </div>
        </div>      
      </header>
    </div>
  );
}

export default App;
