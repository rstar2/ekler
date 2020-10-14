const nodemailer = require('nodemailer');

const EMAIL_FROM = process.env.emailFrom || 'rumenn@qnext.com';

// when using Mailtrap - for testing purposes
// TODO: make all these be env variables
const transporter = nodemailer.createTransport({
  host: 'smtp.mailtrap.io',
  port: 2525,
  auth: {
    user: '7237f8f409f71d',
    pass: '0a4daec5d57731'
  }
});

// When using Gmail to send
// const transporter = nodemailer.createTransport({
//     service: 'gmail',
//     auth: {
//         user: 'yourgmailaccount@gmail.com',
//         pass: 'yourgmailaccpassword'
//     }
// });

// TODO: make all these be env variables
module.exports = {
  /**
   * Send a email to user's account email
   * @param {{id: String, email: String, receiveEmails: Boolean}} user
   * @param {{subject: String, text?:String, html?: String}} payload
   * @param {Boolean} dryRun
   */
  async sendEmail(user, payload) {
    const { id, email, receiveEmails = true } = user;

    if (!receiveEmails) return false;

    const { subject, text, html } = payload;

    if (!text && !html) throw new Error('Either text or html should be set');
    if (text && html) throw new Error('Either only text or only html should be set');

    console.log(`Send email to user ${id} - ${email}: ${subject}`);

    const mailOptions = {
      from: EMAIL_FROM,
      to: email,

      subject, //Email subject
      text, //Email content in plain text
      html //Email content in HTML
    };

    return transporter.sendMail(mailOptions);
  }
};
