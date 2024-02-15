// load csv file
fetch('https://raw.githubusercontent.com/jagadeesh-r1/cse564/master/lab1/youtube_stats.csv')
    .then(response => response.text())
    .then(data => {
        // console.log(data);
        // store csv headers into a variable
        // const headers = data.split('\n')[0].split(',');
        // console.log(headers);
        // get all data in 'rank' column in a variable
        // const rankColumn = data.split('\n').slice(1).map(row => parseInt(row.split(',')[2]));
        // console.log(rankColumn);
        const rows = data.split('\n');
        const headers = rows[0].split(',');
        var categorical_columns = [
            "category",
            "country",
            "channel_type",
            "video_views_rank",
            "country_rank",
            "channel_type_rank",
            "created_year",
            "continent"
        ]
    
        var neumerical_columns = [
            "subscribers",
            "views",
            "uploads",
            "video_views_for_the_last_30_days",
            "lowest_monthly_earnings",
            "highest_monthly_earnings",
            "lowest_yearly_earnings",
            "highest_yearly_earnings",
            "subscribers_for_last_30_days",
            "gross_tertiary_education_enrollment",
            "population",
            "unemployment_rate",
            "urban_population"
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
        console.log(dataObjects);

        var selectElement = document.getElementById('dropdown');
        var scatterCheckbox = document.getElementById('scatter');
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
                var margin = { top: 30, right: 30, bottom: 90, left: 60 };
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
                    .attr('y', innerHeight + 30)
                    .attr('text-anchor', 'middle')
                    .text(selectedOption);
                g.append('text')
                    .attr('x', -innerHeight / 2)
                    .attr('y', -30)
                    .attr('transform', 'rotate(-90)')
                    .attr('text-anchor', 'middle')
                    .text('Frequency');
                g.append('text')
                    .attr('x', innerWidth / 2)
                    .attr('y', -10)
                    .attr('text-anchor', 'middle')
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
                    .attr('y', innerHeight + 30)
                    .attr('text-anchor', 'middle')
                    .text('Frequency');
                g.append('text')
                    .attr('x', -innerHeight / 2)
                    .attr('y', -30)
                    .attr('transform', 'rotate(-90)')
                    .attr('text-anchor', 'middle')
                    .text(selectedOption);

                g.append('text')
                    .attr('x', innerWidth / 2)
                    .attr('y', -10)
                    .attr('text-anchor', 'middle')
                    .text('Histogram of ' + selectedOption + (denomination ? ' in ' + denomination +'s' : ''));
            }
            if (neumerical_columns.includes(selectedOption)) {
                createVerticalHistogram();
            }
            else {
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
                    .attr('y', innerHeight + 30)
                    .attr('text-anchor', 'middle')
                    .text(selectedOption);
                g.append('text')
                    .attr('x', -innerHeight / 2)
                    .attr('y', -30)
                    .attr('transform', 'rotate(-90)')
                    .attr('text-anchor', 'middle')
                    .text('Frequency');
                g.append('text')
                    .attr('x', innerWidth / 2)
                    .attr('y', -10)
                    .attr('text-anchor', 'middle')
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
                    .attr('y', innerHeight + 30)
                    .attr('text-anchor', 'middle')
                    .text('Frequency');
                g.append('text')
                    .attr('x', -innerHeight / 2)
                    .attr('y', -30)
                    .attr('transform', 'rotate(-90)')
                    .attr('text-anchor', 'middle')
                    .text(selectedOption);
                g.append('text')
                    .attr('x', innerWidth / 2)
                    .attr('y', -10)
                    .attr('text-anchor', 'middle')
                    .text('Bar chart of ' + selectedOption);
            }

            if (scatterCheckbox.checked) {
                
            }
            else {
                d3.select('#flip').on('click', function() {
                    d3.select('svg').remove();
                    console.log(isVertical);
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

    })
    .catch(error => console.error('Error:', error));







// handle dom events