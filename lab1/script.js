// load csv file
fetch('https://raw.githubusercontent.com/jagadeesh-r1/cse564/master/lab1/youtube_stats.csv')
    .then(response => response.text())
    .then(data => {
        const rows = data.split('\n');
        const headers = rows[0].split(',');
        var categorical_columns = [
            "Channel Category",
            "Country",
            "Channel Sub-Category",
            "Rank by Video Views",
            "Country Rank",
            "Channel Category Rank",
            "Channel Created Year",
            "Continent"
        ]
    
        var neumerical_columns = [
            "Subscriber Count",
            "Channel Views",
            "Video Uploads",
            "Views in December",
            "Lowest Yearly Earnings",
            "Highest Yearly Earnings",
            "December Subscriber Gain",
            "Gross tertiary education enrollment(%)",
            "Population",
            "Unemployment Rate(%)",
            "Urban Population"
        ]

        const dataObjects = rows.slice(1)
            .map(row => {
                const values = row.split(',');
                let obj = {};
                headers.forEach((header, i) => {
                    obj[header] = values[i];
                });
                return obj;
            })
            .filter(obj => {
                // Check if all properties are present and not empty
                return headers.every(header => obj[header] !== undefined && obj[header] !== '');
            });
        // console.log(dataObjects);

        var selectElement = document.getElementById('dropdown');
        var scatterCheckbox = document.getElementById('scatter');
        var flipButton = document.getElementById('flip');
        let width = 960;
        let height = 500;

        selectElement.addEventListener('change', function() {
            var selectedOption = this.value;
            console.log(selectedOption); // This will log the value of the selected option
            
            // Create a histogram using D3.js
            // Replace 'data' with your actual data variable
            // Assuming dataColumn is your data array
            var denomination = 'Million';
            function scaleNumber(num, allData) {
                try {
                    num = parseInt(num);
                    if (num >= 1e9) {
                        if (allData.some(n => n >= 1e6 && n < 1e9)) {
                            denomination = 'Million';
                            return num / 1e6;
                        }
                        else if (allData.some(n => n >= 1e3 && n < 1e6)) {
                            denomination = 'Thousand';
                            return num / 1e3;
                        }
                        else if (allData.some(n => n >= 1 && n < 1e3)) {
                            denomination = '';
                            return num;
                        }
                        denomination = 'Billion';
                        return num / 1e9;
                    } else if (num >= 1e6) {
                        if (allData.some(n => n >= 1e6 && n < 1e9)) {
                            denomination = 'Million';
                            return num / 1e6;
                        }
                        else if (allData.some(n => n >= 1e3 && n < 1e6)) {
                            denomination = 'Thousand';
                            return num / 1e3;
                        }
                        else if (allData.some(n => n >= 1 && n < 1e3)) {
                            denomination = '';
                            return num;
                        }
                        denomination = 'Million';
                        return num / 1e6;
                    } else if (num >= 1e3) {
                        if (allData.some(n => n >= 1e6 && n < 1e9)) {
                            denomination = 'Million';
                            return num / 1e6;
                        }
                        else if (allData.some(n => n >= 1e3 && n < 1e6)) {
                            denomination = 'Thousand';
                            return num / 1e3;
                        }
                        else if (allData.some(n => n >= 1 && n < 1e3)) {
                            denomination = '';
                            return num;
                        }
                        denomination = 'Thousand';
                        return num / 1e3;
                    } else {
                        denomination = '';
                        return num;
                    }
                } catch (e) {
                    console.log(e);
                }
            }
            if (neumerical_columns.includes(selectedOption)) {
                const dataColumn = dataObjects.map(row => parseInt(row[selectedOption]));
                var scaledDataColumn = dataColumn.map(num => scaleNumber(num, dataColumn));
                d3.select('svg').remove();
                var svg = d3.select('#chart').append('svg')
                        .attr('width', width)
                        .attr('height', height);
                var margin = { top: 30, right: 30, bottom: 90, left: 90 };
                var innerWidth = width - margin.left - margin.right;
                var innerHeight = height - margin.top - margin.bottom;
                var x = d3.scaleLinear()
                    .domain([0, d3.max(scaledDataColumn)])
                    .range([0, innerWidth]);
                var histogram = d3.histogram()
                    .domain(x.domain())
                    .thresholds(x.ticks(20));
                var bins = histogram(scaledDataColumn);
                var y = d3.scaleLinear()
                    .domain([0, d3.max(bins, d => d.length)])
                    .range([innerHeight, 0]);
            }
            // console.log(scaledDataColumn);
            // console.log(denomination);
            // Create a histogram using D3.js
            // Replace 'data' with your actual data variable
            // Assuming dataColumn is your data array
            let isVertical = true;

            function createVerticalHistogram() {
                d3.select('svg').remove();
                var svg = d3.select('#chart').append('svg')
                    .attr('width', width)
                    .attr('height', height);

                var g = svg.append('g')
                    .attr('transform', `translate(${margin.left},${margin.top})`);
                g.append('g')
                    .attr('transform', `translate(0,${innerHeight})`)
                    .call(d3.axisBottom(x));
                g.append('g')
                    .call(d3.axisLeft(y));
                // Create color scale
                const colorScale = d3.scaleSequential()
                    .domain([0, bins.length])
                    .interpolator(d3.interpolateRainbow);
                const tooltip = d3.select('#chart').append('div')
                    .attr('class', 'tooltip')
                    .style('opacity', 0);
                // Create rectangles
                g.selectAll('rect').data(bins)
                    .enter().append('rect')
                    .attr('x', d => x(d.x0) + 1)
                    .attr('width', d => Math.max(0, x(d.x1) - x(d.x0) - 1))
                    .attr('y', innerHeight)
                    .attr('height', 0)
                    .attr('fill', (d, i) => colorScale(i))
                    // Add tooltip
                    .on('mouseover', function(event, d) {
                        tooltip.transition()
                            .duration(200)
                            .style('opacity', .9);
                        tooltip.html(`Range: ${d.x0} ${denomination} to ${d.x1} ${denomination}<br/>Count: ${d.length}`)
                            .style('left', (event.pageX) + 'px')
                            .style('top', (event.pageY - 28) + 'px');
                    })
                    .on('mouseout', function(d) {
                        tooltip.transition()
                            .duration(500)
                            .style('opacity', 0);
                    })
                    .transition() // Start a transition
                    .duration(1000) // Make the transition last 1000ms
                    .attr('y', d => y(d.length)) // End at the final y position
                    .attr('height', d => innerHeight - y(d.length)); // End with the final height
                g.append('text')
                    .attr('x', innerWidth / 2)
                    .attr('y', innerHeight + 60)
                    .attr('text-anchor', 'middle')
                    .attr('fill', 'white')
                    .text(selectedOption);
                g.append('text')
                    .attr('x', -innerHeight / 2)
                    .attr('y', -50)
                    .attr('transform', 'rotate(-90)')
                    .attr('text-anchor', 'middle')
                    .attr('fill', 'white')
                    .text('Frequency');
                g.append('text')
                    .attr('x', innerWidth / 2)
                    .attr('y', -10)
                    .attr('text-anchor', 'middle')
                    .attr('fill', 'white')
                    .text('Histogram of ' + selectedOption + (denomination ? ' in ' + denomination +'s' : ''));
            }

            function createHorizontalHistogram() {
                // Swap the roles of the x and y scales
                d3.select('svg').remove();
                var svg = d3.select('#chart').append('svg')
                    .attr('width', width)
                    .attr('height', height);
                var x = d3.scaleLinear()
                    .domain([0, d3.max(bins, d => d.length)])
                    .range([0, innerWidth]);
                var y = d3.scaleLinear()
                    .domain([0, d3.max(scaledDataColumn)])
                    .range([innerHeight, 0]);
                var g = svg.append('g')
                    .attr('transform', `translate(${margin.left},${margin.top})`);
                g.append('g')
                    .attr('transform', `translate(0,${innerHeight})`)
                    .call(d3.axisBottom(x));
                g.append('g')
                    .call(d3.axisLeft(y));
                // Create color scale
                const colorScale = d3.scaleSequential()
                    .domain([0, bins.length])
                    .interpolator(d3.interpolateRainbow);
                const tooltip = d3.select('#chart').append('div')
                    .attr('class', 'tooltip')
                    .style('opacity', 0);
                // Adjust the rectangle attributes
                g.selectAll('rect').data(bins)
                    .enter().append('rect')
                    .attr('y',innerHeight)
                    .attr('height', 0)
                    .attr('x', 0)
                    .attr('width', d => x(d.length))
                    .attr('fill', (d, i) => colorScale(i))
                    // Add tooltip
                    .on('mouseover', function(event, d) {
                        tooltip.transition()
                            .duration(200)
                            .style('opacity', .9);
                        tooltip.html(`Range: ${d.x0} ${denomination} to ${d.x1} ${denomination}<br/>Count: ${d.length}`)
                            .style('left', (event.pageX) + 'px')
                            .style('top', (event.pageY - 28) + 'px');
                    })
                    .on('mouseout', function(d) {
                        tooltip.transition()
                            .duration(500)
                            .style('opacity', 0);
                    })
                    .transition() // Start a transition
                    .duration(1000) // Make the transition last 1000ms
                    .attr('y', d => y(d.x1)) // End at the final y position
                    .attr('height', d => y(d.x0) - y(d.x1)); // End with the final height
                g.append('text')
                    .attr('x', innerWidth / 2)
                    .attr('y', innerHeight + 60)
                    .attr('text-anchor', 'middle')
                    .attr('fill', 'white')
                    .text('Frequency');
                g.append('text')
                    .attr('x', -innerHeight / 2)
                    .attr('y', -50)
                    .attr('transform', 'rotate(-90)')
                    .attr('fill', 'white')
                    .attr('text-anchor', 'middle')
                    .text(selectedOption);

                g.append('text')
                    .attr('x', innerWidth / 2)
                    .attr('y', -10)
                    .attr('text-anchor', 'middle')
                    .attr('fill', 'white')
                    .text('Histogram of ' + selectedOption + (denomination ? ' in ' + denomination +'s' : ''));
            }
            if (neumerical_columns.includes(selectedOption) && !scatterCheckbox.checked) {
                createVerticalHistogram();
            }
            else if (categorical_columns.includes(selectedOption) && !scatterCheckbox.checked) {
                createVerticalBarChart();
            }

            function createVerticalBarChart() {
                d3.select('svg').remove();
                const dataColumn = dataObjects.map(row => row[selectedOption]);
                // console.log(dataColumn);
                var svg = d3.select('#chart').append('svg')
                    .attr('width', width)
                    .attr('height', height);
                var margin = { top: 30, right: 30, bottom: 90, left: 60 };
                var innerWidth = width - margin.left - margin.right;
                var innerHeight = height - margin.top - margin.bottom;
                // with the dataColumn, create a map of the frequency of each value and use it to create a bar chart
                var frequencyMap = new Map();
                dataColumn.forEach(value => {
                    frequencyMap.set(value, (frequencyMap.get(value) || 0) + 1);
                });
                var x = d3.scaleBand()
                    .domain(frequencyMap.keys())
                    .range([0, innerWidth])
                    .padding(0.1);
                var y = d3.scaleLinear()
                    .domain([0, d3.max(frequencyMap.values())])
                    .range([innerHeight, 0]);
                var g = svg.append('g')
                    .attr('transform', `translate(${margin.left},${margin.top})`);
                g.append('g')
                    .attr('transform', `translate(0,${innerHeight})`)
                    .call(d3.axisBottom(x))
                    .selectAll('text')
                    .attr('transform', 'rotate(-45)')
                    .style('text-anchor', 'end');
                g.append('g')
                    .call(d3.axisLeft(y));

                const tooltip = d3.select('#chart').append('div')
                    .attr('class', 'tooltip')
                    .style('opacity', 0);

                const colorScale = d3.scaleSequential()
                    .domain([0, frequencyMap.size])
                    .interpolator(d3.interpolateRainbow);
                
                g.selectAll('rect').data(frequencyMap)
                    .enter().append('rect')
                    .attr('x', ([key, value]) => x(key))
                    .attr('y', innerHeight)
                    .attr('height', 0)
                    .attr('width', x.bandwidth())
                    .attr('fill', (d, i) => colorScale(i))
                    .on('mouseover', function(event, [key, value]) {
                        tooltip.transition()
                            .duration(200)
                            .style('opacity', .9);
                        tooltip.html(`Key: ${key}<br/>Value: ${value}`)
                            .style('left', (event.pageX) + 'px')
                            .style('top', (event.pageY - 28) + 'px');
                    })
                    .on('mouseout', function(d) {
                        tooltip.transition()
                            .duration(500)
                            .style('opacity', 0);
                    })
                    .transition() // Start a transition
                    .duration(1000) // Make the transition last 1000ms
                    .attr('y', ([key, value]) => y(value)) // End at the final y position
                    .attr('height', ([key, value]) => innerHeight - y(value)); // End with the final height
                g.append('text')
                    .attr('x', innerWidth / 2)
                    .attr('fill', 'white')
                    .attr('y', innerHeight + 60)
                    .attr('text-anchor', 'middle')
                    .text(selectedOption);
                g.append('text')
                    .attr('x', -innerHeight / 2)
                    .attr('y', -50)
                    .attr('transform', 'rotate(-90)')
                    .attr('text-anchor', 'middle')
                    .attr('fill', 'white')
                    .text('Frequency');
                g.append('text')
                    .attr('x', innerWidth / 2)
                    .attr('y', -10)
                    .attr('text-anchor', 'middle')
                    .attr('fill', 'white')
                    .text('Bar chart of ' + selectedOption);
            }

            function createHorizontalBarChart() {
                d3.select('svg').remove();
                const dataColumn = dataObjects.map(row => row[selectedOption]);
                // console.log(dataColumn);
                var svg = d3.select('#chart').append('svg')
                    .attr('width', width)
                    .attr('height', height);
                var margin = { top: 30, right: 30, bottom: 90, left: 60 };
                var innerWidth = width - margin.left - margin.right;
                var innerHeight = height - margin.top - margin.bottom;
                // with the dataColumn, create a map of the frequency of each value and use it to create a bar chart
                var frequencyMap = new Map();
                dataColumn.forEach(value => {
                    frequencyMap.set(value, (frequencyMap.get(value) || 0) + 1);
                });
                var y = d3.scaleBand()
                    .domain(frequencyMap.keys())
                    .range([0, innerHeight])
                    .padding(0.1);
                var x = d3.scaleLinear()
                    .domain([0, d3.max(frequencyMap.values())])
                    .range([0, innerWidth]);
                var g = svg.append('g')
                    .attr('transform', `translate(${margin.left},${margin.top})`);
                g.append('g')
                    .attr('transform', `translate(0,${innerHeight})`)
                    .call(d3.axisBottom(x));
                g.append('g')
                    .call(d3.axisLeft(y));
                const tooltip = d3.select('#chart').append('div')
                    .attr('class', 'tooltip')
                    .style('opacity', 0);
                const colorScale = d3.scaleSequential()
                    .domain([0, frequencyMap.size])
                    .interpolator(d3.interpolateRainbow);
                g.selectAll('rect').data(frequencyMap)
                    .enter().append('rect')
                    .attr('y', ([key, value]) => y(key))
                    .attr('x', 0)
                    .attr('width', 0)
                    .attr('height', y.bandwidth())
                    .attr('fill', (d, i) => colorScale(i))
                    .on('mouseover', function(event, [key, value]) {
                        tooltip.transition()
                            .duration(200)
                            .style('opacity', .9);
                        tooltip.html(`Key: ${key}<br/>Value: ${
                            value
                        }`)
                            .style('left', (event.pageX) + 'px')
                            .style('top', (event.pageY - 28) + 'px');
               
                    })
                    .on('mouseout', function(d) {
                        tooltip.transition()
                            .duration(500)
                            .style('opacity', 0);
                    });
                g.selectAll('rect').data(frequencyMap)
                    .transition() // Start a transition
                    .duration(1000) // Make the transition last 1000ms
                    .attr('width', ([key, value]) => x(value)) // End at the final x position
                    .attr('height', y.bandwidth()); // End with the final height
                g.append('text')
                    .attr('x', innerWidth / 2)
                    .attr('y', innerHeight + 60)
                    .attr('text-anchor', 'middle')
                    .attr('fill', 'white')
                    .text('Frequency');
                g.append('text')
                    .attr('x', -innerHeight / 2)
                    .attr('y', -50)
                    .attr('transform', 'rotate(-90)')
                    .attr('fill', 'white')
                    .attr('text-anchor', 'middle')
                    .text(selectedOption);
                g.append('text')
                    .attr('x', innerWidth / 2)
                    .attr('y', -10)
                    .attr('text-anchor', 'middle')
                    .attr('fill', 'white')
                    .text('Bar chart of ' + selectedOption);
            }

            if (scatterCheckbox.checked) {
                
            }
            else {
                d3.select('#flip').on('click', function() {
                    d3.select('svg').remove();
                    // console.log(isVertical);
                    if (isVertical) {
                        if (neumerical_columns.includes(selectedOption)) {
                            isVertical = !isVertical;
                            createHorizontalHistogram();
                        }
                        else {
                            isVertical = !isVertical;
                            createHorizontalBarChart();
                        }
                    } else {
                        if (neumerical_columns.includes(selectedOption)) {
                            isVertical = !isVertical;
                            createVerticalHistogram();
                        }
                        else {
                            isVertical = !isVertical;
                            createVerticalBarChart();
                        }
                    // console.log(isVertical);

                    }
                });
            }
        });

        scatterCheckbox.addEventListener('change', function() {
            var radioContainer = document.getElementById('radio-container');
            radioContainer.innerHTML = ''; // Clear the container
            if (this.checked) {
                // Create the X radio button
                var xRadio = document.createElement('input');
                xRadio.type = 'radio';
                xRadio.id = 'xRadio';
                xRadio.name = 'axis';
                xRadio.value = 'x';
                var xLabel = document.createElement('label');
                xLabel.for = 'xRadio';
                xLabel.textContent = 'X';
        
                // Create the Y radio button
                var yRadio = document.createElement('input');
                yRadio.type = 'radio';
                yRadio.id = 'yRadio';
                yRadio.name = 'axis';
                yRadio.value = 'y';
                var yLabel = document.createElement('label');
                yLabel.for = 'yRadio';
                yLabel.textContent = 'Y';
        
                // Append the radio buttons to the container
                radioContainer.appendChild(xLabel);
                radioContainer.appendChild(xRadio);
                radioContainer.appendChild(yLabel);
                radioContainer.appendChild(yRadio);

                var xOption, yOption;

                // Add event listeners to the radio buttons
                xRadio.addEventListener('change', function() {
                    if (this.checked) {
                        xOption = selectElement.value;
                        if (xOption && yOption) {
                            console.log(xOption + ' xoption');
                            console.log(yOption + ' yoption');
                            drawScatterplot(xOption, yOption);
                        }
                    }
                });

                yRadio.addEventListener('change', function() {
                    if (this.checked) {
                        yOption = selectElement.value;
                        if (xOption && yOption && scatterCheckbox.checked) {
                            console.log(xOption + ' xoption');
                            console.log(yOption + ' yoption');
                            drawScatterplot(xOption, yOption);
                        }
                    }
                });

                // Add a 'change' event listener to the select element
                selectElement.addEventListener('change', function() {
                    if (xRadio.checked) {
                        xOption = this.value;
                    } else if (yRadio.checked) {
                        yOption = this.value;
                    }

                    if (xOption && yOption && scatterCheckbox.checked) {
                        console.log(xOption + ' xoption');
                        console.log(yOption + ' yoption');
                        drawScatterplot(xOption, yOption);
                    }
                });

                flipButton.addEventListener('click', function() {
                    // Swap xOption and yOption
                    var temp = xOption;
                    xOption = yOption;
                    yOption = temp;
                
                    // Redraw the scatterplot with the new options
                    if (xOption && yOption && scatterCheckbox.checked) {
                        console.log(xOption + ' xoption');
                        console.log(yOption + ' yoption');
                        drawScatterplot(xOption, yOption);
                    }
                });

                // Function to draw a scatterplot
                function drawScatterplot(xOption, yOption) {
                    // Assuming dataObjects is your data array
                    const xData = dataObjects.map(row => isNaN(row[xOption]) ? row[xOption] : parseInt(row[xOption]));
                    const yData = dataObjects.map(row => isNaN(row[yOption]) ? row[yOption] : parseInt(row[yOption]));
                    console.log(xData);
                    console.log(yData);

                    // Your existing code to create an SVG, define scales, and draw circles
                    d3.select('svg').remove();
                    var svg = d3.select('#chart').append('svg')
                        .attr('width', width)
                        .attr('height', height);
                    var margin = { top: 30, right: 30, bottom: 90, left: 100 };
                    var innerWidth = width - margin.left - margin.right;
                    var innerHeight = height - margin.top - margin.bottom;
                    var x;
                    if (isNaN(xData[0])) { // If xData is categorical
                        x = d3.scaleBand()
                            .domain(xData)
                            .range([0, innerWidth])
                            .padding(0.1);
                    } else { // If xData is numerical
                        x = d3.scaleLinear()
                            .domain([d3.min(xData), d3.max(xData)])
                            .range([0, innerWidth]);
                        }
                    var y;
                    if (isNaN(yData[0])) { // If yData is categorical
                        y = d3.scaleBand()
                            .domain(yData)
                            .range([innerHeight, 0])
                            .padding(0.1);
                    } else { // If yData is numerical
                        y = d3.scaleLinear()
                            .domain([d3.min(yData), d3.max(yData)])
                            .range([innerHeight, 0]);
                    }
                    // var x = d3.scaleLinear()
                    //     .domain([d3.min(xData), d3.max(xData)])
                    //     .range([0, innerWidth]);
                    // var y = d3.scaleLinear()
                    //     .domain([d3.min(yData), d3.max(yData)])
                    //     .range([innerHeight, 0]);
                    
                    var g = svg.append('g')
                        .attr('transform', `translate(${margin.left},${margin.top})`);
                    g.append('g')
                        .attr('transform', `translate(0,${innerHeight})`)
                        .call(d3.axisBottom(x))
                        .selectAll("text")  
                        .style("text-anchor", "end")
                        .attr("dx", "-.8em")
                        .attr("dy", ".15em")
                        .attr('fill', 'white')
                        .attr("transform", "rotate(-65)");
                    g.append('g')
                        .call(d3.axisLeft(y));

                    var r = d3.scaleSqrt()
                        .domain([0, d3.max(dataObjects, d => d.value)])
                        .range([2, 20]);
                    g.selectAll('circle').data(dataObjects) 
                        .enter().append('circle')
                        .attr('cx', d => x(isNaN(d[xOption]) ? d[xOption] : parseInt(d[xOption])))
                        .attr('cy', d => y(isNaN(d[yOption]) ? d[yOption] : parseInt(d[yOption])))
                        .attr('r', 7)
                        .attr('fill', d => d3.interpolateRainbow(Math.random()))
                        .append('title') // Append a title to each circle
                        .text(d => `x: ${d[xOption]}, y: ${d[yOption]}`);
                    g.append('text')
                        .attr('x', innerWidth / 2)
                        .attr('y', innerHeight + 60)
                        .attr('text-anchor', 'middle')
                        .attr('fill', 'white')
                        .text(xOption);
                    g.append('text')
                        .attr('x', -innerHeight / 2)
                        .attr('y', -80)
                        .attr('transform', 'rotate(-90)')
                        .attr('fill', 'white')
                        .attr('text-anchor', 'middle')
                        .text(yOption);
                    g.append('text')
                        .attr('x', innerWidth / 2)
                        .attr('y', -10)
                        .attr('text-anchor', 'middle')
                        .attr('fill', 'white')
                        .text('Scatterplot of ' + xOption + ' and ' + yOption);

                }
            }
            else {
                radioContainer.innerHTML = ''; // Clear the container
                d3.select('svg').remove();
                var svg = d3.select('#chart').append('svg')
                    .attr('width', width)
                    .attr('height', height);
            }
        });

    })
    .catch(error => console.error('Error:', error));