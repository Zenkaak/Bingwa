import * as zod from "zod";

export const HealthCheckResponse = zod.object({
  status: zod.string(),
});

export const ListDealsResponseItem = zod.object({
  id: zod.string(),
  category: zod.enum(["data", "minutes", "sms"]),
  price: zod.number().min(1),
  quantity: zod.string(),
  validity: zod.string(),
  repeatable: zod.boolean(),
});
export const ListDealsResponse = zod.array(ListDealsResponseItem);
export const UpdateDealBody = zod.object({
  category: zod.enum(["data", "minutes", "sms"]).optional(),
  price: zod.number().int().min(1).optional(),
  quantity: zod.string().min(1).optional(),
  validity: zod.string().min(1).optional(),
  repeatable: zod.boolean().optional(),
});
export const UpdateDealResponse = ListDealsResponseItem;
export const ListAdminDealsResponse = zod.array(ListDealsResponseItem);

export const GetStoreSettingsResponse = zod.object({
  tillNumber: zod.string(),
  customerCare: zod.string(),
  contactName: zod.string(),
});

export const StartCheckoutBody = zod.object({
  dealId: zod.string().min(1),
  phoneNumber: zod.string().min(9),
  customerName: zod.string().min(2).nullable().optional(),
});

export const StartCheckoutResponse = zod.object({
  orderId: zod.number(),
  message: zod.string(),
});

export const AdminLoginBody = zod.object({
  password: zod.string().min(1),
});

export const AdminLoginResponse = zod.object({
  success: zod.boolean(),
});

export const GetAdminSummaryResponse = zod.object({
  totalOrders: zod.number(),
  completedOrders: zod.number(),
  failedOrders: zod.number(),
  pendingOrders: zod.number(),
  totalRevenue: zod.number(),
  todayOrders: zod.number(),
  todayRevenue: zod.number(),
  completionRate: zod.number(),
  recentOrders: zod.array(
    zod.object({
      id: zod.number(),
      phoneNumber: zod.string(),
      dealId: zod.string(),
      amount: zod.number(),
      status: zod.enum(["pending", "completed", "failed"]),
      mpesaReceipt: zod.string().nullish(),
      failureReason: zod.string().nullish(),
      createdAt: zod.string(),
    }),
  ),
});

export const ListCustomersResponseItem = zod.object({
  id: zod.number(),
  phoneNumber: zod.string(),
  name: zod.string().nullish(),
  orderCount: zod.number(),
  totalSpent: zod.number(),
  lastOrderAt: zod.string().nullable(),
  lastMpesaReference: zod.string().nullish(),
});
export const ListCustomersResponse = zod.array(ListCustomersResponseItem);

export const ListCustomersQueryParams = zod.object({
  q: zod.string().optional(),
});

export const ListOrdersQueryParams = zod.object({
  status: zod.enum(["all", "completed", "failed", "pending"]).optional(),
});

export const ListOrdersResponseItem = zod.object({
  id: zod.number(),
  phoneNumber: zod.string(),
  dealId: zod.string(),
  amount: zod.number(),
  status: zod.enum(["pending", "completed", "failed"]),
  mpesaReceipt: zod.string().nullish(),
  failureReason: zod.string().nullish(),
  createdAt: zod.string(),
});
export const ListOrdersResponse = zod.array(ListOrdersResponseItem);

export const UpdateStoreSettingsBody = zod.object({
  tillNumber: zod.string().min(5).optional(),
  customerCare: zod.string().min(5).optional(),
  contactName: zod.string().min(2).optional(),
});

export const UpdateStoreSettingsResponse = zod.object({
  tillNumber: zod.string(),
  customerCare: zod.string(),
  contactName: zod.string(),
});