# Alloy PostgreSQL Exporter

A PostgreSQL monitoring solution that dynamically configures Grafana Alloy targets. I built this to solve the problem of having to restart monitoring services every time we add a new database to monitor.

## What This Does

Instead of manually editing config files and restarting services, this exporter:
- Takes a database connection string
- Creates the right Alloy target configuration
- Drops it in the targets directory
- Alloy picks it up automatically

## How It Works

```
Connection String → Parse & Validate → Create Config → Write File → Alloy Discovers
```

## Features

- **Multiple URI formats**: Works with `postgresql://`, `postgres://`, and plain `host:port`
- **Dynamic targets**: Add/remove databases without touching the monitoring service
- **Error handling**: Validates inputs and gives useful error messages
- **File management**: Creates directories, checks permissions, cleans up properly

## Usage

```typescript
import { setDatabaseUriToPostgresExporter } from './alloyPostgresExporter';

// Add a new database to monitor
const result = await setDatabaseUriToPostgresExporter({
  userId: 'user123',
  uri_string: 'postgresql://user:pass@db.example.com:5432/mydb'
});

console.log(result.message);
// "PostgreSQL monitoring target created successfully for user user123"
```

## Cleanup

```typescript
import { cleanupExporter } from './alloyPostgresExporter';

// Stop monitoring when done
await cleanupExporter('user123');
```

## Configuration Files

The exporter creates files in `./grafana-alloy/targets/` that look like:

```json
[
  {
    "targets": ["db.example.com:5432"],
    "labels": {
      "user_id": "user123",
      "database": "postgresql",
      "service": "queryhawk",
      "environment": "development",
      "instance": "db.example.com:5432",
      "database_name": "mydb",
      "user": "user"
    }
  }
]
```

## Why I Built It This Way

**File-based config**: Alloy watches the targets directory and reloads automatically. No need to manage state or restart services.

**Async/await**: File I/O can be slow, so async keeps the app responsive.

**Input validation**: Connection strings can be messy, so I validate everything before processing.

**Error handling**: When things go wrong, you get clear messages about what happened and how to fix it.

## Edge Cases I Handled

- Empty or malformed connection strings
- Invalid port numbers (must be 1-65535)
- Directory permission issues
- Concurrent access (multiple processes trying to create targets)
- Malformed JSON files in the targets directory

## Testing

I wrote tests to cover the main functionality and edge cases. Run them with:

```bash
npm test
```

The tests mock the file system operations so they're fast and reliable.

## Dependencies

- Node.js 16+
- TypeScript 4.5+
- Built-in `fs/promises` for file operations

## Future Ideas

- Validate target configs against a schema
- Track metrics about exporter operations
- Health checks for target availability
- Audit logging for configuration changes

---

*This was built to solve a real monitoring problem. It's not perfect, but it's production-ready and handles the edge cases we've run into.*
