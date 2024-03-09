import pandas as pd
import numpy as np

# Load the data
df = pd.read_csv('pca/autos.csv')

# Generate new data
new_data = pd.DataFrame()

for column in df.columns:
    if df[column].dtype == np.number:
        mean = df[column].mean()
        std = df[column].std()
        new_data[column] = np.around(np.random.normal(mean, std, size=len(df)), 2)
    else:
        new_data[column] = np.random.choice(df[column], size=len(df))

# Save the new data to a CSV file
new_data.to_csv('autos_generated.csv', index=False)