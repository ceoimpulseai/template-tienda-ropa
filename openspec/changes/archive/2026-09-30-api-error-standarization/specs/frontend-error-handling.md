# Frontend Error Handling Specification

## Purpose

Create a typed `ApiError` class on the frontend, update `apiFetch` to throw it, type `useApi` error properly, and use `error.code` in `SalesPage` for user-friendly messages.

## Requirements

### Requirement: ApiError class

The system MUST define `class ApiError extends Error` inside `apps/web/src/lib/apiFetch.ts` with `constructor(code: string, message: string, details?: any, status?: number)`. The class SHALL expose public properties: `this.code`, `this.details`, `this.status`. `message` SHALL be inherited from `Error`.

#### Scenario: ApiError instantiation

- GIVEN `new ApiError('ARCA_NOT_CONFIGURED', 'ARCA no está configurado.')`
- WHEN inspecting the instance
- THEN `code` is `'ARCA_NOT_CONFIGURED'`, `message` is `'ARCA no está configurado.'`, `details` is undefined, `status` is undefined

### Requirement: apiFetch throws ApiError

When the response `ok` is false OR `body.success` is false, `apiFetch` MUST throw an `ApiError`. The code and message SHALL be taken from `body.error.code` and `body.error.message`. If the response body does not have the new envelope format (legacy format `{ error: 'SOME_CODE' }`), the system MUST use `body.error` as the code and `body.error` as the message.

#### Scenario: apiFetch recibe error con nuevo envelope

- GIVEN response status 422 with body `{ success: false, error: { code: 'ARCA_NOT_CONFIGURED', message: 'ARCA no está configurado.' } }`
- WHEN apiFetch parses
- THEN it throws `ApiError` with code `'ARCA_NOT_CONFIGURED'` and message `'ARCA no está configurado.'`

#### Scenario: apiFetch recibe error legacy

- GIVEN response status 400 with body `{ error: 'BUSINESS_NOT_FOUND' }` (legacy format)
- WHEN apiFetch parses
- THEN it throws `ApiError` with code `'BUSINESS_NOT_FOUND'` and message `'BUSINESS_NOT_FOUND'`

### Requirement: useApi typed error

The `useApi` hook MUST type `error` as `ApiError | string | null` for backward compatibility. The public API SHALL remain `{ data, loading, error, refetch }`.

#### Scenario: useApi returns ApiError

- GIVEN a request that fails with an ApiError
- WHEN useApi resolves
- THEN `error` is an `ApiError` instance with `.code` and `.message`

### Requirement: SalesPage uses error.code

The `SalesPage` component MUST use `error.code` to look up friendly messages in `ARCA_ERROR_MESSAGES`. The catch block in `handleIssue` SHALL check `if (err instanceof ApiError)` and use `ARCA_ERROR_MESSAGES[err.code] ?? err.message` as the display message.

#### Scenario: SalesPage muestra error amigable

- GIVEN `handleIssue` catches an `ApiError` with code `'ARCA_NOT_CONFIGURED'`
- WHEN `ARCA_ERROR_MESSAGES['ARCA_NOT_CONFIGURED']` exists
- THEN the user sees the friendly message instead of the raw error message