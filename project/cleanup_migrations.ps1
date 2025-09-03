# =====================================================
# MIGRATION CLEANUP SCRIPT
# This script deletes all unnecessary migration files
# and keeps only the clean schema migration
# =====================================================

Write-Host "Starting migration cleanup..." -ForegroundColor Green

# Define the directory containing migrations
$migrationsDir = "supabase/migrations"

# Define the migration file to keep
$keepFile = "20250101000026_clean_schema_final.sql"

# Check if the migrations directory exists
if (-not (Test-Path $migrationsDir)) {
    Write-Host "Migrations directory not found: $migrationsDir" -ForegroundColor Red
    exit 1
}

# Get all migration files
$migrationFiles = Get-ChildItem -Path $migrationsDir -Filter "*.sql" | Sort-Object Name

Write-Host "Found $($migrationFiles.Count) migration files:" -ForegroundColor Yellow

# Display all migration files
foreach ($file in $migrationFiles) {
    $status = if ($file.Name -eq $keepFile) { "KEEP" } else { "DELETE" }
    Write-Host "  $status - $($file.Name)" -ForegroundColor $(if ($file.Name -eq $keepFile) { "Green" } else { "Red" })
}

Write-Host ""
Write-Host "WARNING: This will delete all migration files except:" -ForegroundColor Yellow
Write-Host "   $keepFile" -ForegroundColor Green
Write-Host ""

# Ask for confirmation
$confirmation = Read-Host "Are you sure you want to proceed? (yes/no)"

if ($confirmation -ne "yes") {
    Write-Host "Cleanup cancelled." -ForegroundColor Red
    exit 0
}

Write-Host ""
Write-Host "Deleting unnecessary migration files..." -ForegroundColor Yellow

# Delete all migration files except the one to keep
$deletedCount = 0
foreach ($file in $migrationFiles) {
    if ($file.Name -ne $keepFile) {
        try {
            Remove-Item $file.FullName -Force
            Write-Host "  Deleted: $($file.Name)" -ForegroundColor Green
            $deletedCount++
        } catch {
            Write-Host "  Failed to delete: $($file.Name)" -ForegroundColor Red
        }
    }
}

Write-Host ""
Write-Host "Migration cleanup completed!" -ForegroundColor Green
Write-Host "   Deleted: $deletedCount files" -ForegroundColor Yellow
Write-Host "   Kept: $keepFile" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "   1. Go to your Supabase dashboard" -ForegroundColor White
Write-Host "   2. Navigate to SQL Editor" -ForegroundColor White
Write-Host "   3. Copy the contents of $keepFile" -ForegroundColor White
Write-Host "   4. Paste and run the migration" -ForegroundColor White
Write-Host "   5. This should fix your payment system!" -ForegroundColor White
Write-Host ""
Write-Host "The clean migration includes:" -ForegroundColor Cyan
Write-Host "   All necessary tables for payment system" -ForegroundColor Green
Write-Host "   Proper RLS policies" -ForegroundColor Green
Write-Host "   Required indexes" -ForegroundColor Green
Write-Host "   Functions and triggers" -ForegroundColor Green
Write-Host "   Initial data setup" -ForegroundColor Green
