
# first stage builds frontend and stores it in /dist
FROM node:20 as build-frontend
WORKDIR /app

# Copy the shared protos first
COPY ./protos ./protos

# Setup frontend directory (nf-viz)
WORKDIR /app/nf-viz
COPY ./nf-viz/package.json ./nf-viz/package-lock.json ./
RUN npm install

# Copy source
COPY ./nf-viz .

# build
# This should successfully find "../protos" relative to "/app/nf-viz"
RUN npm run build

# Use a lightweight Python base image
FROM python:3.10-slim

# Set working directory to /app (This is the container root)
WORKDIR /app

# Prevent Python from writing pyc files to disc
ENV PYTHONDONTWRITEBYTECODE 1
# Prevent Python from buffering stdout and stderr
ENV PYTHONUNBUFFERED 1

# Install dependencies
# We copy requirements.txt from the host root to the container root
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the backend code
# This copies the local 'app' folder
COPY app ./app

COPY --from=build-frontend /app/nf-viz/dist ./nf-viz/dist

# list what is in the docker filesystem to aid in debugging.
RUN echo "=== FILE LISTING START ===" && \
    find . -maxdepth 4 -not -path '*/.*' && \
    echo "=== FILE LISTING END ==="

# Expose the port backend listens on
EXPOSE 8080

# Run the application
# We run from /app, so uvicorn looks for the 'app' package, then 'main' module
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]