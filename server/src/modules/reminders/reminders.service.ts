import { prisma } from "../../lib/prisma.js";

// Bonus feature: email reminders for expiring driver licenses.
// If SMTP env vars are configured, sends real email via nodemailer.
// Otherwise falls back to a console log so the hackathon demo never breaks on missing credentials.

export interface ExpiringLicense {
  driverId: number;
  name: string;
  licenseNumber: string;
  licenseExpiry: Date;
  daysLeft: number;
  contact: string;
}

export async function findExpiringLicenses(withinDays = 30): Promise<ExpiringLicense[]> {
  const now = new Date();
  const cutoff = new Date(now.getTime() + withinDays * 24 * 60 * 60 * 1000);
  const drivers = await prisma.driver.findMany({
    where: { licenseExpiry: { lte: cutoff } },
    orderBy: { licenseExpiry: "asc" },
  });
  return drivers.map((d) => ({
    driverId: d.id,
    name: d.name,
    licenseNumber: d.licenseNumber,
    licenseExpiry: d.licenseExpiry,
    daysLeft: Math.ceil((d.licenseExpiry.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)),
    contact: d.contact,
  }));
}

async function sendEmail(to: string, subject: string, body: string) {
  const host = process.env.SMTP_HOST;
  if (!host) {
    // No SMTP configured — safe fallback for hackathon/demo.
    console.log(`[reminder-email:simulated] to=${to} subject="${subject}"\n${body}`);
    return { simulated: true };
  }
  const nodemailer = await import("nodemailer");
  const transporter = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: false,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  });
  await transporter.sendMail({ from: process.env.SMTP_FROM ?? "TransitOps <noreply@transitops.local>", to, subject, text: body });
  return { simulated: false };
}

export async function sendExpiryReminders(withinDays = 30) {
  const expiring = await findExpiringLicenses(withinDays);
  const results = [];
  for (const d of expiring) {
    const subject = `License expiry reminder — ${d.name}`;
    const body = `Driver ${d.name} (license ${d.licenseNumber}) expires in ${d.daysLeft} day(s) on ${d.licenseExpiry.toDateString()}. Please renew.`;
    // In a real system we'd email the driver/admin; here we notify the ops inbox.
    const to = process.env.REMINDER_TO ?? "fleet-ops@transitops.local";
    const result = await sendEmail(to, subject, body);
    results.push({ driver: d.name, licenseNumber: d.licenseNumber, daysLeft: d.daysLeft, ...result });
  }
  return results;
}
