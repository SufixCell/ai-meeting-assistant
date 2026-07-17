const axios = require("axios");

const API_URL = "https://api.meetingbaas.com/v2/bots";

async function joinMeeting(meetingUrl) {
    try {
        const response = await axios.post(
            API_URL,
            {
                meeting_url: meetingUrl,
                bot_name: "AI Meeting Assistant",
                recording_mode: "speaker_view",
                speech_to_text: {
                    provider: "Gladia"
                },
                reserved: false
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    "x-meeting-baas-api-key": process.env.MEETING_BAAS_API_KEY
                }
            }
        );

        return response.data;

    } catch (err) {
        console.error(err.response?.data || err.message);
        throw err;
    }
}

async function getBotStatus(botId) {
    try {
        const response = await axios.get(
            `${API_URL}/${botId}`,
            {
                headers: {
                    "x-meeting-baas-api-key": process.env.MEETING_BAAS_API_KEY
                }
            }
        );
        return response.data;
    } catch (err) {
        console.error("Error getting bot status:", err.response?.data || err.message);
        throw err;
    }
}

async function leaveMeeting(botId) {
    try {
        // According to MeetingBaaS API, DELETE removes the bot
        const response = await axios.delete(
            `${API_URL}/${botId}`,
            {
                headers: {
                    "x-meeting-baas-api-key": process.env.MEETING_BAAS_API_KEY
                }
            }
        );
        return response.data;
    } catch (err) {
        console.error("Error leaving meeting:", err.response?.data || err.message);
        // It might return 404 if the bot is already gone
        if (err.response?.status === 404) return { success: true };
        throw err;
    }
}

module.exports = {
    joinMeeting,
    getBotStatus,
    leaveMeeting
};