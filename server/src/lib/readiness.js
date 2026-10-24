// Read-only check: never infer a baseline or modify an existing database.
export async function schemaReady(query) {
    const table = (await query("SELECT to_regclass('public.petcare_schema_migrations') IS NOT NULL AS present")).rows[0].present
    if (!table) return false
    const rows = (await query('SELECT version FROM petcare_schema_migrations ORDER BY version')).rows
    return ['000','001','002','003','004','005'].every(version => rows.some(row => row.version === version))
}
