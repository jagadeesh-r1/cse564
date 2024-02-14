// load csv file
fetch('https://raw.githubusercontent.com/owid/covid-19-data/master/public/data/owid-covid-data.csv')
    .then(response => response.text())
    .then(data => {;
        console.log(data);
    })
    .catch(error => console.error('Error:', error));

// handle dom events