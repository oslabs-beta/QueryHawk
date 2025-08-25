FROM grafana/alloy:latest

# Copy configuration files
COPY config.yml /etc/alloy/config.yml
COPY targets/ /etc/alloy/targets/

# Create targets directory
RUN mkdir -p /etc/alloy/targets

# Set working directory
WORKDIR /etc/alloy

# Expose ports
EXPOSE 12345 12346 4317 4318

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:12345/ready || exit 1

# Start Alloy
CMD ["run", "/etc/alloy/config.yml"]
