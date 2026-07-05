export const INCOME_CATEGORIES = [
  { value: 'SALARY', label: 'Salary' },
  { value: 'TRANSFER_RECEIVED', label: 'Transfer Received' },
  { value: 'REFUND', label: 'Refund' },
  { value: 'INTEREST', label: 'Interest' },
  { value: 'OTHER_INCOME', label: 'Other Income' },
];

export const EXPENSE_CATEGORIES = [
  { value: 'FOOD', label: 'Food' },
  { value: 'SHOPPING', label: 'Shopping' },
  { value: 'FUEL', label: 'Fuel' },
  { value: 'RENT', label: 'Rent' },
  { value: 'BILLS', label: 'Bills' },
  { value: 'MEDICAL', label: 'Medical' },
  { value: 'ENTERTAINMENT', label: 'Entertainment' },
  { value: 'EDUCATION', label: 'Education' },
  { value: 'TRAVEL', label: 'Travel' },
  { value: 'OTHER', label: 'Other' },
];

export const TRANSACTION_SOURCES = [
  { value: 'MANUAL', label: 'Manual' },
  { value: 'SMS', label: 'SMS' },
  { value: 'STATEMENT', label: 'Statement' },
];

export function labelForCategory(type, value) {
  const list = type === 'INCOME' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  return list.find((item) => item.value === value)?.label || value;
}

export function formatCurrency(amount, currency = 'INR') {
  const symbol = currency === 'INR' ? '₹' : currency;
  return `${symbol}${Number(amount).toLocaleString('en-IN')}`;
}

export function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
