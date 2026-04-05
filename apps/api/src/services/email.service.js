const { env } = require("../config/env")

let transport = null

const buildVerificationUrl = (email, token) => {
  const base = (env.frontendBaseUrl || "http://localhost:5173").replace(/\/+$/, "")
  const query = new URLSearchParams({ email, token }).toString()
  return `${base}/verify-email?${query}`
}

const buildPasswordResetUrl = (email, token) => {
  const base = (env.frontendBaseUrl || "http://localhost:5173").replace(/\/+$/, "")
  const query = new URLSearchParams({ email, token }).toString()
  return `${base}/reset-password?${query}`
}

const getOptionalTransport = () => {
  if (transport) return transport

  if (!env.smtpHost || !env.smtpPort || !env.smtpUser || !env.smtpPass) {
    return null
  }

  let nodemailer
  try {
    nodemailer = require("nodemailer")
  } catch {
    return null
  }

  transport = nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: Boolean(env.smtpSecure),
    auth: {
      user: env.smtpUser,
      pass: env.smtpPass
    }
  })

  return transport
}

const escapeHtml = (value) => String(value || "")
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&#39;")

const renderList = (items = []) => {
  return items
    .map((item) => `
      <tr>
        <td style="padding:0 0 12px;">
          <div style="display:flex;align-items:flex-start;gap:12px;border:1px solid rgba(148,163,184,0.16);border-radius:16px;background:rgba(255,255,255,0.04);padding:14px 16px;">
            <div style="margin-top:2px;height:8px;width:8px;border-radius:999px;background:${item.accent || "#a855f7"};"></div>
            <div>
              <div style="font-size:13px;line-height:1.6;color:rgba(226,232,240,0.94);">${escapeHtml(item.title)}</div>
              ${item.body ? `<div style="margin-top:4px;font-size:12px;line-height:1.7;color:rgba(148,163,184,0.92);">${escapeHtml(item.body)}</div>` : ""}
            </div>
          </div>
        </td>
      </tr>
    `)
    .join("")
}

const buildEmailShell = ({
  eyebrow,
  title,
  intro,
  buttonLabel,
  actionUrl,
  fallbackLabel,
  footerTitle = "Need a hand?",
  footerCopy = "If the button does not work, use the link below. If you did not request this email, you can safely ignore it.",
  supportLabel = "ChurnFlow access",
  supportCopy = "Built for calm, reliable churn operations."
}) => {
  const safeActionUrl = escapeHtml(actionUrl)

  return `
    <!doctype html>
    <html>
      <body style="margin:0;padding:32px 16px;background:#07080d;font-family:'Segoe UI',Arial,sans-serif;color:#f8fafc;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:640px;margin:0 auto;border-collapse:collapse;">
          <tr>
            <td>
              <div style="border:1px solid rgba(148,163,184,0.16);border-radius:28px;overflow:hidden;background:
                radial-gradient(circle at 12% 0%, rgba(217,70,239,0.18), transparent 30%),
                radial-gradient(circle at 88% 0%, rgba(99,102,241,0.18), transparent 28%),
                linear-gradient(180deg, rgba(15,16,24,1), rgba(10,11,17,1));box-shadow:0 28px 80px rgba(0,0,0,0.38);">
                <div style="padding:32px 32px 0;">
                  <div style="display:inline-flex;align-items:center;gap:10px;border:1px solid rgba(248,250,252,0.12);border-radius:999px;padding:8px 12px;background:rgba(255,255,255,0.04);font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:rgba(226,232,240,0.84);">
                    <span style="display:inline-block;height:8px;width:8px;border-radius:999px;background:#f472b6;box-shadow:0 0 18px rgba(244,114,182,0.75);"></span>
                    ChurnFlow
                  </div>
                  <div style="margin-top:22px;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:rgba(148,163,184,0.78);">${escapeHtml(eyebrow)}</div>
                  <h1 style="margin:16px 0 0;font-family:Georgia,'Times New Roman',serif;font-size:40px;line-height:1.1;font-weight:400;color:#ffffff;">${escapeHtml(title)}</h1>
                  <p style="margin:18px 0 0;font-size:15px;line-height:1.8;color:rgba(226,232,240,0.86);">${escapeHtml(intro)}</p>
                </div>

                <div style="padding:28px 32px 0;">
                  <div style="border:1px solid rgba(148,163,184,0.16);border-radius:22px;background:rgba(255,255,255,0.04);padding:22px;">
                    <a href="${safeActionUrl}" style="display:inline-block;border-radius:999px;background:linear-gradient(135deg, rgba(244,114,182,0.92), rgba(99,102,241,0.92));padding:14px 22px;font-size:12px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:#ffffff;text-decoration:none;">
                      ${escapeHtml(buttonLabel)}
                    </a>
                    <div style="margin-top:16px;font-size:12px;line-height:1.8;color:rgba(148,163,184,0.88);">
                      ${escapeHtml(footerCopy)}
                    </div>
                    <div style="margin-top:12px;font-size:12px;line-height:1.8;color:rgba(226,232,240,0.92);word-break:break-all;">
                      ${escapeHtml(fallbackLabel)}: <a href="${safeActionUrl}" style="color:#c4b5fd;text-decoration:none;">${safeActionUrl}</a>
                    </div>
                  </div>
                </div>

                <div style="padding:24px 32px 12px;">
                  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
                    ${renderList([
                      {
                        title: supportLabel,
                        body: supportCopy,
                        accent: "#a855f7"
                      },
                      {
                        title: footerTitle,
                        body: "This email keeps your workspace secure while making sure you can get back to scoring, queue review, and follow-up work quickly.",
                        accent: "#60a5fa"
                      }
                    ])}
                  </table>
                </div>

                <div style="padding:0 32px 30px;font-size:11px;line-height:1.8;color:rgba(148,163,184,0.82);">
                  Sent by ChurnFlow. If this was unexpected, you can ignore this email and no changes will be made.
                </div>
              </div>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `
}

const sendMessage = async ({ to, subject, text, html, replyTo }) => {
  const mailer = getOptionalTransport()

  if (!mailer) {
    console.log(`[EMAIL][fallback] to=${to} subject="${subject}"`)
    console.log(text)
    return { delivered: false, mode: "fallback_log" }
  }

  const info = await mailer.sendMail({
    from: env.smtpFrom || env.smtpUser,
    to,
    replyTo,
    subject,
    text,
    html
  })

  return {
    delivered: true,
    mode: "smtp",
    messageId: info.messageId
  }
}

const sendVerificationEmail = async ({ name, email, token }) => {
  const verifyUrl = buildVerificationUrl(email, token)
  const subject = "Verify your ChurnFlow workspace"
  const text = [
    `Hi ${name || "there"},`,
    "",
    "Welcome to ChurnFlow.",
    "Verify your email to unlock your workspace and continue with the churn setup you chose.",
    "",
    `Open this link: ${verifyUrl}`,
    "",
    "If you did not request this, you can safely ignore this email."
  ].join("\n")
  const html = buildEmailShell({
    eyebrow: "Verify access",
    title: "Confirm your workspace email",
    intro: `Hi ${name || "there"}, you are one quick step away from entering ChurnFlow. Verify this email and we will send you straight back into your workspace flow.`,
    buttonLabel: "Verify email",
    actionUrl: verifyUrl,
    fallbackLabel: "Verification link",
    supportLabel: "Next after verification",
    supportCopy: "We will restore the right workspace path for you automatically, whether you are starting with the telecom model or building a custom one."
  })

  const delivery = await sendMessage({
    to: email,
    subject,
    text,
    html
  })

  if (!delivery.delivered) {
    console.log(`[EMAIL][verification][fallback] to=${email} url=${verifyUrl}`)
  }

  return { ...delivery, verifyUrl }
}

const sendPasswordResetEmail = async ({ name, email, token }) => {
  const resetUrl = buildPasswordResetUrl(email, token)
  const subject = "Reset your ChurnFlow password"
  const text = [
    `Hi ${name || "there"},`,
    "",
    "We received a request to reset your ChurnFlow password.",
    "Use the link below to choose a new password and return to your workspace.",
    "",
    `Open this link: ${resetUrl}`,
    "",
    "If you did not request this, you can safely ignore this email."
  ].join("\n")
  const html = buildEmailShell({
    eyebrow: "Password reset",
    title: "Set a new password and get back in",
    intro: `Hi ${name || "there"}, use the secure link below to reset your password. We will guide you back into the right workspace as soon as you finish.`,
    buttonLabel: "Reset password",
    actionUrl: resetUrl,
    fallbackLabel: "Reset link",
    supportLabel: "What happens next",
    supportCopy: "After you choose a new password, ChurnFlow will sign you in and bring you back to your dashboard or custom setup flow."
  })

  const delivery = await sendMessage({
    to: email,
    subject,
    text,
    html
  })

  if (!delivery.delivered) {
    console.log(`[EMAIL][password-reset][fallback] to=${email} url=${resetUrl}`)
  }

  return { ...delivery, resetUrl }
}

const sendContactEmail = async ({ name, email, company, message }) => {
  const inbox = env.contactInboxEmail || env.smtpFrom || env.smtpUser
  const subject = `New contact request from ${name}`
  const text = [
    `Name: ${name}`,
    `Email: ${email}`,
    `Company: ${company || "-"}`,
    "",
    "Message:",
    message
  ].join("\n")
  const html = `
    <p><strong>Name:</strong> ${escapeHtml(name)}</p>
    <p><strong>Email:</strong> ${escapeHtml(email)}</p>
    <p><strong>Company:</strong> ${escapeHtml(company || "-")}</p>
    <p><strong>Message:</strong></p>
    <p>${escapeHtml(String(message || "")).replace(/\n/g, "<br/>")}</p>
  `

  if (!inbox) {
    console.log(`[EMAIL][contact][fallback] from=${email} name=${name} company=${company || "-"} message=${message}`)
    return { delivered: false, mode: "fallback_log" }
  }

  const delivery = await sendMessage({
    to: inbox,
    replyTo: email,
    subject,
    text,
    html
  })

  if (!delivery.delivered) {
    console.log(`[EMAIL][contact][fallback] from=${email} name=${name} company=${company || "-"} message=${message}`)
  }

  return delivery
}

module.exports = {
  sendVerificationEmail,
  buildVerificationUrl,
  sendPasswordResetEmail,
  buildPasswordResetUrl,
  sendContactEmail
}
