package com.yourmaster.api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

@SpringBootApplication
@EnableCaching
public class YourmasterApiApplication {

    public static void main(String[] args) {
        SpringApplication.run(YourmasterApiApplication.class, args);
    }

}