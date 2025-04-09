## Example: Use `@geoarrow/deck.gl-layers` with GeoArrow point data

## Data for example:

```
wget https://minio.dive.edito.eu/project-chlorophyll/03MAR_CHL5D_6MFORECAST.parquet
poetry install
poetry run python generate_data.py
```

## Serve data

```
npx http-server --cors
```

## Usage

To install dependencies:

```bash
npm install
# or
yarn
```

Commands:

* `npm start` is the development target, to serve the app and hot reload.
* `npm run build` is the production target, to create the final bundle and write to disk.
