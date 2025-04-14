from pathlib import Path
import geopandas
import pandas
from pyarrow import feather
from lonboard._geoarrow.geopandas_interop import geopandas_to_geoarrow
from shapely import Polygon, Point
import time

GRID_SIZE = 0.25

BASE_FILENAME = "04APR_CHL5D_6MFORECAST_norm"
PARQUET_FILE = f"{BASE_FILENAME}.parquet"
DATA_FOLDER = "data"
URL = f"https://minio.dive.edito.eu/project-chlorophyll/{PARQUET_FILE}"
LOCAL_PATH_TO_PARQUET_FILE = Path(DATA_FOLDER) / Path(PARQUET_FILE)
CHL_COLUMN = "CHL"

def create_polygon(point: Point):    
    half_size = GRID_SIZE / 2
    lon = point.x
    lat = point.y 
    return Polygon([    
        (lon - half_size, lat - half_size),    
        (lon + half_size, lat - half_size),    
        (lon + half_size, lat + half_size),    
        (lon - half_size, lat + half_size),    
        (lon - half_size, lat - half_size)  # Close the polygon    
    ])
    
def main():
    if not LOCAL_PATH_TO_PARQUET_FILE.exists():
        msg = f"Please download file to this directory from {URL=}."
        raise ValueError(msg)

    gdf = geopandas.read_parquet(LOCAL_PATH_TO_PARQUET_FILE).dropna()    
    print(f"Total number of rows: {len(gdf)}")
    start_time = time.time()
    gdf["geometry"] = gdf["geometry"].map(create_polygon)
    map_time = time.time() - start_time
    print(f"Geometry column converted as Polygon after {map_time:.5f} seconds")
    
    unique_times = gdf.time.unique()
    for unique_time in unique_times:
        unique_time: pandas.Timestamp
        gdf_by_time = gdf[gdf['time'] == unique_time]
        table = geopandas_to_geoarrow(gdf_by_time, preserve_index=False)
        destination = Path(DATA_FOLDER) / Path(f"{BASE_FILENAME}-{unique_time.date()}.feather")
        feather.write_feather(
            table, destination, compression="uncompressed"
        )

if __name__ == "__main__":
    main()
