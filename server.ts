import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import nodemailer, { Transporter } from 'nodemailer';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '5mb' }));

const CONFIG_FILE_PATH = path.resolve('smtp-config.json');

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
}

// In-memory active transporter cache
let cachedTransporter: Transporter | null = null;
let lastVerificationStatus: { ok: boolean; message: string; timestamp: string } | null = null;

// Read config from environment variables or smtp-config.json
export function loadSmtpConfig(): SmtpConfig | null {
  let host = process.env.SMTP_HOST?.trim();
  let portRaw = process.env.SMTP_PORT?.trim();
  let secureRaw = process.env.SMTP_SECURE?.trim();
  let user = process.env.SMTP_USER?.trim();
  let pass = process.env.SMTP_PASS?.trim();
  let from = process.env.SMTP_FROM?.trim();

  // Smart detect if user swapped HOST and PORT in env configuration:
  // e.g. SMTP_HOST was set to "587" and SMTP_PORT was set to "smtp.gmail.com"
  if (portRaw && isNaN(Number(portRaw)) && host && !isNaN(Number(host))) {
    const temp = host;
    host = portRaw;
    portRaw = temp;
  }
  if ((!host || !isNaN(Number(host))) && portRaw && isNaN(Number(portRaw))) {
    host = portRaw;
    portRaw = '587';
  }
  if (host && !isNaN(Number(host))) {
    portRaw = host;
    host = 'smtp.gmail.com';
  }

  let port = portRaw ? parseInt(portRaw, 10) : 587;
  if (isNaN(port) || port <= 0) {
    port = 587;
  }

  let secure = secureRaw === 'true' || port === 465;

  if (host && user && pass) {
    return {
      host,
      port,
      secure,
      user,
      pass,
      from: from || `"${user}" <${user}>`,
    };
  }

  // 2. Check persistent server config file
  try {
    if (fs.existsSync(CONFIG_FILE_PATH)) {
      const raw = fs.readFileSync(CONFIG_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed.host && parsed.user && parsed.pass) {
        const filePort = parseInt(parsed.port, 10) || 587;
        return {
          host: String(parsed.host).trim(),
          port: filePort,
          secure: Boolean(parsed.secure) || filePort === 465,
          user: String(parsed.user).trim(),
          pass: String(parsed.pass).trim(),
          from: String(parsed.from || `"${parsed.user}" <${parsed.user}>`).trim(),
        };
      }
    }
  } catch (err) {
    console.warn('Could not read smtp-config.json:', err);
  }

  return null;
}

// Create or retrieve active transporter
function getTransporter(customConfig?: SmtpConfig): Transporter | null {
  if (customConfig) {
    return nodemailer.createTransport({
      host: customConfig.host,
      port: customConfig.port,
      secure: customConfig.secure,
      auth: {
        user: customConfig.user,
        pass: customConfig.pass,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });
  }

  if (cachedTransporter) {
    return cachedTransporter;
  }

  const config = loadSmtpConfig();
  if (!config) {
    return null;
  }

  try {
    cachedTransporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.pass,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });
    return cachedTransporter;
  } catch (err) {
    console.error('Failed to initialize nodemailer transport:', err);
    return null;
  }
}

// 1. Health endpoint (Requirement 18)
app.get('/api/health', (_req, res) => {
  const config = loadSmtpConfig();
  const configured = Boolean(config && config.host && config.user && config.pass);

  res.json({
    ok: true,
    smtpConfigured: configured,
    host: config?.host || null,
    port: config?.port || 587,
    user: config?.user ? config.user.replace(/(.{2})(.*)(@.*)/, '$1***$3') : null,
  });
});

// 2. Safe SMTP configuration status (Requirement 16)
const handleSmtpStatus = (_req: express.Request, res: express.Response) => {
  const config = loadSmtpConfig();
  const hostVal = config?.host || process.env.SMTP_HOST || null;
  const userVal = config?.user || process.env.SMTP_USER || null;
  const passVal = config?.pass || process.env.SMTP_PASS || null;
  const configured = Boolean(config && config.host && config.user && config.pass);

  res.json({
    configured,
    host: config?.host || null,
    port: config?.port || 587,
    secure: config?.secure || false,
    user: config?.user ? config.user.replace(/(.{2})(.*)(@.*)/, '$1***$3') : null,
    from: config?.from || 'Saraswati Vidya Academy <no-reply@school.edu>',
    verified: lastVerificationStatus?.ok || false,
    lastVerificationMessage: lastVerificationStatus?.message || null,
    hostConfigured: Boolean(hostVal),
    portConfigured: true,
    userConfigured: Boolean(userVal),
    passwordConfigured: Boolean(passVal),
  });
};

app.get('/api/email/status', handleSmtpStatus);
app.get('/api/smtp-status', handleSmtpStatus);

// 3. Configure or update SMTP credentials
const handleSmtpConfigSave = async (req: express.Request, res: express.Response) => {
  try {
    const { host, port, secure, user, pass, from, senderName, senderEmail } = req.body;

    if (!host || !user || !pass) {
      return res.status(400).json({
        success: false,
        message: 'SMTP Host, Username, and Password / App Password are required.',
        error: 'SMTP Host, Username, and Password / App Password are required.',
      });
    }

    const portNum = parseInt(port, 10) || (secure ? 465 : 587);
    const isSecure = Boolean(secure || portNum === 465);

    const testTransporter = nodemailer.createTransport({
      host: host.trim(),
      port: portNum,
      secure: isSecure,
      auth: {
        user: user.trim(),
        pass: pass.trim(),
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });

    try {
      await testTransporter.verify();
      lastVerificationStatus = {
        ok: true,
        message: 'Mail server connection and credentials verified successfully.',
        timestamp: new Date().toISOString(),
      };
    } catch (verifyErr: any) {
      console.error('SMTP Verification Failed:', verifyErr.message);
      lastVerificationStatus = {
        ok: false,
        message: verifyErr.message || 'SMTP authentication failed',
        timestamp: new Date().toISOString(),
      };

      let guidance = verifyErr.message;
      if (verifyErr.code === 'EAUTH') {
        guidance = 'Authentication failed (Invalid username or password). If using Gmail, make sure to generate a 16-character App Password in your Google Account security settings.';
      } else if (verifyErr.code === 'ESOCKET' || verifyErr.code === 'ETIMEDOUT') {
        guidance = `Connection to ${host}:${portNum} timed out. Verify your host and port settings.`;
      } else if (verifyErr.code === 'EDNS') {
        guidance = `Could not resolve host "${host}". Please check the hostname.`;
      }

      return res.status(400).json({
        success: false,
        message: guidance,
        error: guidance,
        code: verifyErr.code || 'SMTP_ERROR',
      });
    }

    // Persist verified configuration
    const resolvedFrom = from?.trim() || (senderName && senderEmail ? `"${senderName.trim()}" <${senderEmail.trim()}>` : `"${user.trim()}" <${user.trim()}>`);
    const newConfig: SmtpConfig = {
      host: host.trim(),
      port: portNum,
      secure: isSecure,
      user: user.trim(),
      pass: pass.trim(),
      from: resolvedFrom,
    };

    fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(newConfig, null, 2), 'utf-8');
    cachedTransporter = testTransporter;

    res.json({
      success: true,
      message: 'SMTP settings successfully verified and saved! Live email dispatch is now active.',
      config: {
        host: newConfig.host,
        port: newConfig.port,
        secure: newConfig.secure,
        user: newConfig.user,
        from: newConfig.from,
      },
    });
  } catch (error: any) {
    console.error('Error in /api/email/config:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error configuring SMTP.', error: error.message });
  }
};

app.post('/api/email/config', handleSmtpConfigSave);
app.post('/api/smtp-config', handleSmtpConfigSave);

// 4. Test SMTP sending endpoint (Requirements 4, 12, 19)
const handleTestEmail = async (req: express.Request, res: express.Response) => {
  try {
    const { testEmail, host, port, secure, user, pass, from } = req.body;
    const recipient = testEmail?.trim();

    if (!recipient || !recipient.includes('@')) {
      return res.status(400).json({
        success: false,
        message: 'A valid test recipient email address is required.',
        sent: 0,
        failed: 1,
      });
    }

    let transporter: Transporter | null = null;
    let config: SmtpConfig | null = null;

    if (host && user && pass) {
      const portNum = parseInt(port, 10) || (secure ? 465 : 587);
      config = {
        host: host.trim(),
        port: portNum,
        secure: Boolean(secure || portNum === 465),
        user: user.trim(),
        pass: pass.trim(),
        from: from?.trim() || `"${user.trim()}" <${user.trim()}>`,
      };
      transporter = getTransporter(config);
    } else {
      config = loadSmtpConfig();
      transporter = getTransporter();
    }

    if (!transporter || !config) {
      return res.status(400).json({
        success: false,
        configured: false,
        message: 'Email service is not configured. Please enter your email server details in School Settings first.',
        error: 'Email service is not configured.',
        sent: 0,
        failed: 1,
      });
    }

    try {
      await transporter.verify();
    } catch (verifyErr: any) {
      console.error('SMTP Verify Failed during test:', verifyErr.message);
      let guidance = verifyErr.message;
      if (verifyErr.code === 'EAUTH') {
        guidance = 'Authentication failed (Invalid username or password). If using Gmail, make sure to generate an App Password.';
      } else if (verifyErr.code === 'ESOCKET' || verifyErr.code === 'ETIMEDOUT') {
        guidance = `Connection to ${config.host}:${config.port} timed out. Verify your host and port settings.`;
      }
      return res.status(400).json({
        success: false,
        message: guidance,
        sent: 0,
        failed: 1,
        code: verifyErr.code || 'SMTP_ERROR',
      });
    }

    const info = await transporter.sendMail({
      from: config.from,
      to: recipient,
      subject: '[Test Verification] School Smart Hub Email System',
      text: `This is a test notification confirming that your School Smart Hub email service is active and properly connected to ${config.host}.`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          <h2 style="color: #1e3a8a; margin-top: 0;">School Smart Hub</h2>
          <p style="color: #334155; line-height: 1.6;">This is an official test notification confirming that the server-side email dispatch system has been verified and is operational.</p>
          <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 12px 16px; border-radius: 4px; margin: 16px 0;">
            <p style="margin: 0; color: #065f46; font-weight: 600;">✓ Email service connection verified!</p>
          </div>
          <p style="color: #64748b; font-size: 12px; margin-bottom: 0;">Dispatched via: ${config.host}:${config.port}</p>
        </div>
      `,
    });

    const wasAccepted = info.accepted && info.accepted.length > 0;

    if (!wasAccepted) {
      return res.status(502).json({
        success: false,
        message: 'The mail server did not accept the test recipient address.',
        sent: 0,
        failed: 1,
        rejected: info.rejected,
      });
    }

    res.json({
      success: true,
      message: 'Test email sent successfully.',
      sent: 1,
      failed: 0,
      details: `Accepted by mail server for ${recipient}. Response: ${info.response || 'OK'}`,
    });
  } catch (err: any) {
    console.error('Test SMTP Failed:', err.message);
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to dispatch test email',
      sent: 0,
      failed: 1,
    });
  }
};

app.post('/api/test-email', handleTestEmail);
app.post('/api/email/test-smtp', handleTestEmail);

// Apps Script Endpoint Configuration persistence
const APPS_SCRIPT_CONFIG_FILE = path.resolve('apps-script-config.json');

function loadSavedAppsScriptUrl(): string {
  try {
    if (fs.existsSync(APPS_SCRIPT_CONFIG_FILE)) {
      const data = JSON.parse(fs.readFileSync(APPS_SCRIPT_CONFIG_FILE, 'utf-8'));
      if (data && data.appsScriptUrl && typeof data.appsScriptUrl === 'string') {
        return data.appsScriptUrl.trim();
      }
    }
  } catch (e) {
    // ignore
  }
  return '';
}

function saveAppsScriptUrlToServer(url: string): void {
  try {
    fs.writeFileSync(
      APPS_SCRIPT_CONFIG_FILE,
      JSON.stringify({ appsScriptUrl: url.trim(), updatedAt: new Date().toISOString() }, null, 2)
    );
  } catch (e) {
    console.error('Failed to save apps-script-config.json:', e);
  }
}

app.get('/api/settings/apps-script-url', (_req, res) => {
  const url = loadSavedAppsScriptUrl() || process.env.APPS_SCRIPT_URL || process.env.VITE_APPS_SCRIPT_URL || '';
  res.json({ appsScriptUrl: url });
});

app.post('/api/settings/apps-script-url', (req, res) => {
  const { appsScriptUrl } = req.body || {};
  if (appsScriptUrl && typeof appsScriptUrl === 'string') {
    saveAppsScriptUrlToServer(appsScriptUrl);
    console.log(`[Settings] Google Apps Script URL saved on server: ${appsScriptUrl.trim()}`);
    return res.json({ success: true, appsScriptUrl: appsScriptUrl.trim() });
  }
  res.status(400).json({ success: false, message: 'Invalid URL' });
});

// 5. Server-side announcement email dispatch via Google Apps Script Web App Proxy
// (Replaces old SMTP announcement delivery; does NOT use nodemailer or Gmail SMTP)
const handleSendAnnouncement = async (req: express.Request, res: express.Response) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  try {
    const { title, message, announcementTitle, announcementMessage, recipients, appsScriptUrl } = req.body || {};

    const resolvedTitle = (title || announcementTitle || '').trim();
    const resolvedMessage = (message || announcementMessage || '').trim();

    if (!resolvedTitle || !resolvedMessage) {
      return res.status(200).json({
        success: false,
        message: 'Announcement title and message are required.',
        sent: 0,
        failed: 1,
      });
    }

    // Parse recipients array of teacher emails (Requirement 1 & 6)
    let recipientEmails: string[] = [];
    if (Array.isArray(recipients)) {
      recipientEmails = recipients
        .map((r: any) => (typeof r === 'string' ? r.trim() : (r?.email ? String(r.email).trim() : '')))
        .filter((email: string) => email && email.includes('@'));
    }

    // Requirement 15: Detailed server-side logging for number of active teachers found
    console.log(`[Announcement] number of active teachers found: ${recipientEmails.length}`);

    // Requirement 11: If zero active teachers found, report clearly without failing announcement creation
    if (recipientEmails.length === 0) {
      console.log(`[Announcement] No active teacher emails provided to dispatch.`);
      return res.status(200).json({
        success: true,
        zeroRecipients: true,
        message: 'Announcement saved to notice board, but no active teacher emails were available.',
        sent: 0,
        failed: 0,
      });
    }

    // Determine target Apps Script Web App URL (Requirement 13)
    const targetUrl = (
      appsScriptUrl ||
      loadSavedAppsScriptUrl() ||
      process.env.APPS_SCRIPT_URL ||
      process.env.VITE_APPS_SCRIPT_URL ||
      'PASTE_MY_APPS_SCRIPT_WEB_APP_URL_HERE'
    ).trim();

    if (appsScriptUrl && typeof appsScriptUrl === 'string' && appsScriptUrl.startsWith('http')) {
      saveAppsScriptUrlToServer(appsScriptUrl);
    }

    // If the URL is still unconfigured or placeholder
    if (!targetUrl || targetUrl === 'PASTE_MY_APPS_SCRIPT_WEB_APP_URL_HERE' || !targetUrl.startsWith('http')) {
      console.error(`[Announcement] Apps Script URL is not configured: ${targetUrl}`);
      return res.status(200).json({
        success: false,
        message: 'Google Apps Script Web App URL is not configured yet. Please configure the URL in School Settings.',
        sent: 0,
        failed: recipientEmails.length,
      });
    }

    const payload = {
      title: resolvedTitle,
      message: resolvedMessage,
      recipients: recipientEmails,
    };

    // Requirement 15: Detailed server-side logging for Apps Script request sent
    console.log(`[Announcement] Apps Script request sent: ${targetUrl}`);
    console.log(`[Announcement] Apps Script request payload:`, JSON.stringify(payload));

    // Forward to Google Apps Script Web App server-to-server (Requirement 5)
    const gasResponse = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
      redirect: 'follow',
    });

    // Requirement 15: Detailed server-side logging for Apps Script HTTP status
    console.log(`[Announcement] Apps Script HTTP status: ${gasResponse.status} ${gasResponse.statusText}`);

    const rawText = await gasResponse.text();

    // Requirement 15: Detailed server-side logging for Apps Script response body
    console.log(`[Announcement] Apps Script response body:`, rawText);

    let data: any = null;
    try {
      data = JSON.parse(rawText);
    } catch (parseErr) {
      console.error('[Announcement] Apps Script response was not valid JSON:', rawText, parseErr);
      return res.status(200).json({
        success: false,
        message: 'Email service returned an invalid response: ' + (rawText.length > 150 ? rawText.slice(0, 150) + '...' : rawText),
        sent: 0,
        failed: recipientEmails.length,
        raw: rawText,
      });
    }

    // Requirement 8: If Apps Script returns success=true, show: "Announcement sent successfully to X teachers."
    if (data && data.success === true) {
      const sentCount = typeof data.sent === 'number' ? data.sent : recipientEmails.length;
      const failedCount = typeof data.failed === 'number' ? data.failed : 0;

      // Requirement 15: Detailed server-side logging for sent count & failed count
      console.log(`[Announcement] sent count: ${sentCount}`);
      console.log(`[Announcement] failed count: ${failedCount}`);

      const successMessage = failedCount > 0
        ? `Announcement sent to ${sentCount} teachers. ${failedCount} emails failed.`
        : `Announcement sent successfully to ${sentCount} teachers.`;

      return res.status(200).json({
        success: true,
        message: successMessage,
        sent: sentCount,
        failed: failedCount,
        data,
      });
    }

    // Requirement 9: If Apps Script returns an error, show the REAL error message returned by Apps Script
    const realErrorMsg = data?.message || data?.error || 'Google Apps Script reported an unhandled email delivery failure.';
    const sentCount = typeof data?.sent === 'number' ? data.sent : 0;
    const failedCount = typeof data?.failed === 'number' ? data.failed : recipientEmails.length;

    // Requirement 15: Detailed server-side logging for sent count & failed count
    console.log(`[Announcement] sent count: ${sentCount}`);
    console.log(`[Announcement] failed count: ${failedCount}`);
    console.log(`[Announcement] Real error message: ${realErrorMsg}`);

    return res.status(200).json({
      success: false,
      message: realErrorMsg,
      sent: sentCount,
      failed: failedCount,
      data,
    });
  } catch (error: any) {
    console.error('[Announcement] Error in send-announcement Apps Script proxy:', error);
    return res.status(200).json({
      success: false,
      message: error?.message || 'Server failed to connect to Google Apps Script Web App.',
      sent: 0,
      failed: 1,
    });
  }
};

app.post('/api/send-announcement', handleSendAnnouncement);
app.post('/api/send-announcement/', handleSendAnnouncement);
app.post('/api/email/send-announcement', handleSendAnnouncement);
app.post('/api/email/send-announcement/', handleSendAnnouncement);

// 6. Explicit API fallback handler - NEVER return HTML for /api/* routes (Requirements 7, 8, 9)
app.all('/api/*', (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
    sent: 0,
    failed: 0,
  });
});

app.all('/api', (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
    sent: 0,
    failed: 0,
  });
});

// 7. Express error handling middleware for API errors - guarantees JSON responses
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (req.originalUrl.startsWith('/api') || req.url.startsWith('/api')) {
    console.error('API Error Middleware caught:', err);
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.status(500).json({
      success: false,
      message: err?.message || 'Internal server error',
      sent: 0,
      failed: 1,
    });
  }
  next(err);
});

// 8. Mount Vite or serve static assets for frontend SPA
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve('dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
