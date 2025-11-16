# Security Policy

## Production Security Checklist

### 1. Environment Variables

**Critical - Must Change:**
- [ ] `JWT_SECRET` - Use a strong random string (min 32 characters)
- [ ] `DB_ROOT_PASSWORD` - Strong MySQL root password
- [ ] `DB_PASSWORD` - Strong application database password
- [ ] `ZENOPAY_API_KEY` - Production API key (not sandbox)

**Generate secure secrets:**
```bash
# Generate JWT secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Or use OpenSSL
openssl rand -hex 32
```

### 2. Database Security

**MySQL Configuration:**
```sql
-- Create dedicated user with limited privileges
CREATE USER 'hospital_user'@'%' IDENTIFIED BY 'strong_password';
GRANT SELECT, INSERT, UPDATE, DELETE ON hospital_db_prod.* TO 'hospital_user'@'%';
FLUSH PRIVILEGES;

-- Disable remote root access
DELETE FROM mysql.user WHERE User='root' AND Host NOT IN ('localhost', '127.0.0.1', '::1');
FLUSH PRIVILEGES;
```

**Backup encryption:**
```bash
# Encrypt backups
gpg --symmetric --cipher-algo AES256 backup.sql
```

### 3. Network Security

**Firewall Rules:**
```bash
# Allow only necessary ports
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw allow 22/tcp    # SSH (restrict to specific IPs)
ufw deny 3306/tcp   # MySQL (internal only)
ufw enable
```

**Docker Network Isolation:**
- Backend and MySQL on private network
- Only Nginx exposed to public

### 4. SSL/TLS Configuration

**Strong SSL Configuration:**
```nginx
# Use only TLS 1.2 and 1.3
ssl_protocols TLSv1.2 TLSv1.3;

# Strong cipher suites
ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';

# Enable HSTS
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
```

### 5. Application Security

**Rate Limiting:**
```javascript
// Already configured in server.js
// Adjust limits based on your needs
RATE_LIMIT_WINDOW_MS=900000  // 15 minutes
RATE_LIMIT_MAX_REQUESTS=100  // 100 requests per window
```

**Input Validation:**
- All inputs validated using express-validator
- SQL injection prevention via parameterized queries
- XSS prevention via Helmet middleware

**Authentication:**
- JWT tokens with expiration
- Bcrypt password hashing (10 rounds)
- Session management with database storage

### 6. File Upload Security

**Configuration:**
```javascript
// Restrict file types
const allowedMimeTypes = [
  'image/jpeg',
  'image/png',
  'application/pdf'
];

// Limit file size
MAX_FILE_SIZE=5242880  // 5MB
```

**File Storage:**
- Files stored outside web root
- Random filenames to prevent guessing
- Virus scanning recommended

### 7. Logging and Monitoring

**Enable Logging:**
```javascript
// Production logging
LOG_LEVEL=info
LOG_FILE=./logs/app.log
```

**Monitor for:**
- Failed login attempts
- Unusual API usage patterns
- Database connection errors
- File upload attempts

**Log Rotation:**
```bash
# /etc/logrotate.d/hospital-api
/opt/hospital-management/backend/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 nodejs nodejs
    sharedscripts
}
```

### 8. Dependency Security

**Regular Updates:**
```bash
# Check for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix

# Update dependencies
npm update
```

**Automated Scanning:**
- Use Dependabot or Snyk
- Regular security patches

### 9. Access Control

**Role-Based Access Control (RBAC):**
- Admin: Full system access
- Doctor: Patient records, prescriptions
- Nurse: Patient vitals, basic info
- Lab Tech: Lab tests and results
- Pharmacist: Medications, dispensing
- Billing: Invoices, payments
- Receptionist: Patient registration

**API Authorization:**
```javascript
// Middleware checks user roles
requireRole(['admin', 'doctor'])
```

### 10. Backup Security

**Encrypted Backups:**
```bash
# Encrypt backup
gpg --symmetric --cipher-algo AES256 backup.sql

# Decrypt backup
gpg --decrypt backup.sql.gpg > backup.sql
```

**Backup Storage:**
- Store backups off-site
- Use encrypted cloud storage
- Test restore procedures regularly

### 11. Docker Security

**Best Practices:**
- Run containers as non-root user
- Use official base images
- Scan images for vulnerabilities
- Limit container resources

```dockerfile
# Non-root user
USER nodejs

# Resource limits in docker-compose.yml
deploy:
  resources:
    limits:
      cpus: '1'
      memory: 512M
```

### 12. Secrets Management

**Never commit secrets to Git:**
```bash
# .gitignore
.env
.env.production
.env.local
*.key
*.pem
```

**Use secrets management:**
- Docker Secrets
- HashiCorp Vault
- AWS Secrets Manager
- Azure Key Vault

### 13. Security Headers

**Already configured via Helmet:**
- X-Frame-Options: SAMEORIGIN
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block
- Strict-Transport-Security
- Content-Security-Policy

### 14. Database Encryption

**Encrypt sensitive data:**
```sql
-- Enable encryption at rest
ALTER TABLE patients 
MODIFY COLUMN medical_history VARBINARY(1000);

-- Use application-level encryption for PHI
```

### 15. Compliance

**HIPAA Compliance (if applicable):**
- Encrypt data in transit (SSL/TLS)
- Encrypt data at rest
- Audit logging enabled
- Access controls implemented
- Regular security assessments
- Business Associate Agreements

**GDPR Compliance:**
- Data minimization
- Right to erasure
- Data portability
- Consent management
- Privacy by design

## Incident Response

### Security Incident Procedure:

1. **Detect and Analyze**
   - Monitor logs for suspicious activity
   - Investigate alerts

2. **Contain**
   - Isolate affected systems
   - Block malicious IPs
   - Revoke compromised credentials

3. **Eradicate**
   - Remove malware/backdoors
   - Patch vulnerabilities
   - Update credentials

4. **Recover**
   - Restore from clean backups
   - Verify system integrity
   - Resume operations

5. **Post-Incident**
   - Document incident
   - Update security measures
   - Train staff

## Security Contacts

**Report Security Issues:**
- Email: security@your-domain.com
- Encrypted: Use PGP key
- Response time: 24 hours

## Regular Security Tasks

**Daily:**
- Monitor logs
- Check failed login attempts
- Review system alerts

**Weekly:**
- Review access logs
- Check backup integrity
- Update security patches

**Monthly:**
- Security audit
- Dependency updates
- Access review
- Backup testing

**Quarterly:**
- Penetration testing
- Security training
- Policy review
- Disaster recovery drill

## Security Tools

**Recommended:**
- **Fail2ban** - Intrusion prevention
- **OSSEC** - Host intrusion detection
- **ModSecurity** - Web application firewall
- **Snyk** - Dependency scanning
- **Trivy** - Container scanning
- **Lynis** - Security auditing

## Compliance Certifications

Consider obtaining:
- SOC 2 Type II
- ISO 27001
- HIPAA (if handling PHI)
- PCI DSS (if processing payments)

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CIS Benchmarks](https://www.cisecurity.org/cis-benchmarks/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
