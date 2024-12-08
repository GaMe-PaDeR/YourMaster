package com.yourmaster.api.model;

import com.yourmaster.api.enums.Category;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.UuidGenerator;

import java.util.List;
import java.util.UUID;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "services")
@Builder
public class Service {
    @Id
    @GeneratedValue
    @UuidGenerator(style = UuidGenerator.Style.TIME)
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "master_id")
    private User master;

//    @ManyToOne
    @Column(name = "category_id")
    @Enumerated(value = EnumType.STRING)
    private Category category;

    @NotBlank(message = "Enter service title")
    @Size(max = 100, message = "Title must be less than 100 characters")
    private String title;

    @NotBlank(message = "Enter service description")
    @Size(max = 500, message = "Description must be less than 500 characters")
    private String description;

    @Column(name = "price")
    @NotNull(message = "Enter service price")
    private Double price;

    @ElementCollection
    @CollectionTable(name = "service_photos",
            joinColumns = @JoinColumn(name = "service_id"))
    @Column(name = "photo_path")
    private List<String> photos;
}
