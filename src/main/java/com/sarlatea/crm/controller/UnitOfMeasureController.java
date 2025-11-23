package com.sarlatea.crm.controller;

import com.sarlatea.crm.dto.UnitOfMeasureDTO;
import com.sarlatea.crm.service.UnitOfMeasureService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for UnitOfMeasure operations
 */
@RestController
@RequestMapping("/api/units-of-measure")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001"}, 
             allowedHeaders = "*", 
             methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS},
             allowCredentials = "true")
public class UnitOfMeasureController {

    private final UnitOfMeasureService unitOfMeasureService;

    @GetMapping
    @PreAuthorize("hasPermission('UNITS_OF_MEASURE', 'VIEW')")
    public ResponseEntity<List<UnitOfMeasureDTO>> getAllUnits() {
        log.info("GET request to fetch all units of measure");
        List<UnitOfMeasureDTO> units = unitOfMeasureService.getAllUnits();
        return ResponseEntity.ok(units);
    }

    @GetMapping("/active")
    @PreAuthorize("hasPermission('UNITS_OF_MEASURE', 'VIEW')")
    public ResponseEntity<List<UnitOfMeasureDTO>> getActiveUnits() {
        log.info("GET request to fetch active units of measure");
        List<UnitOfMeasureDTO> units = unitOfMeasureService.getActiveUnits();
        return ResponseEntity.ok(units);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasPermission('UNITS_OF_MEASURE', 'VIEW')")
    public ResponseEntity<UnitOfMeasureDTO> getUnitById(@PathVariable String id) {
        log.info("GET request to fetch unit with id: {}", id);
        UnitOfMeasureDTO unit = unitOfMeasureService.getUnitById(id);
        return ResponseEntity.ok(unit);
    }

    @PostMapping
    @PreAuthorize("hasPermission('UNITS_OF_MEASURE', 'CREATE')")
    public ResponseEntity<UnitOfMeasureDTO> createUnit(@RequestBody UnitOfMeasureDTO unitDTO) {
        log.info("POST request to create new unit: {}", unitDTO.getName());
        UnitOfMeasureDTO createdUnit = unitOfMeasureService.createUnit(unitDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdUnit);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasPermission('UNITS_OF_MEASURE', 'EDIT')")
    public ResponseEntity<UnitOfMeasureDTO> updateUnit(
            @PathVariable String id,
            @RequestBody UnitOfMeasureDTO unitDTO) {
        log.info("PUT request to update unit with id: {}", id);
        UnitOfMeasureDTO updatedUnit = unitOfMeasureService.updateUnit(id, unitDTO);
        return ResponseEntity.ok(updatedUnit);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasPermission('UNITS_OF_MEASURE', 'DELETE')")
    public ResponseEntity<Void> deleteUnit(@PathVariable String id) {
        log.info("DELETE request for unit with id: {}", id);
        unitOfMeasureService.deleteUnit(id);
        return ResponseEntity.noContent().build();
    }
}

