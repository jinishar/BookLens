# Use Python 3.11 slim as base
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1
ENV PORT 8000

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements and install dependencies
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY . /app/

# Create necessary directories
RUN mkdir -p /app/staticfiles /app/media /app/chroma_db

# Expose the port
EXPOSE 8000

# Start script
RUN echo "#!/bin/sh\n\
python manage.py collectstatic --noinput\n\
python manage.py migrate\n\
gunicorn booklens.wsgi:application --bind 0.0.0.0:\$PORT" > /app/start.sh

RUN chmod +x /app/start.sh

CMD ["/app/start.sh"]
