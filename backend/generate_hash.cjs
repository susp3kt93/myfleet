const bcrypt = require('bcryptjs');

async function generateHash() {
    const hash = await bcrypt.hash('password123', 10);
    console.log('Hash for password123:');
    console.log(hash);
}

generateHash();
