const baseTime = new Date('2026-10-28T08:00:00+05:30')

const transactions = [
  ['tx-001', 'acct-101', 'acct-202', 1800, 0],
  ['tx-002', 'acct-202', 'acct-303', 1650, 18],
  ['tx-003', 'acct-303', 'acct-101', 1500, 41],
  ['tx-004', 'acct-404', 'acct-202', 2200, 53],
  ['tx-005', 'acct-505', 'acct-202', 1950, 78],
  ['tx-006', 'acct-606', 'acct-202', 2400, 96],
  ['tx-007', 'acct-101', 'acct-707', 1200, 140],
] as const

export const examples: Record<string, unknown> = {
  graph: {
    transactions: transactions.map(([transaction_id, sender_account, receiver_account, amount, minute]) => ({
      transaction_id,
      sender_account,
      receiver_account,
      amount,
      timestamp: new Date(baseTime.getTime() + minute * 60_000).toISOString(),
      transaction_type: 'UPI',
    })),
  },
  anomaly: {
    history: [
      { amount: 720, timestamp: '2026-10-21T08:10:00+05:30', beneficiary: 'merchant-a' },
      { amount: 1100, timestamp: '2026-10-21T12:40:00+05:30', beneficiary: 'merchant-b' },
      { amount: 950, timestamp: '2026-10-22T09:05:00+05:30', beneficiary: 'merchant-a' },
      { amount: 1450, timestamp: '2026-10-22T18:20:00+05:30', beneficiary: 'merchant-c' },
      { amount: 820, timestamp: '2026-10-23T10:30:00+05:30', beneficiary: 'merchant-b' },
      { amount: 1320, timestamp: '2026-10-23T15:15:00+05:30', beneficiary: 'merchant-a' },
      { amount: 1750, timestamp: '2026-10-24T11:00:00+05:30', beneficiary: 'merchant-c' },
      { amount: 610, timestamp: '2026-10-24T17:25:00+05:30', beneficiary: 'merchant-a' },
      { amount: 1200, timestamp: '2026-10-25T13:10:00+05:30', beneficiary: 'merchant-b' },
      { amount: 980, timestamp: '2026-10-26T08:55:00+05:30', beneficiary: 'merchant-c' },
    ],
    candidate_amount: 80000,
    candidate_timestamp: '2026-10-28T02:25:00+05:30',
    candidate_beneficiary: 'new-beneficiary',
  },
  bayesian: {
    training_data: [
      { fraud: false, features: { unusual_amount: false, new_beneficiary: false, rapid_activity: false } },
      { fraud: false, features: { unusual_amount: false, new_beneficiary: false, rapid_activity: false } },
      { fraud: false, features: { unusual_amount: false, new_beneficiary: true, rapid_activity: false } },
      { fraud: false, features: { unusual_amount: true, new_beneficiary: false, rapid_activity: false } },
      { fraud: false, features: { unusual_amount: false, new_beneficiary: false, rapid_activity: true } },
      { fraud: false, features: { unusual_amount: false, new_beneficiary: false, rapid_activity: false } },
      { fraud: false, features: { unusual_amount: true, new_beneficiary: false, rapid_activity: false } },
      { fraud: false, features: { unusual_amount: false, new_beneficiary: true, rapid_activity: false } },
      { fraud: true, features: { unusual_amount: true, new_beneficiary: true, rapid_activity: true } },
      { fraud: true, features: { unusual_amount: true, new_beneficiary: true, rapid_activity: false } },
      { fraud: true, features: { unusual_amount: false, new_beneficiary: true, rapid_activity: true } },
      { fraud: true, features: { unusual_amount: true, new_beneficiary: false, rapid_activity: true } },
    ],
    evidence: { unusual_amount: true, new_beneficiary: true, rapid_activity: true },
    smoothing_alpha: 1,
  },
  thresholds: {
    split: 'validation',
    labels: [0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0],
    scores: [0.12, 0.91, 0.43, 0.22, 0.74, 0.31, 0.67, 0.49, 0.18, 0.82, 0.38, 0.08],
    cost_fn: 10000,
    cost_fp: 100,
  },
  quantum: {
    resource_limit: 4,
    cases: [
      { case_id: 'CASE-101', expected_value: 9.2, resource_units: 2 },
      { case_id: 'CASE-102', expected_value: 7.1, resource_units: 1 },
      { case_id: 'CASE-103', expected_value: 8.4, resource_units: 3 },
      { case_id: 'CASE-104', expected_value: 5.2, resource_units: 2 },
      { case_id: 'CASE-105', expected_value: 3.8, resource_units: 1 },
    ],
  },
  risk: {
    training_data: [
      { fraud: false, features: { unusual_amount: false, new_beneficiary: false, rapid_activity: false } },
      { fraud: false, features: { unusual_amount: false, new_beneficiary: false, rapid_activity: false } },
      { fraud: false, features: { unusual_amount: false, new_beneficiary: true, rapid_activity: false } },
      { fraud: false, features: { unusual_amount: true, new_beneficiary: false, rapid_activity: false } },
      { fraud: true, features: { unusual_amount: true, new_beneficiary: true, rapid_activity: true } },
      { fraud: true, features: { unusual_amount: true, new_beneficiary: true, rapid_activity: false } },
      { fraud: true, features: { unusual_amount: false, new_beneficiary: true, rapid_activity: true } },
      { fraud: true, features: { unusual_amount: true, new_beneficiary: false, rapid_activity: true } },
    ],
    evidence: { unusual_amount: true, new_beneficiary: true, rapid_activity: true },
    low_max: 0.33,
    high_min: 0.66,
  },
}