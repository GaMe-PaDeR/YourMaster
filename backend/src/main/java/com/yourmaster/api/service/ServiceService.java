package com.yourmaster.api.service;

import com.yourmaster.api.dto.ServicesDto;
import com.yourmaster.api.enums.Category;
import com.yourmaster.api.exception.ApiException;
import com.yourmaster.api.model.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

public interface ServiceService {
    Service createService(Service service, List<MultipartFile> files);

    Service updateService(UUID serviceId, Service serviceDto, List<MultipartFile> newFiles, List<String> replaceFilesUrls) throws ApiException;

    void deleteService(UUID serviceId);

    Service getServiceById(UUID serviceId);

    List<Service> getAllServices(int limit);

    ServicesDto getServicesForMaster();

    List<Service> getServicesByCategory(Category category);


}
