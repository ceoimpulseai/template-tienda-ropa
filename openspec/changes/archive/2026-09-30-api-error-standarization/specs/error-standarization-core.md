# Error Standardization Core Specification

## Purpose

Define a hierarchical error system for the API backend: a base `AppError` class with typed subclasses, an Express error handler that produces a consistent JSON envelope, and a `sendError` helper for controllers. All error messages MUST be in Spanish.

## Requirements

### Requirement: AppError class hierarchy

The system MUST provide an `AppError` base class extending `Error` with `constructor(code: string, message?: string, statusCode?: number, details?: any)` and the following subclasses:

| Class | Default statusCode |
|-------|-------------------|
| `NotFoundError` | 404 |
| `ConflictError` | 409 |
| `ValidationError` | 400 |

All existing imports (`throw new ValidationError('SOME_CODE')`) MUST continue to work without changes — the constructor signature `(code: string)` SHALL set `message` from a fallback mapping when no message is provided.

#### Scenario: Throw and catch AppError subclass

- GIVEN a controller that throws `new NotFoundError('BRANCH_NOT_FOUND')`
- WHEN the error reaches errorHandler
- THEN `error.statusCode` is 404, `error.code` is `'BRANCH_NOT_FOUND'`

#### Scenario: Legacy throw still works

- GIVEN existing code that throws `new ConflictError('ITEM_NOT_FOUND')`
- WHEN no arguments change
- THEN the error is caught normally and `error.code` is `'ITEM_NOT_FOUND'`

### Requirement: Error handler envelope

The error handler MUST intercept all uncaught errors and respond with:

```
{ success: false, error: { code: string, message: string, details?: any } }
```

The handler SHALL handle three error types:

| Error type | HTTP status | code | message | details |
|---|---|---|---|---|
| `AppError` | `err.statusCode` | `err.code` | `err.message` | `err.details` (if any) |
| `ZodError` | 400 | `'VALIDATION_ERROR'` | `'Datos inválidos'` | `{ fields: { campo: ['mensaje'] } }` — mapped from `err.flatten().fieldErrors` |
| Unknown | 500 | `'INTERNAL_ERROR'` | `'Error interno del servidor'` | omitted |

Unknown errors MUST be logged via `console.error` with timestamp and full error details.

#### Scenario: Error de validación

- GIVEN a controller that throws `ValidationError('CUSTOMER_MISSING_FISCAL_ID')`
- WHEN errorHandler captures it
- THEN response status is 400 with body `{ success: false, error: { code: 'CUSTOMER_MISSING_FISCAL_ID', message: 'El cliente necesita CUIT/DNI para facturar.' } }`

#### Scenario: Error de validación Zod

- GIVEN an endpoint with Zod schema validation
- WHEN validation fails
- THEN response is 400 with `{ success: false, error: { code: 'VALIDATION_ERROR', message: 'Datos inválidos', details: { fields: { cuit: ['Required'] } } } }`

#### Scenario: Error no controlado

- GIVEN an error that is neither AppError nor ZodError
- WHEN it reaches errorHandler
- THEN response is 500 with `{ success: false, error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor' } }`
- AND the error is logged via `console.error` with a timestamp

### Requirement: sendError helper

The system MUST provide `sendError(res: Response, err: unknown): void` in `apps/api/src/lib/response.ts` that sends the same envelope format as errorHandler. This SHALL be used by controllers that handle errors inline without delegating to `next(err)`.

#### Scenario: sendError in branch controller

- GIVEN branch.controller catches a branch-not-found condition
- WHEN it calls `sendError(res, new NotFoundError('BRANCH_NOT_FOUND'))`
- THEN the response is 404 with the standard error envelope