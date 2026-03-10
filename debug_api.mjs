
import axios from 'axios';

const BASE_URL = 'https://service-app-42do.onrender.com';

const debug = async () => {
  try {
    console.log('Logging in...');
    const loginRes = await axios.post(`${BASE_URL}/login`, {
      username: 'technician',
      password: 'ChangeMe123!'
    });
    const token = loginRes.data.token;
    const user = loginRes.data.user;
    console.log(`Logged in as: ${user.username}, Role: ${user.role}`);

    console.log('\n--- Service Calls (All) ---');
    const callsRes = await axios.get(`${BASE_URL}/service-calls`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`Total calls: ${callsRes.data.length}`);
    console.log(JSON.stringify(callsRes.data, null, 2));

    console.log('\n--- Service Reports (All) ---');
    const reportsRes = await axios.get(`${BASE_URL}/service-reports`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`Total reports: ${reportsRes.data.length}`);
    console.log(JSON.stringify(reportsRes.data, null, 2));

  } catch (error) {
    console.error('Debug failed!');
    console.error(error.response?.data || error.message);
  }
};

debug();
