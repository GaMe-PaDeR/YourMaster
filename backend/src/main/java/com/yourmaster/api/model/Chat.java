package com.yourmaster.api.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.UuidGenerator;
import com.fasterxml.jackson.annotation.JsonIgnore;

import java.util.List;
import java.util.UUID;
import java.util.ArrayList;

//@Entity
//@Data
//@NoArgsConstructor
//@AllArgsConstructor
//@Table(name = "chats")
//@Builder
//public class Chat {
//    @Id
//    @GeneratedValue
//    @UuidGenerator(style = UuidGenerator.Style.TIME)
//    private UUID id;
//
//    @ManyToMany(fetch = FetchType.EAGER)
//    @JoinTable(
//            name = "chat_participants",
//            joinColumns = @JoinColumn(name = "chat_id"),
//            inverseJoinColumns = @JoinColumn(name = "participant_id")
//    )
//    private List<User> participants;
//
//    @ManyToOne(fetch = FetchType.EAGER)
//    private User createdBy;
//
//    @Column(name = "is_group")
//    private Boolean isGroup;
//
//    @Column(name = "chat_image")
//    private String chatImage;
//
//    @Column(name = "chat_name")
//    private String chatName;
//
//    @Override
//    public String toString() {
//        return "Chat{" +
//                "id=" + id +
//                ", isGroup=" + isGroup +
//                ", chatImage='" + chatImage + '\'' +
//                ", chatName='" + chatName + '\'' +
//                '}';
//    }
//}

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "chats")
@Builder
public class Chat {
    @Id
    @GeneratedValue
    @UuidGenerator(style = UuidGenerator.Style.TIME)
    private UUID id;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
            name = "chat_participants",
            joinColumns = @JoinColumn(name = "chat_id"),
            inverseJoinColumns = @JoinColumn(name = "participant_id")
    )
    private List<User> participants;

    @OneToMany(mappedBy = "chat", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<Message> messages = new ArrayList<>();

    @ManyToOne(fetch = FetchType.EAGER)
    private User createdBy;

    @Column(name = "is_group")
    private Boolean isGroup;

    @Column(name = "chat_image")
    private String chatImage;

    @Column(name = "chat_name")
    private String chatName;

    @Column(name = "total_messages")
    private Long totalMessages;

    @Transient
    private Message lastMessage;

    @Override
    public String toString() {
        return "Chat{" +
                "id=" + id +
                ", isGroup=" + isGroup +
                ", chatImage='" + chatImage + '\'' +
                ", chatName='" + chatName + '\'' +
                '}';
    }
}