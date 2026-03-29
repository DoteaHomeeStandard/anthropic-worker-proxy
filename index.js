export default {
  async fetch(request, env) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    // Handle the Preflight request from the browser
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // Safety Guard: Ensure it's a POST request with a body
    if (request.method !== "POST") {
      return new Response("Please send a POST request with JSON body.", { status: 405, headers: corsHeaders });
    }

    try {
      const body = await request.json();
      
      // Safety Guard: Check if messages exist
      if (!body.messages) {
        throw new Error("No messages found in request body");
      }

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": env.Anthropic_Key,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-3-sonnet-20240229",
          max_tokens: 400,
          system: "You are the éStandard assessment engine. Return ONLY JSON. Format: {\"itemName\":\"Name\",\"durable\":{\"pass\":true},\"washable\":{\"pass\":true}}",
          messages: body.messages,
        }),
      });

      const result = await response.json();

      // If Anthropic sends an error, pass it through so we can see it
      if (result.error) {
        return new Response(JSON.stringify({ error: result.error.message }), { status: 400, headers: corsHeaders });
      }

      const aiText = result.content[0].text.replace(/```json|```/g, "").trim();

      return new Response(aiText, {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } catch (err) {
      // This sends the actual error message back to Carrd instead of just crashing
      return new Response(JSON.stringify({ error: err.message }), { 
        status: 500, 
        headers: corsHeaders 
      });
    }
  },
};
