const mongoose = require('mongoose');

async function testConnection() {
  try {
    await mongoose.connect('mongodb+srv://hariniv23aid_db_user:y2Vz3rPjLSulxlvw@cluster0.tk1hmao.mongodb.net/paintcalculator?authSource=admin');
    console.log('Connection successful!');
    process.exit(0);
  } catch (err) {
    console.error('Connection failed:', err.message);
    process.exit(1);
  }
}

testConnection();
