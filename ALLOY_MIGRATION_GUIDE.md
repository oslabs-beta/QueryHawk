# QueryHawk Grafana Alloy Migration Guide

## 🎯 **Overview**

This guide covers the migration from QueryHawk's current observability stack (OpenTelemetry Collector + Prometheus + Jaeger) to Grafana Alloy for unified observability.

## 🚀 **What's Changing**

### **Before (Current Stack)**

```
QueryHawk App → OpenTelemetry Collector → Jaeger (Traces) + Prometheus (Metrics)
                ↓
            Container per User (PostgreSQL Exporter)
```

### **After (Alloy Stack)**

```
QueryHawk App → Grafana Alloy → Unified Grafana (Traces + Metrics + Logs)
                ↓
            File-based Targets (No Containers)
```

## 🔧 **Migration Steps**

### **Step 1: Stop Current Services**

```bash
# Stop the current stack
docker-compose down

# Remove old volumes (optional - backup first!)
docker volume rm queryhawk_prometheus_data queryhawk_prometheus_targets
```

### **Step 2: Update Configuration Files**

- ✅ `docker-compose.yml` - Updated for Alloy
- ✅ `grafana-alloy/config.yml` - New Alloy configuration
- ✅ `grafana/provisioning/datasources/alloy-datasource.yml` - New datasource
- ✅ `server/utils/alloyPostgresExporter.ts` - New target management

### **Step 3: Start New Stack**

```bash
# Build and start the new Alloy-based stack
docker-compose up --build -d
```

### **Step 4: Verify Migration**

```bash
# Check Alloy is running
curl http://localhost:12345/ready

# Check Grafana datasource
# Navigate to http://localhost:3001/datasources
# Verify "Alloy" datasource is configured and working
```

## 📊 **Key Benefits of Migration**

### **1. Eliminates Container-per-User Problem**

- **Before**: N users = N containers = exponential resource growth
- **After**: N users = N targets = single process = linear resource growth

### **2. Unified Observability**

- **Single UI**: All traces, metrics, and logs in Grafana
- **Better Correlation**: Automatic linking between related telemetry
- **Simplified Management**: One configuration file instead of multiple

### **3. Improved Performance**

- **Lower Latency**: No container overhead for monitoring
- **Better Resource Utilization**: Shared monitoring logic
- **Faster Target Discovery**: File-based vs container startup

## 🔍 **Configuration Details**

### **Alloy Configuration (`grafana-alloy/config.yml`)**

```yaml
server:
  log_level: info
  http_listen_port: 12345
  grpc_listen_port: 12346

metrics:
  configs:
    - name: default
      scrape_configs:
        - job_name: 'postgresql-users'
          file_sd_configs:
            - files: ['./targets/*.json']
          relabel_configs:
            - source_labels: [user_id]
              target_label: user_id
```

### **Target File Format**

```json
[
  {
    "targets": ["host:port"],
    "labels": {
      "user_id": "userId",
      "database": "postgresql",
      "service": "queryhawk"
    }
  }
]
```

## 🚨 **Breaking Changes**

### **1. API Endpoints Changed**

- **Old**: `/monitoring/start` → Creates Docker container
- **New**: `/monitoring/start` → Creates Alloy target file

### **2. Monitoring URLs Changed**

- **Old**: Prometheus at `http://localhost:9090`
- **New**: Alloy at `http://localhost:12345`

### **3. Configuration Management**

- **Old**: Container lifecycle management
- **New**: File-based target management

## 🔄 **Rollback Plan**

If you need to rollback to the old stack:

### **1. Restore Old Configuration**

```bash
# Restore old docker-compose.yml
git checkout HEAD~1 -- docker-compose.yml

# Restore old OpenTelemetry config
git checkout HEAD~1 -- opentelemetry/otel-config.yml
```

### **2. Restart Old Stack**

```bash
docker-compose down
docker-compose up -d
```

## 📈 **Post-Migration Verification**

### **1. Check Alloy Health**

```bash
# Alloy should be healthy
curl http://localhost:12345/ready

# Check metrics endpoint
curl http://localhost:12345/metrics
```

### **2. Verify Grafana Integration**

- Navigate to `http://localhost:3001`
- Check datasources → Alloy should be configured
- Verify dashboards are receiving data

### **3. Test User Monitoring**

- Add a new database connection
- Verify target file is created in `grafana-alloy/targets/`
- Check metrics appear in Grafana

## 🛠 **Troubleshooting**

### **Common Issues**

#### **Alloy Not Starting**

```bash
# Check logs
docker-compose logs grafana-alloy

# Verify config file syntax
docker exec -it queryhawk-grafana-alloy-1 alloy --config.file=/etc/alloy/config.yml --check
```

#### **Targets Not Appearing**

- Verify target files exist in `grafana-alloy/targets/`
- Check file permissions
- Verify JSON syntax is valid

#### **Grafana No Data**

- Check Alloy datasource configuration
- Verify Alloy is sending data to Grafana
- Check network connectivity between services

### **Debug Commands**

```bash
# Check Alloy targets
curl http://localhost:12345/api/v1/targets

# Check Alloy metrics
curl http://localhost:12345/metrics

# Check target files
ls -la grafana-alloy/targets/
```

## 🎉 **Success Criteria**

Migration is successful when:

- ✅ Alloy service is running and healthy
- ✅ Grafana datasource is configured and working
- ✅ User database monitoring works without containers
- ✅ All existing dashboards receive data
- ✅ No more container-per-user resource explosion

## 📚 **Additional Resources**

- [Grafana Alloy Documentation](https://grafana.com/docs/alloy/)
- [Alloy Configuration Reference](https://grafana.com/docs/alloy/latest/reference/)
- [OpenTelemetry Integration](https://grafana.com/docs/alloy/latest/otel/)
- [QueryHawk Support](https://github.com/your-repo/queryhawk)

## 🤝 **Support**

If you encounter issues during migration:

1. Check the troubleshooting section above
2. Review Alloy logs: `docker-compose logs grafana-alloy`
3. Verify configuration syntax
4. Check network connectivity between services

---

**Migration completed successfully! 🎉**

QueryHawk now uses Grafana Alloy for unified observability with no more container-per-user overhead.
