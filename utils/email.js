const nodemailer = require('nodemailer');
//const { htmlToText } = require('html-to-text');
const pug = require('pug');
module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.userId = user.id;
    this.firstName = user.firstName;
    this.lastName = user.lastName;
    this.phone = user.phone;
    this.url = url;
    this.from = '"F&N Nomaroi" <noreply@nomaroi.com>';
  }

  newTransport() {
    if (process.env.NODE_ENV === 'production') {
      return nodemailer.createTransport({
        // service: 'gmail',
        // auth: {
        //   user: process.env.GMAIL_USERNAME,
        //   pass: process.env.GMAIL_PASSWORD,
        // },
        host: 'smtp.mailgun.org',
        port: 587,
        auth: {
          user: 'noreply@nomaroi.com',
          pass: '497583f6c5dde870da594d89f79c3989-0be3b63b-80881f24',
        },
        tls: {
          // do not fail on invalid certs
          rejectUnauthorized: false,
        },
      });
    }

    return nodemailer.createTransport({
      host: 'mail.fn.digisolution.co.th',
      port: 587,
      auth: {
        user: 'noreply@fn.digisolution.co.th',
        pass: 'Wmc12345',
      },
      tls: {
        // do not fail on invalid certs
        rejectUnauthorized: false,
      },
    });
  }

  // Send the actual email
  async send(template, subject, email) {
    // 1) Render HTML based on a pug template
    //console.log(__dirname);
    const html = pug.renderFile(
      `./email/${template}.pug`,
      {
        userId: this.userId,
        firstName: this.firstName,
        lastName: this.lastName,
        email: this.to,
        phone: this.phone,
        url: this.url,
      }
    );

    //const html = 'EMAIL';
    // 2) Define email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      //text: htmlToText(html),
    };

    // 3) Create a transport and send email
    await this.newTransport().sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.send('welcome', 'การสมัครสมาชิกของคุณเสร็จสิ้น | F&N Nomaroi','email');
  }

  async sendPasswordReset() {
    await this.send('resetpass','รีเซ็ตรหัสผ่านผู้ใช้งานของคุณ | F&N Nomaroi','email');
  }
};
