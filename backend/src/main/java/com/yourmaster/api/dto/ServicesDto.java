package com.yourmaster.api.dto;

import com.yourmaster.api.model.Service;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@AllArgsConstructor
public class ServicesDto {
    private List<Service> myOwnServices;
    private List<Service> otherServices;
}
