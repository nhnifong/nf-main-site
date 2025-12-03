# Use a lightweight Python base image
FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Prevent Python from writing pyc files to disc
ENV PYTHONDONTWRITEBYTECODE 1
# Prevent Python from buffering stdout and stderr
ENV PYTHONUNBUFFERED 1

# Install system dependencies if needed (e.g. for psycopg2 build)
# RUN apt-get update && apt-get install -y libpq-dev gcc && rm -rf /var/lib/apt/lists/*

# Copy requirements first to leverage Docker cache
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
# Assumes Dockerfile is at project root and code is in ./app
COPY . .

# Expose the port uvicorn will run on
EXPOSE 8080

# Run the application
# We use the module syntax 'app.main:app' assuming the parent directory is the build context
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]