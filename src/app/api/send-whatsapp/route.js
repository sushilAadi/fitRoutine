import { NextResponse } from 'next/server';

const WHATSAPP_API_VERSION = 'v18.0';
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;

async function sendTemplateMessage(to, templateName, parameters = [], languageCode = 'en_US') {
  try {
    const cleanPhoneNumber = to.replace(/[\s\-\(\)]/g, '');
    const formattedNumber = cleanPhoneNumber.startsWith('+') ? cleanPhoneNumber : `+${cleanPhoneNumber}`;

    const baseURL = `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${WHATSAPP_PHONE_NUMBER_ID}/messages`;
    
    const payload = {
      messaging_product: 'whatsapp',
      to: formattedNumber,
      type: 'template',
      template: {
        name: templateName,
        language: {
          code: languageCode
        },
        components: parameters.length > 0 ? [
          {
            type: 'body',
            parameters: parameters.map(param => ({
              type: 'text',
              text: String(param)
            }))
          }
        ] : undefined
      }
    };

    console.log('Sending WhatsApp template message:', {
      to: formattedNumber,
      template: templateName,
      parameters,
      phoneNumberId: WHATSAPP_PHONE_NUMBER_ID,
      hasToken: !!WHATSAPP_ACCESS_TOKEN
    });

    const response = await fetch(baseURL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('WhatsApp API error:', result);
      throw new Error(`WhatsApp API error: ${result.error?.message || 'Unknown error'}`);
    }

    console.log('WhatsApp message sent successfully:', result);
    return {
      success: true,
      messageId: result.messages?.[0]?.id,
      data: result
    };

  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { adminPhone, mentorPhone, clientName, mentorName, amount } = body;

    console.log('WhatsApp notification request:', {
      adminPhone,
      mentorPhone,
      clientName,
      mentorName,
      amount
    });

    const results = [];

    // Send admin notification
    if (adminPhone) {
      const adminResult = await sendTemplateMessage(
        adminPhone,
        'admin_enrollment_alert',
        [clientName, mentorName, String(amount)]
      );
      results.push({ type: 'admin', ...adminResult });
    }

    // Send mentor notification  
    if (mentorPhone) {
      const mentorResult = await sendTemplateMessage(
        mentorPhone,
        'mentor_new_student',
        [clientName, String(amount)]
      );
      results.push({ type: 'mentor', ...mentorResult });
    }

    const allSuccess = results.every(r => r.success);

    return NextResponse.json({
      success: allSuccess,
      results: results
    });

  } catch (error) {
    console.error('WhatsApp notification API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message 
      },
      { status: 500 }
    );
  }
}