import DOMPurify from "isomorphic-dompurify";

const ALLOWED_TAGS = [
  "p", "br", "hr", "a", "strong", "em", "s", "u", "code", "pre", "mark",
  "h2", "h3", "h4", "ul", "ol", "li", "blockquote",
  "img", "video", "iframe", "figure", "figcaption",
  "table", "thead", "tbody", "tr", "th", "td",
  "div", "span", "button", "svg", "path", "g", "text", "sub", "sup",
];

const ALLOWED_ATTR = [
  "href", "src", "alt", "title", "class", "id", "target", "rel",
  "data-type", "data-node", "colspan", "rowspan", "width", "height",
  "controls", "preload", "frameborder", "allow", "allowfullscreen",
  "style", "viewBox", "d", "fill", "stroke", "cx", "cy", "r", "x", "y",
];

export function sanitizeArticleHtml(html: string) {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ADD_TAGS: ["iframe"],
  });
}

export function ArticleContent({ html, id }: { html: string; id: string }) {
  const clean = sanitizeArticleHtml(html);
  return (
    // eslint-disable-next-line react/no-danger
    <div id={id} className="prose-article" dangerouslySetInnerHTML={{ __html: clean }} />
  );
}
