#!/bin/bash

# Build and Run Script for Sarla Tea Estates CRM
# This script builds the React frontend and Spring Boot backend together

set -e  # Exit on error

echo "================================"
echo "Building Sarla Tea Estates CRM"
echo "================================"
echo ""

# Clean previous builds
echo "🧹 Cleaning previous builds..."
mvn clean

# Build the application (this will build React and Spring Boot)
echo ""
echo "🔨 Building application (React + Spring Boot)..."
mvn package -DskipTests

# Run the application
echo ""
echo "🚀 Starting application on http://localhost:8080"
echo "   Frontend: http://localhost:8080"
echo "   API: http://localhost:8080/api"
echo ""
echo "Press Ctrl+C to stop the application"
echo ""

java -jar target/sarla-tea-estates-crm-1.0.0.jar --spring.profiles.active=dev

