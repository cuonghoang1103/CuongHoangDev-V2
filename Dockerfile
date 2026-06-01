# ─────────────────────────────────────────────
# Stage 1: Build
# ─────────────────────────────────────────────
FROM maven:3.9-eclipse-temurin-21-alpine AS builder

WORKDIR /app

COPY pom.xml .
RUN mvn dependency:go-offline -B

COPY src ./src
RUN mvn package -DskipTests -B

# ─────────────────────────────────────────────
# Stage 2: Runtime
# ─────────────────────────────────────────────
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Install wget for healthcheck (Alpine JRE image may not have it)
RUN apk add --no-cache wget > /dev/null 2>&1 || true

# Run as non-root
RUN addgroup -S spring && adduser -S spring -G spring

COPY --from=builder /app/target/*.jar app.jar

USER spring:spring

# Render sets PORT env var (default 10000). Spring Boot reads SERVER_PORT.
ENV SERVER_PORT=${PORT:-10000}

EXPOSE 10000

# Healthcheck - Render port is always 10000 in free tier
HEALTHCHECK --interval=30s --timeout=10s --start-period=90s --retries=5 \
  CMD wget -qO- http://localhost:10000/api/v1/system/health || exit 1

ENTRYPOINT ["sh", "-c", "java -Dserver.port=${PORT:-10000} -jar app.jar"]
