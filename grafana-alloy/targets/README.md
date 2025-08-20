# Grafana Alloy Dynamic Targets

This directory contains dynamic target configurations for PostgreSQL monitoring.

## How It Works

1. **Dynamic Discovery**: Alloy automatically discovers new targets from JSON files in this directory
2. **File-based Configuration**: Each user's database connection creates a target file
3. **Automatic Reloading**: Alloy reloads targets when files are added/removed/modified

## Target File Format

Each target file should be named `user-{userId}.json` and contain:

```json
[
  {
    "targets": ["host:port"],
    "labels": {
      "user_id": "userId",
      "database": "postgresql",
      "service": "queryhawk",
      "environment": "development"
    }
  }
]
```

## Example

`user-123.json`:

```json
[
  {
    "targets": ["user-db.example.com:5432"],
    "labels": {
      "user_id": "123",
      "database": "postgresql",
      "service": "queryhawk",
      "environment": "production"
    }
  }
]
```

## Benefits

- **No containers**: Single Alloy process monitors all databases
- **Dynamic scaling**: Add/remove monitoring without restarting
- **Resource efficient**: Shared monitoring logic across all targets
- **Centralized management**: All monitoring in one place
