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

# Create upload directory as root before switching to non-root user
RUN mkdir -p /app/uploads && chmod 777 /app/uploads

RUN addgroup -S spring && adduser -S spring -G spring

COPY --from=builder /app/target/*.jar app.jar

USER spring:spring

# Render sets PORT env (default 10000)
ENV SERVER_PORT=${PORT:-10000}
ENV PORT=${PORT:-10000}

EXPOSE 10000

# exec form: java is PID 1 so Render port scanner can detect it
# Note: env vars from Render may contain trailing newlines, strip them via shell wrapper
ENTRYPOINT ["/bin/sh", "-c", "java -XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -XX:InitialRAMPercentage=50.0 -XX:+UseSerialGC -XX:+TieredCompilation -XX:TieredStopAtLevel=1 -Djava.security.egd=file:/dev/./urandom -Dserver.port=${PORT:-10000} -jar app.jar"]
