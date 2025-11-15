import admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FB_PROJECT_ID,
      clientEmail: process.env.FB_CLIENT_EMAIL,
      privateKey: process.env.FB_PRIVATE_KEY.replace(/\\n/g, "\n")
    }),
    databaseURL: "https://led2-a60fb-default-rtdb.firebaseio.com"
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { led, status } = req.body;
  if (!led || !status) return res.status(400).json({ error: "Missing parameters" });

  try {
    await admin.database().ref(`/leds/${led}/status`).set(status);
    res.status(200).json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
