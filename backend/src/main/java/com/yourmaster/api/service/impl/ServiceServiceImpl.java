package com.yourmaster.api.service.impl;

import com.yourmaster.api.Constants;
import com.yourmaster.api.dto.ServicesDto;
import com.yourmaster.api.dto.response.TimeSlotResponse;
import com.yourmaster.api.enums.Category;
import com.yourmaster.api.exception.ApiException;
import com.yourmaster.api.exception.ResourceNotFoundException;
import com.yourmaster.api.model.Availability;
import com.yourmaster.api.model.Record;
import com.yourmaster.api.model.Service;
import com.yourmaster.api.model.User;
import com.yourmaster.api.repository.RecordRepository;
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
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

@org.springframework.stereotype.Service
@Slf4j
public class ServiceServiceImpl implements ServiceService {
    @Autowired
    private UserService userService;

    @Autowired
    private FileService fileService;

    @Autowired
    private ServiceRepository serviceRepository;

    @Autowired
    private RecordRepository recordRepository;

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
    public Service updateService(UUID serviceId, Service serviceDto, List<MultipartFile> newFiles, List<String> replaceFilesUrls) {
        Service service = getServiceById(serviceId);
        List<String> serviceImages = new ArrayList<>(service.getPhotos());

        if (newFiles != null && !newFiles.isEmpty()) {
            List<String> newFileNames = fileService.uploadFileList(serviceFolder, newFiles);
            serviceImages.addAll(newFileNames);
        }

        if (replaceFilesUrls != null) {
            replaceFilesUrls.forEach(fileName -> {
                try {
                    Files.deleteIfExists(fileService.getStaticFilePath(serviceFolder, fileName));
                    serviceImages.remove(fileName);
                } catch (IOException e) {
                    throw new ApiException(HttpStatus.BAD_REQUEST, e.getMessage());
                }
            });
        }

        service.setPhotos(serviceImages);
        service.setTitle(serviceDto.getTitle());
        service.setDescription(serviceDto.getDescription());
        service.setCategory(serviceDto.getCategory());
        service.setPrice(serviceDto.getPrice());
        service.setEstimatedDuration(serviceDto.getEstimatedDuration());
        service.setAvailability(serviceDto.getAvailability());

        log.info("updateService[3]: Updating service {}", service);
        return serviceRepository.save(service);
    }

    @Override
    public void deleteService(UUID serviceId) {
        Service service = serviceRepository.findById(serviceId)
            .orElseThrow(() -> new ResourceNotFoundException("Service", "id", serviceId));
        
        // Проверка, есть ли активные записи
        if (recordRepository.existsByServiceIdAndRecordDateAfter(serviceId, LocalDateTime.now())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Невозможно удалить услугу с активными записями");
        }
        
        // Мягкое удаление
        service.setDeleted(true);
        serviceRepository.save(service);
    }

    @Override
    public Service getServiceById(UUID serviceId) {
        return serviceRepository.findById(serviceId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        Constants.SERVICE_RESOURCE_NAME, Constants.ID_FIELD, serviceId)
        );
    }

    @Override
    public List<Service> getAllServices() {
        return serviceRepository.findAllActiveServices();
    }

    @Override
    public List<Service> getServicesByMasterId(UUID masterId) {
        return serviceRepository.findActiveServicesByMasterId(masterId);
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

    public List<TimeSlotResponse> getAvailableTimeSlots(UUID serviceId, LocalDate date) {
        Service service = getServiceById(serviceId);
        List<Record> futureRecords = recordRepository.findByServiceIdAndRecordDateAfter(serviceId, LocalDateTime.now());
        
        return service.getAvailability().stream()
            .filter(av -> av.getDate().equals(date))
            .flatMap(av -> av.getTimeSlotsMap().entrySet().stream()
                .filter(Map.Entry::getValue)
                .map(entry -> {
                    LocalTime time = LocalTime.parse(entry.getKey());
                    LocalDateTime dateTime = LocalDateTime.of(date, time);
                    boolean isBooked = futureRecords.stream()
                        .anyMatch(r -> r.getRecordDate().equals(dateTime));
                    return new TimeSlotResponse(entry.getKey(), !isBooked);
                }))
            .sorted(Comparator.comparing(TimeSlotResponse::getTime))
            .collect(Collectors.toList());
    }


    @Override
    public List<String> getAvailableDates(UUID serviceId) {
        log.info("Calculating available dates for service: {}", serviceId);
        Service service = getServiceById(serviceId);
        LocalDateTime now = LocalDateTime.now();
        log.debug("Current time: {}", now);
        
        List<Record> futureRecords = recordRepository.findByServiceIdAndRecordDateAfter(serviceId, now);
        log.debug("Found {} future records", futureRecords.size());

        List<LocalDate> result = service.getAvailability().stream()
            .peek(av -> log.trace("Processing availability: {}", av.getDate()))
            .filter(av -> {
                boolean dateValid = av.getDate().isAfter(now.toLocalDate().minusDays(1));
                log.debug("Date {} valid: {}", av.getDate(), dateValid);
                return dateValid;
            })
            .filter(av -> av.getTimeSlotsMap().entrySet().stream()
                .anyMatch(entry -> {
                    try {
                        LocalTime time = LocalTime.parse(entry.getKey());
                        LocalDateTime slotDateTime = LocalDateTime.of(av.getDate(), time);
                        boolean slotAvailable = entry.getValue() 
                            && slotDateTime.isAfter(now)
                            && futureRecords.stream().noneMatch(r -> r.getRecordDate().equals(slotDateTime));
                        
                        log.trace("Slot {} available: {}", entry.getKey(), slotAvailable);
                        return slotAvailable;
                    } catch (Exception e) {
                        log.error("Error processing time slot: {}", entry.getKey(), e);
                        return false;
                    }
                }))
            .map(Availability::getDate)
            .distinct()
            .sorted()
            .collect(Collectors.toList());

        log.info("Found {} available dates for service {}", result.size(), serviceId);
        return result.stream()
            .map(date -> date.toString())
            .collect(Collectors.toList());
    }
}
