package com.yourmaster.api.service.impl;

import com.yourmaster.api.Constants;
import com.yourmaster.api.dto.ServicesDto;
import com.yourmaster.api.enums.Category;
import com.yourmaster.api.exception.ApiException;
import com.yourmaster.api.exception.ResourceNotFoundException;
import com.yourmaster.api.model.Availability;
import com.yourmaster.api.model.Service;
import com.yourmaster.api.model.User;
import com.yourmaster.api.repository.ServiceRepository;
import com.yourmaster.api.service.FileService;
import com.yourmaster.api.service.ServiceService;
import com.yourmaster.api.service.UserService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@org.springframework.stereotype.Service
@Slf4j
public class ServiceServiceImpl implements ServiceService {
    @Autowired
    private UserService userService;

    @Autowired
    private FileService fileService;

    @Autowired
    private ServiceRepository serviceRepository;

    @Value("${project.serviceImg}")
    private String serviceFolder;

    @Override
    public Service createService(Service serviceDto, List<MultipartFile> files) {
        User master = userService.getCurrentUser();
        List<String> fileNames;
        List<String> serviceImageUrl = new ArrayList<>();

        if(files != null) {
            fileNames = fileService.uploadFileList(serviceFolder, files);
            serviceImageUrl.addAll(fileNames);
        }

        Service service = Service.builder()
                .price(serviceDto.getPrice())
                .title(serviceDto.getTitle())
                .description(serviceDto.getDescription())
                .category(serviceDto.getCategory())
                .master(master)
                .photos(serviceImageUrl)
                .estimatedDuration(serviceDto.getEstimatedDuration())
                .availability(serviceDto.getAvailability())
                .build();

        log.info("createService[1]: Creating service {}", service);

        Service savedService = serviceRepository.save(service);

        log.info("createService[2]: Service created with ID {}", savedService.getId());

        return savedService;
    }

    @Override
    public Service updateService(UUID serviceId, Service serviceDto, List<MultipartFile> newFiles, List<String> replaceFilesUrls) throws ApiException {
        Service service = getServiceById(serviceId);
        List<String> newFileNames;
        List<String> serviceImages = new ArrayList<>(service.getPhotos());

        if(newFiles != null) {
            newFileNames = fileService.uploadFileList(serviceFolder, newFiles);
            serviceImages.addAll(newFileNames);
        }

        if(replaceFilesUrls != null) {
            replaceFilesUrls.forEach(f -> {
                try {
                    Files.deleteIfExists(fileService.getStaticFilePath(serviceFolder, f));
                    serviceImages.remove(f);
                    log.debug("updateService[1]: Files deleted {}", f);
                } catch (IOException e) {
                    throw new ApiException(HttpStatus.BAD_REQUEST, e.getMessage());
                }
            });
            log.debug("updateService[2]: Files remain {}", serviceImages);
        }

        service.setPhotos(serviceImages);
        service.setCategory(serviceDto.getCategory());
        service.setDescription(serviceDto.getDescription());
        service.setPrice(serviceDto.getPrice());
        service.setTitle(serviceDto.getTitle());
        service.setEstimatedDuration(serviceDto.getEstimatedDuration());
        service.setAvailability(serviceDto.getAvailability());

        log.info("updateService[3]: Updating service {}", service);
        return serviceRepository.save(service);
    }

    @Override
    public void deleteService(UUID serviceId) {
        Service service = getServiceById(serviceId);

        if (!userService.getCurrentUser().equals(service.getMaster())) {
            throw new ApiException(HttpStatus.FORBIDDEN, Constants.PERMISSION_MESSAGE);
        }

        List<String> serviceImages = service.getPhotos();
        log.info("deleteService[1]: Getting the service images urls {}", serviceImages);

        serviceImages.forEach(f -> {
            try {
                Files.deleteIfExists(fileService.getStaticFilePath(serviceFolder, f));
            } catch (IOException e) {
                throw new ApiException(HttpStatus.BAD_REQUEST, e.getMessage());
            }
        });
        log.info("deleteService[2]: Images was successfully deleted from the disk. Service ID {} deleted", serviceId);
        serviceRepository.delete(service);
    }

    @Override
    public Service getServiceById(UUID serviceId) {
        return serviceRepository.findById(serviceId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        Constants.SERVICE_RESOURCE_NAME, Constants.ID_FIELD, serviceId)
        );
    }

    @Override
    public List<Service> getAllServices(int limit) {
        return serviceRepository.findAll(PageRequest.of(0, limit)).getContent();
    }

    @Override
    public ServicesDto getServicesForMaster() {
        User master = userService.getCurrentUser();
        List<Service> myOwnServices = serviceRepository.findAllByMasterId(master.getId());
        List<Service> otherServices = serviceRepository.findAllByMasterIdNot(master.getId());
        return new ServicesDto(myOwnServices, otherServices);
    }

    @Override
    public List<Service> getServicesByCategory(Category category) {
        return serviceRepository.findAllByCategory(category);
    }


}
