import { ProcessManagerService } from '../services/process-manager.service';
import { fileOperationsConfig, knowledgeSystemConfig } from '../config/process-groups';
import { logger } from '../utils/logger';

async function startServer(processManager: ProcessManagerService, config: any) {
  try {
    await processManager.register(config);
    await processManager.start(config.id);
    logger.info(`Started ${config.name}`);
  } catch (error) {
    logger.error(`Failed to start ${config.name}:`, error);
    throw error;
  }
}

async function main() {
  try {
    const processManager = new ProcessManagerService();

    // Start file operations first since it has no dependencies
    await startServer(processManager, fileOperationsConfig);
    logger.info('File operations server initialized');

    // Wait a bit before starting knowledge system to ensure file ops is ready
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Start knowledge system
    await startServer(processManager, knowledgeSystemConfig);
    logger.info('Knowledge system initialized');

    // Handle shutdown
    process.on('SIGINT', async () => {
      logger.info('Shutting down...');
      await processManager.dispose();
      process.exit(0);
    });

    logger.info('All services running');
  } catch (error) {
    logger.error('Failed to start process manager:', error);
    process.exit(1);
  }
}

main().catch(error => {
  logger.error('Unhandled error:', error);
  process.exit(1);
});
