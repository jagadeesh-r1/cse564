from flask import Flask, request
from flask_cors import CORS
import pandas as pd
import numpy as np
from collections import Counter
from sklearn.cluster import DBSCAN


app = Flask(__name__)
CORS(app)

column_names = {
    'sy_snum': 'No of Stars',
    'sy_pnum': 'No of Planets',
    'sy_dist': 'Distance [pc]',
    'st_logg': 'Surface Gravity',
    'pl_eqt': 'Equi Temp [K]',
    'pl_orbeccen': 'Eccentricity',
    'pl_bmasse': 'Plt Mass [earth]',
    'pl_rade': 'Plt Radius [earth]',
    'pl_insol': 'Insolation Flux [earth]',
    'pl_orbper': 'Orbit [days]',
    'st_rad': 'St Radius [sun]',
    'sy_vmag': 'Magnitude',
    'cluster': 'DBSCAN cls'
}

df_stars = pd.read_csv('/home/jaggu/viz/final_project/backend/datasets/Constellation_Stars.csv')
df_planets = pd.read_csv('/home/jaggu/viz/final_project/backend/datasets/PSCompPars.csv')

# Rename columns in the stars dataframe
df_stars = df_stars.rename(columns={'RA [deg]': 'ra', 'Dec [deg]': 'dec'})

err_cols = df_planets.filter(like='err').columns
df_planets = df_planets.drop(columns=err_cols)

# dbscan
# Prepare the data
planets_data = df_planets[['ra', 'dec']].values

# Perform DBSCAN on planets data
db_planets = DBSCAN(eps=8, min_samples=30).fit(planets_data)
labels_planets = db_planets.labels_

df_planets['cluster'] = labels_planets


def filter_scatterplot_data(ra_min=None, ra_max=None, dec_min=None, dec_max=None, columns=['ra', 'dec'], data_type=None, filter_data=None):
    # Filter the data
    if ra_min is None and ra_max is None and dec_min is None and dec_max is None:
        df_planets_filtered = df_planets
        df_stars_filtered = df_stars
    else:
        df_planets_filtered = df_planets[(df_planets['ra'] >= ra_min) & (df_planets['ra'] <= ra_max) & (df_planets['dec'] >= dec_min) & (df_planets['dec'] <= dec_max)]
        df_stars_filtered = df_stars[(df_stars['ra'] >= ra_min) & (df_stars['ra'] <= ra_max) & (df_stars['dec'] >= dec_min) & (df_stars['dec'] <= dec_max)]

    if columns is None:
        columns = df_planets_filtered.columns
    
    if filter_data is not None:
        for filter_item in filter_data:
            for key, value in filter_item.items():
                if value:
                    if key in df_planets_filtered.columns:
                        df_planets_filtered = df_planets_filtered[df_planets_filtered[key].isin(value)]
                    else:
                        df_planets_filtered = df_planets_filtered
    
    if data_type is None:
        df_planets_filtered = df_planets_filtered[columns].dropna()
        df_stars_filtered = df_stars_filtered[['ra', 'dec']].dropna()

        # Convert the filtered data to JSON
        exoplanets_json = df_planets_filtered.to_dict(orient='records')
        stars_json = df_stars_filtered.to_dict(orient='records')

        # Combine the two JSON objects into a single object
        combined_json = {"exoplanets":exoplanets_json, "stars": stars_json}
    else:
        df_planets_filtered = df_planets_filtered[columns].dropna()
        exoplanets_json = df_planets_filtered.to_dict(orient='records')
        combined_json = {data_type:exoplanets_json}
    # Return the JSON data
    return combined_json



@app.route('/get_star_explanets_scatterplot', methods=['POST'])
def get_star_explanets_scatterplot():
    data = request.get_json()
    min_ra = data.get('min_ra')
    max_ra = data.get('max_ra')
    min_dec = data.get('min_dec')
    max_dec = data.get('max_dec')
    disc_year = data.get('disc_year')
    discovery_method = data.get('discoverymethod')
    disc_facility = data.get('disc_facility')
    filter_data = [{"disc_year":disc_year}, {"discoverymethod":discovery_method}, {"disc_facility": disc_facility}]

    combined_json = filter_scatterplot_data(min_ra, max_ra, min_dec, max_dec, columns=['disc_year', 'ra', 'dec', 'cluster'], filter_data=filter_data)
    return combined_json


@app.route('/get_year_of_discovery', methods=['POST'])
def get_year_of_discovery():
    data = request.get_json()
    min_ra = data.get('min_ra')
    max_ra = data.get('max_ra')
    min_dec = data.get('min_dec')
    max_dec = data.get('max_dec')
    disc_year = data.get('disc_year')
    discovery_method = data.get('discoverymethod')
    disc_facility = data.get('disc_facility')
    filter_data = [{"discoverymethod":discovery_method}, {"disc_facility": disc_facility}]

    combined_json = filter_scatterplot_data(min_ra, max_ra, min_dec, max_dec, columns=['disc_year'], data_type='disc_year', filter_data=filter_data)
    combined_json['disc_year'] = [item['disc_year'] for item in combined_json['disc_year'] if item['disc_year'] > 0] 
    return combined_json

@app.route('/get_discovery_method', methods=['POST'])
def get_discovery_method():
    data = request.get_json()
    min_ra = data.get('min_ra')
    max_ra = data.get('max_ra')
    min_dec = data.get('min_dec')
    max_dec = data.get('max_dec')
    disc_year = data.get('disc_year')
    discovery_method = data.get('discoverymethod')
    disc_facility = data.get('disc_facility')
    filter_data = [{"disc_year":disc_year}, {"disc_facility": disc_facility}]

    combined_json = filter_scatterplot_data(min_ra, max_ra, min_dec, max_dec, columns=['discoverymethod'], data_type='discoverymethod', filter_data=filter_data)

    combined_json['discoverymethod'] = dict(Counter(item['discoverymethod'] for item in combined_json['discoverymethod']))
    return combined_json

@app.route('/get_pcp_plot_data', methods=['POST'])
def get_pcp_plot_data():
    data = request.get_json()
    min_ra = data.get('min_ra')
    max_ra = data.get('max_ra')
    min_dec = data.get('min_dec')
    max_dec = data.get('max_dec')
    disc_year = data.get('disc_year')
    discovery_method = data.get('discoverymethod')
    disc_facility = data.get('disc_facility')
    filter_data = [{"disc_year":disc_year}, {"discoverymethod":discovery_method}, {"disc_facility": disc_facility}]

    columns = ['sy_snum', 'sy_pnum', 'sy_dist', 'st_logg', 'pl_eqt', 'pl_orbeccen', 'pl_bmasse', 'pl_rade', 'pl_insol', 'pl_orbper', 'st_rad', 'sy_vmag', 'cluster']
    combined_json = filter_scatterplot_data(min_ra, max_ra, min_dec, max_dec, columns=columns, filter_data=filter_data)
    combined_json['exoplanets'] = [{column_names.get(k, k): v for k, v in d.items()} for d in combined_json['exoplanets']]

    combined_json = {
        'data': combined_json['exoplanets'],
        'cluster_ids': [i['DBSCAN cls'] for i in combined_json['exoplanets']]
    }
    return combined_json


@app.route('/get_treemap_data', methods=["POST"])
def get_treemap_data():
    data = request.get_json()
    min_ra = data.get('min_ra')
    max_ra = data.get('max_ra')
    min_dec = data.get('min_dec')
    max_dec = data.get('max_dec')
    disc_year = data.get('disc_year')
    discovery_method = data.get('discoverymethod')
    disc_facility = data.get('disc_facility')
    filter_data = [{"disc_year":disc_year}, {"discoverymethod": discovery_method}]

    combined_json = filter_scatterplot_data(min_ra, max_ra, min_dec, max_dec, columns=['disc_facility'], data_type='disc_facility', filter_data=filter_data)

    combined_json['disc_facility'] = dict(Counter(item['disc_facility'] for item in combined_json['disc_facility']))
    return combined_json

if __name__ == '__main__':
    app.run(debug=True)