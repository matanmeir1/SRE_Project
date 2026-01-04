# SRE_Project

## Database Setup

### Default User Credentials
- **Email**: `admin@example.com`
- **Password**: `admin123`

### Verifying Password Hash

To verify that the password hash in the seed file is correct, run:

```bash
docker-compose exec api node verify-password.js
```

This will verify that the hash in `db/init/03_seed_default_user.sql` correctly matches the password `admin123`. If it's incorrect, the script will generate a new hash that you can use to update the seed file.

### Regenerating Password Hash

If you need to regenerate the password hash:

```bash
docker-compose exec api node -e "const bcrypt=require('bcrypt');bcrypt.hash('admin123',10).then(h=>console.log(h));"
```

Then update `db/init/03_seed_default_user.sql` with the new hash.