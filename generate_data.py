from pathlib import Path
import geopandas
import pandas
import pyarrow
from pyarrow import feather
from lonboard._geoarrow.geopandas_interop import geopandas_to_geoarrow
from lonboard.colormap import apply_continuous_cmap
from palettable.cartocolors.sequential import BluGrn_6

base_filename = "03MAR_CHL5D_6MFORECAST"
parquet_file = f"{base_filename}.parquet"
url = f"https://minio.dive.edito.eu/project-chlorophyll/{parquet_file}"
path = Path(parquet_file)
chl_column = "CHL"


def main():
    if not path.exists():
        msg = f"Please download file to this directory from {url=}."
        raise ValueError(msg)

    gdf = geopandas.read_parquet(path).sort_values(by=["time"])
    
    unique_times = gdf.time.unique()
    for time in unique_times:
        time: pandas.Timestamp
        gdf_by_time = gdf[gdf['time'] == time].dropna()

        table = geopandas_to_geoarrow(gdf_by_time, preserve_index=False)

        min_bound = gdf_by_time[chl_column].min()
        max_bound = gdf_by_time[chl_column].max()
        chl = gdf_by_time[chl_column]
        normalized_chl = (chl - min_bound) / (max_bound - min_bound)

        colors = apply_continuous_cmap(normalized_chl, BluGrn_6)
        table = table.append_column(
            "colors", pyarrow.FixedSizeListArray.from_arrays(colors.flatten("C"), 3)
        )

        feather.write_feather(
            table, f"{base_filename}-{time.date()}.feather", compression="uncompressed"
        )

if __name__ == "__main__":
    main()
