import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { transformWithEsbuild } from 'vite';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const source = await readFile(new URL('../src/components/ChatMessage.jsx', import.meta.url), 'utf8');
const { code } = await transformWithEsbuild(source.replace("import React from 'react';", ''), 'ChatMessage.jsx', { loader: 'jsx', jsx: 'transform' });
const ChatMessage = new Function('React', code.replace('export default function ChatMessage', 'function ChatMessage') + '\nreturn ChatMessage;')(React);
const render = text => renderToStaticMarkup(React.createElement(ChatMessage, { text }));

test('coach replies render emphasis, paragraphs and lists without exposing formatting markers', () => {
    const html = render('**Current stats**\n\n- **Protein:** 20 g\n- Carbs: 30 g\n\n1. First step\n2. Second step');
    assert.match(html, /<strong>Current stats<\/strong>/);
    assert.match(html, /<ul><li><strong>Protein:<\/strong>/);
    assert.match(html, /<ol><li>First step/);
    assert.ok(!html.includes('**'));
});

test('user-supplied HTML remains escaped text', () => {
    const html = render('<img src=x onerror=alert(1)>\n\n**Safe emphasis**');
    assert.ok(!html.includes('<img'));
    assert.match(html, /&lt;img/);
    assert.match(html, /<strong>Safe emphasis<\/strong>/);
});
