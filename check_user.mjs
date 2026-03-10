
import axios from 'axios';

const BASE_URL = 'https://service-app-42do.onrender.com';

const checkUser = async () => {
  try {
    const loginRes = await axios.post(`${BASE_URL}/login`, {
      username: 'technician',
      password: 'ChangeMe123!'
    });
    console.log('USER OBJECT:', JSON.stringify(loginRes.data.user, null, 2));
  } catch (error) {
    console.error(error.response?.data || error.message);
  }
};

checkUser();
