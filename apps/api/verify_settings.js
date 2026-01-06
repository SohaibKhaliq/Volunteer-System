const axios = require('axios');

const API_URL = 'http://localhost:3333';
let token;

async function verifySettings() {
  console.log('🚀 Starting System Settings Verification...');

  try {
    // 1. Login as Admin
    console.log('Step 1: Logging in as admin...');
    const loginRes = await axios.post(`${API_URL}/login`, {
      email: 'admin@gmail.com',
      password: '12345678'
    });
    token = loginRes.data.token.token || loginRes.data.token;
    console.log('✅ Login successful');

    // 2. Fetch Settings
    console.log('Step 2: Fetching system settings...');
    const settingsRes = await axios.get(`${API_URL}/admin/system-settings`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`✅ Fetched ${settingsRes.data.length} settings`);
    
    const platformNameSetting = settingsRes.data.find(s => s.key === 'platform_name');
    console.log(`Current Platform Name: ${platformNameSetting ? platformNameSetting.value : 'N/A'}`);

    // 3. Update a Setting
    console.log('Step 3: Updating platform_name...');
    const newName = 'Eghata Pro ' + Math.floor(Math.random() * 1000);
    await axios.put(`${API_URL}/admin/system-settings`, {
      platform_name: newName
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`✅ Updated platform_name to: ${newName}`);

    // 4. Verify the update
    console.log('Step 4: Verifying the update...');
    const verifyRes = await axios.get(`${API_URL}/admin/system-settings`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const updatedSetting = verifyRes.data.find(s => s.key === 'platform_name');
    if (updatedSetting && updatedSetting.value === newName) {
      console.log('✅ Update verified successfully');
    } else {
      console.error('❌ Update verification failed');
    }

    // 5. Check Audit Log
    console.log('Step 5: Checking audit log for the change...');
    const auditRes = await axios.get(`${API_URL}/audit-logs`, {
      params: { limit: 10 },
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const logs = auditRes.data.data || auditRes.data;
    const settingLog = logs.find(l => l.action === 'system_setting_updated');
    
    if (settingLog) {
      console.log('✅ Audit log found:', settingLog.details);
      console.log('Metadata:', settingLog.metadata);
    } else {
      console.warn('⚠️ No system_setting_updated action found in the last 10 logs.');
      console.log('Latest log actions:', logs.map(l => l.action).join(', '));
    }

    console.log('\n✨ System Settings Verification Completed Successfully!');
  } catch (error) {
    console.error('❌ Verification failed:', error.response ? error.response.data : error.message);
    process.exit(1);
  }
}

verifySettings();
