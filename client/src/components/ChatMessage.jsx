import React from 'react';

// Deliberately small renderer: React escapes text, and no raw HTML is evaluated.
const inline = (text, key = 'text') => String(text).split(/(\*\*[^*\n]+\*\*|__[^_\n]+__|`[^`\n]+`|\*[^*\n]+\*)/g).map((part, index) => {
  const id = `${key}-${index}`;
  if ((part.startsWith('**') && part.endsWith('**')) || (part.startsWith('__') && part.endsWith('__'))) return <strong key={id}>{part.slice(2, -2)}</strong>;
  if (part.startsWith('`') && part.endsWith('`')) return <code key={id}>{part.slice(1, -1)}</code>;
  if (part.startsWith('*') && part.endsWith('*') && part.length > 2) return <em key={id}>{part.slice(1, -1)}</em>;
  return part;
});

export default function ChatMessage({ text }) {
  const lines = String(text || '').replace(/\r\n/g, '\n').split('\n');
  const blocks = [];
  for (let index = 0; index < lines.length;) {
    const line = lines[index].trim();
    if (!line || /^[-*_]{3,}$/.test(line)) { index++; continue; }
    const heading = line.match(/^#{1,6}\s+(.+)$/);
    if (heading) { blocks.push(<h4 key={index}>{inline(heading[1], `h-${index}`)}</h4>); index++; continue; }
    const list = line.match(/^(?:[-*+]\s+|\d+[.)]\s+)/);
    if (list) {
      const ordered = /^\d/.test(line);
      const items = [];
      const first = index;
      const pattern = ordered ? /^\d+[.)]\s+(.+)$/ : /^[-*+]\s+(.+)$/;
      while (index < lines.length && pattern.test(lines[index].trim())) {
        const value = lines[index].trim().match(pattern)[1];
        items.push(<li key={index}>{inline(value, `li-${index}`)}</li>); index++;
      }
      blocks.push(ordered ? <ol key={first}>{items}</ol> : <ul key={first}>{items}</ul>);
      continue;
    }
    const first = index;
    const paragraph = [];
    while (index < lines.length && lines[index].trim() && !/^#{1,6}\s|^(?:[-*+]\s+|\d+[.)]\s+)/.test(lines[index].trim())) {
      paragraph.push(lines[index]); index++;
    }
    blocks.push(<p key={first}>{inline(paragraph.join('\n'), `p-${first}`)}</p>);
  }
  return <div className="chat-rich-text">{blocks}</div>;
}
