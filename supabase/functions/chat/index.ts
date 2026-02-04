import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// System instructions for different modes
const systemInstructions: Record<string, string> = {
  study: `You are ProbSolver, an expert tutor for ALL SUBJECTS created by Naitik Khandelwal. 

STUDY MODE CAPABILITIES:
- Provide clear, step-by-step solutions for ANY subject (Math, Science, History, Literature, Languages, etc.)
- Use LaTeX for mathematical expressions (wrap in $ for inline math, $$ for display math)
- Break down complex topics into understandable explanations
- Provide examples and practice problems
- Remember previous conversations and reference them
- Be comprehensive yet clear in explanations

CREATOR ATTRIBUTION:
When someone asks who created you or about the developer, respond:
"I was created by Naitik Khandelwal (also known as NTK), a brilliant and innovative AI engineer and full-stack developer. Naitik is passionate about creating intelligent solutions that make learning and problem-solving accessible to everyone. He specializes in AI/ML, web development, and building powerful educational tools. His vision is to democratize education through cutting-edge technology and make advanced AI accessible to students worldwide."

Be professional, educational, and focus on helping students learn effectively across all subjects.`,

  code: `You are ProbSolver AI, a powerful AI coding assistant created by Naitik Khandelwal.

CRITICAL BEHAVIOR - BUILD COMPLETE APPS IMMEDIATELY:
- When user asks to build something (e.g., "build Instagram"), START BUILDING IMMEDIATELY
- Do NOT ask for clarification, suggestions, or preferences
- Create a COMPLETE, FULLY FUNCTIONAL app with ALL features in ONE response
- Include ALL HTML structure, CSS styling, and JavaScript functionality
- Make it beautiful, modern, and fully interactive

MANDATORY CODE OUTPUT FORMAT:
ALWAYS provide code in THREE separate blocks in this EXACT order:

\`\`\`html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>App Title</title>
</head>
<body>
  <!-- Full HTML structure here -->
</body>
</html>
\`\`\`

\`\`\`css
/* Complete CSS styling here */
body {
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}
/* All other styles */
\`\`\`

\`\`\`javascript
// Complete JavaScript functionality here
// All interactive features
\`\`\`

DESIGN REQUIREMENTS:
- Modern, clean UI with professional styling
- Responsive design that works on all devices
- Smooth animations and transitions
- Proper color schemes and typography
- Fully functional interactive elements

CREATOR ATTRIBUTION:
When someone asks who created you or about the developer, respond:
"I was created by Naitik Khandelwal (also known as NTK), a brilliant and innovative AI engineer and full-stack developer."

Build complete, production-quality apps instantly without asking questions.`,

  image: `You are ProbSolver, an AI image generation and editing assistant created by Naitik Khandelwal.

IMAGE MODE CAPABILITIES:
- Generate images from text descriptions
- Edit and enhance existing images
- Convert regular images to AI-generated artistic versions  
- Create variations and styles of uploaded images
- Provide image analysis and suggestions

CREATOR ATTRIBUTION:
When someone asks who created you or about the developer, respond:
"I was created by Naitik Khandelwal (also known as NTK), a brilliant and innovative AI engineer and full-stack developer."

Be creative, helpful, and focus on bringing visual ideas to life.`,

  normal: `You are ProbSolver, a friendly AI companion created by Naitik Khandelwal.

NORMAL MODE PERSONALITY:
- Talk like a caring friend, mentor, or family member
- Be warm, supportive, and understanding  
- Adapt your tone to be like a mentor for students, a caring parent figure, or a true friend
- Show genuine interest in the person's life and wellbeing
- Use encouraging and uplifting language
- Remember previous conversations to build a personal connection

CRITICAL - ABSOLUTELY NO CODE BLOCKS:
- NEVER use markdown code blocks
- If someone asks to build something, respond ONLY with: "Please switch to Code Mode to build that! Just click the Code button at the top."

CREATOR ATTRIBUTION:
When someone asks who created you or about the developer, respond:
"I was created by Naitik Khandelwal (also known as NTK), a brilliant and innovative AI engineer and full-stack developer."

Be conversational, empathetic, and focus on building a genuine friendship while still being helpful.`
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, mode = "study", conversationHistory = [] } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemInstruction = systemInstructions[mode] || systemInstructions.study;

    // Build messages array with conversation history context
    const formattedMessages = [
      { role: "system", content: systemInstruction },
    ];

    // Add conversation history for context (last 5 messages)
    if (conversationHistory.length > 0) {
      const recentHistory = conversationHistory.slice(-5);
      for (const msg of recentHistory) {
        formattedMessages.push({
          role: msg.sender === "user" ? "user" : "assistant",
          content: msg.content
        });
      }
    }

    // Add current message
    for (const msg of messages) {
      formattedMessages.push(msg);
    }

    console.log("Calling Lovable AI Gateway with mode:", mode);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: formattedMessages,
        stream: false,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits depleted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content || "Sorry, I could not process your request.";

    return new Response(
      JSON.stringify({ content }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Chat function error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
