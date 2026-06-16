import nodemailer from "nodemailer";
import { env } from "../config/env.js";

type MailResult = "sent" | "logged";

export class EmailService {
  isConfigured() {
    return Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS);
  }

  private getTransporter() {
    return nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE === "true",
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS?.replace(/\s+/g, "")
      }
    });
  }

  async sendWelcomeEmail(to: string, name: string): Promise<MailResult> {
    if (!this.isConfigured()) {
      if (env.NODE_ENV === "production") {
        throw new Error("SMTP is not configured");
      }
      console.warn("SMTP is not configured. Welcome email was not sent.");
      console.info(`Development welcome email for ${to}: Welcome to TripPlanner AI, ${name}.`);
      return "logged";
    }

    await this.getTransporter().sendMail({
      from: env.MAIL_FROM,
      to,
      subject: "Welcome to TripPlanner AI",
      text: [
        `Hi ${name},`,
        "",
        "Welcome to TripPlanner AI.",
        "You can now upload bookings, generate itineraries, and manage your travel plans in one place.",
        "",
        `Open your dashboard: ${env.CLIENT_URL}`,
        "",
        "Thanks,",
        "TripPlanner AI"
      ].join("\n"),
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a">
          <p>Hi ${name},</p>
          <p>Welcome to TripPlanner AI.</p>
          <p>You can now upload bookings, generate itineraries, and manage your travel plans in one place.</p>
          <p><a href="${env.CLIENT_URL}" style="display:inline-block;background:#2563eb;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none">Open dashboard</a></p>
          <p>Thanks,<br />TripPlanner AI</p>
        </div>
      `
    });

    return "sent";
  }

  async sendPasswordResetEmail(to: string, resetUrl: string): Promise<MailResult> {
    if (!this.isConfigured()) {
      if (env.NODE_ENV === "production") {
        throw new Error("SMTP is not configured");
      }
      console.warn("SMTP is not configured. Password reset email was not sent.");
      console.info(`Development password reset URL for ${to}: ${resetUrl}`);
      return "logged";
    }

    await this.getTransporter().sendMail({
      from: env.MAIL_FROM,
      to,
      subject: "Reset your TripPlanner AI password",
      text: [
        "Hi,",
        "",
        "We received a request to reset your TripPlanner AI password.",
        `Reset your password using this link: ${resetUrl}`,
        "",
        "This link expires in 30 minutes.",
        "If you did not request this, you can safely ignore this email."
      ].join("\n"),
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a">
          <p>Hi,</p>
          <p>We received a request to reset your TripPlanner AI password.</p>
          <p><a href="${resetUrl}" style="display:inline-block;background:#2563eb;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none">Reset password</a></p>
          <p>This link expires in 30 minutes.</p>
          <p>If you did not request this, you can safely ignore this email.</p>
        </div>
      `
    });

    return "sent";
  }
}
