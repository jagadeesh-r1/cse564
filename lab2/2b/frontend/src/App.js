import './App.css';
import * as d3 from 'd3';
import React, { useState, useEffect } from 'react';


function App() {

  const [kmeansdata, setkmeansdata] = useState([]);
  const [selectedVariables, setSelectedVariables] = useState([]);


  useEffect(() => {
    kmeans_elbow();
    fetchMdsVariableData();
  }, []);
  useEffect(() => {
    // console.log(kmeansdata);
    fetchMdsData();
  }, [kmeansdata]);

  useEffect(() => {
    console.log(selectedVariables, "selectedVariables");
    fetchParallelCoordinatesData();
  }, [kmeansdata, selectedVariables]);

  async function kmeans_elbow() {
    const response = await fetch('http://127.0.0.1:5000/kmeans', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({'selectedBars': 'selectedBars'}),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    if (data.mse_errors) {
      const mse_errors = data.mse_errors;
      // console.log(mse_errors);
      const svg = d3.select("#kmeans");
      // remove the previous plot
      svg.selectAll("*").remove();

      const margin = {top: 20, right: 50, bottom: 100, left: 70};

      const width = +svg.attr("width") - margin.left - margin.right;
      const height = +svg.attr("height") - margin.top - margin.bottom,

      g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");
      
      const x = d3.scaleLinear()
      .range([1, width])
      .domain([1, 15]);

      const xAxis = d3.axisBottom(x)
        .tickSize(0)
        .tickPadding(10);

      g.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis)
        .selectAll("text")
        .attr("transform", "translate(" + width/mse_errors.length/2 + ",0)");

      const y = d3.scaleLinear()
      .range([height, 0])
      .domain([0, d3.max(mse_errors, d => d)]);
      // g.append("g")
      // .attr("transform", "translate(0," + height + ")")
      // .call(d3.axisBottom(x));
      g.append("g")
      .call(d3.axisLeft(y));
      // line chart
      const line = d3.line()
      .x((d, i) => x(i + 1))
      .y(d => y(d));

      g.append("path")
      .datum(mse_errors)
      .attr("fill", "none")
      .attr("stroke", "steelblue")
      .attr("stroke-linejoin", "round")
      .attr("stroke-linecap", "round")
      .attr("stroke-width", 1.5)
      .attr("d", line);

      let tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);
      
      // add bars to the plot
      g.selectAll(".bar")
        .data(mse_errors)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", (d, i) => x(i + 1) + 4)
        .attr("y", d => y(d))
        .attr("width", 20)
        .attr("height", d => height - y(d))
        // .attr("fill", (d, i) => i +2 === data.k ? "red" : "")
        .on("click", function(d, i) {
          // Color all bars with a value less than the clicked bar's value red
          // console.log(i);
          // console.log(data);
          d3.selectAll(".bar")
            .filter(data => data > i)
            .style("fill", "");

          // Reset the color of all bars with a value greater than or equal to the clicked bar's value
          d3.selectAll(".bar")
            .filter(data => data < i)
            .style("fill", ""); // Replace "" with the original color
          d3.selectAll(".bar")
            .filter(data => data === i)
            .style("fill", "yellow");
          // console.log('i:', i);
          // console.log('mse_errors:', mse_errors);
          setkmeansdata(mse_errors.map((data, index) => data === i ? index + 1 : -1).filter(index => index !== -1));
          // console.log(kmeansdata);
        })
        .on("mouseover", function(event, d) {
          tooltip.transition()
            .duration(200)
            .style("opacity", .9);
          const [x, y] = d3.pointer(event);
        })
        .on("mouseout", function(d) {
          tooltip.transition()
            .duration(500)
            .style("opacity", 0);
        });
      
      const barWidth = width / mse_errors.length;

      g.selectAll(".dot")
          .data(mse_errors)
          .enter().append("circle")
          .attr("class", "dot")
          .attr("cx", (d, i) => x(i + 1) + barWidth / 2 ) // Add an offset to the x position
          .attr("cy", d => y(d))
          .attr("r", 2.5)
          .attr("fill", "red")
          .on("mouseover", function(event, d) {
            tooltip.transition()
              .duration(200)
              .style("opacity", .9);
            const [x, y] = d3.pointer(event);
          })
          .on("mouseout", function(d) {
            tooltip.transition()
              .duration(500)
              .style("opacity", 0);
          });
      // Add x-axis label
      g.append("text")
        .attr("transform", "translate(" + (width / 2) + " ," + (height + margin.top + 20) + ")")
        .style("text-anchor", "middle")
        .style("fill", "white")
        .text("No of Clusters");

      // Add y-axis label
      g.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left)
        .attr("x", 0 - (height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .style("fill", "white")
        .text("MSE Error");
    }
  }

  async function fetchMdsData() {
    const response = await fetch('http://127.0.0.1:5000/mds_data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({'selectedBars': kmeansdata}),
    });
  
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  
    const data = await response.json();
    const svg = d3.select("#mds-data");
    // remove the previous plot
    svg.selectAll("*").remove();
    const margin = {top: 20, right: 20, bottom: 30, left: 40};
    const width = +svg.attr("width") - margin.left - margin.right;
    const height = +svg.attr("height") - margin.top - margin.bottom;

    const x = d3.scaleLinear().range([0, width]);
    const y = d3.scaleLinear().range([height, 0]);

    const color = d3.scaleOrdinal(d3.schemeCategory10);

    const g = svg.append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    x.domain(d3.extent(data.data, d => d[0]));
    y.domain(d3.extent(data.data, d => d[1]));

    g.append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x));

    g.append("g")
      .call(d3.axisLeft(y));

    g.selectAll(".dot")
      .data(data.data)
      .enter().append("circle")
      .attr("class", "dot")
      .attr("r", 3.5)
      .attr("cx", d => x(d[0]))
      .attr("cy", d => y(d[1]))
      .style("fill", (d, i) => color(data.cluster_ids[i]));

    // Add a box for the legend
    svg.append("rect")
      .attr("x", width - 100)
      .attr("y", 0)
      .attr("width", 100)
      .attr("height", color.domain().length * 20)
      .style("fill", "none")
      .style("stroke", "black");

    const legend = svg.selectAll(".legend")
      .data(color.domain())
      .enter().append("g")
      .attr("class", "legend")
      .attr("transform", (d, i) => "translate(0," + i * 20 + ")");

    legend.append("rect")
      .attr("x", width - 18)
      .attr("width", 18)
      .attr("height", 18)
      .style("fill", color);

    legend.append("text")
      .attr("x", width - 24)
      .attr("y", 9)
      .attr("dy", ".35em")
      .style("text-anchor", "end")
      .style("fill", "white")
      .style("font-size", "10px") // Make the text smaller
      .text((d, i) => "Cluster " + (i + 1));
    
    g.append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x))
      .append("text")
      .attr("x", width)
      .attr("y", -6)
      .attr("fill", "white")
      .style("text-anchor", "end")
      .text("Dimension 1");

    g.append("g")
      .call(d3.axisLeft(y))
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", ".71em")
      .attr("fill", "white")
      .style("text-anchor", "end")
      .text("Dimension 2");
  }

  async function fetchMdsVariableData() {
    const response = await fetch('http://127.0.0.1:5000/mds_variable', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({'selectedBars': 'selectedBars'}),
    });
  
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  
    const data = await response.json();
    const svg = d3.select("#mds-variable");
    svg.selectAll("*").remove();

    const margin = {top: 20, right: 40, bottom: 20, left: 40};
    const width = +svg.attr("width") - margin.left - margin.right;
    const height = +svg.attr("height") - margin.top - margin.bottom;

    const x = d3.scaleLinear().range([0, width]);
    const y = d3.scaleLinear().range([height, 0]);

    const g = svg.append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    x.domain(d3.extent(data.variables, d => d[0]));
    y.domain(d3.extent(data.variables, d => d[1]));

    g.append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x));

    g.append("g")
      .call(d3.axisLeft(y));

    // const line = d3.line()
    //   .x(d => x(d[0]))
    //   .y(d => y(d[1]));

    g.selectAll(".dot")
      .data(data.variables)
      .join("circle")
      .attr("class", "dot")
      .attr("r", 3.5)
      .attr("cx", d => x(d[0]))
      .attr("cy", d => y(d[1]))
      .style("fill", "red")
      .on("click", function(event, d) {
        const i = data.variables.indexOf(d);
        const selected = d3.select(this);
        const isSelected = selected.style("fill") === "yellow";

        if (isSelected) {
          // If the dot is already selected (yellow), deselect it (make it red) and remove its variable name from selectedVariables
          selected.style("fill", "red");
          setSelectedVariables(selectedVariables => selectedVariables.filter(variable => variable !== data.variable_names[i]));
        } else {
          // If the dot is not selected (blue), select it (make it yellow) and add its variable name to selectedVariables
          selected.style("fill", "yellow");
          setSelectedVariables(selectedVariables => [...selectedVariables, data.variable_names[i]]);
          // if (selectedVariables.length > 0) {
          //   console.log(selectedVariables, "selectedVariables*****");
          //   const lastVariable = selectedVariables[selectedVariables.length - 1];
          //   const lastIndex = data.variable_names.indexOf(lastVariable);
          //   const lastPoint = data.variables[lastIndex];
        
          //   g.append("path")
          //     .datum([lastPoint, d])
          //     .attr("fill", "none")
          //     .attr("stroke", "black")
          //     .attr("stroke-width", 1.5)
          //     .attr("d", line);
          // }
        }
      });

    g.selectAll(".text")
      .data(data.variables)
      .enter().append("text")
      .attr("x", d => x(d[0]))
      .attr("y", d => y(d[1]))
      .text((d, i) => data.variable_names[i])
      .attr("fill", "white")
      .attr("font-size", "10px")
      .attr("dx", "0.5em")
      .attr("dy", "-0.5em");
    
    g.append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x))
      .append("text")
      .attr("x", width)
      .attr("y", -1)
      .attr("fill", "white")
      .style("text-anchor", "end")
      .text("Variable Dimension 1");

    g.append("g")
      .call(d3.axisLeft(y))
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 4)
      .attr("fill", "white")
      .attr("dy", ".71em")
      .style("text-anchor", "end")
      .text("Variable Dimension 2");
  }

  async function fetchParallelCoordinatesData() {
    const response = await fetch('http://127.0.0.1:5000/parallel_coordinates', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({'selectedBars': kmeansdata, 'selectedColumns': selectedVariables}),
    });
  
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  
    const data = await response.json();
    console.log(data);
    const svg = d3.select("#pcp");
    svg.selectAll("*").remove();

    const dimensions = Object.keys(data.data[0]);
    const color = d3.scaleOrdinal(d3.schemeCategory10);

    const margin = {top: 30, right: 30, bottom: 30, left: 60},
          width = 1800 - margin.left - margin.right,
          height = 500 - margin.top - margin.bottom;

    const x = d3.scalePoint().range([0, width]).domain(dimensions);
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
        dragging[d] = this.__origin__ = x(d);
        background.attr("visibility", "visible");
      })
      .on("drag", function(event, d) {
        dragging[d] = Math.min(width, Math.max(0, this.__origin__ += event.dx));
        foreground.attr("d", path);
        dimensions.sort((a, b) => position(a) - position(b));
        x.domain(dimensions);
        g.selectAll(".dimension").attr("transform", d => `translate(${position(d)})`);
        svg.selectAll(".foreground path").attr("d", d => line(dimensions.map(p => [p, d[p]]))); // Update line paths

        const overlap = dimensions.find((e, i) => i !== dimensions.indexOf(d) && position(e) === position(d));
        if (overlap) {
          console.log(`Overlapping dimensions: ${d} and ${overlap}`);
          const tempIndex = dimensions.indexOf(d);
          const overlapIndex = dimensions.indexOf(overlap);
          dimensions[tempIndex] = overlap;
          dimensions[overlapIndex] = d;
          x.domain(dimensions); // Update the x scale domain with the new dimensions array

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
              .attr("y", 10)
              .attr("fill", "white")
              .attr("transform", "rotate(0)")
              .text(dimension);
          })
        }
      })
      .on("end", function(event, d) {
        delete this.__origin__;
        delete dragging[d];
        transition(d3.select(this)).attr("transform", `translate(${x(d)})`);
        transition(foreground).attr("d", path);
        background
          .attr("d", path)
          .transition()
          .delay(500)
          .duration(0)
          .attr("visibility", null);
        svg.selectAll(".foreground path").attr("d", d => line(dimensions.map(p => [p, d[p]]))); // Update line paths
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
          .attr("y", 10)
          .attr("fill", "white")
          .attr("transform", "rotate(0)")
          .text(dimension);
      })
      .call(drag);
    
    function line(d) {
      let path = d3.path();
      path.moveTo(x(d[0][0]), y[d[0][0]](d[0][1]));
      for (let i = 1; i < d.length; i++) {
        path.lineTo(x(d[i][0]), y[d[i][0]](d[i][1]));
      }
      return path.toString();
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

  }


  return (
    <div className="App">
      <header className="App-header">
        <div className="grid-container" id="master">
          <div className="container" id="mds-data-container">
            <h3>MDS Data</h3>
            <svg id="mds-data" width="500" height="350"></svg>
          </div>
          <div className="container" id="mds-variable-constainer">
            <h3>MDS-Variable</h3>
            <svg id="mds-variable" width="500" height="350"></svg>
          </div>
          <div className="container" id="kmeans-container">
            <h3>K-Means Elbow</h3>
            <svg id="kmeans" width="500" height="350"></svg>
          </div>
        </div>
        <div className="pcp-footer" id="master">
          <div className="container" id="pcp-container">
            <h3>Parallel Coordinate Plot</h3>
            <svg id="pcp" width="1500" height="500"></svg>
          </div>
        </div>
      </header>
    </div>
  );
}

export default App;
