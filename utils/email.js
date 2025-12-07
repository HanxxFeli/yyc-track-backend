/**
 * Email Utility
 * 
 * Handles sending emails using Nodemailer
 */

const nodeMailer = require('nodemailer');

/**
 * Create email transporter
 * handles how to send emails (mailman)
 */
const createTransporter = () => {
    return nodeMailer.createTransport({
        service: process.env.EMAIL_SERVICE,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        }
    })
}

/**
 * Send verification code email
 * @param {string} email - Recipient email
 * @param {string} code - 6-digit verification code
 */
const sendVerificationEmail = async (email, code) => { 
    const transporter = createTransporter(); 

    // create the email template with the email message (SIMPLIFIED FOR NOW)
    const mailOptions = { 
        from: process.env.EMAIL_FROM,
        to: email,
        subject: 'Verify Your Email - YYC-Track',
        html: `
        <div>
            <h2>Thank you for registering with YYC-TRACK!</h2>
            <p>Your verification code is: ${code}</p>
            <p>This code will expire in 10 minutes.</p>
             <p>If you didn't create an account, please ignore this email.</p>
        </div>`
    }

    try { 
        await transporter.sendMail(mailOptions)
        console.log(`Verification email sent to ${email}`)
    } 
    catch (error) { 
        console.error(`Error sending verification email: ${error.stack}`)
        throw new Error('Failed to send verfication email')
    }
}

/**
 * Send password reset email
 * @param {string} email - Recipient email
 * @param {string} resetToken - Password reset token
 */
const sendPasswordResetEmail = async (email, resetToken) => { 
    const transporter = createTransporter();

    // create reset password URL (frontend will handle the route)
    const resetURL = `${process.env.CLIENT_URL}/reset-password/${resetToken}`

    // create email template for password reset (SIMPLIFIED FOR NOW)
    const mailOptions = { 
        from: process.env.EMAIL_FROM,
        to: email, 
        subject: 'Password Reset Request - YYC-Track',
        html: `
        <div>
            <h2> Password Reset Request </h2>
            <p>You requested to reset your password for your YYC-TRACK account.</p>
            <p>Click the button below to reset your password:</p>
            <a href="${resetURL}"> Reset Password </a>
            <p>Or copy and paste this link into your browser:</p>
            <p>${resetURL}</p>
            <p><strong>This link will expire in 1 hour.</strong></p>
            <p>If you didn't request a password reset, please ignore this email and your password will remain unchanged.</p>
        </div>`
    }

    try { 
        await transporter.sendMail(mailOptions)
        console.log(`Password reset email sent to ${email}`)
    } 
    catch (error) { 
        console.error(`Error sending password reset email: '${error.stack}`);
        throw new Error('Failed to send password reset email');
    }
}

module.exports = { 
    sendVerificationEmail,
    sendPasswordResetEmail
}