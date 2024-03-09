# get iris data from openml
from sklearn.datasets import fetch_openml
import numpy as np
from sklearn.decomposition import PCA

# get iris data
iris = fetch_openml(name='iris', version=1)


# calculate eigenvalues and eigenvectors

# get iris data
X = iris.data
y = iris.target
target_names = iris.target_names

print(X)
print(y)
print(target_names)

print(type(X))

# calculate eigenvalues and eigenvectors
pca = PCA()
pca.fit(X)

# get eigenvalues
eigenvalues = pca.explained_variance_

# get eigenvectors
eigenvectors = range(pca.n_components_)

# calculate explained variance
explained_variance = pca.explained_variance_ratio_ * 100

# calculate cumulative explained variance
cumulative_explained_variance = np.cumsum(explained_variance) 
# plot scree plot
import matplotlib
matplotlib.use('TkAgg')

import matplotlib.pyplot as plt

# plot scree plot
plt.bar(eigenvectors , explained_variance, label='Individual')
plt.title('Scree Plot')
plt.xlabel('Principal Component')
plt.ylabel('Explained Variance')

# add explained variance as curve
plt.plot(eigenvectors, cumulative_explained_variance, label='Cumulative')



plt.savefig('scree_plot.png')
# plt.show()


# create biplot with top 2 principal components
# get top 2 principal components
pca = PCA(n_components=2)
pca.fit(X)
X_r = pca.transform(X)

# create biplot with top 2 principal components
plt.figure()
colors = ['navy', 'turquoise', 'darkorange']
lw = 2

for color, i, target_name in zip(colors, [0, 1, 2], target_names):
    plt.scatter(X_r[y == i, 0], X_r[y == i, 1], color=color, alpha=.8, lw=lw,
                label=target_name)
plt.legend(loc='best', shadow=False, scatterpoints=1)
plt.title('PCA of IRIS dataset')

# add vectors
for i in range(pca.components_.shape[1]):
    plt.arrow(0, 0, pca.components_[0, i], pca.components_[1, i],
              color='k', alpha=0.8, linewidth=2, label='Eigenvectors', linestyle='--')
    plt.text(pca.components_[0, i] * 1.15, pca.components_[1, i] * 1.15,
                iris.feature_names[i], color='k', ha='center', va='center', fontsize=10)

plt.xlabel('Principal Component 1')
plt.ylabel('Principal Component 2')
plt.xlim(-1, 1)
plt.ylim(-1, 1)
plt.grid()
plt.tight_layout()

# add data points to biplot
for i in range(X_r.shape[0]):
    plt.text(X_r[i, 0], X_r[i, 1], str(i), color='black', ha='center', va='center', fontsize=8)
    
plt.savefig('biplot.png')

# plt.show()


# create a scatterplot matrix
import seaborn as sns
import pandas as pd

# create a scatterplot matrix
iris_df = pd.DataFrame(X, columns=iris.feature_names)
iris_df['species'] = y
sns.pairplot(iris_df, hue='species')
plt.savefig('scatterplot_matrix.png')
# plt.show()

# calculate k-means clustering
from sklearn.cluster import KMeans

# calculate k-means clustering
kmeans = KMeans(n_clusters=3, random_state=0)
kmeans.fit(X)

# add cluster labels to iris_df
iris_df['cluster'] = kmeans.labels_

# create a scatterplot with k-means cluster centers
sns.pairplot(iris_df, hue='cluster')
plt.savefig('kmeans_cluster.png')
plt.show()


