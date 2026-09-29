# Architecture Decision Records

Folder ini menyimpan keputusan teknis dan business-logic penting.

Gunakan ADR ketika keputusan:

- mempengaruhi architecture;
- mempengaruhi database;
- mempengaruhi authentication;
- mempengaruhi authorization;
- mempengaruhi inventory behavior;
- memiliki trade-off penting;
- sulit dibalik;
- akan mempengaruhi future development.

## Template

Gunakan format:

```markdown
# ADR-XXX — Title

## Status

PROPOSED / ACCEPTED / SUPERSEDED / DEPRECATED

## Context

...

## Decision

...

## Reason

...

## Alternatives

...

## Trade-offs

...

## Impact

...

## Verification

...
```

## Examples

Contoh keputusan yang layak dicatat:

- source of truth current stock;
- stock transaction atomicity;
- authentication strategy;
- authorization strategy;
- soft delete vs hard delete;
- reconciliation behavior;
- audit log strategy.
