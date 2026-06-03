import handler from '../api/ai/chat.ts';

async function test() {
  console.log("Mocking request to chat handler...");
  
  const mockReq = new Request("http://localhost/api/ai/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      messages: [{ role: "user", content: "Say hello in 5 words!" }]
    })
  });

  try {
    const res = await handler(mockReq);
    console.log("Response Status:", res.status);
    console.log("Response Headers:", Object.fromEntries(res.headers.entries()));
    const text = await res.text();
    console.log("Response Text:", text);
  } catch (err) {
    console.error("Handler threw an error:", err);
  }
}

test();
