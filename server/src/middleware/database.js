import { prisma, checkDatabaseConnection } from '../db/client.js';

// Middleware to handle database connection issues
export async function withDatabaseRetry(operation, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Check if database is connected
      const isConnected = await checkDatabaseConnection();
      if (!isConnected) {
        console.log(`Database connection lost, attempting to reconnect (attempt ${attempt}/${maxRetries})`);
        // Force reconnection by disconnecting and reconnecting
        await prisma.$disconnect();
        await prisma.$connect();
      }
      
      // Execute the operation
      return await operation();
    } catch (error) {
      console.error(`Database operation failed (attempt ${attempt}/${maxRetries}):`, error);
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
}

// Enhanced error handler for database operations
export function handleDatabaseError(error, operation = 'database operation') {
  console.error(`Database error in ${operation}:`, error);
  
  // Common Prisma error codes
  const errorMessages = {
    P1001: 'Database connection failed. Please try again.',
    P1002: 'Database connection timeout. Please try again.',
    P1008: 'Database operation timeout. Please try again.',
    P1017: 'Database connection closed. Please refresh the page.',
    P2025: 'Record not found.',
    P2002: 'Duplicate entry found.',
  };
  
  const errorCode = error.code || error.meta?.code;
  const message = errorMessages[errorCode] || error.message || 'Database operation failed';
  
  return {
    error: message,
    code: errorCode,
    originalError: error
  };
}

