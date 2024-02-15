// load csv file
fetch('https://raw.githubusercontent.com/jagadeesh-r1/cse564/master/lab1/youtube_stats.csv')
    .then(response => response.text())
    .then(data => {
        // console.log(data);
        // store csv headers into a variable
        const headers = data.split('\n')[0].split(',');
        console.log(headers);
        // get all data in 'rank' column in a variable
        // const rankColumn = data.split('\n').slice(1).map(row => parseInt(row.split(',')[2]));
        // console.log(rankColumn);


    })
    .catch(error => console.error('Error:', error));

    var selectElement = document.getElementById('dropdown');

    selectElement.addEventListener('change', function() {
        var selectedOption = this.value;
        console.log(selectedOption); // This will log the value of the selected option
    });

// handle dom events