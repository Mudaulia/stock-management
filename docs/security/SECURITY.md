# Security Rules

## Purpose

Dokumen ini berisi security requirements untuk Stock Management.

## Trust Boundary

Selalu anggap client sebagai untrusted.

```
Client input      = untrusted
Client role       = untrusted
URL parameter     = untrusted
Request body      = untrusted
Frontend state    = untrusted
```

Server adalah security boundary.

## Authentication

Authentication harus:

- memvalidasi credential;
- menggunakan password hash;
- memiliki session/token expiry;
- menggunakan secure cookie configuration;
- menangani logout;
- menolak inactive user jika requirement mengharuskannya.

Password plaintext tidak boleh disimpan.

Password/hash tidak boleh dikembalikan ke client.

## Password

Password harus menggunakan secure password hashing.

Jangan:

- log password;
- return password;
- store plaintext password;
- expose password hash ke client.

## JWT / Session

Periksa:

- expiry;
- signature verification;
- cookie security;
- invalid/expired token;
- logout behavior;
- inactive user.

Jangan mempercayai claim client tanpa verification.

## Cookie

Authentication cookie harus ditinjau untuk:

- httpOnly;
- secure pada production;
- sameSite;
- expiry/max-age;
- path.

Gunakan configuration yang sesuai dengan environment.

## Authorization

Authorization harus dilakukan di server.

UI visibility bukan authorization.

Contoh:

```
hidden button ≠ permission
hidden menu ≠ permission
disabled button ≠ permission
```

API harus memeriksa role/permission secara independen.

## Role

Role tidak boleh dipercaya hanya karena dikirim oleh client.

Gunakan trusted session/database source.

Jika project memiliki:

- `ADMIN`
- `WAREHOUSE_STAFF`
- `VIEWER`

permission harus mengikuti requirement aktual.

## Input Validation

Semua request input harus divalidasi di server.

Periksa:

- type;
- required field;
- format;
- range;
- enum;
- length;
- business constraints.

Jika menggunakan Zod, gunakan schema validation secara konsisten.

## IDOR / Unauthorized Resource Access

Jangan menganggap user boleh mengakses resource hanya karena mengetahui ID.

Setiap resource-sensitive endpoint harus memeriksa authorization.

## Error Handling

Jangan membocorkan:

- stack trace;
- database credentials;
- SQL details;
- internal secrets;
- password/hash;
- sensitive implementation details.

Client menerima error yang aman dan relevan.

## Secrets

Secret harus berasal dari environment/configuration yang aman.

Jangan commit:

- production password;
- JWT secret;
- private key;
- API secret;
- database password.

Saat mendokumentasikan secret:

```
<redacted>
```

## Audit Log

Audit log tidak boleh menyimpan password atau secret.

Audit log harus mencatat event penting sesuai requirement.

## Security Changes

Perubahan security yang besar harus diverifikasi dengan:

- positive case;
- negative case;
- unauthorized request;
- invalid input;
- expired session/token;
- role restriction.
