package com.digitalbanking.portal.dto;

import java.math.BigDecimal;

public record PaymentStatusResponse(
        String reference,
        String transactionId,
        String status,
        String statusDescription,
        BigDecimal amount,
        String currency,
        String debtorAccount,
        String creditorAccount,
        String creditorName,
        String paymentMethod,
        String createdAt,
        String updatedAt
) {
}
