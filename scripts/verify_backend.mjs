
import axios from 'axios';

const BASE_URL = 'https://service-app-42do.onrender.com';

const testLogin = async () => {
  try {
    console.log('Testing Login API...');
    const response = await axios.post(`${BASE_URL}/login`, {
      username: 'technician',
      password: 'ChangeMe123!'
    });
    console.log('Login successful! ✅');
    console.log('User Role:', response.data.user.role);
    return response.data.token;
  } catch (error) {
    console.error('Login failed! ❌');
    console.error(error.response?.data || error.message);
  }
};

const testServiceCalls = async (token) => {
  try {
    console.log('Testing Service Calls API...');
    const response = await axios.get(`${BASE_URL}/service-calls`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`Retrieved ${response.data.length} service calls! ✅`);
  } catch (error) {
    console.error('Service Calls API failed! ❌');
    console.error(error.response?.data || error.message);
  }
};

const runTests = async () => {
  const token = await testLogin();
  if (token) {
    await testServiceCalls(token);
  }
};

runTests();
