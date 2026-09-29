# Architecture

## Purpose

Dokumen ini menjelaskan arsitektur aktual project Stock Management.

Dokumen harus diperbarui ketika terjadi perubahan arsitektur yang signifikan.

## Source of Truth

Untuk kondisi implementasi aktual, prioritaskan:

- source code;
- configuration;
- database/schema;
- runtime behavior;
- tests;
- documentation.

## Application Layers

Dokumentasikan struktur aktual dengan pola berikut:

```
Browser
   ↓
Frontend / UI
   ↓
Server / API
   ↓
Business Logic
   ↓
Data Access / ORM
   ↓
MySQL
```

Sesuaikan dengan arsitektur aktual project.

## Frontend

Dokumentasikan:

- routing;
- layouts;
- components;
- forms;
- state management;
- data fetching;
- validation;
- UI library.

## Backend

Dokumentasikan:

- API routes;
- server actions jika digunakan;
- service layer jika ada;
- business logic;
- authorization;
- error handling.

## Database

Dokumentasikan:

- database engine;
- ORM;
- schema;
- important relations;
- transaction strategy.

## Authentication

Dokumentasikan:

- login flow;
- session strategy;
- token strategy;
- cookie strategy;
- logout flow.

## Authorization

Dokumentasikan:

- role;
- permission;
- server-side enforcement;
- protected routes;
- API authorization.

## Inventory

Dokumentasikan:

- current stock;
- stock transaction;
- stock opname;
- reconciliation;
- audit trail.

Untuk aturan detail inventory, gunakan:

`docs/business/INVENTORY-RULES.md`

## Architecture Changes

Perubahan arsitektur penting harus dicatat di:

`docs/decisions/`

Jangan menggunakan file ini sebagai changelog detail.
