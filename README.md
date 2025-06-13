# Vercel deploy fix

## Setup

From the repository root install the client dependencies:

```bash
cd client && npm install
```

## Running tests

The automated tests reside in the `client` project and require the client dependencies above. Run the test suite with:

```bash
npm test -- --watchAll=false
```
