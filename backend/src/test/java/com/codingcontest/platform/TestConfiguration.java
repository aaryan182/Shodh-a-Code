package com.codingcontest.platform;

import com.codingcontest.platform.service.CodeJudgeService;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;
import org.mockito.Mockito;

/**
 * Test configuration for integration tests
 */
@TestConfiguration
@Profile("test")
public class TestConfiguration {

    /**
     * Mock CodeJudgeService for tests that don't need actual Docker execution
     */
    @Bean
    @Primary
    public CodeJudgeService mockCodeJudgeService() {
        return Mockito.mock(CodeJudgeService.class);
    }
}
