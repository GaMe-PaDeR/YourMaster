package com.yourmaster.api.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.yourmaster.api.dto.ServicesDto;
import com.yourmaster.api.enums.Category;
import com.yourmaster.api.enums.Role;
import com.yourmaster.api.exception.ApiException;
import com.yourmaster.api.model.Service;
import com.yourmaster.api.service.ServiceService;
import com.yourmaster.api.service.UserService;
import lombok.extern.slf4j.Slf4j;
import org.hibernate.Cache;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/services")
@Slf4j
public class ServiceController {

    @Autowired
    private ServiceService serviceService;

    @Autowired
    private UserService userService;

//    @GetMapping
//    public ResponseEntity<List<Service>> getAllServices() {
//        List<Service> services = serviceService.getAllServices();
//        return ResponseEntity.ok(services);
//    }
//
//    @GetMapping("/master/{masterId}")
//    public ResponseEntity<List<Service>> getServicesByMasterId(@PathVariable UUID masterId) {
//        List<Service> services = serviceService.getServicesByMasterId(masterId);
//        return ResponseEntity.ok(services);
//    }

    @GetMapping("/{id}")
    public ResponseEntity<Service> getServiceById(@PathVariable UUID id) {
        Service service = serviceService.getServiceById(id);
        return ResponseEntity.ok(service);
    }

    @PostMapping("/create")
    public ResponseEntity<Service> createService(
        @RequestParam("serviceJson") String serviceJson,
        @RequestParam(required = false) List<MultipartFile> files
    ) throws JsonProcessingException {
        ObjectMapper objectMapper = new ObjectMapper();
        Service service = objectMapper.readValue(serviceJson, Service.class);
        
        if (userService.getCurrentUser().getRole().equals(Role.ROLE_CLIENT)) {
//            перенести в сервис проверку пользователя и поднимать ошибку
            log.info("createService[1]: Client can't create a service");
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        Service createdService = serviceService.createService(service, files);
        return ResponseEntity.ok(createdService);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Service> updateService(@PathVariable UUID id, @RequestBody Service service,
                                                 @RequestPart(required = false) List<MultipartFile> newFiles,
                                                 @RequestParam(required = false) List<String> replaceFilesUrls) {
        Service updatedService = serviceService.updateService(id, service, newFiles, replaceFilesUrls);
        return ResponseEntity.ok(updatedService);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteService(@PathVariable UUID id) {
        serviceService.deleteService(id);
        return ResponseEntity.noContent().build();
    }


    @GetMapping
    public ResponseEntity<List<Service>> getAllServices(@RequestParam(defaultValue = "10") int limit) {
        List<Service> services = serviceService.getAllServices(limit);
        return ResponseEntity.ok(services);
    }

    @GetMapping("/master")
    public ResponseEntity<ServicesDto> getAllServicesForMaster() {
        ServicesDto servicesDto = serviceService.getServicesForMaster();
        return ResponseEntity.ok(servicesDto);
    }

    @GetMapping("/category/{category}")
    public ResponseEntity<List<Service>> getServicesByCategory(@RequestParam Category category) {
        List<Service> services = serviceService.getServicesByCategory(category);
        return ResponseEntity.ok(services);
    }
}

