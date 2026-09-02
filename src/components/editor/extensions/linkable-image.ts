import TiptapImage from "@tiptap/extension-image";
import { mergeAttributes } from "@tiptap/core";
import type { DOMOutputSpec } from "@tiptap/pm/model";

/**
 * Extends the stock image node with an optional `href` — when set, the
 * published HTML wraps the <img> in a real <a href> (not a JS click
 * handler), so it works as a genuine, crawlable backlink.
 */
export const LinkableImage = TiptapImage.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      href: { default: null },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'a[data-node="linked-image"] > img[src]',
        getAttrs: (element) => {
          const img = element as HTMLImageElement;
          const anchor = img.parentElement;
          return {
            src: img.getAttribute("src"),
            alt: img.getAttribute("alt"),
            title: img.getAttribute("title"),
            href: anchor?.getAttribute("href") ?? null,
          };
        },
      },
      ...(this.parent?.() ?? []),
    ];
  },

  renderHTML({ HTMLAttributes }): DOMOutputSpec {
    const { href, ...rest } = HTMLAttributes;
    const img: DOMOutputSpec = ["img", mergeAttributes(rest)];
    if (!href) return img;
    return ["a", { href, target: "_blank", rel: "noopener", "data-node": "linked-image" }, img];
  },
});

export default LinkableImage;
