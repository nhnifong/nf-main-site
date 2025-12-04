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

# 2. Copy the Application Code
# This copies the local 'app' folder
COPY app ./app

# Expose the port
EXPOSE 8080

# Run the application
# We run from /app, so uvicorn looks for the 'app' package, then 'main' module
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]