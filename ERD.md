# Entity Relationship Diagram (ERD) - Sistem Manajemen Stok

## Mermaid Diagram

```mermaid
erDiagram
    USER ||--o{ STOCK_TRANSACTION_IN : "creates"
    USER ||--o{ STOCK_TRANSACTION_OUT : "creates"
    USER ||--o{ STOCK_TRANSACTION_ADJ : "creates"
    USER ||--o{ STOCK_OPNAME : "creates"
    USER ||--o{ STOCK_RECONCILIATION : "adjusts"
    USER ||--o{ AUDIT_LOG : "generates"

    ITEM ||--o{ STOCK_TRANSACTION : "has"
    ITEM ||--o{ STOCK_OPNAME : "has"

    STOCK_OPNAME ||--|| STOCK_RECONCILIATION : "reconciled_by"

    USER {
        string id PK "CUID"
        string email UK "Unique"
        string username UK "Unique"
        string passwordHash "bcrypt hash"
        string fullName
        enum role "ADMIN, WAREHOUSE_STAFF, VIEWER"
        boolean isActive "Default: true"
        datetime createdAt
        datetime updatedAt
        datetime lastLoginAt
    }

    ITEM {
        string id PK "CUID"
        string code UK "Unique, e.g. SP-001"
        string name
        string unit "PCS, SET, LITER, UNIT"
        int minStock "Default: 0"
        int currentStock "Default: 0"
        string description
        boolean isActive "Default: true"
        datetime createdAt
        datetime updatedAt
    }

    STOCK_TRANSACTION {
        string id PK "CUID"
        string itemId FK
        enum type "STOCK_IN, STOCK_OUT, ADJUSTMENT"
        int quantity "Positive integer"
        string reference "PO/SO number"
        string notes
        datetime transactionDate
        string createdById FK
        datetime createdAt
    }

    STOCK_OPNAME {
        string id PK "CUID"
        string itemId FK
        int systemStock "Snapshot at opname time"
        int physicalStock "Actual counted"
        int difference "Computed: physical - system"
        string notes
        enum status "PENDING, RECONCILED, CANCELLED"
        datetime opnameDate
        string createdById FK
        datetime createdAt
    }

    STOCK_RECONCILIATION {
        string id PK "CUID"
        string opnameId FK UK "One-to-one"
        string adjustedById FK
        datetime adjustedAt
        string notes
    }

    AUDIT_LOG {
        string id PK "CUID"
        string userId FK "Nullable"
        string action "CREATE, UPDATE, DELETE, LOGIN, RECONCILE"
        string entity "ITEM, STOCK_TRANSACTION, etc"
        string entityId
        json oldData
        json newData
        string ipAddress
        string userAgent
        datetime createdAt
    }
```

## Table Definitions

### 1. users
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | CHAR(25) | PK, CUID | Primary key |
| email | VARCHAR(255) | UK, NOT NULL | Unique email |
| username | VARCHAR(100) | UK, NOT NULL | Unique username |
| password_hash | VARCHAR(255) | NOT NULL | Bcrypt hash (cost 12) |
| full_name | VARCHAR(255) | NOT NULL | Display name |
| role | ENUM | NOT NULL, DEFAULT 'VIEWER' | ADMIN, WAREHOUSE_STAFF, VIEWER |
| is_active | BOOLEAN | NOT NULL, DEFAULT true | Soft delete flag |
| created_at | DATETIME | NOT NULL, DEFAULT NOW() | |
| updated_at | DATETIME | NOT NULL, ON UPDATE NOW() | |
| last_login_at | DATETIME | NULLABLE | Track last login |

**Indexes**: `idx_users_email`, `idx_users_username`, `idx_users_role`

---

### 2. items
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | CHAR(25) | PK, CUID | Primary key |
| code | VARCHAR(50) | UK, NOT NULL | Business code (SP-001) |
| name | VARCHAR(255) | NOT NULL | Item name |
| unit | VARCHAR(50) | NOT NULL | Unit of measure |
| min_stock | INT | NOT NULL, DEFAULT 0 | Minimum threshold |
| current_stock | INT | NOT NULL, DEFAULT 0 | Real-time quantity |
| description | TEXT | NULLABLE | Optional details |
| is_active | BOOLEAN | NOT NULL, DEFAULT true | Soft delete |
| created_at | DATETIME | NOT NULL, DEFAULT NOW() | |
| updated_at | DATETIME | NOT NULL, ON UPDATE NOW() | |

**Indexes**: `idx_items_code`, `idx_items_name`, `idx_items_is_active`, `idx_items_low_stock` (current_stock <= min_stock)

---

### 3. stock_transactions
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | CHAR(25) | PK, CUID | Primary key |
| item_id | CHAR(25) | FK, NOT NULL | References items.id |
| type | ENUM | NOT NULL | STOCK_IN, STOCK_OUT, ADJUSTMENT |
| quantity | INT | NOT NULL, > 0 | Always positive |
| reference | VARCHAR(100) | NULLABLE | PO/SO/Reference number |
| notes | TEXT | NULLABLE | Additional info |
| transaction_date | DATETIME | NOT NULL, DEFAULT NOW() | When transaction occurred |
| created_by_id | CHAR(25) | FK, NOT NULL | References users.id |
| created_at | DATETIME | NOT NULL, DEFAULT NOW() | |

**Indexes**: `idx_stock_transactions_item_id`, `idx_stock_transactions_type`, `idx_stock_transactions_date`, `idx_stock_transactions_created_by`

**Foreign Keys**:
- `item_id` → `items.id` (ON DELETE RESTRICT)
- `created_by_id` → `users.id` (ON DELETE RESTRICT)

---

### 4. stock_opnames
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | CHAR(25) | PK, CUID | Primary key |
| item_id | CHAR(25) | FK, NOT NULL | References items.id |
| system_stock | INT | NOT NULL | Snapshot of current_stock at opname time |
| physical_stock | INT | NOT NULL | Actual counted quantity |
| difference | INT | NOT NULL | Computed: physical - system |
| notes | TEXT | NULLABLE | Reason for difference |
| status | ENUM | NOT NULL, DEFAULT 'PENDING' | PENDING, RECONCILED, CANCELLED |
| opname_date | DATETIME | NOT NULL, DEFAULT NOW() | When count performed |
| created_by_id | CHAR(25) | FK, NOT NULL | References users.id |
| created_at | DATETIME | NOT NULL, DEFAULT NOW() | |

**Indexes**: `idx_stock_opnames_item_id`, `idx_stock_opnames_status`, `idx_stock_opnames_date`

**Foreign Keys**:
- `item_id` → `items.id` (ON DELETE RESTRICT)
- `created_by_id` → `users.id` (ON DELETE RESTRICT)

---

### 5. stock_reconciliations
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | CHAR(25) | PK, CUID | Primary key |
| opname_id | CHAR(25) | FK, UK, NOT NULL | One-to-one with opname |
| adjusted_by_id | CHAR(25) | FK, NOT NULL | Admin who approved |
| adjusted_at | DATETIME | NOT NULL, DEFAULT NOW() | When reconciled |
| notes | TEXT | NULLABLE | Approval notes |

**Foreign Keys**:
- `opname_id` → `stock_opnames.id` (ON DELETE CASCADE)
- `adjusted_by_id` → `users.id` (ON DELETE RESTRICT)

---

### 6. audit_logs
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | CHAR(25) | PK, CUID | Primary key |
| user_id | CHAR(25) | FK, NULLABLE | Null for system actions |
| action | VARCHAR(50) | NOT NULL | CREATE, UPDATE, DELETE, LOGIN, RECONCILE |
| entity | VARCHAR(50) | NOT NULL | ITEM, STOCK_TRANSACTION, USER, etc |
| entity_id | CHAR(25) | NOT NULL | Affected record ID |
| old_data | JSON | NULLABLE | Previous state |
| new_data | JSON | NULLABLE | New state |
| ip_address | VARCHAR(45) | NULLABLE | IPv4/IPv6 |
| user_agent | TEXT | NULLABLE | Browser info |
| created_at | DATETIME | NOT NULL, DEFAULT NOW() | |

**Indexes**: `idx_audit_logs_user_id`, `idx_audit_logs_entity`, `idx_audit_logs_created_at`

**Foreign Keys**:
- `user_id` → `users.id` (ON DELETE SET NULL)

---

## Relationship Summary

```
User (1) ──────< (N) StockTransaction (as creator)
    │
    ├──< StockTransaction (STOCK_IN) - createdById
    ├──< StockTransaction (STOCK_OUT) - createdById
    ├──< StockTransaction (ADJUSTMENT) - createdById
    ├──< StockOpname - createdById
    └──< StockReconciliation - adjustedById

Item (1) ──────< (N) StockTransaction - itemId
    │
    └──< (N) StockOpname - itemId

StockOpname (1) ───── (1) StockReconciliation - opnameId

User (1) ──────< (N) AuditLog - userId
```

## Key Business Rules (Enforced at Application Level)

1. **Stock In**: `item.currentStock += quantity` (within transaction)
2. **Stock Out**: Validate `item.currentStock >= quantity` THEN `item.currentStock -= quantity`
3. **Adjustment**: Direct set `item.currentStock = newQuantity` (audit logged)
4. **Opname**: Capture `systemStock = item.currentStock` at creation time
5. **Reconcile**: `item.currentStock = opname.physicalStock` (only ADMIN, status PENDING → RECONCILIED)
6. **Soft Delete**: `isActive = false` instead of hard delete for User & Item
7. **Unique Code**: `Item.code` must be unique across active items
8. **Role Hierarchy**: ADMIN > WAREHOUSE_STAFF > VIEWER

## Migration Commands

```bash
# Generate migration
npx prisma migrate dev --name init_schema

# Push directly (development)
npx prisma db push

# Open Prisma Studio
npx prisma studio

# Seed database
npm run db:seed
```