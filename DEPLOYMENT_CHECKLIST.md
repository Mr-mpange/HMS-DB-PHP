# 📋 Production Deployment Checklist

## Pre-Deployment

### Environment Configuration
- [ ] Copy `.env.production` to `.env`
- [ ] Generate secure JWT_SECRET (min 32 characters)
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
- [ ] Set strong `DB_ROOT_PASSWORD`
- [ ] Set strong `DB_PASSWORD`
- [ ] Configure `FRONTEND_URL` with production domain
- [ ] Update `ZENOPAY_API_KEY` with production key
- [ ] Update `ZENOPAY_MERCHANT_ID`
- [ ] Set `ZENOPAY_ENV=production`
- [ ] Update domain in `nginx/nginx.conf`

### Infrastructure
- [ ] Docker and Docker Compose installed
- [ ] Domain name configured and pointing to server
- [ ] Firewall configured (ports 80, 443, 22)
- [ ] SSL certificates obtained (or Let's Encrypt ready)
- [ ] Sufficient disk space (min 20GB recommended)
- [ ] Sufficient RAM (min 2GB recommended)

### Code Preparation
- [ ] Latest code pulled from repository
- [ ] All dependencies installed
- [ ] Database schema reviewed
- [ ] API endpoints tested
- [ ] Frontend built for production

## Deployment

### Initial Setup
- [ ] Run deployment script
  ```bash
  ./deploy.sh  # Linux/Mac
  # or
  deploy.bat   # Windows
  ```
- [ ] Verify all containers are running
  ```bash
  docker-compose ps
  ```
- [ ] Check service logs for errors
  ```bash
  docker-compose logs -f
  ```

### Database Setup
- [ ] Database tables created successfully
- [ ] Admin user created
- [ ] Doctor user created
- [ ] Test database connection
  ```bash
  docker-compose exec mysql mysqladmin ping
  ```

### SSL Configuration
- [ ] SSL certificates installed
- [ ] HTTPS working correctly
- [ ] HTTP to HTTPS redirect working
- [ ] SSL certificate auto-renewal configured

### Service Verification
- [ ] API health check passing
  ```bash
  curl https://your-domain.com/api/health
  ```
- [ ] Login working with admin credentials
- [ ] All API endpoints accessible
- [ ] Frontend loading correctly
- [ ] Socket.io connections working

## Post-Deployment

### Security
- [ ] Change admin password from default
- [ ] Change doctor password from default
- [ ] Verify JWT_SECRET is unique and secure
- [ ] Verify database passwords are strong
- [ ] Test rate limiting is working
- [ ] Verify CORS is configured correctly
- [ ] Check security headers are present
- [ ] Verify file upload restrictions working

### Backup Configuration
- [ ] Backup script tested
  ```bash
  ./backup-db.sh
  ```
- [ ] Cron job configured for daily backups
  ```bash
  crontab -e
  # Add: 0 2 * * * /path/to/backup-db.sh
  ```
- [ ] Backup restoration tested
- [ ] Backup retention policy configured (7 days)
- [ ] Off-site backup storage configured (optional)

### Monitoring
- [ ] Health check endpoint monitored
- [ ] Uptime monitoring configured
- [ ] Log aggregation setup
- [ ] Error alerting configured
- [ ] Performance monitoring setup
- [ ] Disk space monitoring
- [ ] Database monitoring

### Performance
- [ ] Load testing completed
- [ ] Response times acceptable
- [ ] Database queries optimized
- [ ] Caching configured
- [ ] CDN configured (if applicable)

### Documentation
- [ ] Deployment process documented
- [ ] Admin credentials securely stored
- [ ] API documentation accessible
- [ ] Troubleshooting guide reviewed
- [ ] Team trained on system

## Testing

### Functional Testing
- [ ] User registration working
- [ ] User login working
- [ ] Patient creation working
- [ ] Appointment scheduling working
- [ ] Prescription creation working
- [ ] Lab test ordering working
- [ ] Medication dispensing working
- [ ] Invoice creation working
- [ ] Payment processing working
- [ ] File upload working

### Security Testing
- [ ] SQL injection testing
- [ ] XSS testing
- [ ] CSRF protection verified
- [ ] Authentication bypass testing
- [ ] Authorization testing
- [ ] Rate limiting testing
- [ ] File upload security testing

### Integration Testing
- [ ] ZenoPay integration working
- [ ] Email notifications working (if configured)
- [ ] SMS notifications working (if configured)
- [ ] Real-time updates working
- [ ] File storage working

## Compliance

### Data Protection
- [ ] Data encryption at rest configured
- [ ] Data encryption in transit (HTTPS)
- [ ] Access logs enabled
- [ ] Audit trail configured
- [ ] Data retention policy defined
- [ ] Data backup policy defined

### HIPAA (if applicable)
- [ ] PHI encryption verified
- [ ] Access controls implemented
- [ ] Audit logging enabled
- [ ] Business Associate Agreements signed
- [ ] Security risk assessment completed
- [ ] Incident response plan documented

### GDPR (if applicable)
- [ ] Data minimization implemented
- [ ] Consent management configured
- [ ] Right to erasure implemented
- [ ] Data portability implemented
- [ ] Privacy policy published
- [ ] Data processing agreements signed

## Maintenance

### Regular Tasks
- [ ] Daily backup verification
- [ ] Weekly log review
- [ ] Weekly security updates
- [ ] Monthly dependency updates
- [ ] Monthly security audit
- [ ] Quarterly disaster recovery drill
- [ ] Quarterly performance review

### Monitoring Checklist
- [ ] Daily: Check service status
- [ ] Daily: Review error logs
- [ ] Weekly: Review access logs
- [ ] Weekly: Check disk space
- [ ] Monthly: Review security logs
- [ ] Monthly: Update dependencies
- [ ] Quarterly: Security audit

## Rollback Plan

### Preparation
- [ ] Previous version tagged in Git
- [ ] Database backup before deployment
- [ ] Rollback procedure documented
- [ ] Rollback tested in staging

### Rollback Steps
1. [ ] Stop current services
2. [ ] Restore database from backup
3. [ ] Deploy previous version
4. [ ] Verify services are running
5. [ ] Test critical functionality
6. [ ] Document rollback reason

## Support

### Contact Information
- [ ] System administrator contact documented
- [ ] Emergency contact list created
- [ ] Support escalation path defined
- [ ] Vendor support contacts documented

### Documentation
- [ ] User manual available
- [ ] Admin guide available
- [ ] API documentation available
- [ ] Troubleshooting guide available
- [ ] FAQ document created

## Sign-Off

### Stakeholder Approval
- [ ] Technical lead approval
- [ ] Security team approval
- [ ] Operations team approval
- [ ] Business owner approval
- [ ] Compliance officer approval (if required)

### Final Verification
- [ ] All checklist items completed
- [ ] Production environment stable
- [ ] Monitoring active
- [ ] Backups working
- [ ] Team trained
- [ ] Documentation complete

---

## Deployment Date: _______________

## Deployed By: _______________

## Verified By: _______________

## Notes:
```
[Add any deployment-specific notes here]
```

---

**Status: [ ] Ready for Production**

**Approved By: _______________**

**Date: _______________**
