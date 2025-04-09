from pathlib import Path

import geopandas as gpd
import pandas as pd
import pyarrow as pa
import pyarrow.feather as feather
from lonboard._geoarrow.geopandas_interop import geopandas_to_geoarrow
from lonboard.colormap import apply_continuous_cmap
from palettable.colorbrewer.diverging import BrBG_10

filename = "03MAR_CHL5D_6MFORECAST.parquet"
url = f"https://minio.dive.edito.eu/project-chlorophyll/{filename}"
path = Path(filename)
chl_column = "CHL"

def main():
    if not path.exists():
        msg = f"Please download file to this directory from {url=}."
        raise ValueError(msg)

    gdf = gpd.read_parquet(path)
    table = geopandas_to_geoarrow(gdf, preserve_index=False)

    min_bound = gdf[chl_column].min()
    max_bound = gdf[chl_column].max()
    chl = gdf[chl_column]
    normalized_chl = (chl - min_bound) / (max_bound - min_bound)

    colors = apply_continuous_cmap(normalized_chl, BrBG_10)
    table = table.append_column(
        "colors", pa.FixedSizeListArray.from_arrays(colors.flatten("C"), 3)
    )

    feather.write_feather(
        table, f"{filename}.feather", compression="uncompressed"
    )


if __name__ == "__main__":
    main()
