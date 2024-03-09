import './App.css';
import * as d3 from 'd3';
import React, { useState, useEffect } from 'react';


function App() {

  const [selectedBars, setSelectedBars] = useState([]);
  const [kmeansdata, setkmeansdata] = useState([]);

  useEffect(() => {
    screePlot();
    kmeans_elbow();
    // pca_loadings_biplot();
  }, []);

  useEffect(() => {
    // console.log(selectedBars, "selectedBars");
    pca_loadings_biplot();
    scatterplot_matrix();
  }, [kmeansdata, selectedBars]);

  async function screePlot() {
    const response = await fetch('http://127.0.0.1:8080/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({'question': "generate_data"}),
    });
  
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  
    const data = await response.json();
  
    // Now you can use the data
    // console.log(data);
    if (data.screeplot) {
      const screeplot = data.screeplot;
      // suppose the screeplot data is like this  [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
      // console.log(screeplot);

      const svg = d3.select("#screeplot");
      // remove the previous plot
      svg.selectAll("*").remove();

      const margin = {top: 20, right: 50, bottom: 30, left: 50};

      const width = +svg.attr("width") - margin.left - margin.right;
      const height = +svg.attr("height") - margin.top - margin.bottom,

      g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      const x = d3.scaleBand()
      .rangeRound([0, width])
      .padding(0.1)
      .domain(screeplot.map((d, i) => i));

      const y = d3.scaleLinear()
      .rangeRound([height, 0])
      .domain([0, d3.max(screeplot, d => d)]);

      g.append("g")
      .call(d3.axisLeft(y))
      .append("text")
      .attr("fill", "#000")
      .attr("transform", "rotate(-90)")
      .attr("y", -40)
      .attr("dy", "0.71em")
      .attr("text-anchor", "end")
      .attr("fill", "white")
      .text("Eigen Values");

      // label the x-axis
      g.append("text")
        .attr("x", width / 4)
        .attr("y", height + 40)
        .text("Principal Components")
        .attr("fill", "white")
        .attr("size", "10px");


      g.selectAll(".bar")
        .data(screeplot)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", (d, i) => x(i))
        .attr("y", d => y(d))
        .attr("width", x.bandwidth())
        .attr("height", d => height - y(d))
        .attr("fill", (d, i) => i === data.intrinsic_dimensionality ? "yellow" : "")
        .on("click", function(d, i) {
          // Color all bars with a value less than the clicked bar's value red
          // console.log(i);
          // console.log(data);
          svg.selectAll(".bar")
            .filter(data => data >= i)
            .style("fill", "red");

          // Reset the color of all bars with a value greater than or equal to the clicked bar's value
          svg.selectAll(".bar")
            .filter(data => data < i)
            .style("fill", ""); // Replace "" with the original color

          // Update the selectedBars state variable
          setSelectedBars(screeplot.map((data, index) => data >= i ? index : -1).filter(index => index !== -1));        
        });
    }
    if (data.cumulative_explained_variance) {
      const cumulative_explained_variance = data.cumulative_explained_variance;
      // console.log(cumulative_explained_variance);
      // plot the values of cumulative_explained_variance on the screeplot

      const svg = d3.select("#screeplot");
      const margin = {top: 20, right: 20, bottom: 30, left: 40};

      const width = +svg.attr("width") - margin.left - margin.right;
      const height = +svg.attr("height") - margin.top - margin.bottom,

      g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");
      const x = d3.scaleBand()
      .rangeRound([0, width])
      .padding(0.1)
      .domain(cumulative_explained_variance.map((d, i) => i));

      const y = d3.scaleLinear()
      .rangeRound([height, 0])
      .domain([0, d3.max(cumulative_explained_variance, d => d)]);
      g.append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x));
      g.append("g")
        .attr("transform", "translate(" + width + ", 0)") // Move the y-axis to the right side of the plot
        .call(d3.axisRight(y)) // Use d3.axisRight instead of d3.axisLeft
        .append("text")
        .attr("fill", "white")
        .attr("transform", "rotate(-90)")
        .attr("y", -15) // Adjust the y position of the text
        .attr("dy", "0.71em")
        .attr("text-anchor", "end")
        .text("Cumulative Explained Variance");
      // line chart
      const line = d3.line()
      .x((d, i) => x(i))
      .y(d => y(d));

      g.append("path")
      .datum(cumulative_explained_variance)
      .attr("fill", "none")
      .attr("stroke", "steelblue")
      .attr("stroke-linejoin", "round")
      .attr("stroke-linecap", "round")
      .attr("stroke-width", 1.5)
      .attr("d", line);
      let tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);
      g.selectAll(".dot")
        .data(cumulative_explained_variance)
        .enter().append("circle")
        .attr("class", "dot")
        .attr("cx", (d, i) => x(i))
        .attr("cy", d => y(d))
        .attr("r", 5)
        .attr("fill", "red")
        .on("mouseover", function(event, d) {
          tooltip.transition()
            .duration(200)
            .style("opacity", .9);
          const [x, y] = d3.pointer(event);
          tooltip.html("Value: " + d)
            .style("left", (x + 850) + "px")
            .style("top", (y + 150) + "px");
        })
        .on("mouseout", function(d) {
          tooltip.transition()
            .duration(500)
            .style("opacity", 0);
        });
    }
  }

  async function pca_loadings_biplot() {
    const response = await fetch('http://127.0.0.1:8080/pca_loadings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({'biplotselectedBars': selectedBars, 'kmeansselectedBars': kmeansdata}),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Now you can use the loadings html in data to build a table using the html sent from the server
    const pca_top_4 = document.getElementById("pca-top-4");
    pca_top_4.innerHTML = data.loadings;
    // console.log(data);



    if (data.biplot_data) {
      const biplot = JSON.parse(data.biplot_data);  
      // console.log(data);
      const biplot_centers = JSON.parse(data.biplot_centers);
      // console.log(biplot);    
      // contruct the biplot
      const svg = d3.select("#biplot");
      // remove the previous plot
      svg.selectAll("*").remove();

      const margin = {top: 20, right: 50, bottom: 30, left: 50};

      const width = +svg.attr("width") - margin.left - margin.right;
      const height = +svg.attr("height") - margin.top - margin.bottom,

      g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");
      const x = d3.scaleLinear()
      .range([0, width])
      .domain([d3.min(biplot, d => d.x), d3.max(biplot, d => d.x)]);
    
    const y = d3.scaleLinear()
      .range([height, 0])
      .domain([d3.min(biplot, d => d.y), d3.max(biplot, d => d.y)]);

      g.append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x));

      g.append("g")
      .call(d3.axisLeft(y));

      const color = d3.scaleOrdinal(d3.schemeCategory10);

      g.selectAll(".dot")
        .data(biplot)
        .enter().append("circle")
        .attr("cx", d => {
          // console.log(d["x"]);
          return x(d["x"]);
        })        
        .attr("cy", d => {
          // console.log(d["y"]);
          return y(d["y"]); // Use the 'y' scale function
        })     
        .attr("r", 2)
        .attr("fill", d => color(d.label))    
        .on("mouseover", function(event, d) {
          d3.select(this).attr("r", 5);
          const [x, y] = d3.pointer(event);
          d3.select("#biplot").append("text")
            .attr("x", x)
            .attr("y", y)
            .text(d.label)
            .attr("fill", "white");
        })
        .on("mouseout", function(d) {
          d3.select(this).attr("r", 2);
          d3.select("#biplot").selectAll("text").remove();
          legend.append("text")
          .attr("x", width - 24)
          .attr("y", 9)
          .attr("dy", ".35em")
          .style("text-anchor", "end")
          .text(d => d)
          .attr("fill", "white");
          g.append("text")
          .attr("x", width / 2)
          .attr("y", 0)
          .text("PC1")
          .attr("fill", "white");
          g.append("text")
          .attr("x", width)
          .attr("y", height / 2)
          .text("PC2")
          .attr("fill", "white");
          g.selectAll(".arrow")
          .data(biplot_centers)
          .enter().append("text")
          .attr("x", d => x(d.x))
          .attr("y", d => y(d.y))
          .text(d => d.label)
          .attr("fill", "white");
        });

      //add a legend
      const legend = g.selectAll(".legend")
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
        .text(d => d);
      // draw arrows to connect the cluster center to the origin
      // const cluster_centers = JSON.parse(data.biplot_centers);
      // console.log(biplot_centers);
      g.selectAll(".arrow")
        .data(biplot_centers)
        .enter().append("line")
        .attr("x1", width / 2)
        .attr("y1", height / 2)
        .attr("x2", d => x(d.x))
        .attr("y2", d => y(d.y))
        .attr("stroke-width", 2)
        .attr("stroke", "white");
      
      g.selectAll(".arrow")
        .data(biplot_centers)
        .enter().append("text")
        .attr("x", d => x(d.x))
        .attr("y", d => y(d.y))
        .text(d => d.label)
        .attr("fill", "white");
      
      // add grid lines to the biplot at origin
      g.append("line")
        .attr("x1", width / 2)
        .attr("y1", 0)
        .attr("x2", width / 2)
        .attr("y2", height)
        .attr("stroke-width", 1)
        .attr("stroke", "white");
      g.append("line")
        .attr("x1", 0)
        .attr("y1", height / 2)
        .attr("x2", width)
        .attr("y2", height / 2)
        .attr("stroke-width", 1)
        .attr("stroke", "white");
      
      // add labels to the biplot
      g.append("text")
        .attr("x", width / 2)
        .attr("y", 0)
        .text("PC1")
        .attr("fill", "white");
      g.append("text")
        .attr("x", width)
        .attr("y", height / 2)
        .text("PC2")
        .attr("fill", "white");

      }
  }

  async function kmeans_elbow() {
    const response = await fetch('http://127.0.0.1:8080/kmeans_elbow', {
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
      const k = data.k;
      // console.log(mse_errors);
      const svg = d3.select("#kmeans");
      // remove the previous plot
      svg.selectAll("*").remove();

      const margin = {top: 20, right: 50, bottom: 30, left: 50};

      const width = +svg.attr("width") - margin.left - margin.right;
      const height = +svg.attr("height") - margin.top - margin.bottom,

      g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");
      const x = d3.scaleLinear()
      .range([0, width])
      .domain([0, mse_errors.length]);

      const y = d3.scaleLinear()
      .range([height, 0])
      .domain([0, d3.max(mse_errors, d => d)]);
      g.append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x));
      g.append("g")
      .call(d3.axisLeft(y));
      // line chart
      const line = d3.line()
      .x((d, i) => x(i))
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
      g.selectAll(".dot")
        .data(mse_errors)
        .enter().append("circle")
        .attr("class", "dot")
        .attr("cx", (d, i) => x(i))
        .attr("cy", d => y(d))
        .attr("r", 5)
        .attr("fill", "red")
        .on("mouseover", function(event, d) {
          tooltip.transition()
            .duration(200)
            .style("opacity", .9);
          const [x, y] = d3.pointer(event);
          tooltip.html("Value: " + d)
            .style("left", (x + 3050) + "px")
            .style("top", (y + 500) + "px");
        })
        .on("mouseout", function(d) {
          tooltip.transition()
            .duration(500)
            .style("opacity", 0);
        });
      // add bars to the plot
      g.selectAll(".bar")
        .data(mse_errors)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", (d, i) => x(i))
        .attr("y", d => y(d))
        .attr("width", 20)
        .attr("height", d => height - y(d))
        .attr("fill", (d, i) => i === data.k ? "red" : "")
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

          setkmeansdata(mse_errors.map((data, index) => data === i ? index : -1).filter(index => index !== -1));
        })
        .on("mouseover", function(event, d) {
          tooltip.transition()
            .duration(200)
            .style("opacity", .9);
          const [x, y] = d3.pointer(event);
          tooltip.html("Value: " + d)
            .style("left", (x + 600) + "px")
            .style("top", (y + 500) + "px");
        })
        .on("mouseout", function(d) {
          tooltip.transition()
            .duration(500)
            .style("opacity", 0);
        });
      }
  }

  async function scatterplot_matrix() {
    const response = await fetch('http://127.0.0.1:8080/scatterplot_matrix', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    if (data.scatterplot_matrix) {
      const scatterplot_matrix = data.scatterplot_matrix;
      // the data is a dictionary with keys as the column names and values as the array of values
      // console.log(scatterplot_matrix);
      const svg = d3.select("#scatterplot");
      // remove the previous plot
      svg.selectAll("*").remove();
      const margin = {top: 20, right: 50, bottom: 30, left: 50};

      const width = +svg.attr("width") - margin.left - margin.right;
      const height = +svg.attr("height") - margin.top - margin.bottom,
      g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      const padding = 20; // or any other value you want
      // Get the keys from the data
      const keys = Object.keys(scatterplot_matrix);

      // Define the size of each individual scatter plot
      const size = Math.min(width, height) / keys.length;

      // Define the scales for the x and y axes
      const xScales = keys.map(key => d3.scaleLinear()
        .domain(d3.extent(scatterplot_matrix[key]))
        .range([padding, size - padding]));

      const yScales = keys.map(key => d3.scaleLinear()
        .domain(d3.extent(scatterplot_matrix[key]))
        .range([size - padding, padding]));

      // Create the scatter plot for each pair of keys
      keys.forEach((keyY, i) => {
        keys.forEach((keyX, j) => {
          if (i === j) return;

          // Create a group for each scatter plot
          const cell = g.append("g")
            .attr("transform", `translate(${j * size},${i * size})`);

          // Add the scatter plot to the group
          cell.selectAll("circle")
            .data(scatterplot_matrix[keyX])
            .enter().append("circle")
            .attr("cx", d => xScales[j](d))
            .attr("cy", d => yScales[i](scatterplot_matrix[keyY][scatterplot_matrix[keyX].indexOf(d)]))
            .attr("r", 1)
            .style("fill", "steelblue");

          // Add the x axis
          cell.append("g")
            .attr("transform", `translate(0,${size - padding})`)
            .call(d3.axisBottom(xScales[j]).ticks(5));

          // Add the y axis
          cell.append("g")
            .attr("transform", `translate(${padding},0)`)
            .call(d3.axisLeft(yScales[i]).ticks(5));
          cell.append("text")
            .attr("x", size / 2)
            .attr("y", size - padding)
            .text(keyX)
            .attr("fill", "white")
            .style("font-size", "10px"); // adjust the size as needed
          cell.append("text")
            .attr("x", padding - 35)
            .attr("y", size / 20)
            .text(keyY)
            .attr("fill", "white")
            .attr("transform", "rotate(-90)")
            .attr("text-anchor", "end")
            .style("font-size", "10px"); // adjust the size as needed
        });
      });
      
    }


  }


  return (
    <div className="App">
      <header className="App-header">
        <div className="grid-container" id="master">
          <div className="container" id="scatterplot-container">
            <h3>Scatterplot</h3>
            <svg id="scatterplot" width="700" height="500"></svg>
          </div>
          <div className="container" id="screeplot-constainer">
            <h3>Screeplot</h3>
            <svg id="screeplot" width="700" height="500"></svg>
          

            {/* <button onClick={screePlot}>display plots</button> */}
          </div>
          <div className="container" id="biplot-container">
            <h3>Biplot</h3>
            <svg id="biplot" width="700" height="500"></svg>
          
          </div>
          <div className="container" id="kmeans-container">
            <h3>K-Means Elbow</h3>
            <svg id="kmeans" width="700" height="500"></svg>

         
          </div>
        </div>
        <div className="table-container" id="pca-top-4">
        </div>
      </header>
    </div>
  );
}

export default App;
