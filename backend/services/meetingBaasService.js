const axios = require("axios");

const API_URL = "https://api.meetingbaas.com/v2/bots";

async function joinMeeting(meetingUrl) {
    try {
        const payload = {
            meeting_url: meetingUrl,
            bot_name: "AI Meeting Assistant",
            recording_mode: "speaker_view",
            speech_to_text: {
                provider: "Default"
            },
            webhook_url: global.WEBHOOK_URL ? `${global.WEBHOOK_URL}/api/bot/webhook` : undefined,
            reserved: false
        };
        
        console.log("===============================================");
        console.log("MEETINGBAAS PAYLOAD REQUEST:");
        console.log(JSON.stringify(payload, null, 2));
        console.log("===============================================");

        const response = await axios.post(
            API_URL,
            payload,
            {
                headers: {
                    "Content-Type": "application/json",
                    "x-meeting-baas-api-key": process.env.MEETING_BAAS_API_KEY
                }
            }
        );

        console.log("===============================================");
        console.log("MEETINGBAAS CREATE RESPONSE:");
        console.log(JSON.stringify(response.data, null, 2));
        console.log("===============================================");

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
        console.log(`[MeetingBaaS Polling] Status for ${botId}: ${response.data?.data?.status}`);
        if (response.data?.data?.status === 'completed' || response.data?.data?.status === 'failed') {
            console.log("===============================================");
            console.log("MEETINGBAAS BOT COMPLETED/FAILED RESPONSE:");
            console.log(JSON.stringify(response.data, null, 2));
            console.log("===============================================");
        }
        return response.data;
    } catch (err) {
        console.error("Error getting bot status:", err.response?.data || err.message);
        throw err;
    }
}

async function leaveMeeting(botId) {
    const maxRetries = 3;
    let attempt = 0;
    
    while (attempt < maxRetries) {
        try {
            // First, check the bot's current status
            const statusRes = await getBotStatus(botId);
            const currentStatus = statusRes?.data?.status;
            
            console.log(`[Leave Request] Bot ${botId} status before leave: ${currentStatus}`);
            
            if (currentStatus === 'completed' || currentStatus === 'failed') {
                console.log(`[Leave Request] Bot already in final state (${currentStatus}). No need to leave.`);
                return { success: true, status: currentStatus };
            }
            
            // Try to leave
            const response = await axios.post(
                `${API_URL}/${botId}/leave`,
                {},
                {
                    headers: {
                        "x-meeting-baas-api-key": process.env.MEETING_BAAS_API_KEY
                    }
                }
            );
            return response.data;
        } catch (err) {
            console.error(`Error leaving meeting (Attempt ${attempt + 1}/${maxRetries}):`, err.response?.data || err.message);
            
            if (err.response?.status === 404) {
                return { success: true, reason: 'not_found' };
            }
            
            if (err.response?.status === 409) {
                // Conflict, likely a state transition. Wait and retry.
                attempt++;
                if (attempt < maxRetries) {
                    console.log(`Received 409 Conflict. Retrying in 2 seconds...`);
                    await new Promise(r => setTimeout(r, 2000));
                    continue;
                }
            }
            
            throw err;
        }
    }
}

module.exports = {
    joinMeeting,
    getBotStatus,
    leaveMeeting
};