export function emailLayout(content: string) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color:#171717;border-radius:12px;border:1px solid #262626;">
        <tr><td style="padding:32px 40px 24px;border-bottom:1px solid #262626;">
          <h1 style="margin:0;font-size:20px;font-weight:700;color:#fafafa;letter-spacing:-0.02em;">Better Music League</h1>
        </td></tr>
        <tr><td style="padding:32px 40px;">
          ${content}
        </td></tr>
        <tr><td style="padding:20px 40px;border-top:1px solid #262626;">
          <p style="margin:0;font-size:12px;color:#737373;text-align:center;">
            You're receiving this because you're a member of Better Music League.
            Update your notification preferences in your profile settings.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function emailButton(text: string, url: string) {
  return `<table cellpadding="0" cellspacing="0" style="margin:24px 0;">
    <tr><td style="background-color:#6d28d9;border-radius:8px;padding:12px 24px;">
      <a href="${url}" style="color:#fafafa;text-decoration:none;font-size:14px;font-weight:600;">${text}</a>
    </td></tr>
  </table>`;
}
