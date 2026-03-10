
import axios from 'axios';

const BASE_URL = 'https://service-app-42do.onrender.com';

const seed = async () => {
  try {
    console.log('Logging in as admin...');
    const loginRes = await axios.post(`${BASE_URL}/login`, {
      username: 'technician',
      password: 'ChangeMe123!'
    });
    const token = loginRes.data.token;

    console.log('Seeding a PENDING call for technician...');
    const res = await axios.post(`${BASE_URL}/service-calls`, {
      customer_name: 'Debug Customer',
      location: 'Office 101',
      problem_description: 'Test pending call visibility',
      assigned_technician: 'technician',
      priority: 'HIGH',
      scheduled_date: new Date().toISOString().split('T')[0]
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Seed successful! Call ID:', res.data.id);

  } catch (error) {
    console.error('Seed failed!');
    console.error(error.response?.data || error.message);
  }
};

seed();
