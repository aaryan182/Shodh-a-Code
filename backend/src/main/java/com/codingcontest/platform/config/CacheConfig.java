package com.codingcontest.platform.config;

import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.type.TypeFactory;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.github.benmanes.caffeine.cache.Caffeine;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.TimeUnit;

/**
 * Comprehensive caching configuration with both Redis (distributed) and Caffeine (local) caching
 * 
 * Cache Strategy:
 * - Redis: For distributed caching across multiple instances
 * - Caffeine: For high-performance local caching of frequently accessed data
 * - Multi-level caching: Local cache as L1, Redis as L2
 */
@Configuration
@EnableCaching
public class CacheConfig {
    
    private static final Logger logger = LoggerFactory.getLogger(CacheConfig.class);
    
    @Value("${spring.redis.host:localhost}")
    private String redisHost;
    
    @Value("${spring.redis.port:6379}")
    private int redisPort;
    
    @Value("${app.cache.redis.enabled:true}")
    private boolean redisEnabled;
    
    @Value("${app.cache.caffeine.enabled:true}")
    private boolean caffeineEnabled;
    
    // Cache names and their configurations
    public static final String CONTEST_CACHE = "contests";
    public static final String CONTEST_DETAILS_CACHE = "contestDetails";
    public static final String PROBLEM_CACHE = "problems";
    public static final String PROBLEM_DETAILS_CACHE = "problemDetails";
    public static final String LEADERBOARD_CACHE = "leaderboard";
    public static final String USER_CACHE = "users";
    public static final String SUBMISSION_STATUS_CACHE = "submissionStatus";
    public static final String TEST_CASES_CACHE = "testCases";
    public static final String CONTEST_PROBLEMS_CACHE = "contestProblems";
    
    /**
     * Primary cache manager - Redis for distributed caching
     */
    @Bean
    @Primary
    @ConditionalOnProperty(name = "app.cache.redis.enabled", havingValue = "true", matchIfMissing = true)
    public CacheManager redisCacheManager(RedisConnectionFactory connectionFactory) {
        logger.info("Configuring Redis cache manager");
        
        // Default cache configuration
        RedisCacheConfiguration defaultConfig = RedisCacheConfiguration.defaultCacheConfig()
            .entryTtl(Duration.ofMinutes(30))
            .serializeKeysWith(org.springframework.data.redis.serializer.RedisSerializationContext.SerializationPair
                .fromSerializer(new StringRedisSerializer()))
            .serializeValuesWith(org.springframework.data.redis.serializer.RedisSerializationContext.SerializationPair
                .fromSerializer(createJsonRedisSerializer()))
            .disableCachingNullValues();
        
        // Cache-specific configurations
        Map<String, RedisCacheConfiguration> cacheConfigurations = new HashMap<>();
        
        // Contest data - moderate TTL as contests don't change frequently
        cacheConfigurations.put(CONTEST_CACHE, defaultConfig.entryTtl(Duration.ofHours(1)));
        cacheConfigurations.put(CONTEST_DETAILS_CACHE, defaultConfig.entryTtl(Duration.ofMinutes(30)));
        cacheConfigurations.put(CONTEST_PROBLEMS_CACHE, defaultConfig.entryTtl(Duration.ofHours(1)));
        
        // Problem data - longer TTL as problems are mostly static
        cacheConfigurations.put(PROBLEM_CACHE, defaultConfig.entryTtl(Duration.ofHours(2)));
        cacheConfigurations.put(PROBLEM_DETAILS_CACHE, defaultConfig.entryTtl(Duration.ofHours(2)));
        cacheConfigurations.put(TEST_CASES_CACHE, defaultConfig.entryTtl(Duration.ofHours(4)));
        
        // Dynamic data - shorter TTL
        cacheConfigurations.put(LEADERBOARD_CACHE, defaultConfig.entryTtl(Duration.ofMinutes(5)));
        cacheConfigurations.put(SUBMISSION_STATUS_CACHE, defaultConfig.entryTtl(Duration.ofMinutes(10)));
        
        // User data - moderate TTL
        cacheConfigurations.put(USER_CACHE, defaultConfig.entryTtl(Duration.ofMinutes(60)));
        
        RedisCacheManager cacheManager = RedisCacheManager.builder(connectionFactory)
            .cacheDefaults(defaultConfig)
            .withInitialCacheConfigurations(cacheConfigurations)
            .build();
        
        logger.info("Redis cache manager configured with {} cache configurations", cacheConfigurations.size());
        return cacheManager;
    }
    
    /**
     * Local cache manager - Caffeine for high-performance local caching
     */
    @Bean("caffeineCacheManager")
    @ConditionalOnProperty(name = "app.cache.caffeine.enabled", havingValue = "true", matchIfMissing = true)
    public CacheManager caffeineCacheManager() {
        logger.info("Configuring Caffeine cache manager");
        
        CaffeineCacheManager cacheManager = new CaffeineCacheManager();
        
        // Configure Caffeine cache with optimized settings
        cacheManager.setCaffeine(Caffeine.newBuilder()
            .maximumSize(10000) // Maximum number of entries
            .expireAfterWrite(15, TimeUnit.MINUTES) // Write-based expiration
            .expireAfterAccess(5, TimeUnit.MINUTES) // Access-based expiration
            .recordStats() // Enable statistics for monitoring
        );
        
        // Set cache names
        cacheManager.setCacheNames(java.util.List.of(
            CONTEST_CACHE + "_local",
            PROBLEM_CACHE + "_local",
            LEADERBOARD_CACHE + "_local",
            USER_CACHE + "_local"
        ));
        
        logger.info("Caffeine cache manager configured with local caching");
        return cacheManager;
    }
    
    /**
     * Redis template for manual cache operations
     */
    @Bean
    @ConditionalOnProperty(name = "app.cache.redis.enabled", havingValue = "true", matchIfMissing = true)
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory connectionFactory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);
        
        // Use String serialization for keys
        template.setKeySerializer(new StringRedisSerializer());
        template.setHashKeySerializer(new StringRedisSerializer());
        
        // Use JSON serialization for values
        GenericJackson2JsonRedisSerializer jsonSerializer = createJsonRedisSerializer();
        template.setValueSerializer(jsonSerializer);
        template.setHashValueSerializer(jsonSerializer);
        
        template.setDefaultSerializer(jsonSerializer);
        template.afterPropertiesSet();
        
        logger.info("Redis template configured for manual cache operations");
        return template;
    }
    
    /**
     * Create JSON serializer for Redis with proper configuration
     */
    private GenericJackson2JsonRedisSerializer createJsonRedisSerializer() {
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        objectMapper.activateDefaultTyping(
            objectMapper.getPolymorphicTypeValidator(),
            ObjectMapper.DefaultTyping.NON_FINAL,
            JsonTypeInfo.As.PROPERTY
        );
        
        return new GenericJackson2JsonRedisSerializer(objectMapper);
    }
    
    /**
     * Cache statistics and monitoring bean
     */
    @Bean
    public CacheMetrics cacheMetrics() {
        return new CacheMetrics();
    }
    
    /**
     * Helper class for cache metrics and monitoring
     */
    public static class CacheMetrics {
        private static final Logger logger = LoggerFactory.getLogger(CacheMetrics.class);
        
        public void logCacheStats(String cacheName, long hits, long misses, double hitRate) {
            logger.info("Cache stats for {}: hits={}, misses={}, hit rate={:.2f}%", 
                       cacheName, hits, misses, hitRate * 100);
        }
        
        public void logCacheEviction(String cacheName, String key, String reason) {
            logger.debug("Cache eviction in {}: key={}, reason={}", cacheName, key, reason);
        }
    }
}
