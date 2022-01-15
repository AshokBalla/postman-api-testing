# Postman API Testing (JSONPlaceholder)

This repository contains Postman collections and a Newman integration to run API tests against the JSONPlaceholder demo API.

Requirements
- Node.js (>=14)
- npm

Install dependencies

  npm ci

Run tests locally

  npm test

This runs Newman with the included collection and environment and generates reports in reports/ (HTML and JSON).

Sample Newman CLI (for CI):

  newman run collections/jsonplaceholder-postman-collection.json -e environments/jsonplaceholder-env.json -r cli,htmlextra,json --reporter-htmlextra-export reports/report.html --reporter-json-export reports/report.json

GitHub Actions: A workflow is provided in .github/workflows/newman.yml which runs on push and uploads reports as artifacts.

