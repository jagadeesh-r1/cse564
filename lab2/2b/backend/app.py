# MDS plots (numerical data dimensions only) 
# (a) construct the data MDS plot (use the Euclidian distance) and 
# visualize it via a scatterplot (use metric MDS – python 
# sklearn.manifold.MDS) 
# color the points by cluster ID (see task 3 in Lab 2(A) ) 
# (b) construct the variables’ MDS plot (use the (1-|correlation|) 
# distance) and visualize it via a scatterplot (also here, use metric MDS)

# dataset at autos.csv
# columns: symboling,make,fuel_type,aspiration,num_of_doors,body_style,drive_wheels,engine_location,wheel_base,length,width,height,curb_weight,engine_type,num_of_cylinders,engine_size,fuel_system,bore,stroke,compression_ratio,horsepower,peak_rpm,city_mpg,highway_mpg,price


import pandas as pd
import numpy as np
from sklearn.manifold import MDS
import matplotlib.pyplot as plt
from flask import Flask, request, jsonify
from flask_cors import CORS
from sklearn.cluster import KMeans
from kneed import KneeLocator
import json

# Load the data
data = pd.read_csv('autos.csv')
data = data.dropna()
data = data.rename(columns={'symboling': 'Symboling', 'make': 'Make', 'fuel_type': 'Fuel_Type', 'aspiration': 'Aspiration', 'num_of_doors': 'Num_of_Doors', 'body_style': 'Body_Style', 'drive_wheels': 'Drive_Wheels', 'engine_location': 'Engine_Location', 'wheel_base': 'Wheel_Base', 'length': 'Length', 'width': 'Width', 'height': 'Height', 'curb_weight': 'Curb_Weight', 'engine_type': 'Engine_Type', 'num_of_cylinders': 'Num_of_Cylinders', 'engine_size': 'Engine_Size', 'fuel_system': 'Fuel_System', 'bore': 'Bore', 'stroke': 'Stroke', 'compression_ratio': 'Compression_Ratio', 'horsepower': 'Horsepower', 'peak_rpm': 'Peak_RPM', 'city_mpg': 'City_MPG', 'highway_mpg': 'Highway_MPG', 'price': 'Price'})

complete_data = data.copy()

# Select numerical columns
data = data.select_dtypes(include=[np.number])

# use kmeans to cluster the data
from sklearn.cluster import KMeans
kmeans = KMeans(n_clusters=6)
data['cluster_id'] = kmeans.fit_predict(data)

# Normalize the data
data = (data - data.mean()) / data.std()

# MDS for data
mds = MDS(n_components=2, dissimilarity='euclidean')
data_mds = mds.fit_transform(data)

# Plot the data MDS
cluster_ids = data['cluster_id']  # Assuming you have a column named 'cluster_id' in your data
# plt.scatter(data_mds[:, 0], data_mds[:, 1], c=cluster_ids)
# plt.title('Data MDS')
# plt.show()

# MDS for variables
correlation = data.corr()
variables_mds = MDS(n_components=2, dissimilarity='precomputed')
variables_mds = variables_mds.fit_transform(1 - np.abs(correlation))

# get the variable names
variable_names = correlation.columns

# Plot the variables MDS
# plt.scatter(variables_mds[:, 0], variables_mds[:, 1])
# for i, name in enumerate(variable_names):
#     plt.annotate(name, (variables_mds[i, 0], variables_mds[i, 1]))
# plt.title('Variables MDS')
# plt.show()


app = Flask(__name__)
CORS(app)

def find_best_k(dataframe, increment=0, decrement=0):
    """Find the best k value for KMeans clustering using the elbow method."""
        
    sse = {}
    # _k = min of 21 or norm.shape[0]+1
    _k = min(15, dataframe.shape[0]+1)
    for k in range(1, _k):
        # print("Current k: ", k)
        kmeans = KMeans(n_clusters=k, random_state=1)
        kmeans.fit(dataframe)
        sse[k] = kmeans.inertia_
    return KneeLocator(list(sse.keys()), list(sse.values()), curve='convex', direction='decreasing').elbow

def calculate_kmeans_elbow(dataframe, increment=0, decrement=0):
    """Calculate the k value for KMeans clustering using the elbow method."""
    # calculate k-means clustering
    from sklearn.preprocessing import Normalizer
    scaler = Normalizer()
    dataframe = pd.DataFrame(scaler.fit_transform(dataframe), columns=dataframe.columns)

    k = find_best_k(dataframe, increment, decrement)
    mse_errors = []
    for i in range(1, 15):
        kmeans = KMeans(n_clusters=i, random_state=0)
        kmeans.fit(dataframe)
        mse_errors.append(kmeans.inertia_)
    return k, mse_errors

def default(o):
    if isinstance(o, np.int64): return int(o)  
    raise TypeError

@app.route('/mds_variable', methods=['POST'])
def mds():
    return jsonify({
        # 'data': data_mds.tolist(),
        'variables': variables_mds.tolist(),
        'variable_names': variable_names.tolist()
    })

@app.route('/mds_data', methods=['POST'])
def mds_data():
    # get selected dimensions from the request
    global cluster_ids
    selected_clusters = request.json['selectedBars']
    if selected_clusters:
        kmeans = KMeans(n_clusters=selected_clusters[0])
        data['cluster_id'] = kmeans.fit_predict(data)
        cluster_ids = data['cluster_id']

    return jsonify({
        'data': data_mds.tolist(),
        'cluster_ids': cluster_ids.tolist()
    })

@app.route('/kmeans', methods=['POST'])
def kmeans():
    k, mse_errors = calculate_kmeans_elbow(data, 0, 0)

    response = {
        "k": k,
        "mse_errors": mse_errors
    }
    return json.dumps(response, default=default)


@app.route('/parallel_coordinates', methods=['POST'])
def parallel_coordinates():
    global cluster_ids
    selected_clusters = request.json['selectedBars']
    selected_columns = request.json['selectedColumns']
    if selected_clusters:
        kmeans = KMeans(n_clusters=selected_clusters[0])
        data['cluster_id'] = kmeans.fit_predict(data)
        cluster_ids = data['cluster_id']
    if selected_columns:
        selected_data = complete_data[selected_columns]
    else:
        selected_data = complete_data
    return jsonify({
        'data': selected_data.to_dict(orient='records'),
        'cluster_ids': cluster_ids.tolist()
    })

if __name__ == '__main__':
    app.run(port=5000, debug=True)