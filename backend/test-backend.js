const fs = require('fs');
const path = require('path');

// A simple script to test the backend API locally.
// Make sure your server is running (node server.js) on port 3000 before running this script!

async function testBackend() {
  console.log('--- Testing AI Meeting Backend ---');

  // 1. Create a dummy text file to act as our "audio" for testing the upload
  // (Note: To test OpenAI Whisper properly, you must replace this with a real .m4a or .wav file)
  const testFilePath = path.join(__dirname, 'test-audio.txt');
  fs.writeFileSync(testFilePath, 'This is a test audio file.');
  
  console.log('Sending test file to http://localhost:3000/api/process-meeting...');

  try {
    // Node 18+ has native fetch and FormData
    const formData = new FormData();
    const fileBlob = new Blob([fs.readFileSync(testFilePath)]);
    formData.append('audio', fileBlob, 'test-audio.txt');
    formData.append('title', 'Backend Test Meeting');
    formData.append('userId', 'test-user-123');

    const response = await fetch('http://localhost:3000/api/process-meeting', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (response.ok) {
      console.log('\n✅ SUCCESS! Backend returned:\n');
      console.log(JSON.stringify(data, null, 2));
    } else {
      console.log('\n❌ SERVER RETURNED AN ERROR:\n');
      console.log(JSON.stringify(data, null, 2));
      console.log('\n(If you got a 500 error about "Invalid file format" from OpenAI, that is expected because we uploaded a text file instead of real audio. Replace the test-audio.txt with a real .m4a file in this script to fully test the AI!)');
    }
  } catch (err) {
    console.error('\n❌ CONNECTION ERROR: Could not connect to backend.');
    console.error('Did you remember to start the server with `node server.js`?');
    console.error(err.message);
  } finally {
    // Cleanup dummy file
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
    }
  }
}

testBackend();
