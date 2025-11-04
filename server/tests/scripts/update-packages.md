# Package Update Instructions

## Updated Dependencies

All packages have been updated to their latest secure versions:

### Production Dependencies
- **helmet**: 7.x → 8.x (latest security patches)
- **multer**: 1.x → 2.x (security vulnerabilities fixed)
- **@prisma/client**: 5.x → 6.x (latest features and performance)

### Development Dependencies  
- **eslint**: 8.x → 9.x (latest linting rules and performance)
- **@eslint/js**: New (ESLint 9.x requirement)
- **eslint-plugin-import**: Updated to latest
- **nodemon**: Updated to latest
- **prettier**: Updated to latest
- **prisma**: 5.x → 6.x (matches client version)
- **supertest**: 6.x → 7.x (latest testing features)

## Migration Steps

1. **Delete old node_modules and lock file:**
   ```bash
   cd server
   rm -rf node_modules package-lock.json
   ```

2. **Clean install with new packages:**
   ```bash
   npm install
   ```

3. **Regenerate Prisma client:**
   ```bash
   npm run prisma:generate
   ```

4. **Run database migration (if needed):**
   ```bash
   npm run prisma:migrate
   ```

5. **Test the updated setup:**
   ```bash
   npm run lint
   npm test
   npm run dev
   ```

## Breaking Changes Addressed

### ESLint 9.x
- Migrated from `.eslintrc.cjs` to `eslint.config.js` (flat config)
- Updated import syntax and configuration format

### Multer 2.x
- API remains compatible with existing code
- Security vulnerabilities from 1.x fixed

### Prisma 6.x
- Backward compatible with existing schema
- Better performance and TypeScript support

### Supertest 7.x
- Minor API changes, but existing tests should work
- Better error reporting and performance

All existing code should work without changes. The updates focus on security patches and performance improvements.




