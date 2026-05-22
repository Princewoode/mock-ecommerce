# MockShop Database Migration Plan

## Current storage

The project currently uses localStorage through service files:

- cartStorage.ts
- orderStorage.ts
- productStorage.ts
- authStorage.ts
- reviewStorage.ts
- localDatabase.ts

## Future database tables

### customers

Stores customer account/profile information.

Fields:
- id
- full_name
- email
- password_hash
- shipping_address
- created_at

### products

Stores products.

Fields:
- id
- name
- category
- description
- price
- image_url
- stock
- is_default
- created_at

### cart_items

Stores customer cart items.

Fields:
- id
- customer_id
- product_id
- quantity
- created_at

### orders

Stores order header information.

Fields:
- id
- customer_id
- customer_name
- customer_email
- shipping_address
- status
- payment_method
- total
- created_at

### order_items

Stores products inside each order.

Fields:
- id
- order_id
- product_id
- product_name
- product_category
- product_image
- product_price
- quantity

### reviews

Stores product reviews.

Fields:
- id
- product_id
- customer_id
- customer_name
- customer_email
- rating
- comment
- created_at

## Migration strategy

1. Keep localStorage as fallback.
2. Add Supabase client.
3. Create database tables.
4. Move products to Supabase first.
5. Move customer accounts to Supabase Auth later.
6. Move orders and reviews after product migration.
7. Replace localStorage gradually service by service.