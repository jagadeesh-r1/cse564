from flask import Flask, jsonify
from flask import request
from flask import render_template
from flask_cors import CORS
import pandas as pd
from sklearn.preprocessing import StandardScaler, MinMaxScaler
from sklearn.decomposition import PCA
from sklearn.cluster import KMeans
from kneed import KneeLocator
import numpy as np
import skdim
from matplotlib import pyplot as plt


app = Flask(__name__)
CORS(app)

dataset = pd.read_csv('pca/autos.csv') # columns: symboling,make,fuel_type,aspiration,num_of_doors,body_style,drive_wheels,engine_location,wheel_base,length,width,height,curb_weight,engine_type,num_of_cylinders,engine_size,fuel_system,bore,stroke,compression_ratio,horsepower,peak_rpm,city_mpg,highway_mpg,price
# drop columns
dataset = dataset.drop(columns=['make', 'fuel_type', 'aspiration', 'num_of_doors', 'body_style', 'drive_wheels', 'engine_location', 'engine_type', 'num_of_cylinders', 'fuel_system'])

# drop rows with missing values
dataset = dataset.dropna()

# scale the values in the  columns 
scaled_data = (dataset - dataset.mean(axis=0)) / dataset.std(axis=0)
# print(scaled_data)
# print(scaled_data.shape)


# calculate PCA
pca = PCA()
pca.fit(scaled_data)



# compute the Eigenvectors and Eigenvalues
eigenvectors = (pca.n_components_)
eigenvalues = pca.explained_variance_
explained_variance = pca.explained_variance_ratio_ * 100
cumulative_explained_variance = np.cumsum(explained_variance) 

feature_names = dataset.columns.tolist()
screeplot = eigenvalues.tolist()

top_attributes_kmeans = None


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

        kn = KneeLocator(
                 x=list(sse.keys()), 
                 y=list(sse.values()), 
                 curve='convex', 
                 direction='decreasing'
                 )
    if kn.knee is not None:
        k = kn.knee + increment - decrement
    else:
        # handle the case where no knee was found
        k = 2
    return k

def calculate_pca_loadings(dataframe, selected_dimensions=5):
    """Calculate the PCA loadings for the given dataframe."""
    global top_attributes_kmeans

    # calculate PCA
    pca = PCA(n_components=selected_dimensions)
    pca.fit(dataframe)
    #  use the PCA components ≤di  to obtain the 4 attributes with the highest squared sum of PCA loadings
    loadings = pca.components_[:selected_dimensions]
    loadings_squared_sum = np.sum(loadings**2, axis=0)
    top_attributes_indices = np.argsort(loadings_squared_sum)[-4:]
    top_attributes = [feature_names[i] for i in top_attributes_indices]

    # print(top_attributes)
    # print(loadings)
    # print(loadings_squared_sum)

    # Calculate the PCA loadings for the first 4 principal components
    loadings = pca.components_[:4]

    # Calculate the sum of squared loadings for each attribute
    loadings_squared_sum = np.sum(loadings**2, axis=0)

    # Round the sum of squared loadings to 2 decimal places
    loadings_squared_sum = np.round(loadings_squared_sum, 2)

    # Get the top 4 attributes with the highest sum of squared loadings
    top_attributes_indices = np.argsort(loadings_squared_sum)[-4:]
    top_attributes = [feature_names[i] for i in top_attributes_indices]

    # Get the loadings for the top 4 attributes and round them to 2 decimal places
    top_loadings = np.round(loadings[:, top_attributes_indices], 2)

    # Create the table
    table = []
    table.append(["Attribute", "Sum of Squared Loadings"])
    top_attributes_kmeans = []
    for i in range(4):
        table.append([top_attributes[i], loadings_squared_sum[top_attributes_indices[i]]])
        top_attributes_kmeans.append(top_attributes[i])
        # for j in range(4):
        #     table.append(["", top_loadings[j][i]])

    # table to html table
    html_table = "<table>"
    for row in table:
        html_table += "<tr>"
        for cell in row:
            html_table += f"<td>{cell}</td>"
        html_table += "</tr>"
    html_table += "</table>"

    return html_table

import json

def biplot(dataframe, selected_dimensions=5):
    # Perform KMeans clustering
    k = selected_dimensions
    kmeans = KMeans(n_clusters=k, random_state=1)
    kmeans.fit(dataframe)
    labels = kmeans.labels_.tolist()
    # print(labels)

    # Perform PCA
    pca = PCA(n_components=selected_dimensions)
    pca.fit(dataframe)
    transformed_data = pca.transform(dataframe).tolist()

    # Get feature loadings
    feature_loadings = pca.components_.T[:, :2].tolist()

    # Create a list of dictionaries, where each dictionary represents a data point
    data = []
    for i in range(len(transformed_data)):
        data_point = {
            'x': transformed_data[i][0],
            'y': transformed_data[i][1],
            'label': labels[i],
            # 'loadings': feature_loadings[i]
        }
        data.append(data_point)

    # Convert the data to JSON
    json_data = json.dumps(data)

    # cluster centers for biplot from transformed_data
    cluster_centers = kmeans.cluster_centers_.tolist()
    for i in range(len(cluster_centers)):
        cluster_centers[i] = {
            'x': cluster_centers[i][0],
            'y': cluster_centers[i][1],
            'label': i
        }
    json_cluster_centers = json.dumps(cluster_centers)
    # Send the JSON data to the frontend
    # print(json_data)
    return json_data, json_cluster_centers


def calculate_kmeans_elbow(dataframe, increment=0, decrement=0):
    """Calculate the k value for KMeans clustering using the elbow method."""
    # calculate k-means clustering
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


@app.route("/scatterplot_matrix", methods=["POST"])
def scatterplot_matrix():
    response = {}
    if top_attributes_kmeans is not None:
        # create a scatterplot matrix for the top 4 attributes with each attribute on the x and y axis
        scatterplot_matrix = scaled_data[top_attributes_kmeans]
        response = {
            "scatterplot_matrix": scatterplot_matrix.to_dict(orient="list")
        }
    return response


@app.route("/kmeans_elbow", methods=["POST"])
def kmeans_elbow():
    k, mse_errors = calculate_kmeans_elbow(scaled_data, 0, 0)
    response = {
        "k": k,
        "mse_errors": mse_errors
    }
    return json.dumps(response, default=default)

@app.route("/pca_loadings", methods=["POST"])
def pca_loadings():
    try:
        biselected_dimensions = max(request.json["biplotselectedBars"]) + 1
        kselected_dimensions = max(request.json["kmeansselectedBars"]) + 1
    except:
        biselected_dimensions = 5
        kselected_dimensions = 5
    biplot_data, biplot_centers = biplot(scaled_data, biselected_dimensions)
    loadings = calculate_pca_loadings(scaled_data, kselected_dimensions)
    response = {
        "loadings": loadings,
        "biplot_data": biplot_data,
        "biplot_centers": biplot_centers,
    }
    return response

@app.route("/generate", methods=["POST"])
def generate():
    intrinsic_dimensionality = find_best_k(scaled_data)

    response = {
        "screeplot": screeplot,
        "cumulative_explained_variance": cumulative_explained_variance.tolist(),
        "intrinsic_dimensionality": int(intrinsic_dimensionality) - 1
    }
    return response

@app.route("/")
def index():
    return render_template("health_check.html")

if __name__ == "__main__":
    # from waitress import serve
    # serve(app, host="0.0.0.0", port=8080)
    app.run(debug=True, host="0.0.0.0", port=8080)