# JSON Query Table

A single-page tool that loads a JSON Dataset and displays it in a queryable, virtualized table.

## Language

**Dataset**:
The ordered collection of Records loaded into the app, via paste or file upload.
_Avoid_: data, payload, input

**Record**:
A single JSON object in the Dataset; rendered as one table row.
_Avoid_: row, item, entry

**Field path**:
A dot-separated path from a Record's root to one of its values, e.g. `user.name`.
_Avoid_: key, selector, property

**Column**:
One table column, derived from a Field path observed across the Dataset.
_Avoid_: header, attribute, field

**Query DSL**:
The typed grammar that selects which Records form the Result Set: field-path clauses with wildcards and quoted values, combined with AND/OR/NOT, parentheses, and ordering comparisons.
_Avoid_: filter, search, query string

**Result Set**:
The Records currently matching the active Query DSL input; what the table displays.
_Avoid_: matches, output

**NDJSON**:
Newline-delimited JSON: an alternative Dataset encoding with one Record per line.
_Avoid_: JSONL