
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

const sendBookingConfirmation = async ({ to, userName, bookingRef, eventTitle, eventDate, eventTime, venue, seats, totalAmount, qrCode }) => {
  const transporter = createTransporter();

  const seatsHtml = seats
    .map(
      (s) =>
        `<tr>
          <td style="padding:8px 12px;border-bottom:1px solid #333;">${s.seatNumber}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #333;text-transform:capitalize;">${s.category}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #333;">₹${s.price}</td>
        </tr>`
    )
    .join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Booking Confirmation</title>
    </head>
    <body style="margin:0;padding:0;background:#0f0f1a;font-family:'Segoe UI',Arial,sans-serif;">
      <div style="max-width:600px;margin:0 auto;background:#1a1a2e;border-radius:16px;overflow:hidden;margin-top:20px;">
        
        <!-- Header -->
        <div style="background:linear-gradient(135deg,#6c63ff,#e040fb);padding:40px 30px;text-align:center;">
          <h1 style="color:#fff;margin:0;font-size:28px;letter-spacing:1px;"> Booking Confirmed!</h1>
          <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;">Your tickets are ready</p>
        </div>

        <!-- Body -->
        <div style="padding:30px;">
          <p style="color:#e0e0e0;font-size:16px;">Hi <strong style="color:#a78bfa;">${userName}</strong>,</p>
          <p style="color:#b0b0c0;">Your booking has been confirmed! Here are your ticket details:</p>

          <!-- Booking Ref -->
          <div style="background:#0f0f1a;border:1px solid #6c63ff;border-radius:10px;padding:16px 20px;margin:20px 0;text-align:center;">
            <p style="color:#a0a0b0;margin:0 0 4px;font-size:12px;letter-spacing:2px;text-transform:uppercase;">Booking Reference</p>
            <h2 style="color:#6c63ff;margin:0;font-size:24px;letter-spacing:3px;">${bookingRef}</h2>
          </div>

          <!-- Event Details -->
          <table style="width:100%;border-collapse:collapse;margin:20px 0;">
            <tr>
              <td style="color:#a0a0b0;padding:8px 0;width:40%;"> Event</td>
              <td style="color:#e0e0e0;font-weight:600;">${eventTitle}</td>
            </tr>
            <tr>
              <td style="color:#a0a0b0;padding:8px 0;"> Date</td>
              <td style="color:#e0e0e0;">${new Date(eventDate).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td>
            </tr>
            <tr>
              <td style="color:#a0a0b0;padding:8px 0;"> Time</td>
              <td style="color:#e0e0e0;">${eventTime}</td>
            </tr>
            <tr>
              <td style="color:#a0a0b0;padding:8px 0;"> Venue</td>
              <td style="color:#e0e0e0;">${venue}</td>
            </tr>
          </table>

          <!-- Seats Table -->
          <h3 style="color:#a78bfa;margin:24px 0 12px;">Your Seats</h3>
          <table style="width:100%;border-collapse:collapse;background:#0f0f1a;border-radius:8px;overflow:hidden;">
            <thead>
              <tr style="background:#6c63ff20;">
                <th style="padding:10px 12px;color:#a78bfa;text-align:left;font-size:12px;letter-spacing:1px;">SEAT</th>
                <th style="padding:10px 12px;color:#a78bfa;text-align:left;font-size:12px;letter-spacing:1px;">CATEGORY</th>
                <th style="padding:10px 12px;color:#a78bfa;text-align:left;font-size:12px;letter-spacing:1px;">PRICE</th>
              </tr>
            </thead>
            <tbody style="color:#e0e0e0;">
              ${seatsHtml}
            </tbody>
            <tfoot>
              <tr style="background:#6c63ff20;">
                <td colspan="2" style="padding:12px;color:#a78bfa;font-weight:bold;">Total Amount</td>
                <td style="padding:12px;color:#e040fb;font-weight:bold;font-size:18px;">₹${totalAmount}</td>
              </tr>
            </tfoot>
          </table>

          <!-- QR Code -->
          <div style="text-align:center;margin:30px 0;padding:20px;background:#0f0f1a;border-radius:12px;">
            <p style="color:#a0a0b0;margin:0 0 16px;font-size:13px;">Show this QR code at the venue entrance</p>
            <img src="${qrCode}" alt="QR Code" style="width:200px;height:200px;border-radius:8px;background:#fff;padding:8px;" />
            <p style="color:#6c63ff;margin:12px 0 0;font-size:12px;">Ref: ${bookingRef}</p>
          </div>

          <!-- Footer note -->
          <p style="color:#606070;font-size:12px;text-align:center;margin-top:24px;">
            This is an automated confirmation. Please do not reply to this email.<br/>
            For support, visit our help center.
          </p>
        </div>

        <!-- Footer -->
        <div style="background:#0f0f1a;padding:20px;text-align:center;">
          <p style="color:#404060;font-size:12px;margin:0;">© 2024 TicketMaster. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'TicketMaster <noreply@ticketmaster.com>',
      to,
      subject: `✅ Booking Confirmed – ${eventTitle} (${bookingRef})`,
      html,
    });
    return true;
  } catch (error) {
    console.error('Email send error (booking confirmation):', error.message);
    return false;
  }
};

/**
 * Send waitlist offer email with time-limited booking link
 */
const sendWaitlistOffer = async ({ to, userName, eventTitle, eventDate, eventTime, venue, category, offerLink, expiresInMinutes }) => {
  const transporter = createTransporter();

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"><title>Seat Available – Act Fast!</title></head>
    <body style="margin:0;padding:0;background:#0f0f1a;font-family:'Segoe UI',Arial,sans-serif;">
      <div style="max-width:600px;margin:0 auto;background:#1a1a2e;border-radius:16px;overflow:hidden;margin-top:20px;">
        
        <!-- Header -->
        <div style="background:linear-gradient(135deg,#f59e0b,#ef4444);padding:40px 30px;text-align:center;">
          <h1 style="color:#fff;margin:0;font-size:28px;"> Seat Available!</h1>
          <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;">You're next on the waitlist – act now!</p>
        </div>

        <div style="padding:30px;">
          <p style="color:#e0e0e0;font-size:16px;">Hi <strong style="color:#fbbf24;">${userName}</strong>,</p>
          <p style="color:#b0b0c0;">Great news! A seat has become available for an event you're on the waitlist for.</p>

          <!-- Event Info -->
          <div style="background:#0f0f1a;border:1px solid #f59e0b;border-radius:10px;padding:20px;margin:20px 0;">
            <h3 style="color:#fbbf24;margin:0 0 12px;">${eventTitle}</h3>
            <p style="color:#c0c0d0;margin:4px 0;"> ${new Date(eventDate).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p style="color:#c0c0d0;margin:4px 0;"> ${eventTime}</p>
            <p style="color:#c0c0d0;margin:4px 0;"> ${venue}</p>
            <p style="color:#c0c0d0;margin:4px 0;"> Category: <strong style="color:#fbbf24;text-transform:capitalize;">${category}</strong></p>
          </div>

          <!-- Time Warning -->
          <div style="background:#ef444420;border:1px solid #ef4444;border-radius:10px;padding:16px;text-align:center;margin:20px 0;">
            <p style="color:#ef4444;margin:0;font-size:18px;font-weight:bold;"> This offer expires in ${expiresInMinutes} minutes!</p>
            <p style="color:#fca5a5;margin:8px 0 0;font-size:13px;">If you don't complete the booking in time, the seat will be offered to the next person in line.</p>
          </div>

          <!-- CTA Button -->
          <div style="text-align:center;margin:30px 0;">
            <a href="${offerLink}" style="display:inline-block;background:linear-gradient(135deg,#f59e0b,#ef4444);color:#fff;text-decoration:none;padding:16px 40px;border-radius:50px;font-size:18px;font-weight:bold;letter-spacing:1px;">
               Claim Your Seat Now
            </a>
          </div>

          <p style="color:#606070;font-size:12px;text-align:center;">
            If the button doesn't work, copy and paste this link into your browser:<br/>
            <a href="${offerLink}" style="color:#f59e0b;word-break:break-all;">${offerLink}</a>
          </p>
        </div>

        <div style="background:#0f0f1a;padding:20px;text-align:center;">
          <p style="color:#404060;font-size:12px;margin:0;">© 2024 TicketMaster. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'TicketMaster <noreply@ticketmaster.com>',
      to,
      subject: ` Seat Available – Book Now Before It Expires! (${eventTitle})`,
      html,
    });
    return true;
  } catch (error) {
    console.error('Email send error (waitlist offer):', error.message);
    return false;
  }
};

/**
 * Send booking cancellation confirmation
 */
const sendCancellationConfirmation = async ({ to, userName, bookingRef, eventTitle }) => {
  const transporter = createTransporter();

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"><title>Booking Cancelled</title></head>
    <body style="margin:0;padding:0;background:#0f0f1a;font-family:'Segoe UI',Arial,sans-serif;">
      <div style="max-width:600px;margin:0 auto;background:#1a1a2e;border-radius:16px;overflow:hidden;margin-top:20px;">
        <div style="background:linear-gradient(135deg,#6b7280,#374151);padding:40px 30px;text-align:center;">
          <h1 style="color:#fff;margin:0;font-size:28px;">Booking Cancelled</h1>
        </div>
        <div style="padding:30px;">
          <p style="color:#e0e0e0;">Hi <strong>${userName}</strong>,</p>
          <p style="color:#b0b0c0;">Your booking <strong style="color:#a78bfa;">${bookingRef}</strong> for <strong>${eventTitle}</strong> has been successfully cancelled.</p>
          <p style="color:#b0b0c0;">If you paid online, your refund will be processed within 5-7 business days.</p>
        </div>
        <div style="background:#0f0f1a;padding:20px;text-align:center;">
          <p style="color:#404060;font-size:12px;margin:0;">© 2024 TicketMaster. All rights reserved.</p>
        </div>
      </div>
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

export { sendBookingConfirmation,
  sendWaitlistOffer,
  sendCancellationConfirmation, };
