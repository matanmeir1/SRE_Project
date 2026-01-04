const bcrypt = require('bcrypt');

// Hash from seed file: db/init/03_seed_default_user.sql
const seedHash = '$2b$10$k/cF8GUSdKeSF/vBJZo7LO2yn18.EYoTDlTAGQSBwig8owkDln3Vy';
const password = 'admin123';

async function verifyPassword() {
  try {
    const isValid = await bcrypt.compare(password, seedHash);
    
    if (isValid) {
      console.log('✅ Password hash is CORRECT');
      console.log(`   Password: ${password}`);
      console.log(`   Hash: ${seedHash}`);
      return true;
    } else {
      console.log('❌ Password hash is INCORRECT');
      console.log('   Generating new hash...');
      const newHash = await bcrypt.hash(password, 10);
      console.log(`   New hash: ${newHash}`);
      console.log('\n   Update db/init/03_seed_default_user.sql with this hash');
      return false;
    }
  } catch (error) {
    console.error('Error verifying password:', error.message);
    return false;
  }
}

verifyPassword();

