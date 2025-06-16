const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const sendOtpEmail = async (toEmail, otp) => {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Foodify <noreply@egyw.tech>', 
      to: [toEmail], 
      subject: 'Kode Verifikasi Login Anda',
      html: `
        <div style="font-family: sans-serif; text-align: center;">
          <h2>Verifikasi Login</h2><br>
          <p>Gunakan kode berikut untuk menyelesaikan proses login Anda. Kode ini berlaku selama 10 menit.</p>
          <h1 style="letter-spacing: 5px; background-color: #f0f0f0; padding: 20px;">${otp}</h1><br>
          <p>Jika Anda tidak meminta kode ini, mohon abaikan email ini.</p>
        </div>
      `,
    });

    if (error) {
      console.error("Gagal mengirim email via Resend:", error);
      return false;
    }

    console.log("Email OTP berhasil dikirim via Resend ke:", toEmail);
    console.log("Resend Response (ID):", data.id);
    return true;

  } catch (error) {
    console.error("Terjadi exception saat mengirim email via Resend:", error);
    return false;
  }
};

module.exports = { sendOtpEmail };