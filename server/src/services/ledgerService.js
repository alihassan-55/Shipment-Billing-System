// server/src/services/ledgerService.js
import { prisma } from '../db/client.js';
import crypto from 'crypto';

export class LedgerService {
  /**
   * Helper method to create ledger entry with balance calculation
   */
  static async createLedgerEntry(tx, entryData) {
    const { customerId, referenceId, entryType, description, debit, credit } = entryData;
    
    // Get current customer balance
    const customer = await tx.customer.findUnique({
      where: { id: customerId },
      select: { ledgerBalance: true }
    });

    if (!customer) {
      throw new Error(`Customer with ID ${customerId} not found for ledger entry creation.`);
    }

    const debitAmount = Number(debit) || 0;
    const creditAmount = Number(credit) || 0;
    const currentBalance = customer.ledgerBalance || 0;
    const newBalance = currentBalance + debitAmount - creditAmount;

    const ledgerEntry = await tx.ledgerEntry.create({
      data: {
        id: crypto.randomUUID(),
        customerId,
        referenceId,
        entryType,
        description,
        debit: debitAmount,
        credit: creditAmount,
        balanceAfter: newBalance,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    // Update customer balance
    await tx.customer.update({
      where: { id: customerId },
      data: {
        ledgerBalance: newBalance,
        updatedAt: new Date()
      }
    });

    return ledgerEntry;
  }
}
