import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { inviterName, inviterEmail, inviteeEmail, inviteeName, appDownloadUrl } = await req.json()

    // For now, we'll just log the invitation details
    // In production, you'd integrate with an email service like SendGrid, Mailgun, etc.
    console.log('Invitation Details:', {
      inviterName,
      inviterEmail,
      inviteeEmail,
      inviteeName,
      appDownloadUrl
    })

    // Example email template (you'd send this via your email service)
    const emailTemplate = `
Subject: ${inviterName} is asking you to be one of their "persons" on Love on the Pixel

Hi ${inviteeName || 'there'},

${inviterName} has invited you to join them on Love on the Pixel - a special app for sharing words of love, encouragement, and appreciation with the people who matter most.

To get started, download the app from the Google Play Store:
${appDownloadUrl}

Once you've downloaded the app, you'll be able to:
• Receive personalized messages of love and encouragement
• Send your own messages to your loved ones
• Build deeper connections through meaningful affirmations

We hope you'll join us in spreading love and positivity!

Best regards,
The Love on the Pixel Team
    `

    // Here you would send the email using your preferred email service
    // For example, with SendGrid:
    // await sendEmail({
    //   to: inviteeEmail,
    //   from: 'noreply@loveonthepixel.com',
    //   subject: `${inviterName} is asking you to be one of their "persons"`,
    //   text: emailTemplate
    // })

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Invitation sent successfully',
        emailTemplate // For debugging
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})
