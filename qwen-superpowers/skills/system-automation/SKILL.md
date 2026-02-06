---
name: system-automation
description: Use when performing system administration, automation, or maintenance tasks. Provides best practices for safe and effective system operations.
---

# System Automation

## Overview

The System Automation skill provides a framework for safely and effectively managing system administration, automation, and maintenance tasks. It emphasizes safety, verification, and documentation to prevent errors and enable recovery.

## When to Use

Use this skill when:
- Managing system configurations
- Automating repetitive tasks
- Performing system maintenance
- Deploying applications or services
- Monitoring system health
- Troubleshooting system issues
- Managing infrastructure as code

## Core Components

### 1. Safe Operations
Principles for performing system operations without causing disruptions.

### 2. Change Management
Structured approach to implementing system changes.

### 3. Verification & Rollback
Ensuring changes work correctly and providing recovery options.

## Implementation

### Step 1: Environment Assessment
Before making any system changes, assess the current state:

1. **Document Current State**
   - Record system version and configuration
   - Note running services and processes
   - Capture current resource usage (CPU, memory, disk)

2. **Identify Impact**
   - Determine which services/users might be affected
   - Assess required downtime (if any)
   - Plan for potential issues

3. **Prepare Safeguards**
   - Create system backups if applicable
   - Prepare rollback procedures
   - Schedule changes during low-usage periods when possible

### Step 2: Safe Operation Practices
Follow these practices for all system operations:

```markdown
## Safe Operation Checklist

### Before Executing Commands
- [ ] Verify the command is correct
- [ ] Check that it targets the right system/resources
- [ ] Confirm you have appropriate permissions
- [ ] Consider the potential impact
- [ ] Have a rollback plan ready

### During Operations
- [ ] Monitor system response
- [ ] Watch for unexpected behavior
- [ ] Keep documentation of changes made
- [ ] Test functionality incrementally

### After Operations
- [ ] Verify the change worked as expected
- [ ] Check system stability
- [ ] Update documentation if needed
- [ ] Notify stakeholders if required
```

### Step 3: Automation Script Development
When creating automation scripts:

1. **Design for Idempotency**
   - Scripts should be safe to run multiple times
   - Check current state before making changes
   - Only apply changes when needed

2. **Include Error Handling**
   - Validate inputs and preconditions
   - Handle expected error conditions gracefully
   - Provide informative error messages

3. **Add Logging and Reporting**
   - Log significant actions and decisions
   - Report on what was changed and why
   - Include timestamps for audit purposes

### Step 4: Verification Procedures
Always verify system changes:

1. **Functional Testing**
   - Test the specific functionality that was changed
   - Verify dependent systems still work correctly
   - Check edge cases and error conditions

2. **System Health Check**
   - Monitor resource usage
   - Verify service availability
   - Check logs for errors or warnings

3. **Performance Validation**
   - Compare performance metrics before/after
   - Ensure no degradation in critical areas
   - Monitor for resource leaks

## Best Practices

1. **Test First**: Always test changes in a non-production environment
2. **Small Changes**: Make incremental changes rather than large sweeping changes
3. **Documentation**: Keep detailed records of all system changes
4. **Monitoring**: Implement monitoring to detect issues early
5. **Access Control**: Follow principle of least privilege
6. **Backup**: Maintain current backups before making changes
7. **Rollback Plan**: Always have a way to revert changes if needed

## Common Automation Patterns

### Configuration Management
```bash
# Example pattern for safe configuration updates
CONFIG_FILE="/path/to/config.conf"
BACKUP_FILE="${CONFIG_FILE}.backup.$(date +%Y%m%d_%H%M%S)"

# Backup current configuration
cp "$CONFIG_FILE" "$BACKUP_FILE"

# Apply changes
# (perform configuration changes here)

# Verify changes are syntactically correct
if validate_config "$CONFIG_FILE"; then
    echo "Configuration validated successfully"
    restart_service_if_needed
else
    echo "Configuration validation failed, restoring backup"
    cp "$BACKUP_FILE" "$CONFIG_FILE"
    exit 1
fi
```

### Service Management
```bash
# Pattern for safe service updates
SERVICE_NAME="my-service"

# Check current status
if ! systemctl is-active --quiet "$SERVICE_NAME"; then
    echo "Service $SERVICE_NAME is not running"
    exit 1
fi

# Perform update
perform_update

# Restart service
systemctl restart "$SERVICE_NAME"

# Wait for service to become active
sleep 5

# Verify service is running correctly
if systemctl is-active --quiet "$SERVICE_NAME"; then
    echo "Service $SERVICE_NAME restarted successfully"
else
    echo "Service $SERVICE_NAME failed to restart, rolling back"
    # Perform rollback procedure
    exit 1
fi
```

## Tools for System Automation

### System Information
- Use `run_shell_command` to gather system information
- Use `list_directory` to inspect file structures
- Use `read_file` to examine configuration files

### Change Verification
- Use `run_shell_command` to run verification commands
- Use `grep_search` to check for specific patterns in logs or configs

## Verification

Before considering system changes complete, verify:
- All targeted systems are functioning properly
- Services are running as expected
- Performance meets requirements
- Security posture is maintained
- Backups are current and valid