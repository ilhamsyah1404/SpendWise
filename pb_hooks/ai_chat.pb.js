// pb_hooks/ai_chat.pb.js
// ─────────────────────────────────────────────────────────────────
// PocketBase JS Hook — Custom route: POST /api/ai/chat
//
// Proxy ke OpenRouter AI. API key tersimpan aman sebagai env var.
//
// Setup env variable:
//   Fly.io  : fly secrets set OPENROUTER_API_KEY=sk-or-v1-xxxx
//   Railway : Settings → Variables → OPENROUTER_API_KEY
//   Lokal   : export OPENROUTER_API_KEY=sk-or-v1-xxxx
// ─────────────────────────────────────────────────────────────────

routerAdd("POST", "/api/ai/chat", (e) => {
  // Hanya user yang login yang bisa pakai AI
  if (!e.auth) {
    return e.json(401, { error: "Unauthorized" });
  }

  const data         = $apis.requestInfo(e).body;
  const messages     = data.messages;
  const systemPrompt = data.systemPrompt || "Kamu adalah asisten keuangan SpendWise.";

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return e.json(400, { error: "messages wajib diisi" });
  }

  const apiKey = $os.getenv("OPENROUTER_API_KEY");
  if (!apiKey) {
    return e.json(503, { error: "AI tidak tersedia saat ini." });
  }

  const res = $http.send({
    method: "POST",
    url:    "https://openrouter.ai/api/v1/chat/completions",
    headers: {
      "Content-Type":  "application/json",
      "Authorization": "Bearer " + apiKey,
      "HTTP-Referer":  "https://spendwise.fly.dev",
      "X-Title":       "SpendWise AI Advisor",
    },
    body: JSON.stringify({
      model:       "deepseek/deepseek-chat:free",
      max_tokens:  800,
      temperature: 0.7,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
    }),
    timeout: 30,
  });

  if (res.statusCode !== 200) {
    return e.json(502, { error: "AI error: " + res.statusCode });
  }

  const result = JSON.parse(res.raw);
  const reply  = result?.choices?.[0]?.message?.content;
  if (!reply) {
    return e.json(502, { error: "Tidak ada respons dari AI" });
  }

  return e.json(200, { reply });
});