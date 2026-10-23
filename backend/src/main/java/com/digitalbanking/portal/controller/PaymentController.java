package com.digitalbanking.portal.controller;

import com.digitalbanking.portal.dto.PaymentStatusResponse;
import com.digitalbanking.portal.service.PaymentService;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Payment endpoints: protected by the Bearer token (see SecurityConfig). */
@RestController
@RequestMapping("/api/payments")
@Validated
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @GetMapping("/check-status")
    public ResponseEntity<PaymentStatusResponse> checkStatus(@RequestParam @NotBlank String reference) {
        return ResponseEntity.ok(paymentService.checkStatus(reference));
    }
}
