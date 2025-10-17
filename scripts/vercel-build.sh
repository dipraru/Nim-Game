#!/bin/sh
set -e
echo "=== Starting vercel-build.sh ==="
echo "Node: $(node -v)"
echo "Npm: $(npm -v)"
echo "Running clean install in frontend..."
npm --prefix frontend ci
echo "Installed frontend packages. Listing .bin:"
ls -la frontend/node_modules/.bin || true
echo "Listing frontend dist (before build):"
ls -la frontend/dist || true
echo "Running frontend build..."
npm --prefix frontend run build
echo "Listing frontend dist (after build):"
ls -la frontend/dist || true
echo "=== vercel-build.sh finished ===" 
