// package com.yourmaster.api.config;

// import com.yourmaster.api.security.JwtAuthenticationEntryPoint;
// import com.yourmaster.api.security.JwtAuthenticationFilter;
// import lombok.RequiredArgsConstructor;
// import org.springframework.context.annotation.Bean;
// import org.springframework.context.annotation.Configuration;
// import org.springframework.security.authentication.AuthenticationProvider;
// import org.springframework.security.config.annotation.method.configuration.EnableGlobalMethodSecurity;
// import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
// import org.springframework.security.config.annotation.web.builders.HttpSecurity;
// import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
// import org.springframework.security.config.http.SessionCreationPolicy;
// import org.springframework.security.web.SecurityFilterChain;
// import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
// import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
// import org.springframework.web.cors.CorsConfiguration;

// import java.util.Collections;
// import java.util.List;

// @Configuration
// @EnableWebSecurity
// @EnableMethodSecurity
// @RequiredArgsConstructor
// public class SecurityConfig {
//     private final JwtAuthenticationFilter jwtAuthFilter;
//     private final AuthenticationProvider authenticationProvider;
//     private final JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint;

//     @Bean
//     public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
//         http
//             .csrf(AbstractHttpConfigurer::disable)
//             .cors(cors -> cors.configurationSource(request -> {
//                 var corsConfiguration = new CorsConfiguration();
//                 corsConfiguration.setAllowedOriginPatterns(Collections.singletonList("*"));
//                 corsConfiguration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
//                 corsConfiguration.setAllowedHeaders(List.of("Authorization", "Content-Type"));
//                 corsConfiguration.setAllowCredentials(true);
//                 return corsConfiguration;
//             }))
//             .authorizeHttpRequests(auth -> auth
//                 .requestMatchers("/api/v1/auth/**").permitAll()
//                 .requestMatchers("/api/v1/genres/**").permitAll()
//                 .requestMatchers("/admin/**").hasRole("ADMIN")
//                 .requestMatchers("/swagger-ui/**").permitAll()
//                 .requestMatchers("/v3/api-docs/**").permitAll()
//                 .requestMatchers("/ws/**").permitAll()
//                 .anyRequest().authenticated()
//             )
//             .sessionManagement(sess -> sess.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
//             .authenticationProvider(authenticationProvider)
//             .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

//         return http.build();
//     }
// }

package com.yourmaster.api.config;

import com.yourmaster.api.security.JwtAuthenticationEntryPoint;
import com.yourmaster.api.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;

import java.util.Collections;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {
    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final AuthenticationProvider authenticationProvider;
    private final JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http.csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(request -> {
                    var corsConfiguration = new CorsConfiguration();
                    corsConfiguration.setAllowedOriginPatterns(Collections.singletonList("*"));
                    corsConfiguration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
                    corsConfiguration.setAllowedHeaders(List.of("*"));
                    corsConfiguration.setAllowCredentials(true);
                    return corsConfiguration;
                }))
                .exceptionHandling(exception -> exception.authenticationEntryPoint(jwtAuthenticationEntryPoint))
                .authorizeHttpRequests(request -> request
                        .requestMatchers("/api/v1/auth/**").permitAll()
                        .requestMatchers("/api/v1/genres/**").permitAll()
                        .requestMatchers("/admin/**").hasRole("ADMIN")
                        .requestMatchers("/swagger-ui/**").permitAll()
                        .requestMatchers("/v3/api-docs/**").permitAll()
                        .requestMatchers("/ws/**").permitAll()
                        .anyRequest().authenticated())
                .sessionManagement(manager -> manager.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authenticationProvider(authenticationProvider)
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}