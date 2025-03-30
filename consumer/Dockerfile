# Use an official Python runtime as the base image
FROM python:3.9-slim

# Set the working directory in the container
WORKDIR /app

# Copy the requirements file into the container
COPY requirements.txt /app/

# Install any dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of your application files into the container
COPY . /app/

# Expose the port Cloud Run will use
EXPOSE 8080

# Define environment variable
ENV FLASK_APP=main.py

# Command to run the application
CMD ["flask", "run", "--host=0.0.0.0", "--port=8080"]
