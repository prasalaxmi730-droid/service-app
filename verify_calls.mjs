
import axios from 'axios';

const BASE_URL = 'https://service-app-42do.onrender.com';

const verify = async () => {
  try {
    const loginRes = await axios.post(`${BASE_URL}/login`, {
      username: 'technician',
      password: 'ChangeMe123!'
    });
    const token = loginRes.data.token;

    const callsRes = await axios.get(`${BASE_URL}/service-calls?status=PENDING`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('--- PENDING CALLS ---');
    console.log(JSON.stringify(callsRes.data, null, 2));

    const reportsRes = await axios.get(`${BASE_URL}/service-reports`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('\n--- REPORTS (First Item) ---');
    if (reportsRes.data.length > 0) {
      console.log('Status field present:', 'status' in reportsRes.data[0]);
      console.log('Status value:', reportsRes.data[0].status);
    } else {
      console.log('No reports found.');
    }

  } catch (error) {
    console.error(error.message);
  }
};

verify();
