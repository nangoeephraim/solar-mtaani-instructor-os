async function testProd() {
  const url = 'https://solar-mtaani-instructor-oamayvtt6-ephrahims-projects.vercel.app/api/ai/chat';
  
  const payload = {
    messages: [
      { role: 'user', content: 'hello sally' }
    ],
    institutionType: 'CBC CBCCBC'
  };

  try {
    console.log("Sending POST to production URL...");
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log("Headers:");
    for (const [key, value] of response.headers.entries()) {
      console.log(`  ${key}: ${value}`);
    }

    console.log("\nBody:");
    if (response.body) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        console.log(decoder.decode(value, { stream: true }));
      }
    } else {
      console.log(await response.text());
    }
  } catch (err) {
    console.error("Fetch error:", err);
  }
}

testProd();
