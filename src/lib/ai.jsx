import React from 'react';

const PROVIDER = import.meta.env.VITE_LLM_PROVIDER || 'anthropic';
const MODEL    = import.meta.env.VITE_LLM_MODEL    || 'claude-3-5-sonnet-20241022';
const ANTHROPIC_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;
const OPENAI_KEY    = import.meta.env.VITE_OPENAI_API_KEY;
const GEMINI_KEY    = import.meta.env.VITE_GEMINI_API_KEY;

// ── callLLM ──────────────────────────────────────────────────────────────────
// Generic LLM caller. Routes to the configured provider.
// pdfBase64: optional — if provided, the PDF is sent alongside the prompt.
//            Gemini: inline_data. Anthropic: document content type (beta header).
// Fallback: if primary fails and OPENAI_KEY is set, retries with gpt-4o-mini.
export async function callLLM(messages, maxTokens = 8192, pdfBase64 = null) {
  try {
    if (PROVIDER === 'gemini') return await _callGemini(messages, maxTokens, pdfBase64);
    if (PROVIDER === 'openai') return await _callOpenAI(messages, maxTokens);
    return await _callAnthropic(messages, maxTokens, pdfBase64);
  } catch (err) {
    if (PROVIDER !== 'openai' && OPENAI_KEY) {
      console.warn('[callLLM] Primary provider failed, falling back to OpenAI:', err.message);
      return _callOpenAI(messages, maxTokens);
    }
    throw err;
  }
}

async function _callGemini(messages, maxTokens, pdfBase64) {
  const model = MODEL.startsWith('gemini') ? MODEL : 'gemini-1.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_KEY}`;

  // Flatten messages into a single prompt for Gemini
  const text = messages.map(m => m.content).join('\n\n');
  const parts = pdfBase64
    ? [{ inline_data: { mime_type: 'application/pdf', data: pdfBase64 } }, { text }]
    : [{ text }];

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: { maxOutputTokens: maxTokens, temperature: 0.1, thinkingConfig: { thinkingBudget: 0 } }
    })
  });
  if (res.status === 429) throw new Error('429: Gemini rate limit exceeded — wait and retry');
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || 'Gemini call failed');
  if (!data.candidates?.[0]?.content?.parts?.[0]?.text) throw new Error('Unexpected Gemini response format');
  return data.candidates[0].content.parts[0].text;
}

async function _callAnthropic(messages, maxTokens, pdfBase64 = null) {
  const processedMessages = pdfBase64
    ? messages.map(m => ({
        role: m.role,
        content: [
          { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: pdfBase64 } },
          { type: 'text', text: typeof m.content === 'string' ? m.content : JSON.stringify(m.content) }
        ]
      }))
    : messages;

  const headers = {
    'Content-Type': 'application/json',
    'x-api-key': ANTHROPIC_KEY,
    'anthropic-version': '2023-06-01',
  };
  if (pdfBase64) headers['anthropic-beta'] = 'pdfs-2024-09-25';

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers,
    body: JSON.stringify({ model: MODEL, max_tokens: maxTokens, messages: processedMessages })
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || 'Anthropic call failed');
  if (!data.content?.[0]?.text) throw new Error('Unexpected Anthropic response format');
  return data.content[0].text;
}

async function _callOpenAI(messages, maxTokens) {
  const openaiModel = PROVIDER === 'openai' ? MODEL : 'gpt-4o-mini';
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_KEY}`
    },
    body: JSON.stringify({ model: openaiModel, max_tokens: maxTokens, messages })
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || 'OpenAI call failed');
  if (!data.choices?.[0]?.message?.content) throw new Error('Unexpected OpenAI response format');
  return data.choices[0].message.content;
}

// ── extractJSON ──────────────────────────────────────────────────────────────
export function extractJSON(str) {
  try {
    // Strip markdown code fences — also handles Unicode invisible chars Gemini 2.5 sometimes prepends
    const cleaned = str
      .replace(/[​-‍⁠﻿]/g, '')  // strip zero-width / word-joiner chars
      .replace(/`{1,3}json\s*/gi, '')                // ```json or `json variants
      .replace(/`{1,3}\s*/g, '')                     // closing fences
      .trim();
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start === -1 || end === -1) {
      console.error('[extractJSON] No JSON found. Raw:', str.slice(0, 300));
      return { error: true, msg: 'No JSON found in AI response' };
    }
    return JSON.parse(cleaned.slice(start, end + 1));
  } catch (e) {
    console.error('[extractJSON] Parse failed. Raw:', str.slice(0, 300));
    return { error: true, msg: 'Failed to parse AI response: ' + e.message };
  }
}

// ── Markdown renderer ────────────────────────────────────────────────────────
export const Markdown = ({ text }) => {
  if (!text) return null;
  const lines = text.split('\n');
  return (
    <div style={{ lineHeight: 1.6 }}>
      {lines.map((line, i) => {
        if (line.startsWith('### ')) return <h3 key={i} style={{ margin: '16px 0 8px' }}>{line.slice(4)}</h3>;
        if (line.startsWith('## '))  return <h2 key={i} style={{ margin: '20px 0 10px' }}>{line.slice(3)}</h2>;
        if (line.startsWith('• ') || line.startsWith('- ')) return <li key={i} style={{ marginLeft: 20 }}>{line.slice(2)}</li>;
        if (line.trim() === '') return <div key={i} style={{ height: 10 }} />;
        return <p key={i} style={{ margin: '8px 0' }}>{line}</p>;
      })}
    </div>
  );
};
