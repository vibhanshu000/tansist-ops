# 🟩 SHARED — lib (api client, hooks, utils)

Yash sets these up in Phase 0; everyone imports them.

Files:
- api.ts         (axios/fetch instance with base URL + Bearer token interceptor)
- queryClient.ts (if using React Query)
- utils.ts       (cn() classname helper, formatCurrency, formatDate)
- statusColors.ts (maps status string -> design-system color token)

If you add a shared util, keep it generic and tell the group.
