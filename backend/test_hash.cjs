const bcrypt = require('bcryptjs');

const storedHash = '$2a$10$F9zwOPp0pOPbol2tv8bqGu3K4waCwgS288UL3oRekqcLsxKpnXCQ.';
const password = 'password123';

async function testHash() {
    console.log('Testing password:', password);
    console.log('Against hash:', storedHash);

    const isValid = await bcrypt.compare(password, storedHash);
    console.log('Result:', isValid ? '✅ VALID' : '❌ INVALID');

    // Also test generating a new hash
    const newHash = await bcrypt.hash(password, 10);
    console.log('\nNew hash generated:', newHash);
    const newTest = await bcrypt.compare(password, newHash);
    console.log('New hash test:', newTest ? '✅ VALID' : '❌ INVALID');
}

testHash();
