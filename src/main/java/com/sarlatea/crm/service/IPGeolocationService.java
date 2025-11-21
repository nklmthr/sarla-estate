package com.sarlatea.crm.service;

import com.sarlatea.crm.dto.IPGeolocationDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

/**
 * Service for IP Geolocation using ip-api.com
 * Free tier: 45 requests per minute from an IP address
 * For production, consider:
 * - Upgrading to paid tier for higher limits
 * - Using alternative services like MaxMind GeoIP2
 * - Self-hosting a geolocation database
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class IPGeolocationService {

    private final RestTemplate restTemplate;

    @Value("${audit.geolocation.enabled:true}")
    private boolean geolocationEnabled;

    @Value("${audit.geolocation.api-url:http://ip-api.com/json}")
    private String apiUrl;

    // Fields to query from the API (reduces response size)
    private static final String FIELDS = "status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,query";

    /**
     * Get geolocation information for an IP address
     * Results are cached to minimize API calls
     * 
     * @param ipAddress The IP address to lookup
     * @return IPGeolocationDTO with location information, or null if lookup fails
     */
    @Cacheable(value = "ipGeolocation", key = "#ipAddress", unless = "#result == null")
    public IPGeolocationDTO getGeolocation(String ipAddress) {
        if (!geolocationEnabled) {
            log.debug("IP geolocation is disabled");
            return null;
        }

        // Skip geolocation for local/private IP addresses
        if (isLocalOrPrivateIP(ipAddress)) {
            log.debug("Skipping geolocation for local/private IP: {}", ipAddress);
            return createLocalIPResponse(ipAddress);
        }

        try {
            String url = apiUrl + "/" + ipAddress + "?fields=" + FIELDS;
            log.debug("Fetching geolocation for IP: {}", ipAddress);
            
            IPGeolocationDTO response = restTemplate.getForObject(url, IPGeolocationDTO.class);
            
            if (response != null && response.isSuccess()) {
                log.debug("Successfully retrieved geolocation for {}: {}, {}", 
                         ipAddress, 
                         response.getCity() != null ? response.getCity() : "Unknown", 
                         response.getCountry() != null ? response.getCountry() : "Unknown");
                return response;
            } else {
                log.warn("Failed to get geolocation for {}: {}", 
                        ipAddress, response != null ? response.getMessage() : "null response");
                return null;
            }
        } catch (Exception e) {
            log.error("Error fetching geolocation for IP {}: {}", ipAddress, e.getMessage());
            return null;
        }
    }

    /**
     * Check if an IP address is local or private
     */
    private boolean isLocalOrPrivateIP(String ipAddress) {
        if (ipAddress == null || ipAddress.isEmpty()) {
            return true;
        }

        // Check for localhost
        if (ipAddress.equals("127.0.0.1") || ipAddress.equals("::1") || ipAddress.equals("localhost")) {
            return true;
        }

        // Check for private IP ranges (IPv4)
        if (ipAddress.startsWith("10.") || 
            ipAddress.startsWith("192.168.") ||
            ipAddress.startsWith("172.")) {
            return true;
        }

        // Check for link-local addresses
        if (ipAddress.startsWith("169.254.")) {
            return true;
        }

        return false;
    }

    /**
     * Create a response for local/private IPs
     */
    private IPGeolocationDTO createLocalIPResponse(String ipAddress) {
        IPGeolocationDTO response = new IPGeolocationDTO();
        response.setStatus("success");
        response.setCountry("Local Network");
        response.setCountryCode("LOCAL");
        response.setCity("Local");
        response.setQuery(ipAddress);
        return response;
    }

    /**
     * Check if geolocation service is enabled
     */
    public boolean isEnabled() {
        return geolocationEnabled;
    }
}

