package com.sarlatea.crm.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for IP Geolocation API response from ip-api.com
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class IPGeolocationDTO {

    @JsonProperty("status")
    private String status; // "success" or "fail"

    @JsonProperty("message")
    private String message; // Error message if status is "fail"

    @JsonProperty("country")
    private String country;

    @JsonProperty("countryCode")
    private String countryCode;

    @JsonProperty("region")
    private String region;

    @JsonProperty("regionName")
    private String regionName;

    @JsonProperty("city")
    private String city;

    @JsonProperty("zip")
    private String zip;

    @JsonProperty("lat")
    private Double latitude;

    @JsonProperty("lon")
    private Double longitude;

    @JsonProperty("timezone")
    private String timezone;

    @JsonProperty("isp")
    private String isp;

    @JsonProperty("org")
    private String organization;

    @JsonProperty("as")
    private String as; // Autonomous System information

    @JsonProperty("query")
    private String query; // The IP address that was queried

    /**
     * Check if the geolocation lookup was successful
     */
    public boolean isSuccess() {
        return "success".equalsIgnoreCase(status);
    }
}

