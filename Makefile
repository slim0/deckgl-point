serve-files:
	npx http-server --cors

run-frontend:
	yarn start

generate-data:
	poetry run python generate_data.py