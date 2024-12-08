package com.yourmaster.api.dto.request;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.yourmaster.api.Constants;
import com.yourmaster.api.enums.TransferRequestStatus;
import com.yourmaster.api.model.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UuidGenerator;
import org.springframework.beans.factory.annotation.Autowired;

import java.time.LocalDateTime;
import java.util.Date;
import java.util.UUID;
import com.yourmaster.api.model.Record;

@Builder
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class TransferRequest {

    @Id
    @GeneratedValue
    @UuidGenerator(style = UuidGenerator.Style.TIME)
    @Column(name = "id")
    private UUID id;

    @Column(name = "created_datetime")
    @JsonFormat(pattern = Constants.LOCAL_DATETIME_FORMAT)
    private LocalDateTime createdDateTime;

    @ManyToOne
    @JoinColumn(name = "sender_id")
    private User sender;

    @ManyToOne
    @JoinColumn(name = "recipient_id")
    private User recipient;

    @Enumerated(value = EnumType.STRING)
    @Column(name = "status")
    private TransferRequestStatus status;

    @ManyToOne
    @JoinColumn(name = "old_record")
    private Record oldRecord;

    @ManyToOne
    @JoinColumn(name = "new_record")
    private Record newRecord;
}
