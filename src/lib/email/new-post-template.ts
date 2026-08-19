import { siteConfig } from "@/config/site";
import { absoluteUrl } from "@/lib/utils";

export function newPostEmailHtml(opts: {
  title: string;
  excerpt: string;
  slug: string;
  coverImageUrl: string | null;
  unsubscribeToken: string;
}) {
  const postUrl = absoluteUrl(`/blog/${opts.slug}`);
  const unsubscribeUrl = absoluteUrl(`/unsubscribe?token=${opts.unsubscribeToken}`);
  const cover = opts.coverImageUrl
    ? `<img src="${opts.coverImageUrl}" alt="" width="600" style="width:100%;max-width:600px;height:auto;border-radius:12px;display:block;margin-bottom:24px;" />`
    : "";

  return `
<!doctype html>
<html>
  <body style="margin:0;padding:0;background-color:#f5f5f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f4;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:16px;padding:32px;">
            <tr>
              <td style="font-size:13px;color:#78716c;text-transform:uppercase;letter-spacing:0.05em;padding-bottom:16px;">
                ${siteConfig.name} &middot; New article
              </td>
            </tr>
            <tr>
              <td>${cover}</td>
            </tr>
            <tr>
              <td style="font-size:24px;line-height:1.3;font-weight:600;color:#1c1917;padding-bottom:12px;">
                ${opts.title}
              </td>
            </tr>
            <tr>
              <td style="font-size:16px;line-height:1.6;color:#44403c;padding-bottom:24px;">
                ${opts.excerpt}
              </td>
            </tr>
            <tr>
              <td>
                <a href="${postUrl}" style="display:inline-block;background-color:#1c1917;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:15px;font-weight:500;">
                  Read the full article
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding-top:32px;font-size:12px;color:#a8a29e;">
                You're receiving this because you subscribed to ${siteConfig.name}.
                <a href="${unsubscribeUrl}" style="color:#a8a29e;">Unsubscribe</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
