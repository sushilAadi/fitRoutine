const WHATSAPP_API_VERSION = 'v18.0';
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;

/**
 * Reusable WhatsApp API service for sending messages
 */
class WhatsAppService {
  constructor() {
    this.baseURL = `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${WHATSAPP_PHONE_NUMBER_ID}/messages`;
    this.headers = {
      'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Send a template message to a WhatsApp number
   * @param {string} to - WhatsApp number with country code (e.g., +919876543210)
   * @param {string} templateName - Name of the approved template
   * @param {Array} parameters - Array of parameters to replace {{1}}, {{2}}, etc.
   * @param {string} languageCode - Language code (default: en_US)
   */
  async sendTemplateMessage(to, templateName, parameters = [], languageCode = 'en_US') {
    try {
      // Remove any spaces, dashes, or special characters from phone number
      const cleanPhoneNumber = to.replace(/[\s\-\(\)]/g, '');
      
      // Ensure phone number starts with country code
      const formattedNumber = cleanPhoneNumber.startsWith('+') ? cleanPhoneNumber : `+${cleanPhoneNumber}`;

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
        parameters
      });

      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: this.headers,
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

  /**
   * Send a simple text message (only works within 24 hours of user message)
   * @param {string} to - WhatsApp number with country code
   * @param {string} message - Text message to send
   */
  async sendTextMessage(to, message) {
    try {
      const cleanPhoneNumber = to.replace(/[\s\-\(\)]/g, '');
      const formattedNumber = cleanPhoneNumber.startsWith('+') ? cleanPhoneNumber : `+${cleanPhoneNumber}`;

      const payload = {
        messaging_product: 'whatsapp',
        to: formattedNumber,
        type: 'text',
        text: {
          body: message
        }
      };

      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(`WhatsApp API error: ${result.error?.message || 'Unknown error'}`);
      }

      return {
        success: true,
        messageId: result.messages?.[0]?.id,
        data: result
      };

    } catch (error) {
      console.error('Error sending WhatsApp text message:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send enrollment notification to admin
   * @param {string} adminPhone - Admin's WhatsApp number
   * @param {string} clientName - Name of the client who enrolled
   * @param {string} mentorName - Name of the mentor
   * @param {number} amount - Payment amount
   */
  async sendAdminEnrollmentAlert(adminPhone, clientName, mentorName, amount) {
    return await this.sendTemplateMessage(
      adminPhone,
      'admin_enrollment_alert',
      [clientName, mentorName, String(amount)]
    );
  }

  /**
   * Send enrollment notification to mentor
   * @param {string} mentorPhone - Mentor's WhatsApp number
   * @param {string} clientName - Name of the client who enrolled
   * @param {number} amount - Payment amount
   */
  async sendMentorNewStudentAlert(mentorPhone, clientName, amount) {
    return await this.sendTemplateMessage(
      mentorPhone,
      'mentor_new_student',
      [clientName, String(amount)]
    );
  }

  /**
   * Validate WhatsApp phone number format
   * @param {string} phoneNumber - Phone number to validate
   */
  validatePhoneNumber(phoneNumber) {
    const cleanNumber = phoneNumber.replace(/[\s\-\(\)]/g, '');
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(cleanNumber);
  }
}

// Export singleton instance
const whatsappService = new WhatsAppService();
export default whatsappService;

// Named exports for specific functions
export const {
  sendTemplateMessage,
  sendTextMessage,
  sendAdminEnrollmentAlert,
  sendMentorNewStudentAlert,
  validatePhoneNumber
} = whatsappService;