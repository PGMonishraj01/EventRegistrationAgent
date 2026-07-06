# Build stage
FROM maven:3.8.8-eclipse-temurin-17 AS build
WORKDIR /workspace/app

# Copy pom.xml and source code
COPY pom.xml .
COPY src src

# Package the application
RUN mvn clean package -DskipTests

# Run stage
FROM eclipse-temurin:17-jre-alpine
VOLUME /tmp
WORKDIR /app
COPY --from=build /workspace/app/target/eventregistration-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8081

# Run the jar file
ENTRYPOINT ["java", "-jar", "app.jar"]
