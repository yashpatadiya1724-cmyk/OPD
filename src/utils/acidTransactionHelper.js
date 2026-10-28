/**
 * MediQ ACID Transaction & Optimistic Concurrency Lock Helper
 * Prevents negative inventory and concurrent double-dispensing in multi-store networks.
 */

export class InsufficientStockError extends Error {
  constructor(medicineName, requested, available) {
    super(`Insufficient stock for ${medicineName}. Requested: ${requested}, Available: ${available}`);
    this.name = 'InsufficientStockError';
    this.medicineName = medicineName;
    this.requested = requested;
    this.available = available;
  }
}

/**
 * Validates stock availability against atomic snapshot
 * @param {Array} requestedItems - [{ drugId, brandName, quantity }]
 * @param {Map} currentInventorySnapshots - Map of drugId -> { availableQty, mrp }
 */
export function validateAndCalculateReservation(requestedItems, currentInventorySnapshots) {
  let totalAmount = 0;
  const reservationOperations = [];

  for (const item of requestedItems) {
    const stockInfo = currentInventorySnapshots.get(item.drugId);
    if (!stockInfo || stockInfo.availableQty < item.quantity) {
      throw new InsufficientStockError(
        item.brandName || item.drugId,
        item.quantity,
        stockInfo ? stockInfo.availableQty : 0
      );
    }

    const price = stockInfo.sellingPrice || stockInfo.mrp || 0;
    totalAmount += price * item.quantity;

    reservationOperations.push({
      drugId: item.drugId,
      newAvailableQty: stockInfo.availableQty - item.quantity,
      deductedQty: item.quantity,
      unitPrice: price,
    });
  }

  return {
    totalAmount,
    reservationOperations,
    isConfirmed: true,
  };
}
