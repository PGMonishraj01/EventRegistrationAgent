package com.eventagent.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;
import org.springframework.core.env.Environment;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import javax.sql.DataSource;
import java.net.URI;

@Configuration
public class DatabaseConfig {

    @Autowired
    private Environment env;

    @Bean
    @Primary
    public DataSource dataSource(DataSourceProperties properties) {
        // Read directly from Environment or System env to bypass any binding errors
        String url = env.getProperty("spring.datasource.url");
        if (url == null || url.trim().isEmpty() || url.contains("${")) {
            url = System.getenv("DATABASE_URL");
            if (url == null || url.trim().isEmpty()) {
                url = System.getenv("DB_URL");
            }
        }

        String username = env.getProperty("spring.datasource.username");
        if (username == null || username.contains("${")) {
            username = System.getenv("DB_USERNAME");
        }

        String password = env.getProperty("spring.datasource.password");
        if (password == null || password.contains("${")) {
            password = System.getenv("DB_PASSWORD");
        }

        String driverClassName = env.getProperty("spring.datasource.driver-class-name");
        if (driverClassName == null || driverClassName.contains("${")) {
            driverClassName = System.getenv("DB_DRIVER");
        }

        System.out.println("[DatabaseConfig] Resolved url: " + url + ", driver: " + driverClassName);

        if (url != null && (url.startsWith("postgres://") || url.startsWith("postgresql://"))) {
            try {
                String cleanUrl = url.replace("postgres://", "http://").replace("postgresql://", "http://");
                URI uri = new URI(cleanUrl);
                
                String host = uri.getHost();
                int port = uri.getPort();
                String path = uri.getPath();
                String userInfo = uri.getUserInfo();
                
                url = "jdbc:postgresql://" + host + (port != -1 ? ":" + port : "") + path;
                driverClassName = "org.postgresql.Driver";
                
                if (userInfo != null && userInfo.contains(":")) {
                    String[] parts = userInfo.split(":", 2);
                    username = parts[0];
                    password = parts[1];
                }
                
                System.out.println("[DatabaseConfig] Parsed Postgres URL successfully: " + url);
            } catch (Exception e) {
                System.err.println("[DatabaseConfig] Failed to parse Postgres URL: " + e.getMessage());
                url = "jdbc:" + url;
                driverClassName = "org.postgresql.Driver";
            }
        }

        // Fallbacks if null
        if (url == null) {
            url = properties.getUrl();
        }
        if (username == null) {
            username = properties.getUsername();
        }
        if (password == null) {
            password = properties.getPassword();
        }
        if (driverClassName == null) {
            driverClassName = properties.getDriverClassName();
        }

        System.out.println("[DatabaseConfig] Creating DataSource - url: " + url + ", driver: " + driverClassName + ", user: " + username);

        return properties.initializeDataSourceBuilder()
                .url(url)
                .username(username)
                .password(password)
                .driverClassName(driverClassName)
                .build();
    }
}
