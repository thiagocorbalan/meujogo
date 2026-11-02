export function testEmail(
  key: string,
  provider: string,
): { success: boolean; message: string } {
  const upperProvider = provider.toUpperCase();

  if (upperProvider === 'SENDGRID') {
    if (key.startsWith('SG.')) {
      return { success: true, message: 'SendGrid API key format is valid' };
    }
    return {
      success: false,
      message: 'Invalid SendGrid API key format (must start with SG.)',
    };
  }

  if (upperProvider === 'RESEND') {
    if (key.startsWith('re_')) {
      return { success: true, message: 'Resend API key format is valid' };
    }
    return {
      success: false,
      message: 'Invalid Resend API key format (must start with re_)',
    };
  }

  // Generic validation: key must be non-empty
  if (key.length > 0) {
    return { success: true, message: 'Email key format appears valid' };
  }

  return { success: false, message: 'Empty email API key' };
}
