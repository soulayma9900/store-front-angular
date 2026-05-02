# API Endpoints

This document lists the backend HTTP endpoints frontend will call.

> Note: All endpoints that require authentication use the JWT guard (`JwtAuthGuard`). Role restrictions are noted per-endpoint.

## Auth

- **POST** `/auth/login`
  - Auth: No
  - Request body: `LoginRequestDto` (username, password)
  - Response: `LoginResponseDto` (access token + user info)

## Products (`/products`)

- **POST** `/products`
  - Auth: Yes
  - Roles: `ADMIN`, `STAFF`
  - Request body: `ProductCreateDto`
  - Response: `ProductResponseDto`

- **PUT** `/products/:id`
  - Auth: Yes
  - Roles: `ADMIN`, `STAFF`
  - Request body: `ProductUpdateDto`
  - Response: `ProductResponseDto`

- **DELETE** `/products/:id`
  - Auth: Yes
  - Roles: `ADMIN`
  - Response: empty (204)

- **GET** `/products/:id`
  - Auth: Yes
  - Roles: `ADMIN`, `STAFF`
  - Response: `ProductResponseDto`

- **GET** `/products/by-barcode/:barcode`
  - Auth: Yes
  - Roles: `ADMIN`, `STAFF`
  - Response: `ProductResponseDto`

- **POST** `/products/:id/stock/receive`
  - Auth: Yes
  - Roles: `ADMIN`, `STAFF`
  - Request body: `StockReceiveDto`
  - Response: `ProductResponseDto`

- **POST** `/products/:id/stock/waste`
  - Auth: Yes
  - Roles: `ADMIN`, `STAFF`
  - Request body: `StockWasteDto`
  - Response: `ProductResponseDto`

- **POST** `/products/:id/stock/adjust`
  - Auth: Yes
  - Roles: `ADMIN`, `STAFF`
  - Request body: `StockAdjustDto`
  - Response: `ProductResponseDto`

- **GET** `/products/:id/stock/movements`
  - Auth: Yes
  - Roles: `ADMIN`, `STAFF`
  - Query: `page`, `size`
  - Response: paginated `StockMovementResponseDto[]`

- **GET** `/products/:id/stock/batches`
  - Auth: Yes
  - Roles: `ADMIN`, `STAFF`
  - Query: `availableOnly` (defaults to true)
  - Response: `BatchResponseDto[]`

- **GET** `/products`
  - Auth: Yes
  - Roles: `ADMIN`, `STAFF`
  - Query: `page`, `size`, `sortBy`, `sortDir`, `name`, `categoryId`, `supplierId`
  - Response: paginated `ProductResponseDto[]`

- **GET** `/products/alerts/low-stock`
  - Auth: Yes
  - Roles: `ADMIN`, `STAFF`
  - Response: `ProductResponseDto[]`

- **GET** `/products/reorder-list`
  - Auth: Yes
  - Roles: `ADMIN`, `STAFF`
  - Response: array (reorder list)

- **POST** `/products/:id/alerts/snooze`?days=7
  - Auth: Yes
  - Roles: `ADMIN`, `STAFF`
  - Query: `days` (defaults to 7)
  - Response: empty

- **PATCH** `/products/bulk/category`
  - Auth: Yes
  - Roles: `ADMIN`
  - Request body: `ProductBulkCategoryDto`

- **PATCH** `/products/bulk/price`
  - Auth: Yes
  - Roles: `ADMIN`
  - Request body: `ProductBulkPriceDto`

- **POST** `/products/import-csv` (multipart)
  - Auth: Yes
  - Roles: `ADMIN`
  - Form: `file` (CSV)
  - Response: `ProductImportResultDto`

## Categories (`/categories`)

- **POST** `/categories`
  - Auth: Yes
  - Roles: `ADMIN`, `STAFF`
  - Request body: `CategoryCreateDto`
  - Response: `CategoryResponseDto`

- **PUT** `/categories/:id`
  - Auth: Yes
  - Roles: `ADMIN`, `STAFF`
  - Request body: `CategoryUpdateDto`
  - Response: `CategoryResponseDto`

- **DELETE** `/categories/:id`
  - Auth: Yes
  - Roles: `ADMIN`

- **GET** `/categories/:id`
  - Auth: Yes
  - Roles: `ADMIN`, `STAFF`
  - Response: `CategoryResponseDto`

- **GET** `/categories`
  - Auth: Yes
  - Roles: `ADMIN`, `STAFF`
  - Response: `CategoryResponseDto[]`

## Suppliers (`/suppliers`)

- **POST** `/suppliers`
  - Auth: Yes
  - Roles: `ADMIN`, `STAFF`
  - Request body: `SupplierCreateDto`
  - Response: `SupplierResponseDto`

- **PUT** `/suppliers/:id`
  - Auth: Yes
  - Roles: `ADMIN`, `STAFF`
  - Request body: `SupplierUpdateDto`
  - Response: `SupplierResponseDto`

- **DELETE** `/suppliers/:id`
  - Auth: Yes
  - Roles: `ADMIN`

- **GET** `/suppliers/:id`
  - Auth: Yes
  - Roles: `ADMIN`, `STAFF`
  - Response: `SupplierResponseDto`

- **GET** `/suppliers`
  - Auth: Yes
  - Roles: `ADMIN`, `STAFF`
  - Response: `SupplierResponseDto[]`

## Product - Suppliers (`/products/:productId/suppliers`)

- **POST** `/products/:productId/suppliers`
  - Auth: Yes
  - Roles: `ADMIN`, `STAFF`
  - Request body: `ProductSupplierRequestDto`
  - Response: `ProductSupplierResponseDto`

- **GET** `/products/:productId/suppliers`
  - Auth: Yes
  - Roles: `ADMIN`, `STAFF`
  - Response: `ProductSupplierResponseDto[]`

- **GET** `/products/:productId/suppliers/history`
  - Auth: Yes
  - Roles: `ADMIN`, `STAFF`
  - Response: `ProductSupplierHistoryResponseDto[]`

- **GET** `/products/:productId/suppliers/by-supplier/:supplierId`
  - Auth: Yes
  - Roles: `ADMIN`, `STAFF`
  - Response: `ProductSupplierResponseDto[]`

## Sales (`/sales`)

- **POST** `/sales`
  - Auth: Yes
  - Roles: `ADMIN`, `STAFF`
  - Request body: `SaleCreateDto`
  - Response: `SaleResponseDto`

- **GET** `/sales`
  - Auth: Yes
  - Roles: `ADMIN`, `STAFF`
  - Query: `page`, `size`, `productId`
  - Response: paginated `SaleResponseDto[]`

## Dashboard (`/dashboard`)

- **GET** `/dashboard`
  - Auth: Yes
  - Roles: `ADMIN`, `STAFF`
  - Response: `DashboardResponseDto` (aggregated stats, charts, tables)

## Root

- **GET** `/` — simple health/hello endpoint (no auth)

---

If you want, I can:

- add example request/response JSON for each endpoint
- add OpenAPI/Swagger links or generate a Postman collection

Files referenced (for DTO shapes):

- `src/auth/dto`
- `src/inventory/products/dto`
- `src/inventory/categories/dto`
- `src/inventory/suppliers/dto`
- `src/inventory/product-suppliers/dto`
- `src/inventory/sales/dto`
- `src/dashboard`
