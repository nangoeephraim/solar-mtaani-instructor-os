async function run() {
  const url = "https://prism-instructor-os.vercel.app/api/ai/chat";
  console.log(`Sending live request to: ${url}`);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messages: [{ role: "user", content: "Say hi!" }]
      })
    });
    
    console.log("Status:", res.status);
    console.log("Headers:", Object.fromEntries(res.headers.entries()));
    const text = await res.text();
    console.log("Body:", text);
  } catch (err: any) {
    console.error("Live request failed:", err.message);
  }
}

run();
