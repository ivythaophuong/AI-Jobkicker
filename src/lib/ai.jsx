import React from 'react';

// ── AI LLM Logic ─────────────────────────────────────────────────────────────
export async function callLLM(messages, max_tokens = 2000, model_type = "default") {
  // Use user's existing API pattern
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": "...", // User needs to provide this or we use current proxy
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: "claude-3-5-sonnet-20240620",
      max_tokens,
      messages
    })
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || "AI invocation failed");
  return data.content[0].text;
}

export function extractJSON(str) {
  try {
    const start = str.indexOf('{');
    const end = str.lastIndexOf('}');
    if (start === -1 || end === -1) return { error: true, msg: "No JSON found in AI response" };
    return JSON.parse(str.slice(start, end + 1));
  } catch (e) {
    return { error: true, msg: "Failed to parse AI response: " + e.message };
  }
}

// ── Markdown Parser Component ────────────────────────────────────────────────
export const Markdown = ({ text }) => {
  if (!text) return null;
  // Simple regex-based markdown parser (standard in App.jsx)
  const lines = text.split('\n');
  return (
    <div style={{ lineHeight: 1.6 }}>
      {lines.map((line, i) => {
        if (line.startsWith('### ')) return <h3 key={i} style={{ margin: "16px 0 8px" }}>{line.slice(4)}</h3>;
        if (line.startsWith('## ')) return <h2 key={i} style={{ margin: "20px 0 10px" }}>{line.slice(3)}</h2>;
        if (line.startsWith('• ') || line.startsWith('- ')) return <li key={i} style={{ marginLeft: 20 }}>{line.slice(2)}</li>;
        if (line.trim() === "") return <div key={i} style={{ height: 10 }} />;
        return <p key={i} style={{ margin: "8px 0" }}>{line}</p>;
      })}
    </div>
  );
};
