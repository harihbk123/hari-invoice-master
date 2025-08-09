# File Mapping Guide

## Core Files to Copy from Artifacts:

### 1. HTML Files
- [ ] index.html - Main application page
- [ ] login.html - Authentication page

### 2. JavaScript Files  
- [ ] app.js - Main application (~4000 lines)
- [ ] expense.js - Expense management module
- [ ] expense-ui.js - Expense UI components
- [ ] expense-integration.js - Integration layer

### 3. CSS Files
- [ ] style.css - Complete stylesheet

### 4. Database Schema
- [ ] docs/database-schema.sql - Supabase schema

## Implementation Order:
1. Copy login.html first
2. Copy style.css
3. Copy app.js
4. Copy expense modules (expense.js, expense-ui.js, expense-integration.js)
5. Copy index.html
6. Set up Supabase database
7. Configure environment variables
8. Test locally

## Verification Checklist:
- [ ] All files copied
- [ ] No missing dependencies
- [ ] Supabase credentials added
- [ ] Login working
- [ ] Dashboard loading
- [ ] Invoices CRUD working
- [ ] Expenses working
- [ ] PDF generation working
