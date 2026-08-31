const BASE_URL = 'http://localhost:3000/api';

export const fetchComparison = async () => {
  const res = await fetch(`${BASE_URL}/analytics/comparison`);
  if (!res.ok) throw new Error('Failed to fetch comparison analytics');
  return res.json();
};

export const fetchBreakdown = async () => {
  const res = await fetch(`${BASE_URL}/analytics/breakdown`);
  if (!res.ok) throw new Error('Failed to fetch failure breakdown');
  return res.json();
};

export const fetchRecoveryActions = async () => {
  const res = await fetch(`${BASE_URL}/recovery-actions`);
  if (!res.ok) throw new Error('Failed to fetch recovery actions');
  return res.json();
};

export const fetchAuditTrail = async (transactionId) => {
  const res = await fetch(`${BASE_URL}/audit/${transactionId}`);
  if (!res.ok) throw new Error('Failed to fetch transaction audit trail');
  return res.json();
};

export const simulateLivePayment = async () => {
  const res = await fetch(`${BASE_URL}/simulate-live`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error('Failed to simulate live payment');
  return res.json();
};
