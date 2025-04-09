from pathlib import Path
import geopandas
import pyarrow
from pyarrow import feather
from lonboard._geoarrow.geopandas_interop import geopandas_to_geoarrow
from lonboard.colormap import apply_continuous_cmap
from palettable.cartocolors.sequential import BluGrn_6

filename = "03MAR_CHL5D_6MFORECAST"
parquet_file = f"{filename}.parquet"
url = f"https://minio.dive.edito.eu/project-chlorophyll/{parquet_file}"
path = Path(parquet_file)
chl_column = "CHL"

def main():
    if not path.exists():
        msg = f"Please download file to this directory from {url=}."
        raise ValueError(msg)

    gdf = geopandas.read_parquet(path)
    gdf = gdf[gdf['time'] == "2025-03-01"].dropna()

    table = geopandas_to_geoarrow(gdf, preserve_index=False)

    min_bound = gdf[chl_column].min()
    max_bound = gdf[chl_column].max()
    chl = gdf[chl_column]
    normalized_chl = (chl - min_bound) / (max_bound - min_bound)

    colors = apply_continuous_cmap(normalized_chl, BluGrn_6)
    table = table.append_column(
        "colors", pyarrow.FixedSizeListArray.from_arrays(colors.flatten("C"), 3)
    )

    feather.write_feather(
        table, f"{filename}.feather", compression="uncompressed"
    )

if __name__ == "__main__":
    main()
