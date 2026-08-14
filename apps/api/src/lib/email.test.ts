import { describe, expect, it, vi } from 'vitest';

const sendMail = vi.fn().mockResolvedValue({ messageId: 'test' });
const createTransport = vi.fn(() => ({ sendMail }));
const createTestAccount = vi.fn().mockResolvedValue({
  user: 'user',
  pass: 'pass',
  smtp: { host: 'smtp.ethereal.email', port: 587, secure: false },
});

vi.mock('nodemailer', () => ({
  default: { createTransport, createTestAccount, getTestMessageUrl: () => null },
}));

describe('sendEmail', () => {
  it('falls back to a disposable Ethereal account when SMTP is not configured', async () => {
    const { sendEmail } = await import('./email.js');
    await sendEmail({ to: 'someone@test.com', subject: 'Hi', html: '<p>Hi</p>' });

    expect(createTestAccount).toHaveBeenCalled();
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'someone@test.com', subject: 'Hi', html: '<p>Hi</p>' }),
    );
  });
});
