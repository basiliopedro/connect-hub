// Supabase Edge Function — send-verification-email
// Deploy: supabase functions deploy send-verification-email
// Runtime: Deno

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const FROM_EMAIL     = Deno.env.get('FROM_EMAIL') ?? 'noreply@connecthub.ao'
const APP_NAME       = 'ConnectHub'

const corsHeaders = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Responder a preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, codigo, nome } = await req.json()

    if (!email || !codigo) {
      return new Response(
        JSON.stringify({ error: 'email e codigo são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Template do email
    const html = `
<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#07070d;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#07070d;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:500px;background:#10101a;border:1px solid rgba(255,255,255,0.08);border-radius:24px;overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="padding:36px 40px 24px;text-align:center;">
              <div style="font-size:22px;font-weight:900;background:linear-gradient(135deg,#7c5cfc,#fc5c7d);-webkit-background-clip:text;-webkit-text-fill-color:transparent;letter-spacing:-0.02em;">
                CONNECT HUB
              </div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:0 40px 36px;text-align:center;">
              <div style="width:64px;height:64px;border-radius:50%;background:rgba(124,92,252,0.12);border:2px solid rgba(124,92,252,0.25);display:inline-flex;align-items:center;justify-content:center;margin-bottom:24px;">
                <span style="font-size:28px;">🔐</span>
              </div>

              <h1 style="color:#eeeef5;font-size:22px;font-weight:800;margin:0 0 12px;">
                Verifica o teu email
              </h1>

              <p style="color:#6a6a82;font-size:15px;line-height:1.65;margin:0 0 32px;">
                ${nome ? `Olá ${nome},<br><br>` : ''}
                Usa o código abaixo para verificar o teu email no ${APP_NAME}.
                O código expira em <strong style="color:#eeeef5;">15 minutos</strong>.
              </p>

              <!-- Código -->
              <div style="background:#181828;border:1px solid rgba(124,92,252,0.2);border-radius:16px;padding:28px;margin-bottom:28px;">
                <div style="letter-spacing:0.25em;font-size:40px;font-weight:900;color:#7c5cfc;font-family:monospace;">
                  ${codigo}
                </div>
                <div style="color:#6a6a82;font-size:12px;margin-top:8px;">
                  Código de verificação de 6 dígitos
                </div>
              </div>

              <p style="color:#6a6a82;font-size:13px;line-height:1.6;margin:0;">
                Se não criaste uma conta no ${APP_NAME}, podes ignorar este email.
                O código expira automaticamente.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
              <p style="color:#6a6a82;font-size:12px;margin:0;">
                © ${new Date().getFullYear()} ${APP_NAME}. Angola &amp; Portugal.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

    // Enviar via Resend
    if (!RESEND_API_KEY) {
      // Modo desenvolvimento: apenas loga o código
      console.log(`[DEV] Código de verificação para ${email}: ${codigo}`)
      return new Response(
        JSON.stringify({ success: true, dev: true, codigo }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        from:    `${APP_NAME} <${FROM_EMAIL}>`,
        to:      [email],
        subject: `${codigo} — O teu código de verificação ${APP_NAME}`,
        html,
      }),
    })

    if (!res.ok) {
      const errBody = await res.text()
      console.error('Resend error:', errBody)
      throw new Error(`Falha ao enviar email: ${res.status}`)
    }

    const data = await res.json()
    return new Response(
      JSON.stringify({ success: true, id: data.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('Edge Function error:', err)
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
