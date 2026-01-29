import { requestForToken } from "../firebase";
import API_BASE_URL from "../config";

export const registerForPush = async (username) => {
    if (!username) {
        console.warn("registerForPush called without username");
        return;
    }

    try {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
            console.log("Notification permission denied by user.");
            return;
        }

        const token = await requestForToken();
        if (!token) {
            console.log("No FCM token generated.");
            return;
        }

        console.log("🔥 FCM TOKEN:", token);

        // Send to backend
        const response = await fetch(`${API_BASE_URL}/api/users/save-fcm-token`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ username, token })
        });

        if (response.ok) {
            console.log("✅ FCM Token saved to backend");
        } else {
            console.error("❌ Failed to save FCM token output:", await response.text());
        }

    } catch (error) {
        console.error("Error registering for push:", error);
    }
};
