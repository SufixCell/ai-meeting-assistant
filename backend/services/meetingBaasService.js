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
                    provider: "Default"
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

module.exports = {
    joinMeeting
};