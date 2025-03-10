package com.yourmaster.api.repository;

import com.yourmaster.api.enums.Category;
import com.yourmaster.api.model.Service;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ServiceRepository extends JpaRepository<Service, UUID> {
    Service save(Service service);

    Optional<Service> findById(UUID serviceId);

    void deleteById(UUID serviceId);

    List<Service> findAllByCategory(Category category);

    List<Service> findAllByMasterId(UUID masterId);

    List<Service> findAllByMasterIdNot(UUID masterId);

    @Query("SELECT s FROM Service s WHERE s.deleted = false")
    List<Service> findAllActiveServices();

    @Query("SELECT s FROM Service s WHERE s.master.id = :masterId AND s.deleted = false")
    List<Service> findActiveServicesByMasterId(UUID masterId);
}
