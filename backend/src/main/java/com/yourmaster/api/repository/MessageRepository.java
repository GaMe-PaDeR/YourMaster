package com.yourmaster.api.repository;

import com.yourmaster.api.model.Message;
import com.yourmaster.api.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MessageRepository extends JpaRepository<Message, UUID> {
    @Modifying
    @Query("delete Message m where m.id = ?1")
    void deleteById(UUID uuid);

    Page<Message> findByChat_Id(@Param("chatId") UUID chatId, Pageable pageable);
    List<Message> findAllByChat_Id(@Param("chatId") UUID chatId);
    List<Message> findAllByChat_IdOrderByCreatedAtAsc(@Param("chatId") UUID chatId);

    Boolean existsByContentAndSenderAndCreatedAtAfter(String content, User sender, LocalDateTime createdAt);

    @Query("SELECT m FROM Message m WHERE m.chat.id = :chatId ORDER BY m.createdAt DESC LIMIT 1")
    Optional<Message> findLastMessageByChatId(@Param("chatId") UUID chatId);

    @Query("SELECT COUNT(m) FROM Message m " +
           "WHERE m.isRead = false " +
           "AND m.sender <> :user " +
           "AND :user MEMBER OF m.chat.participants")
    Long countUnreadMessagesForUser(@Param("user") User user);

    @Query("SELECT COUNT(m) FROM Message m WHERE m.chat.id = :chatId AND m.sender.id != :userId AND m.isRead = false")
    Long countByChatIdAndSenderIdNotAndIsReadFalse(@Param("chatId") UUID chatId, @Param("userId") UUID userId);

    @Modifying
    @Query("UPDATE Message m SET m.isRead = true WHERE m.chat.id = :chatId AND m.sender.id != :userId AND m.isRead = false")
    void markAllMessagesAsReadInChat(@Param("chatId") UUID chatId, @Param("userId") UUID userId);
}
