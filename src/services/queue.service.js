const Bull = require('bull');
const config = require('../config');
const logger = require('../utils/logger');
const messageService = require('./message.service');
const { QUEUE_NAMES, QUEUE_PRIORITIES } = require('../utils/constants');
const { QueueError } = require('../utils/errors');

class QueueService {
  constructor() {
    this.queues = {};
    this.isInitialized = false;
  }

  /**
   * Initialize all queues
   */
  async initialize() {
    try {
      if (this.isInitialized) {
        logger.warn('Queue service already initialized');
        return;
      }

      logger.info('Initializing queue service...');

      // Create message queue
      this.queues[QUEUE_NAMES.MESSAGE] = new Bull(QUEUE_NAMES.MESSAGE, {
        redis: {
          host: config.redis.host,
          port: config.redis.port,
          password: config.redis.password || undefined,
          db: config.redis.db,
        },
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          removeOnComplete: 100,
          removeOnFail: 100,
        },
      });

      // Create broadcast queue
      this.queues[QUEUE_NAMES.BROADCAST] = new Bull(QUEUE_NAMES.BROADCAST, {
        redis: {
          host: config.redis.host,
          port: config.redis.port,
          password: config.redis.password || undefined,
          db: config.redis.db,
        },
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 3000,
          },
          removeOnComplete: 50,
          removeOnFail: 50,
        },
      });

      // Create webhook queue
      this.queues[QUEUE_NAMES.WEBHOOK] = new Bull(QUEUE_NAMES.WEBHOOK, {
        redis: {
          host: config.redis.host,
          port: config.redis.port,
          password: config.redis.password || undefined,
          db: config.redis.db,
        },
        defaultJobOptions: {
          attempts: 5,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
          removeOnComplete: 100,
          removeOnFail: 50,
        },
      });

      // Setup processors
      this.setupProcessors();

      // Setup event listeners
      this.setupEventListeners();

      this.isInitialized = true;
      logger.info('✅ Queue service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize queue service:', error);
      throw new QueueError('Failed to initialize queue service');
    }
  }

  /**
   * Setup queue processors
   */
  setupProcessors() {
    // Message queue processor
    this.queues[QUEUE_NAMES.MESSAGE].process(async (job) => {
      const { to, message, messageType, userId, mediaPath, caption, filename, mimetype } = job.data;

      logger.info(`Processing message job ${job.id} to ${to}`);

      try {
        let result;

        switch (messageType) {
          case 'text':
            result = await messageService.sendTextMessage(to, message, userId);
            break;

          case 'image':
            result = await messageService.sendImageMessage(to, mediaPath, caption, userId);
            break;

          case 'video':
            result = await messageService.sendVideoMessage(to, mediaPath, caption, userId);
            break;

          case 'document':
            result = await messageService.sendDocumentMessage(to, mediaPath, filename, mimetype, userId);
            break;

          default:
            throw new Error(`Unsupported message type: ${messageType}`);
        }

        logger.info(`Message job ${job.id} completed successfully`);
        return result;
      } catch (error) {
        logger.error(`Message job ${job.id} failed:`, error);
        throw error;
      }
    });

    // Broadcast queue processor
    this.queues[QUEUE_NAMES.BROADCAST].process(async (job) => {
      const { recipients, message, messageType, userId, delay = 2000 } = job.data;

      logger.info(`Processing broadcast job ${job.id} to ${recipients.length} recipients`);

      const results = {
        total: recipients.length,
        success: 0,
        failed: 0,
        errors: [],
      };

      for (let i = 0; i < recipients.length; i++) {
        const recipient = recipients[i];

        try {
          // Add to message queue
          await this.addToMessageQueue({
            to: recipient,
            message,
            messageType,
            userId,
          });

          results.success++;

          // Delay between messages to avoid spam detection
          if (i < recipients.length - 1) {
            await this.sleep(delay);
          }
        } catch (error) {
          results.failed++;
          results.errors.push({
            recipient,
            error: error.message,
          });
          logger.error(`Failed to send to ${recipient}:`, error);
        }

        // Update job progress
        const progress = Math.floor(((i + 1) / recipients.length) * 100);
        job.progress(progress);
      }

      logger.info(`Broadcast job ${job.id} completed: ${results.success} success, ${results.failed} failed`);
      return results;
    });

    // Webhook queue processor (will be implemented in webhook.service.js)
    this.queues[QUEUE_NAMES.WEBHOOK].process(async (job) => {
      const { url, payload, secret, retryCount = 0 } = job.data;

      logger.info(`Processing webhook job ${job.id} to ${url}`);

      try {
        const axios = require('axios');
        const { generateHmacSignature } = require('../utils/helpers');

        const signature = secret ? generateHmacSignature(payload, secret) : null;

        const headers = {
          'Content-Type': 'application/json',
          'User-Agent': 'WA-Gate-v2-Webhook',
        };

        if (signature) {
          headers['X-Webhook-Signature'] = `sha256=${signature}`;
        }

        const response = await axios.post(url, payload, {
          headers,
          timeout: 10000,
        });

        logger.info(`Webhook job ${job.id} completed with status ${response.status}`);
        return { status: response.status, data: response.data };
      } catch (error) {
        logger.error(`Webhook job ${job.id} failed (attempt ${retryCount + 1}):`, error.message);
        throw error;
      }
    });

    logger.info('Queue processors setup completed');
  }

  /**
   * Setup event listeners for all queues
   */
  setupEventListeners() {
    Object.entries(this.queues).forEach(([name, queue]) => {
      queue.on('completed', (job, result) => {
        logger.info(`[${name}] Job ${job.id} completed`);
      });

      queue.on('failed', (job, error) => {
        logger.error(`[${name}] Job ${job.id} failed:`, error.message);
      });

      queue.on('stalled', (job) => {
        logger.warn(`[${name}] Job ${job.id} stalled`);
      });

      queue.on('error', (error) => {
        logger.error(`[${name}] Queue error:`, error);
      });
    });

    logger.info('Queue event listeners setup completed');
  }

  /**
   * Add message to queue
   */
  async addToMessageQueue(data, options = {}) {
    try {
      const job = await this.queues[QUEUE_NAMES.MESSAGE].add(data, {
        priority: options.priority || QUEUE_PRIORITIES.NORMAL,
        delay: options.delay || 0,
        ...options,
      });

      logger.info(`Message job ${job.id} added to queue`);
      return job;
    } catch (error) {
      logger.error('Failed to add message to queue:', error);
      throw new QueueError('Failed to add message to queue');
    }
  }

  /**
   * Add broadcast to queue
   */
  async addToBroadcastQueue(data, options = {}) {
    try {
      const job = await this.queues[QUEUE_NAMES.BROADCAST].add(data, {
        priority: options.priority || QUEUE_PRIORITIES.LOW,
        ...options,
      });

      logger.info(`Broadcast job ${job.id} added to queue`);
      return job;
    } catch (error) {
      logger.error('Failed to add broadcast to queue:', error);
      throw new QueueError('Failed to add broadcast to queue');
    }
  }

  /**
   * Add webhook to queue
   */
  async addToWebhookQueue(data, options = {}) {
    try {
      const job = await this.queues[QUEUE_NAMES.WEBHOOK].add(data, {
        priority: options.priority || QUEUE_PRIORITIES.HIGH,
        ...options,
      });

      logger.info(`Webhook job ${job.id} added to queue`);
      return job;
    } catch (error) {
      logger.error('Failed to add webhook to queue:', error);
      throw new QueueError('Failed to add webhook to queue');
    }
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(queueName) {
    try {
      const queue = this.queues[queueName];
      if (!queue) {
        throw new Error(`Queue ${queueName} not found`);
      }

      const [waiting, active, completed, failed, delayed] = await Promise.all([
        queue.getWaitingCount(),
        queue.getActiveCount(),
        queue.getCompletedCount(),
        queue.getFailedCount(),
        queue.getDelayedCount(),
      ]);

      return {
        name: queueName,
        waiting,
        active,
        completed,
        failed,
        delayed,
        total: waiting + active + completed + failed + delayed,
      };
    } catch (error) {
      logger.error(`Failed to get stats for queue ${queueName}:`, error);
      throw error;
    }
  }

  /**
   * Get all queues statistics
   */
  async getAllQueuesStats() {
    try {
      const stats = {};

      for (const queueName of Object.keys(this.queues)) {
        stats[queueName] = await this.getQueueStats(queueName);
      }

      return stats;
    } catch (error) {
      logger.error('Failed to get all queues stats:', error);
      throw error;
    }
  }

  /**
   * Get queue jobs
   */
  async getQueueJobs(queueName, status = 'waiting', start = 0, end = 10) {
    try {
      const queue = this.queues[queueName];
      if (!queue) {
        throw new Error(`Queue ${queueName} not found`);
      }

      const jobs = await queue.getJobs([status], start, end);

      return jobs.map((job) => ({
        id: job.id,
        data: job.data,
        progress: job.progress(),
        attemptsMade: job.attemptsMade,
        processedOn: job.processedOn,
        finishedOn: job.finishedOn,
        failedReason: job.failedReason,
      }));
    } catch (error) {
      logger.error(`Failed to get jobs for queue ${queueName}:`, error);
      throw error;
    }
  }

  /**
   * Remove job from queue
   */
  async removeJob(queueName, jobId) {
    try {
      const queue = this.queues[queueName];
      if (!queue) {
        throw new Error(`Queue ${queueName} not found`);
      }

      const job = await queue.getJob(jobId);
      if (job) {
        await job.remove();
        logger.info(`Job ${jobId} removed from ${queueName}`);
      }
    } catch (error) {
      logger.error(`Failed to remove job ${jobId}:`, error);
      throw error;
    }
  }

  /**
   * Pause queue
   */
  async pauseQueue(queueName) {
    try {
      const queue = this.queues[queueName];
      if (!queue) {
        throw new Error(`Queue ${queueName} not found`);
      }

      await queue.pause();
      logger.info(`Queue ${queueName} paused`);
    } catch (error) {
      logger.error(`Failed to pause queue ${queueName}:`, error);
      throw error;
    }
  }

  /**
   * Resume queue
   */
  async resumeQueue(queueName) {
    try {
      const queue = this.queues[queueName];
      if (!queue) {
        throw new Error(`Queue ${queueName} not found`);
      }

      await queue.resume();
      logger.info(`Queue ${queueName} resumed`);
    } catch (error) {
      logger.error(`Failed to resume queue ${queueName}:`, error);
      throw error;
    }
  }

  /**
   * Clean queue
   */
  async cleanQueue(queueName, grace = 0, status = 'completed') {
    try {
      const queue = this.queues[queueName];
      if (!queue) {
        throw new Error(`Queue ${queueName} not found`);
      }

      await queue.clean(grace, status);
      logger.info(`Queue ${queueName} cleaned (status: ${status})`);
    } catch (error) {
      logger.error(`Failed to clean queue ${queueName}:`, error);
      throw error;
    }
  }

  /**
   * Sleep helper
   */
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Close all queues
   */
  async closeAll() {
    try {
      await Promise.all(
        Object.values(this.queues).map((queue) => queue.close())
      );
      logger.info('All queues closed');
    } catch (error) {
      logger.error('Failed to close queues:', error);
    }
  }
}

module.exports = new QueueService();