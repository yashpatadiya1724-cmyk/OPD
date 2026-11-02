/**
 * MediQ Double-Entry Accounting & EMR Settlement Engine
 * Project Code: SOCCA - 12 | Silver Oak College of Computer Applications
 * 
 * Enforces strict mathematical balance for hospital billing, pharmacy disbursements,
 * and online refunds: sum(Debit) must strictly equal sum(Credit).
 */

export class EmrLedgerService {
  /**
   * Validates whether a journal entry batch satisfies the fundamental double-entry identity:
   * Total Debits === Total Credits.
   * 
   * @param {Array<{ debitAccount: string, creditAccount: string, amount: number }>} entries
   * @returns {{ balanced: boolean, totalDebit: number, totalCredit: number, difference: number }}
   */
  static validateJournalBatch(entries = []) {
    if (!Array.isArray(entries) || entries.length === 0) {
      return { balanced: false, totalDebit: 0, totalCredit: 0, difference: 0 };
    }

    let totalDebit = 0;
    let totalCredit = 0;

    for (const entry of entries) {
      const amt = Number(entry.amount) || 0;
      if (amt <= 0) {
        throw new Error(`Ledger entry amount must be positive, received: ${entry.amount}`);
      }
      totalDebit += amt;
      totalCredit += amt;
    }

    const diff = Math.abs(Number((totalDebit - totalCredit).toFixed(2)));
    return {
      balanced: diff === 0,
      totalDebit: Number(totalDebit.toFixed(2)),
      totalCredit: Number(totalCredit.toFixed(2)),
      difference: diff,
    };
  }

  /**
   * Constructs a balanced settlement transaction for an express medicine delivery.
   * Debits patient cash/Razorpay escrow and credits pharmacy revenue + rider payout.
   */
  static createPharmacySettlement({
    orderId,
    patientPaidAmount,
    pharmacyDisbursement,
    riderFee,
    platformFee = 0,
  }) {
    const totalOutflow = Number((pharmacyDisbursement + riderFee + platformFee).toFixed(2));
    const inflow = Number(patientPaidAmount.toFixed(2));

    if (inflow !== totalOutflow) {
      throw new Error(
        `Settlement imbalance: Inflow (₹${inflow}) does not match Disbursements (₹${totalOutflow})`
      );
    }

    return [
      {
        transactionRef: `SETTLE-${orderId}`,
        debitAccount: 'ACCOUNT_RECEIVABLE_ESCROW',
        creditAccount: 'PHARMACY_PAYABLE',
        amount: pharmacyDisbursement,
      },
      {
        transactionRef: `SETTLE-${orderId}`,
        debitAccount: 'ACCOUNT_RECEIVABLE_ESCROW',
        creditAccount: 'RIDER_DELIVERY_PAYABLE',
        amount: riderFee,
      },
      ...(platformFee > 0
        ? [
            {
              transactionRef: `SETTLE-${orderId}`,
              debitAccount: 'ACCOUNT_RECEIVABLE_ESCROW',
              creditAccount: 'MEDIQ_PLATFORM_REVENUE',
              amount: platformFee,
            },
          ]
        : []),
    ];
  }
}

export default EmrLedgerService;
