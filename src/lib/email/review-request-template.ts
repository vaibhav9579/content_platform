import { siteConfig } from "@/config/site";
import { absoluteUrl } from "@/lib/utils";

export function reviewRequestEmailHtml(opts: { title: string; postId: string; submitterName: string | null }) {
  const editUrl = absoluteUrl(`/admin/posts/${opts.postId}/edit`);
  const submitter = opts.submitterName || "A teammate";

  return `
<!doctype html>
<html>
  <body style="margin:0;padding:0;background-color:#f5f5f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f4;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:16px;padding:32px;">
            <tr>
              <td style="padding-bottom:12px;">
                <img src="${absoluteUrl(siteConfig.logo)}" alt="${siteConfig.name}" height="28" style="height:28px;width:auto;display:block;" />
              </td>
            </tr>
            <tr>
              <td style="font-size:13px;color:#78716c;text-transform:uppercase;letter-spacing:0.05em;padding-bottom:16px;">
                Review requested
              </td>
            </tr>
            <tr>
              <td style="font-size:24px;line-height:1.3;font-weight:600;color:#1c1917;padding-bottom:12px;">
                ${opts.title}
              </td>
            </tr>
            <tr>
              <td style="font-size:16px;line-height:1.6;color:#44403c;padding-bottom:24px;">
                ${submitter} submitted this post for review. It won't go live until an admin or editor publishes it.
              </td>
            </tr>
            <tr>
              <td>
                <a href="${editUrl}" style="display:inline-block;background-color:#1c1917;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:15px;font-weight:500;">
                  Review this post
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
