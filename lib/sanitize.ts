/**
 * sanitizeBlogHtml — minimal whitelist sanitizer for generated blog bodies.
 *
 * The blog HTML is produced by our own offline generators, but it is
 * rendered with dangerouslySetInnerHTML, so this is the defense-in-depth
 * layer that guarantees only safe, known formatting reaches the browser.
 *
 * Rules:
 *  - Allowed block/inline tags: p, h2, ul, ol, li, strong. All attributes
 *    are stripped (generators emit none).
 *  - b, i, em are normalized to <strong>.
 *  - sub, sup are unwrapped (inner text kept, tags dropped) so formulas
 *    never render raw tags.
 *  - a is unwrapped (inner text kept, href dropped) — blogs must not carry
 *    external links.
 *  - script, style, iframe, object, embed, form, input, button, link, meta
 *    are removed WITH their content.
 *  - HTML comments are removed.
 *  - Any other tag is escaped as literal text.
 *  - Text nodes are escaped (&, <, >).
 *  - Tag nesting is re-balanced with a stack; stray closers are dropped and
 *    unclosed tags are auto-closed at the end.
 */

const KEEP: Record<string, string> = {
  p: "p",
  h2: "h2",
  ul: "ul",
  ol: "ol",
  li: "li",
  strong: "strong",
  b: "strong",
  i: "strong",
  em: "strong",
};

// Tags whose inner text survives but whose markup is dropped.
const UNWRAP = new Set(["sub", "sup", "a", "span", "div", "font", "u"]);

// Tags removed together with everything inside them.
const DROP_WITH_CONTENT = new Set([
  "script",
  "style",
  "iframe",
  "object",
  "embed",
  "form",
  "input",
  "button",
  "link",
  "meta",
  "noscript",
  "template",
  "svg",
]);

function escapeText(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeTag(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function sanitizeBlogHtml(html: string | null | undefined): string {
  if (!html) return "";
  let out = "";
  const stack: string[] = [];
  // Tokenize: comments, tags, text, lone "<".
  const re =
    /<!--[\s\S]*?-->|<\/?[a-zA-Z][a-zA-Z0-9]*(?:\s[^<>]*)?\/?>|[^<]+|</g;
  let m: RegExpExecArray | null;
  let dropDepth = 0;
  let dropTag = "";

  while ((m = re.exec(html)) !== null) {
    const tok = m[0];
    if (tok.startsWith("<!--")) continue; // strip comments

    if (!tok.startsWith("<")) {
      if (dropDepth === 0) out += escapeText(tok);
      continue;
    }

    const isClose = tok[1] === "/";
    const nameMatch = tok.match(/^<\/?([a-zA-Z][a-zA-Z0-9]*)/);
    if (!nameMatch) {
      if (dropDepth === 0) out += escapeTag(tok);
      continue;
    }
    const rawName = nameMatch[1].toLowerCase();
    const selfClose = /\/>$/.test(tok);

    if (dropDepth > 0) {
      // Inside a dropped region: track nesting of the same tag only.
      if (!isClose && rawName === dropTag) dropDepth++;
      else if (isClose && rawName === dropTag) dropDepth--;
      continue;
    }

    if (DROP_WITH_CONTENT.has(rawName)) {
      if (!isClose && !selfClose) {
        dropDepth = 1;
        dropTag = rawName;
      }
      continue; // drop tag and (for opens) its content
    }

    if (UNWRAP.has(rawName)) continue; // keep inner text, drop markup

    const mapped = KEEP[rawName];
    if (!mapped) {
      out += escapeTag(tok); // unknown tag → show as text
      continue;
    }

    if (isClose) {
      // Pop until the matching opener; drop the stray closer if none.
      const idx = stack.lastIndexOf(mapped);
      if (idx === -1) continue;
      while (stack.length > idx) {
        const t = stack.pop()!;
        out += `</${t}>`;
      }
    } else {
      if (selfClose) continue; // none of the kept tags are void; skip
      stack.push(mapped);
      out += `<${mapped}>`;
    }
  }

  // Auto-close anything left open.
  while (stack.length > 0) {
    out += `</${stack.pop()!}>`;
  }
  return out;
}
