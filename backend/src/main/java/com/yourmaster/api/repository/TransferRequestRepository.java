//package com.yourmaster.api.repository;
//
//import com.yourmaster.api.dto.request.TransferRequest;
//import com.yourmaster.api.model.Transfer;
//import com.yourmaster.api.model.User;
//import org.springframework.data.jpa.repository.JpaRepository;
//import org.springframework.stereotype.Repository;
//
//import java.util.List;
//import java.util.Optional;
//import java.util.UUID;
//
//@Repository
//public interface TransferRequestRepository extends JpaRepository<Transfer, UUID> {
//    Boolean existsBySenderAndRecipient(User sender, User recipient);
//
//    List<Transfer> findAllByRecipient(User user);
//
//    List<Transfer> findAllBySender(User user);
//
//    Optional<Transfer> findRequestBySenderAndRecipient(User sender, User recipient);
//
//    Optional<Transfer> findById(UUID id);
//
//    Transfer save(Transfer request);
//
////    void delete(TransferRequest request);
////
////    void deleteBySenderAndRecipient(User sender, User recipient);
//
//}
