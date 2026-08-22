export const deals = [
  { id: "data-55", category: "data", price: 55, quantity: "1.5GB", validity: "Till midnight", repeatable: false },
  { id: "data-20", category: "data", price: 20, quantity: "300MB + WhatsApp", validity: "24 hours", repeatable: false },
  { id: "data-19", category: "data", price: 19, quantity: "1GB", validity: "1 hour", repeatable: false },
  { id: "data-49", category: "data", price: 49, quantity: "1.5GB", validity: "3 hours", repeatable: false },
  { id: "data-99", category: "data", price: 99, quantity: "1.8GB", validity: "24 hours", repeatable: false },
  { id: "data-500", category: "data", price: 500, quantity: "13GB + YouTube", validity: "7 days", repeatable: false },
  { id: "data-100", category: "data", price: 100, quantity: "2GB", validity: "3 days", repeatable: true },
  { id: "data-50", category: "data", price: 50, quantity: "1GB", validity: "24 hours", repeatable: true },
  { id: "minutes-21", category: "minutes", price: 21, quantity: "45 minutes", validity: "3 hours", repeatable: true },
  { id: "minutes-51", category: "minutes", price: 51, quantity: "50 minutes", validity: "Till midnight", repeatable: true },
  { id: "minutes-100", category: "minutes", price: 100, quantity: "120 minutes", validity: "2 days", repeatable: true },
  { id: "sms-5", category: "sms", price: 5, quantity: "20 SMS", validity: "Daily", repeatable: true },
  { id: "sms-10", category: "sms", price: 10, quantity: "200 SMS", validity: "Daily", repeatable: true },
  { id: "sms-30", category: "sms", price: 30, quantity: "1,000 SMS", validity: "Weekly", repeatable: true },
] as const;

export type Deal = (typeof deals)[number];