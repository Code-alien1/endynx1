// Simple test script to check backend connectivity
const axios = require('axios');

const testIPs = [
  'http://192.168.237.107:8000/api',
  'http://localhost:8000/api',
  'http://127.0.0.1:8000/api'
];

async function testConnection() {
  console.log('Testing backend connectivity...\n');
  
  for (const ip of testIPs) {
    try {
      console.log(`Testing: ${ip}`);
      const response = await axios.get(`${ip}/users/profile/`, {
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      console.log(`✅ ${ip} - Status: ${response.status}`);
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.log(`❌ ${ip} - Connection refused (server not running or not accessible)`);
      } else if (error.code === 'ETIMEDOUT') {
        console.log(`❌ ${ip} - Connection timeout`);
      } else if (error.response) {
        console.log(`⚠️  ${ip} - Server responded with status: ${error.response.status}`);
      } else {
        console.log(`❌ ${ip} - Error: ${error.message}`);
      }
    }
    console.log('');
  }
}

testConnection();
