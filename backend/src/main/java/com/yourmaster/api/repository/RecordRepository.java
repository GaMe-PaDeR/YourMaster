package com.yourmaster.api.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import com.yourmaster.api.model.Record;
import com.yourmaster.api.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RecordRepository extends JpaRepository<Record, UUID> {
    Record save(Record record);

    Optional<Record> findById(UUID recordId);

    void deleteById(UUID recordId);

    List<Record> findAllByClientId(UUID clientId);

    List<Record> findAllByMasterId(UUID masterId);

    List<Record> findAllByClientId_OrMaster_Id(UUID client, UUID master);

    List<Record> findByServiceIdAndRecordDateAfter(UUID serviceId, LocalDateTime date);

    boolean existsByServiceIdAndRecordDateAfter(UUID serviceId, LocalDateTime now);

    List<Record> findByRecordDateBetween(LocalDateTime start, LocalDateTime end);
}
