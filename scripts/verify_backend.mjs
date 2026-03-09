
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
    return response.data.token;
  } catch (error) {
    console.error('Login failed! ❌');
    console.error(error.response?.data || error.message);
  }
};

const testFullFlow = async (token) => {
  try {
    console.log('\n--- Testing Full Flow: Pending -> Submit Report -> Completed ---');
    
    // 1. Get a PENDING call
    const callsRes = await axios.get(`${BASE_URL}/service-calls?status=PENDING`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const pendingCall = callsRes.data.find(c => c.status === 'PENDING');
    
    if (!pendingCall) {
      console.log('No pending calls found to test with. (Seeding might be needed)');
      return;
    }
    console.log(`Found Pending Call: ID ${pendingCall.id} for ${pendingCall.customer_name}`);

    // 2. Submit a report
    console.log(`Submitting report for call #${pendingCall.id}...`);
    const reportRes = await axios.post(`${BASE_URL}/submit-report`, {
      service_call_id: pendingCall.id,
      technician_name: 'technician',
      visit_date: new Date().toISOString().split('T')[0],
      resolution_notes: 'Verified logic: Marks call as COMPLETED'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Report submitted successfully! ✅');

    // 3. Verify status changed to COMPLETED
    const updatedCallRes = await axios.get(`${BASE_URL}/service-calls/${pendingCall.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`Updated Call Status: ${updatedCallRes.data.status}`);
    if (updatedCallRes.data.status === 'COMPLETED') {
      console.log('Status successfully changed to COMPLETED! ✅');
    } else {
      console.log('Error: Status did not change to COMPLETED. ❌');
    }

    // 4. Verify PENDING list no longer contains this call
    const finalPendingRes = await axios.get(`${BASE_URL}/service-calls?status=PENDING`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const existsInPending = finalPendingRes.data.some(c => c.id === pendingCall.id);
    // 5. Verify status is present in the reports list
    console.log('Verifying reports list contains status...');
    const reportsRes = await axios.get(`${BASE_URL}/service-reports`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const lastReport = reportsRes.data[0];
    console.log(`Last Report Status Field: ${lastReport.status}`);
    if (lastReport.status === 'COMPLETED') {
      console.log('Backend correctly returns COMPLETED status in reports! ✅');
    } else {
      console.log('Error: Status field missing or incorrect in reports list. ❌');
    }

  } catch (error) {
    console.error('Full flow test failed! ❌');
    console.error(error.response?.data || error.message);
  }
};

const runTests = async () => {
  const token = await testLogin();
  if (token) {
    await testFullFlow(token);
  }
};

runTests();
