// Intentionally no database connection: deleting project data is not authorized.
console.error('[db:reset] Disabled. Create a separate development/test database; no data was deleted.')
process.exitCode = 1
