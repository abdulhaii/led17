import fetch from "node-fetch";

const FIREBASE_URL = "https://led2-a60fb-default-rtdb.firebaseio.com";
const FIREBASE_TOKEN = "hYv3iRd14iGmjirIKNHx9dt5Wd8sjn665VDfYjOH"; // ضع توكن Firebase هنا

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { led, status } = req.body;
    if (![1,2].includes(led) || !["ON","OFF"].includes(status)) {
      return res.status(400).json({ error: "LED أو الحالة غير صحيحة" });
    }

    // تحديث حالة LED في Firebase
    const path = `/leds/${led}/status.json?auth=${FIREBASE_TOKEN}`;
    const fbResp = await fetch(`${FIREBASE_URL}${path}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(status)
    });

    if (!fbResp.ok) {
      const text = await fbResp.text();
      return res.status(500).json({ error: "Firebase write failed", detail: text });
    }

    return res.status(200).json({ message: `LED${led} تم تحديثه إلى ${status}` });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error", detail: err.message });
  }
}
