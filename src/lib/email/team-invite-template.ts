import { siteConfig } from "@/config/site";
import { absoluteUrl } from "@/lib/utils";

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Admin",
  EDITOR: "Editor",
  AUTHOR: "Author",
  CONTRIBUTOR: "Contributor",
};

export function teamInviteEmailHtml(opts: { role: string; invitedByName: string | null }) {
  const signInUrl = absoluteUrl("/sign-in");
  const roleLabel = ROLE_LABEL[opts.role] ?? opts.role;
  const inviter = opts.invitedByName || "An admin";

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
                ${siteConfig.name} &middot; Team invite
              </td>
            </tr>
            <tr>
              <td style="font-size:24px;line-height:1.3;font-weight:600;color:#1c1917;padding-bottom:12px;">
                You've been added to the team
              </td>
            </tr>
            <tr>
              <td style="font-size:16px;line-height:1.6;color:#44403c;padding-bottom:24px;">
                ${inviter} gave you <strong>${roleLabel}</strong> access to the ${siteConfig.name} CMS.
                Sign in with this email address to start writing.
              </td>
            </tr>
            <tr>
              <td>
                <a href="${signInUrl}" style="display:inline-block;background-color:#1c1917;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:15px;font-weight:500;">
                  Sign in to the CMS
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding-top:32px;font-size:12px;color:#a8a29e;">
                If you weren't expecting this, you can ignore this email.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
