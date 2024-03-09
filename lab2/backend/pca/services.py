"""
Task 1: basic dimension reduction and data visualization with PCA 
- use PCA to compute the Eigenvectors of the data and visualize the Eigenvalues as a scree plot 
- add an interaction element into the scree plot that allows the user to mark and select the intrinsic dimensionality index (di) 
- plot the data into a PCA-based biplot  

Task 2: visualize the data with a scatterplot matrix  
- use the PCA components ≤di  to obtain the 4 attributes with the highest squared sum of PCA loadings and list them in a table on the webpage  
- use these four attributes and construct a scatterplot matrix 

Task 3: use k-means to find clusters and color the points by cluster ID 
- use the elbow method to find the best k (visualize the function on k) make it interactible for the user to select the k

Possible work flow:
Upon loading of the dataset, using all numerical attributes  
- Compute PCA and obtain Eigenvectors and Eigenvalues 
- Compute clusters for k=1…10, and for each k (1) keep the MSE score and (2) store each point’s cluster ID into a dedicated column 

Construct initial displays 
- Display PCA scree plot as a bar chart and set the initial intrinsic dimensionality as the elbow of the plot; color the respective bar 
- Display k-means MSE plot as a bar chart; set the initial k as the elbow point and color the respective bar 
- Display biplot and color the points by the set initial k 
- Display scatterplot matrix where the attributes are chosen using the initial intrinsic dimensionality and color the points according to the initial k 

Support user interactions 
- User can choose a different intrinsic dimensionality in the scree plot by coloring the respective bar 
- User can choose a different k in the k-means MSE plot, again by coloring the respective bar 

Make observations 
- Observe what happens when you make these changes 

Additional optional observations 
- Observe what happens in the biplot when different PCA vectors are chosen as the projection  basis 
- You could choose them in the scree plot by coloring the respective two bars  or choosing a different visual marking (bold bar outline)  
- It will have an effect on the quality of the display (you can keep the k as chosen)  

Implementations:

use redis to store the data and the results of the computations to reduce the load on the server
use flask to serve the webpage and the data
use d3.js to visualize the data
use sklearn to compute PCA and k-means
use numpy to compute the Eigenvectors and Eigenvalues
send the data to the server using a POST request

dataset: /home/jaggu/viz/lab2/backend/pca/autos.csv
columns: symboling,make,fuel_type,aspiration,num_of_doors,body_style,drive_wheels,engine_location,wheel_base,length,width,height,curb_weight,engine_type,num_of_cylinders,engine_size,fuel_system,bore,stroke,compression_ratio,horsepower,peak_rpm,city_mpg,highway_mpg,price


"""

import os
import redis
import numpy as np
import pandas as pd
from sklearn import mixture
from sklearn.cluster import KMeans
from sklearn.decomposition import PCA
from sklearn.metrics import mean_squared_error
from sklearn.preprocessing import StandardScaler

dataset = pd.read_csv('pca/bike-sharing.csv')
dataset = dataset.drop(columns=['instant', 'dteday'])

# Task 1: basic dimension reduction and data visualization with PCA
# use PCA to compute the Eigenvectors of the data and visualize the Eigenvalues as a scree plot

# standardize the data
scaler = StandardScaler()
scaler.fit(dataset)
scaled_data = scaler.transform(dataset)

# compute PCA
pca = PCA()
pca.fit(scaled_data)

# compute the Eigenvectors and Eigenvalues
eigenvectors = pca.components_
eigenvalues = pca.explained_variance_

# visualize the Eigenvalues as a scree plot
screeplot = eigenvalues.tolist()

# Task 2: visualize the data with a scatterplot matrix
# use the PCA components ≤di  to obtain the 4 attributes with the highest squared sum of PCA loadings and list them in a table on the webpage
# use these four attributes and construct a scatterplot matrix

# get the intrinsic dimensionality index (di)
di = 3

# get the PCA components ≤di
pca_components = pca.components_[:di]

# obtain the 4 attributes with the highest squared sum of PCA loadings
attributes = np.argsort(np.sum(pca_components**2, axis=0))[-4:]

# use these four attributes and construct a scatterplot matrix
scatterplot_matrix = dataset.iloc[:, attributes]

# Task 3: use k-means to find clusters and color the points by cluster ID
# use the elbow method to find the best k (visualize the function on k) make it interactible for the user to select the k

# use k-means to find clusters
kmeans = KMeans(n_clusters=10)
kmeans.fit(scaled_data)
clusters = kmeans.predict(scaled_data)

# use the elbow method to find the best k
mse = []
for k in range(1, 11):
    kmeans = KMeans(n_clusters=k)
    kmeans.fit(scaled_data)
    clusters = kmeans.predict(scaled_data)
    mse.append(mean_squared_error(scaled_data, kmeans.cluster_centers_[clusters]))

# make it interactible for the user to select the k
elbow = np.argmin(mse) + 1

# store the results of the computations
results = {
    "screeplot": screeplot,
    "attributes": attributes.tolist(),
    "scatterplot_matrix": scatterplot_matrix.to_dict(orient="list"),
    "clusters": clusters.tolist(),
    "mse": mse,
    "elbow": elbow
}

# store the results of the computations in redis
# r = redis.Redis(
#   host='redis-11644.c309.us-east-2-1.ec2.cloud.redislabs.com',
#   port=11644,
#   password=os.environ.get('REDIS_PASSWORD')
# )

# r.set('results', results)

# plot screen plot
import matplotlib.pyplot as plt
plt.plot(screeplot)
plt.show()

# plot scatterplot matrix
import seaborn as sns
sns.pairplot(scatterplot_matrix)
plt.show()

# plot k-means MSE plot
plt.plot(mse)
plt.show()

# plot biplot
from sklearn.decomposition import PCA
import matplotlib.pyplot as plt
import numpy as np

pca = PCA(n_components=2)
pca.fit(scaled_data)
X_pca = pca.transform(scaled_data)

plt.scatter(X_pca[:, 0], X_pca[:, 1], c=clusters, cmap='viridis')
plt.xlabel('First Principal Component')
plt.ylabel('Second Principal Component')
plt.show()
