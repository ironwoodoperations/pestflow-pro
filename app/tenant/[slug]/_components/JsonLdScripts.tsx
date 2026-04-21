// XSS-safe JSON-LD server component.
// Escapes < to < to prevent </script> breakout per S165.9 design v2.
export function JsonLdScript({ schema, id }: { schema: object; id: string }) {
  const safe = JSON.stringify(schema).replace(/</g, '\\u003c');
  return (
    <script
      type="application/ld+json"
      id={id}
      dangerouslySetInnerHTML={{ __html: safe }}
    />
  );
}
