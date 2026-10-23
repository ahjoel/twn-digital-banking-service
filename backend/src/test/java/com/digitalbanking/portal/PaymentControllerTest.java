package com.digitalbanking.portal;

import com.digitalbanking.portal.security.JwtService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.anyOf;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class PaymentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtService jwtService;

    @Test
    void checkStatusWithValidTokenReturnsPaymentStatus() throws Exception {
        String token = jwtService.generateToken("john.doe", "CUSTOMER");

        mockMvc.perform(get("/api/payments/check-status")
                        .param("reference", "PAY-2026-0001")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.reference").value("PAY-2026-0001"))
                .andExpect(jsonPath("$.status").value(anyOf(is("SUCCESS"), is("PENDING"), is("FAILED"))));
    }

    @Test
    void checkStatusWithoutTokenReturns401() throws Exception {
        mockMvc.perform(get("/api/payments/check-status").param("reference", "PAY-2026-0001"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void checkStatusWithInvalidTokenReturns401() throws Exception {
        mockMvc.perform(get("/api/payments/check-status")
                        .param("reference", "PAY-2026-0001")
                        .header("Authorization", "Bearer invalid.token.value"))
                .andExpect(status().isUnauthorized());
    }
}
