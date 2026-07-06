package com.eventagent.config;

import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import javax.sql.DataSource;
import java.net.URI;

@Configuration
public class DatabaseConfig {

    @Bean
    @Primary
    public DataSource dataSource(DataSourceProperties properties) {
        String url = properties.getUrl();
        String username = properties.getUsername();
        String password = properties.getPassword();
        String driverClassName = properties.getDriverClassName();

        if (url != null && (url.startsWith("postgres://") || url.startsWith("postgresql://"))) {
            try {
                // Clean the scheme to parse as java.net.URI
                String cleanUrl = url.replace("postgres://", "http://").replace("postgresql://", "http://");
                URI uri = new URI(cleanUrl);
                
                String host = uri.getHost();
                int port = uri.getPort();
                String path = uri.getPath();
                String userInfo = uri.getUserInfo();
                
                // Construct standard jdbc url: jdbc:postgresql://host:port/database
                url = "jdbc:postgresql://" + host + (port != -1 ? ":" + port : "") + path;
                driverClassName = "org.postgresql.Driver";
                
                if (userInfo != null && userInfo.contains(":")) {
                    String[] parts = userInfo.split(":", 2);
                    username = parts[0];
                    password = parts[1];
                }
            } catch (Exception e) {
                // Fallback to simple prepending if parsing fails
                url = "jdbc:" + url;
                driverClassName = "org.postgresql.Driver";
            }
        }

        return properties.initializeDataSourceBuilder()
                .url(url)
                .username(username)
                .password(password)
                .driverClassName(driverClassName)
                .build();
    }
}
