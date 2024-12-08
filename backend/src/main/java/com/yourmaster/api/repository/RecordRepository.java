package com.yourmaster.api.repository;

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
}
