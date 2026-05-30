#!/bin/bash
# Start backend with correct database (host PostgreSQL on port 5432)

cd /Users/admin/Downloads/api-backend

export SPRING_DATASOURCE_URL="jdbc:postgresql://localhost:5432/cuonghoangdev_db"
export SPRING_DATASOURCE_USERNAME="postgres"
export SPRING_DATASOURCE_PASSWORD="123456"
export SPRING_DATA_REDIS_HOST="localhost"
export SPRING_DATA_REDIS_PORT="6379"

echo "Starting backend on port 8082 with database: $SPRING_DATASOURCE_URL"
mvn spring-boot:run
