package com.digitalbanking.portal.service;

import com.digitalbanking.portal.dto.PaymentStatusResponse;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ThreadLocalRandom;

@Service
public class PaymentService {

    private static final List<String> STATUSES = List.of("SUCCESS", "PENDING", "FAILED");

    private static final Map<String, String> STATUS_DESCRIPTIONS = Map.of(
            "SUCCESS", "Payment completed successfully",
            "PENDING", "Payment is being processed",
            "FAILED", "Payment failed: insufficient funds");

    /** Returns a sample payment status picked at random (not yet backed by a real data source). */
    public PaymentStatusResponse checkStatus(String reference) {
        Instant now = Instant.now().truncatedTo(ChronoUnit.SECONDS);
        String status = STATUSES.get(ThreadLocalRandom.current().nextInt(STATUSES.size()));
        return new PaymentStatusResponse(
                reference,
                "TXN-" + Math.abs(reference.hashCode()),
                status,
                STATUS_DESCRIPTIONS.get(status),
                new BigDecimal("150000.00"),
                "XOF",
                "SN0120100100123456789012",
                "SN0120100100987654321098",
                "Sample Merchant Ltd",
                "TRANSFER",
                now.minus(5, ChronoUnit.MINUTES).toString(),
                now.toString());
    }
}
