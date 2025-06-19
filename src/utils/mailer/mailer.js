const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const sendOtpEmail = async (toEmail, otp, activity) => {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Foodify <noreply@egyw.tech>', 
      to: [toEmail], 
      subject: `Kode Verifikasi ${activity} Anda`,
      html: `
        <div style="font-family: sans-serif; text-align: center;">
          <h2>Verifikasi ${activity}</h2><br>
          <p>Gunakan kode berikut untuk menyelesaikan proses ${activity.toLowerCase()} Anda. Kode ini berlaku selama 3 menit.</p>
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

const sendCommentNotifier = async(toEmail, owner, commenter, recipeName, comment, rating) => {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Foodify <noreply@egyw.tech>', 
      to: [toEmail], 
      subject: `Resep Anda "${recipeName}" Mendapat Komentar Baru!`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; background-color: #fffbe6; border: 1px solid #ffe58f; border-radius: 8px; max-width: 600px; margin: auto;">
          <h2 style="color: #fa8c16;">Resep Anda Mendapat Komentar Baru! 🍽️</h2>
          <p>Halo, ${owner}</p>
          <p><strong>${commenter}</strong> baru saja memberikan komentar pada resep Anda: <strong>"${recipeName}"</strong>.</p>
          
          <div style="background-color: #fafafa; border-left: 4px solid #faad14; padding: 15px; margin: 20px 0; border-radius: 6px;">
            <p style="margin: 0;"><em>"${comment}"</em></p>
            <p style="margin: 5px 0 0 0;">⭐ Rating: <strong>${rating}/5</strong></p>
          </div>

          <p>Terima kasih telah membagikan resep Anda di <strong>Foodify</strong>. Semakin banyak yang suka, semakin banyak yang mencoba!</p><br>

          <p style="color: #999; font-size: 12px;">Email ini dikirim otomatis oleh sistem. Jangan balas ke alamat ini.</p>
        </div>
      `,
    });

    if (error) {
      console.error("Gagal mengirim email via Resend:", error);
      return false;
    }

    console.log("Notifikasi email berhasil dikirim via Resend ke:", toEmail);
    console.log("Resend Response (ID):", data.id);
    return true;

  } catch (error) {
    console.error("Terjadi exception saat mengirim email via Resend:", error);
    return false;
  }
};

module.exports = { 
  sendOtpEmail,
  sendCommentNotifier,
};