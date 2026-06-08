async function testLiveApi() {
  const url = 'https://prism-instructor-os.vercel.app/api/ai/chat';
  
  const payload = {
    messages: [
      { role: 'user', content: 'Check the multimeter stock in Kibera' }
    ]
  };

  console.log(`Sending POST request to production endpoint: ${url}`);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    console.log(`Response Status: ${res.status}`);
    console.log(`Response Headers:`, {
      'content-type': res.headers.get('content-type'),
      'x-provider-used': res.headers.get('x-provider-used')
    });

    const text = await res.text();
    console.log(`\nRaw Response Stream (first 1000 characters):\n`);
    console.log(text.substring(0, 1000));
  } catch (err) {
    console.error("Request failed:", err);
  }
}

testLiveApi();
