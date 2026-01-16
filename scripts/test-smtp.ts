import nodemailer from 'nodemailer'
import dotenv from 'dotenv'
import path from 'path'

// Load .env from the api directory
dotenv.config({ path: path.join(__dirname, '../apps/api/.env') })

async function main() {
  console.log('Testing SMTP connection for:', process.env.MAIL_HOST)
  
  const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: parseInt(process.env.MAIL_PORT || '465'),
    secure: process.env.MAIL_PORT === '465', // true for 465, false for other ports
    auth: {
      user: process.env.MAIL_USERNAME || process.env.MAIL_USER,
      pass: process.env.MAIL_PASSWORD,
    },
    debug: true, // show debug output
    logger: true, // log information in console
  })

  try {
    await transporter.verify()
    console.log('✅ Connection has been established successfully.')
    
    // Test send
    await transporter.sendMail({
      from: process.env.MAIL_FROM,
      to: process.env.MAIL_FROM, // Send to self
      subject: 'SMTP Test',
      text: 'SMTP connection is working!',
    })
    console.log('✅ Test email sent successfully.')
  } catch (error) {
    console.error('❌ SMTP Connection Error:')
    console.dir(error, { depth: null })
  }
}

main()
