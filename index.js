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

    try {
      const body = await request.json();

      // The System Prompt tells the AI to focus ONLY on technical specs.
      // It will see the "Beauty" status in the user message but won't have to calculate it.
      const systemPrompt = `You are the éStandard assessment engine. 
Return ONLY a JSON object. No prose. No explanations.

CRITERIA:
1. DURABLE: Based on materials/construction, will it last 10 years?
2. WASHABLE: Can the owner maintain/clean the surface themselves?

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

      if (!result.content || result.content.length === 0) {
        throw new Error("AI failed to respond");
      }

      // Clean the AI response to ensure it is pure JSON
      let aiText = result.content[0].text.replace(/```json|```/g, "").trim();

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
