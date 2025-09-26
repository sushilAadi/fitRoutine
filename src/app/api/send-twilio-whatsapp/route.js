import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request) {
  try {
    const { clientName, mentorName, mentorPhone, amount, selectedTime, clientEmail, clientPhone, mentorEmail } = await request.json();

    // Twilio credentials from environment
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER;
    const adminNumber = process.env.ADMIN_WHATSAPP_NUMBER;

    // Validate environment variables
    if (!accountSid || !authToken || !fromNumber || !adminNumber) {
      throw new Error('Missing Twilio environment variables');
    }

    // Create Twilio client credentials (Base64 encoded)
    const credentials = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

    // Admin notification message
    const adminMessage = `🎯 *New Enrollment Alert!*

👤 *Student:* ${clientName}
🏃 *Mentor:* ${mentorName}
💰 *Amount:* ₹${amount}
📅 *Date:* ${new Date().toLocaleDateString()}

Please review and approve in admin dashboard.`;

    // Send message to admin
    const adminResponse = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        From: fromNumber,
        To: adminNumber,
        Body: adminMessage,
      }),
    });

    const adminResult = await adminResponse.json();
    console.log('Admin WhatsApp result:', adminResult);

    let mentorResult = null;

    // Send SMS to mentor if phone number provided
    if (mentorPhone) {
      // Format mentor phone number for SMS (detect country and add appropriate code)
      let formattedMentorPhone = mentorPhone.replace(/\D/g, ''); // Remove non-digits

      // Add country code based on number length and pattern
      if (formattedMentorPhone.length === 10) {
        // Indian number (10 digits)
        formattedMentorPhone = `+91${formattedMentorPhone}`;
      } else if (formattedMentorPhone.length === 11 && formattedMentorPhone.startsWith('1')) {
        // US/Canada number
        formattedMentorPhone = `+${formattedMentorPhone}`;
      } else if (!formattedMentorPhone.startsWith('+')) {
        // Default to India if no country code detected
        formattedMentorPhone = `+91${formattedMentorPhone}`;
      }

      const mentorMessage = `🎉 Congratulations! New Student

👤 ${clientName} has joined your program!
💰 Payment: ₹${amount} ✅
📅 Selected Time: ${selectedTime || 'Not specified'}
📧 Contact: ${clientEmail || 'Not provided'}
📱 Phone: ${clientPhone || 'Not provided'}

Welcome them to start their fitness journey! 💪

- FitApp Team`;

      // Send SMS using Twilio (works with trial account)
      const mentorResponse = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          From: process.env.TWILIO_PHONE_NUMBER || '+15642332527',
          To: formattedMentorPhone,
          Body: mentorMessage,
        }),
      });

      mentorResult = await mentorResponse.json();
      console.log('Mentor SMS result:', mentorResult);
    }

    // Send Email notifications
    let emailResults = { admin: null, mentor: null };

    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      try {
        // Create email transporter
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
          }
        });

        // Send admin email
        if (process.env.ADMIN_EMAIL) {
          const adminEmailResult = await transporter.sendMail({
            from: `FitApp Notifications <${process.env.EMAIL_USER}>`,
            to: process.env.ADMIN_EMAIL,
            subject: `🎯 New Enrollment: ${clientName}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2563eb;">🎯 New Student Enrollment!</h2>

                <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="margin-top: 0; color: #1e40af;">Student Details:</h3>
                  <p><strong>Name:</strong> ${clientName}</p>
                  <p><strong>Email:</strong> ${clientEmail || 'Not provided'}</p>
                  <p><strong>Phone:</strong> ${clientPhone || 'Not provided'}</p>
                  <p><strong>Selected Time:</strong> ${selectedTime || 'Not specified'}</p>
                </div>

                <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="margin-top: 0; color: #059669;">Mentor Details:</h3>
                  <p><strong>Mentor:</strong> ${mentorName}</p>
                  <p><strong>Phone:</strong> ${mentorPhone || 'Not provided'}</p>
                  <p><strong>Email:</strong> ${mentorEmail || 'Not provided'}</p>
                </div>

                <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="margin-top: 0; color: #d97706;">Payment Details:</h3>
                  <p><strong>Amount Paid:</strong> ₹${amount}</p>
                  <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
                  <p><strong>Time:</strong> ${new Date().toLocaleTimeString()}</p>
                </div>

                <p style="color: #6b7280;">Please review and approve the enrollment in your admin dashboard.</p>
              </div>
            `
          });
          emailResults.admin = { success: true, messageId: adminEmailResult.messageId };
        }

        // Send mentor email
        if (mentorEmail) {
          const mentorEmailResult = await transporter.sendMail({
            from: `FitApp Notifications <${process.env.EMAIL_USER}>`,
            to: mentorEmail,
            subject: `🎉 Congratulations! New Student: ${clientName}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #059669;">🎉 Congratulations! New Student Enrolled</h2>

                <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <p style="font-size: 18px; margin-bottom: 15px;">Great news! <strong>${clientName}</strong> has enrolled for your training program.</p>
                </div>

                <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="margin-top: 0; color: #1e40af;">Student Information:</h3>
                  <p><strong>Name:</strong> ${clientName}</p>
                  <p><strong>Email:</strong> ${clientEmail || 'Not provided'}</p>
                  <p><strong>Phone:</strong> ${clientPhone || 'Not provided'}</p>
                  <p><strong>Preferred Time:</strong> ${selectedTime || 'Not specified'}</p>
                </div>

                <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="margin-top: 0; color: #d97706;">Payment Completed ✅</h3>
                  <p><strong>Amount:</strong> ₹${amount}</p>
                  <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
                </div>

                <div style="background: #dbeafe; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="margin-top: 0; color: #1d4ed8;">Next Steps:</h3>
                  <ul style="color: #374151;">
                    <li>Contact ${clientName} within 24 hours</li>
                    <li>Schedule the first training session</li>
                    <li>Prepare a personalized workout plan</li>
                    <li>Welcome them to their fitness journey!</li>
                  </ul>
                </div>

                <p style="color: #6b7280; font-style: italic;">Thank you for being an amazing mentor! 💪</p>
                <p style="color: #6b7280; font-size: 14px;">- FitApp Team</p>
              </div>
            `
          });
          emailResults.mentor = { success: true, messageId: mentorEmailResult.messageId };
        }
      } catch (emailError) {
        console.error('Email sending error:', emailError);
        emailResults = {
          admin: { success: false, error: emailError.message },
          mentor: { success: false, error: emailError.message }
        };
      }
    }

    // Check for errors
    if (adminResult.error_code) {
      throw new Error(`Admin message failed: ${adminResult.error_message}`);
    }

    if (mentorResult && mentorResult.error_code) {
      console.error(`Mentor message failed: ${mentorResult.error_message}`);
    }

    return NextResponse.json({
      success: true,
      whatsapp: {
        adminMessageSid: adminResult.sid,
      },
      sms: {
        mentorMessageSid: mentorResult?.sid || null,
      },
      email: emailResults,
      message: 'Notifications sent successfully (WhatsApp + SMS + Email)'
    });

  } catch (error) {
    console.error('Twilio WhatsApp error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        details: 'Check server logs for more information'
      },
      { status: 500 }
    );
  }
}