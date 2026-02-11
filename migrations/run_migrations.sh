#!/bin/bash
# Run all Talk-to-Syllabus RAG migrations in order
# Usage: ./run_migrations.sh <database_url>
# Example: ./run_migrations.sh "postgresql://user:pass@localhost:5432/talk_to_syllabus"

set -e

DB_URL="${1:-$DATABASE_URL}"

if [ -z "$DB_URL" ]; then
    echo "Error: No database URL provided."
    echo "Usage: ./run_migrations.sh <database_url>"
    echo "   or: DATABASE_URL=... ./run_migrations.sh"
    exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=== Talk-to-Syllabus: Running Migrations ==="
echo ""

for migration in "$SCRIPT_DIR"/0*.sql; do
    filename=$(basename "$migration")
    echo "▶ Running: $filename"
    psql "$DB_URL" -f "$migration" -v ON_ERROR_STOP=1
    echo "  ✓ Done"
    echo ""
done

echo "=== All migrations completed successfully! ==="
