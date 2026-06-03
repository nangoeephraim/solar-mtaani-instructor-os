async function run() {
  const url = "https://prism-instructor-os.vercel.app/api/ai/chat";
  console.log(`Sending live streaming request to: ${url}`);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messages: [{ role: "user", content: "Say hello in 3 words!" }]
      })
    });
    
    console.log("Status:", res.status);
    console.log("Headers:", Object.fromEntries(res.headers.entries()));
    
    const reader = res.body?.getReader();
    if (!reader) {
      console.error("No body reader available");
      return;
    }
    
    const decoder = new TextDecoder();
    console.log("Reading live stream chunks:");
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        console.log("\n[Stream finished]");
        break;
      }
      const chunk = decoder.decode(value, { stream: true });
      process.stdout.write(chunk);
    }
  } catch (err) {
    console.error("Live request failed:", err.message);
  }
}

run();
