import nodemailer from 'nodemailer';

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_PORT === '465',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

const sendBookingConfirmation = async ({ to, userName, bookingRef, eventTitle, eventDate, eventTime, venue, seats, subtotal, convenienceFee, totalAmount, qrCode }) => {
  const transporter = createTransporter();

  const seatsHtml = seats
    .map(
      (s) =>
        `<tr>
          <td style="padding:12px;border-bottom:1px solid #333;color:#e0e0e0;font-size:14px;">${s.seatNumber}</td>
          <td style="padding:12px;border-bottom:1px solid #333;color:#e0e0e0;text-transform:capitalize;font-size:14px;">${s.category}</td>
          <td style="padding:12px;border-bottom:1px solid #333;color:#e0e0e0;font-size:14px;">₹${s.price}</td>
        </tr>`
    )
    .join('');

  // Extract base64 part
  const base64Data = qrCode ? qrCode.split(';base64,').pop() : '';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Booking Confirmation</title>
      <style>
        body { margin:0; padding:0; background-color:#0f0f1a; font-family:'Segoe UI',Arial,sans-serif; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }
        table { border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt; }
        img { -ms-interpolation-mode:bicubic; border:0; height:auto; line-height:100%; outline:none; text-decoration:none; display:block; }
      </style>
    </head>
    <body style="margin:0;padding:0;background-color:#0f0f1a;width:100% !important;">
      <table width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#0f0f1a" style="width:100%;background-color:#0f0f1a;margin:0;padding:0;">
        <tr>
          <td align="center" style="padding:20px 10px;">
            
            <table border="0" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background-color:#1a1a2e;border-radius:16px;overflow:hidden;">
              
              <!-- Header -->
              <tr>
                <td align="center" style="background:linear-gradient(135deg,#6c63ff,#e040fb);padding:40px 30px;">
                  <h1 style="color:#ffffff;margin:0;font-size:28px;letter-spacing:1px;font-family:Arial,sans-serif;">Booking Confirmed!</h1>
                  <p style="color:#f3e8ff;margin:8px 0 0;font-size:16px;font-family:Arial,sans-serif;">Your tickets are ready</p>
                </td>
              </tr>
              
              <!-- Body -->
              <tr>
                <td style="padding:30px;">
                  <p style="color:#e0e0e0;font-size:16px;margin:0 0 10px;font-family:Arial,sans-serif;">Hi <strong style="color:#a78bfa;">${userName}</strong>,</p>
                  <p style="color:#b0b0c0;font-size:15px;line-height:1.5;margin:0 0 20px;font-family:Arial,sans-serif;">Your booking has been confirmed! Here are your ticket details:</p>

                  <!-- Booking Ref -->
                  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#0f0f1a;border:1px solid #6c63ff;border-radius:10px;margin-bottom:20px;">
                    <tr>
                      <td align="center" style="padding:16px 20px;">
                        <p style="color:#a0a0b0;margin:0 0 6px;font-size:12px;letter-spacing:2px;text-transform:uppercase;font-family:Arial,sans-serif;">Booking Reference</p>
                        <h2 style="color:#6c63ff;margin:0;font-size:24px;letter-spacing:3px;font-family:Arial,sans-serif;">${bookingRef}</h2>
                      </td>
                    </tr>
                  </table>

                  <!-- Event Details -->
                  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:24px;">
                    <tr>
                      <td style="color:#a0a0b0;padding:8px 0;width:35%;font-family:Arial,sans-serif;font-size:15px;">Event</td>
                      <td style="color:#e0e0e0;font-weight:600;font-family:Arial,sans-serif;font-size:15px;">${eventTitle}</td>
                    </tr>
                    <tr>
                      <td style="color:#a0a0b0;padding:8px 0;font-family:Arial,sans-serif;font-size:15px;">Date</td>
                      <td style="color:#e0e0e0;font-family:Arial,sans-serif;font-size:15px;">${new Date(eventDate).toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</td>
                    </tr>
                    <tr>
                      <td style="color:#a0a0b0;padding:8px 0;font-family:Arial,sans-serif;font-size:15px;">Time</td>
                      <td style="color:#e0e0e0;font-family:Arial,sans-serif;font-size:15px;">${eventTime}</td>
                    </tr>
                    <tr>
                      <td style="color:#a0a0b0;padding:8px 0;font-family:Arial,sans-serif;font-size:15px;">Venue</td>
                      <td style="color:#e0e0e0;font-family:Arial,sans-serif;font-size:15px;">${venue}</td>
                    </tr>
                  </table>

                  <!-- Seats Table -->
                  <h3 style="color:#a78bfa;margin:0 0 12px;font-family:Arial,sans-serif;font-size:18px;">Your Seats</h3>
                  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#0f0f1a;border-radius:8px;overflow:hidden;border:1px solid #333;">
                    <tr>
                      <td style="padding:12px;background-color:#1e1e38;color:#a78bfa;font-size:12px;letter-spacing:1px;font-family:Arial,sans-serif;text-transform:uppercase;font-weight:bold;">Seat</td>
                      <td style="padding:12px;background-color:#1e1e38;color:#a78bfa;font-size:12px;letter-spacing:1px;font-family:Arial,sans-serif;text-transform:uppercase;font-weight:bold;">Category</td>
                      <td style="padding:12px;background-color:#1e1e38;color:#a78bfa;font-size:12px;letter-spacing:1px;font-family:Arial,sans-serif;text-transform:uppercase;font-weight:bold;">Price</td>
                    </tr>
                    ${seatsHtml}
                    <tr>
                      <td colspan="2" align="right" style="padding:12px 12px 4px;color:#a0a0b0;font-family:Arial,sans-serif;background-color:#1e1e38;font-size:14px;">Subtotal:</td>
                      <td style="padding:12px 12px 4px;color:#e0e0e0;font-family:Arial,sans-serif;background-color:#1e1e38;font-size:14px;">₹${subtotal}</td>
                    </tr>
                    <tr>
                      <td colspan="2" align="right" style="padding:4px 12px 12px;color:#a0a0b0;font-family:Arial,sans-serif;background-color:#1e1e38;font-size:14px;">Convenience Fee (2%):</td>
                      <td style="padding:4px 12px 12px;color:#e0e0e0;font-family:Arial,sans-serif;background-color:#1e1e38;font-size:14px;">₹${convenienceFee}</td>
                    </tr>
                    <tr>
                      <td colspan="2" align="right" style="padding:16px 12px;color:#a78bfa;font-weight:bold;font-family:Arial,sans-serif;background-color:#1e1e38;font-size:16px;border-top:1px solid #333;">Total Paid:</td>
                      <td style="padding:16px 12px;color:#e040fb;font-weight:bold;font-size:18px;font-family:Arial,sans-serif;background-color:#1e1e38;border-top:1px solid #333;">₹${totalAmount}</td>
                    </tr>
                  </table>

                  <!-- QR Code -->
                  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top:30px;background-color:#0f0f1a;border-radius:12px;">
                    <tr>
                      <td align="center" style="padding:24px;">
                        <p style="color:#a0a0b0;margin:0 0 16px;font-size:14px;font-family:Arial,sans-serif;">Show this QR code at the venue entrance</p>
                        <table border="0" cellpadding="0" cellspacing="0" align="center" style="background-color:#ffffff;border-radius:8px;">
                          <tr>
                            <td style="padding:12px;">
                              <img src="cid:qrcode" alt="QR Code" width="180" height="180" style="display:block;width:180px;height:180px;border:0;" />
                            </td>
                          </tr>
                        </table>
                        <p style="color:#6c63ff;margin:16px 0 0;font-size:13px;font-family:Arial,sans-serif;letter-spacing:1px;">REF: ${bookingRef}</p>
                      </td>
                    </tr>
                  </table>

                  <!-- Footer note -->
                  <p style="color:#606070;font-size:13px;text-align:center;margin:30px 0 0;font-family:Arial,sans-serif;line-height:1.5;">
                    This is an automated confirmation. Please do not reply to this email.<br/>
                    For support, visit our help center.
                  </p>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td align="center" style="background-color:#0f0f1a;padding:20px;">
                  <p style="color:#404060;font-size:13px;margin:0;font-family:Arial,sans-serif;">© 2026 TicketMaster. All rights reserved.</p>
                </td>
              </tr>
            </table>
            
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'TicketMaster <noreply@ticketmaster.com>',
      to,
      subject: `✅ Booking Confirmed – ${eventTitle} (${bookingRef})`,
      html,
    };

    if (base64Data) {
      mailOptions.attachments = [
        {
          filename: 'qrcode.png',
          content: base64Data,
          encoding: 'base64',
          cid: 'qrcode',
        },
      ];
    }

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Email send error (booking confirmation):', error.message);
    return false;
  }
};

const sendWaitlistOffer = async ({ to, userName, eventTitle, eventDate, eventTime, venue, category, offerLink, expiresInMinutes }) => {
  const transporter = createTransporter();

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Seat Available – Act Fast!</title>
    </head>
    <body style="margin:0;padding:0;background-color:#0f0f1a;width:100% !important;">
      <table width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#0f0f1a" style="width:100%;background-color:#0f0f1a;margin:0;padding:0;">
        <tr>
          <td align="center" style="padding:20px 10px;">
            <table border="0" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background-color:#1a1a2e;border-radius:16px;overflow:hidden;">
              <tr>
                <td align="center" style="background:linear-gradient(135deg,#f59e0b,#ef4444);padding:40px 30px;">
                  <h1 style="color:#ffffff;margin:0;font-size:28px;font-family:Arial,sans-serif;">Seat Available!</h1>
                  <p style="color:#ffedd5;margin:8px 0 0;font-size:16px;font-family:Arial,sans-serif;">You're next on the waitlist – act now!</p>
                </td>
              </tr>
              <tr>
                <td style="padding:30px;">
                  <p style="color:#e0e0e0;font-size:16px;margin:0 0 10px;font-family:Arial,sans-serif;">Hi <strong style="color:#fbbf24;">${userName}</strong>,</p>
                  <p style="color:#b0b0c0;font-size:15px;line-height:1.5;margin:0 0 24px;font-family:Arial,sans-serif;">Great news! A seat has become available for an event you're on the waitlist for.</p>
                  
                  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#0f0f1a;border:1px solid #f59e0b;border-radius:10px;margin-bottom:24px;">
                    <tr>
                      <td style="padding:20px;">
                        <h3 style="color:#fbbf24;margin:0 0 12px;font-family:Arial,sans-serif;font-size:18px;">${eventTitle}</h3>
                        <p style="color:#c0c0d0;margin:4px 0;font-family:Arial,sans-serif;font-size:14px;">${new Date(eventDate).toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</p>
                        <p style="color:#c0c0d0;margin:4px 0;font-family:Arial,sans-serif;font-size:14px;">${eventTime}</p>
                        <p style="color:#c0c0d0;margin:4px 0;font-family:Arial,sans-serif;font-size:14px;">${venue}</p>
                        <p style="color:#c0c0d0;margin:8px 0 0;font-family:Arial,sans-serif;font-size:14px;">Category: <strong style="color:#fbbf24;text-transform:capitalize;">${category}</strong></p>
                      </td>
                    </tr>
                  </table>
                  
                  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#2a1111;border:1px solid #ef4444;border-radius:10px;margin-bottom:30px;">
                    <tr>
                      <td align="center" style="padding:16px;">
                        <p style="color:#ef4444;margin:0;font-size:18px;font-weight:bold;font-family:Arial,sans-serif;">This offer expires in ${expiresInMinutes} minutes!</p>
                        <p style="color:#fca5a5;margin:8px 0 0;font-size:13px;font-family:Arial,sans-serif;">If you don't complete the booking in time, the seat will be offered to the next person in line.</p>
                      </td>
                    </tr>
                  </table>
                  
                  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:24px;">
                    <tr>
                      <td align="center">
                        <a href="${offerLink}" style="display:inline-block;background:#f59e0b;color:#ffffff;text-decoration:none;padding:16px 40px;border-radius:50px;font-size:16px;font-weight:bold;letter-spacing:1px;font-family:Arial,sans-serif;">Claim Your Seat Now</a>
                      </td>
                    </tr>
                  </table>
                  
                  <p style="color:#606070;font-size:13px;text-align:center;font-family:Arial,sans-serif;line-height:1.5;">
                    If the button doesn't work, copy and paste this link:<br/>
                    <a href="${offerLink}" style="color:#f59e0b;word-break:break-all;">${offerLink}</a>
                  </p>
                </td>
              </tr>
              <tr>
                <td align="center" style="background-color:#0f0f1a;padding:20px;">
                  <p style="color:#404060;font-size:13px;margin:0;font-family:Arial,sans-serif;">© 2026 TicketMaster. All rights reserved.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'TicketMaster <noreply@ticketmaster.com>',
      to,
      subject: `Seat Available – Book Now Before It Expires! (${eventTitle})`,
      html,
    });
    return true;
  } catch (error) {
    console.error('Email send error (waitlist offer):', error.message);
    return false;
  }
};

const sendCancellationConfirmation = async ({ to, userName, bookingRef, eventTitle }) => {
  const transporter = createTransporter();

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Booking Cancelled</title>
    </head>
    <body style="margin:0;padding:0;background-color:#0f0f1a;width:100% !important;">
      <table width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#0f0f1a" style="width:100%;background-color:#0f0f1a;margin:0;padding:0;">
        <tr>
          <td align="center" style="padding:20px 10px;">
            <table border="0" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background-color:#1a1a2e;border-radius:16px;overflow:hidden;">
              <tr>
                <td align="center" style="background:linear-gradient(135deg,#6b7280,#374151);padding:40px 30px;">
                  <h1 style="color:#ffffff;margin:0;font-size:28px;font-family:Arial,sans-serif;">Booking Cancelled</h1>
                </td>
              </tr>
              <tr>
                <td style="padding:30px;">
                  <p style="color:#e0e0e0;font-size:16px;margin:0 0 10px;font-family:Arial,sans-serif;">Hi <strong>${userName}</strong>,</p>
                  <p style="color:#b0b0c0;font-size:15px;line-height:1.5;margin:0 0 10px;font-family:Arial,sans-serif;">Your booking <strong style="color:#a78bfa;">${bookingRef}</strong> for <strong>${eventTitle}</strong> has been successfully cancelled.</p>
                  <p style="color:#b0b0c0;font-size:15px;line-height:1.5;margin:0 0 10px;font-family:Arial,sans-serif;">If you paid online, your refund will be processed within 5-7 business days.</p>
                </td>
              </tr>
              <tr>
                <td align="center" style="background-color:#0f0f1a;padding:20px;">
                  <p style="color:#404060;font-size:13px;margin:0;font-family:Arial,sans-serif;">© 2026 TicketMaster. All rights reserved.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'TicketMaster <noreply@ticketmaster.com>',
      to,
      subject: `Booking Cancelled – ${bookingRef}`,
      html,
    });
    return true;
  } catch (error) {
    console.error('Email send error (cancellation):', error.message);
    return false;
  }
};

export { sendBookingConfirmation, sendWaitlistOffer, sendCancellationConfirmation };
