export function getProductUnitCost(product) {
  const amount = Number(
    product?.cost_price ?? product?.unit_cost ?? product?.unit_price ?? 0,
  )

  if (!Number.isFinite(amount) || amount < 0) {
    return 0
  }

  return Number(amount.toFixed(2))
}

export function calculatePurchaseOrderLineTotal(quantity, unitCost) {
  const normalizedQuantity = Number(quantity ?? 0)
  const normalizedUnitCost = Number(unitCost ?? 0)

  if (!Number.isFinite(normalizedQuantity) || !Number.isFinite(normalizedUnitCost)) {
    return 0
  }

  return Number((normalizedQuantity * normalizedUnitCost).toFixed(2))
}
