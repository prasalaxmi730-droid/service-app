
import axios from 'axios';

const BASE_URL = 'https://service-app-42do.onrender.com';

const debugReport = async () => {
  try {
    const loginRes = await axios.post(`${BASE_URL}/login`, {
      username: 'technician',
      password: 'ChangeMe123!'
    });
    const token = loginRes.data.token;

    const reportsRes = await axios.get(`${BASE_URL}/service-reports`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (reportsRes.data.length > 0) {
      console.log('--- RAW REPORT ---');
      console.log(reportsRes.data[0]);
    } else {
      console.log('No reports found.');
    }

  } catch (error) {
    console.error(error.message);
  }
};

debugReport();
