import pandas as pd
import os

def profile_file(filename):
    print(f"--- Profiling {filename} ---")
    try:
        # Solo leemos las primeras 5 filas para evitar problemas de memoria
        df = pd.read_excel(filename, nrows=5)
        print(f"Columns: {df.columns.tolist()}")
        print("\nFirst 5 rows:")
        print(df)
        print("-" * 30)
    except Exception as e:
        print(f"Error reading {filename}: {e}")

# Cambiar al directorio de datos
data_dir = r"c:\Users\damia\Desktop\Proyecto BI\data"
files = [f for f in os.listdir(data_dir) if f.endswith('.xlsx')]

for f in files:
    profile_file(os.path.join(data_dir, f))
