export default {
  async fetch(request, env) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
    }

    try {
      const body = await request.json();
      
      // The System Prompt forces the AI to only return the "Verdict" data
      const systemPrompt = `You are the éStandard assessment engine. Return ONLY valid JSON.
CRITERIA:
DURABLE: Will it last 10 years? (frame, materials, grade).
WASHABLE: Can the owner clean it easily without professional help?
BEAUTIFUL: Use the intake status provided in the prompt.

OUTPUT FORMAT:
{"itemName":"Product Name","durable":{"pass":true},"washable":{"pass":true}}`;

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": env.Anthropic_Key,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-3-sonnet-20240229",
          max_tokens: 300,
          system: systemPrompt,
          messages: body.messages,
        }),
      });

      const result = await response.json();

      // Error handling to prevent the "reading 0" crash
      if (!result.content || result.content.length === 0) {
        return new Response(JSON.stringify({ error: "AI returned no content" }), { 
          status: 500, 
          headers: corsHeaders 
        });
      }

      // Extract only the JSON text from Claude's response
      let aiText = result.content[0].text;
      aiText = aiText.replace(/```json|```/g, "").trim();

      return new Response(aiText, {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { 
        status: 500, 
        headers: corsHeaders 
      });
    }
  },
};
