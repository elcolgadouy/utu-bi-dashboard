uvicorn backend.api:app --host 0.0.0.0 --port 8000 &
cd frontend && npm install && npm run build && npm run preview -- --host 0.0.0.0 --port 5174
