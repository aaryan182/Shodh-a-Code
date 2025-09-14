package com.codingcontest.platform.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;

/**
 * Async configuration for the application
 * Configures thread pool for asynchronous task execution
 */
@Configuration
@EnableAsync
public class AsyncConfig {
    
    private static final Logger logger = LoggerFactory.getLogger(AsyncConfig.class);
    
    // Configurable async processing parameters
    @Value("${app.async.submission-processor.core-pool-size:8}")
    private int submissionCorePoolSize;
    
    @Value("${app.async.submission-processor.max-pool-size:25}")
    private int submissionMaxPoolSize;
    
    @Value("${app.async.submission-processor.queue-capacity:200}")
    private int submissionQueueCapacity;
    
    @Value("${app.async.task-executor.core-pool-size:3}")
    private int taskCorePoolSize;
    
    @Value("${app.async.task-executor.max-pool-size:10}")
    private int taskMaxPoolSize;
    
    @Value("${app.async.task-executor.queue-capacity:50}")
    private int taskQueueCapacity;
    
    /**
     * Configure the executor for async submission processing
     * This executor is specifically optimized for code execution tasks which are:
     * - CPU intensive (compilation and execution)
     * - I/O intensive (Docker container management)
     * - Potentially long-running (up to timeout limits)
     */
    @Bean(name = "submissionExecutor")
    public Executor submissionExecutor() {
        logger.info("Configuring submission executor for async submission processing");
        
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        
        // Core pool size - configurable for different deployment scenarios
        executor.setCorePoolSize(submissionCorePoolSize);
        
        // Maximum pool size - allow scaling up for peak loads
        executor.setMaxPoolSize(submissionMaxPoolSize);
        
        // Queue capacity - buffer for submission spikes
        executor.setQueueCapacity(submissionQueueCapacity);
        
        // Thread name prefix for easy identification in logs and monitoring
        executor.setThreadNamePrefix("SubmissionProcessor-");
        
        // Keep alive time for idle threads (in seconds)
        // Longer timeout for submission processing threads
        executor.setKeepAliveSeconds(120);
        
        // Allow core threads to timeout during low activity periods
        executor.setAllowCoreThreadTimeOut(false); // Keep core threads alive for responsiveness
        
        // Rejection policy when pool and queue are full
        // CallerRunsPolicy ensures submissions are not lost during overload
        executor.setRejectedExecutionHandler(new java.util.concurrent.ThreadPoolExecutor.CallerRunsPolicy());
        
        // Graceful shutdown configuration
        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(60); // Longer timeout for submission completion
        
        // Task decorator for enhanced monitoring and error handling
        executor.setTaskDecorator(runnable -> {
            return () -> {
                String threadName = Thread.currentThread().getName();
                logger.debug("Starting submission processing task on thread: {}", threadName);
                try {
                    runnable.run();
                } catch (Exception e) {
                    logger.error("Unhandled exception in submission processing task on thread {}: {}", 
                               threadName, e.getMessage(), e);
                    throw e;
                } finally {
                    logger.debug("Completed submission processing task on thread: {}", threadName);
                }
            };
        });
        
        executor.initialize();
        
        logger.info("Submission executor configured - Core: {}, Max: {}, Queue: {}, KeepAlive: {}s",
                   executor.getCorePoolSize(), executor.getMaxPoolSize(), 
                   executor.getQueueCapacity(), executor.getKeepAliveSeconds());
        
        return executor;
    }
    
    /**
     * Configure a general purpose executor for other async tasks
     */
    @Bean(name = "taskExecutor")
    public Executor taskExecutor() {
        logger.info("Configuring general task executor");
        
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        
        executor.setCorePoolSize(taskCorePoolSize);
        executor.setMaxPoolSize(taskMaxPoolSize);
        executor.setQueueCapacity(taskQueueCapacity);
        executor.setThreadNamePrefix("AsyncTask-");
        executor.setKeepAliveSeconds(60);
        executor.setAllowCoreThreadTimeOut(true);
        
        executor.setRejectedExecutionHandler(new java.util.concurrent.ThreadPoolExecutor.CallerRunsPolicy());
        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(20);
        
        executor.initialize();
        
        logger.info("General task executor configured with core pool size: {}, max pool size: {}, queue capacity: {}",
                   executor.getCorePoolSize(), executor.getMaxPoolSize(), executor.getQueueCapacity());
        
        return executor;
    }
}
