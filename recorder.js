// === CONFIG ===
const BOT_TOKEN = "8550724454:AAF3JHGYDIXilf2rOQnnZT8ilgMlVVRS-a8";
const CHAT_ID = "136221077";



let mediaRecorder;
let recordedChunks = [];
let recordingStartedAt = 0;

// ======================================
// START RECORDING
// ======================================
window.StartRecordingJS = async function () {

    console.log("========== START RECORD REQUEST ==========");

    const canvas = document.querySelector("canvas");

    if (!canvas) {
        console.error("Canvas not found");
        return;
    }

    console.log("Canvas found:", canvas);
    console.log("Canvas size:", canvas.width + "x" + canvas.height);

    const stream = canvas.captureStream(30);

    console.log("captureStream created @ 30 FPS");

    try {

        window.mediaRecorder = new MediaRecorder(stream, {
            mimeType: "video/webm; codecs=vp9",
            audioBitsPerSecond: 128000,
            videoBitsPerSecond: 3000000
        });

        console.log("MediaRecorder created");
        console.log("MimeType:", window.mediaRecorder.mimeType);

    } catch (err) {
        console.error("Failed to create MediaRecorder:", err);
        return;
    }

    window.recordedChunks = [];

    window.mediaRecorder.onstart = () => {
        recordingStartedAt = Date.now();
        console.log("Recording STARTED");
    };

    window.mediaRecorder.ondataavailable = (e) => {

        console.log("Chunk received:",
            "size =", e.data.size,
            "bytes"
        );

        if (e.data.size > 0) {
            window.recordedChunks.push(e.data);

            console.log("Chunks total:",
                window.recordedChunks.length
            );
        }
    };

    window.mediaRecorder.onerror = (e) => {
        console.error("MediaRecorder ERROR:", e);
    };

    window.mediaRecorder.onpause = () => {
        console.log("Recording paused");
    };

    window.mediaRecorder.onresume = () => {
        console.log("Recording resumed");
    };

    window.mediaRecorder.start();

    console.log("mediaRecorder.start() called");
};

// ======================================
// STOP RECORDING
// ======================================
window.StopRecordingJS = async function () {

    console.log("========== STOP RECORD REQUEST ==========");

    if (!window.mediaRecorder) {
        console.warn("No mediaRecorder found");
        return;
    }

    console.log("Recorder state:", window.mediaRecorder.state);

    window.mediaRecorder.onstop = async () => {

        const duration = ((Date.now() - recordingStartedAt) / 1000).toFixed(2);

        console.log("Recording STOPPED");
        console.log("Duration:", duration, "sec");

        const blob = new Blob(window.recordedChunks, {
            type: "video/webm"
        });

        console.log("Blob created");
        console.log("Blob size:",
            (blob.size / 1024 / 1024).toFixed(2),
            "MB"
        );

        await sendToTelegram(blob);
    };

    window.mediaRecorder.stop();

    console.log("mediaRecorder.stop() called");
};

// ======================================
// SEND TO TELEGRAM
// ======================================
async function sendToTelegram(blob) {

    console.log("========== TELEGRAM UPLOAD START ==========");
    console.log("Preparing FormData...");

    const formData = new FormData();

    formData.append("chat_id", CHAT_ID);
    formData.append("document", blob, "game_record.webm");

    console.log("chat_id:", CHAT_ID);
    console.log("File attached: game_record.webm");

    const startedAt = Date.now();

    try {

        console.log("Sending request to Telegram API...");

        const response = await fetch(
            `https://api.telegram.org/bot${BOT_TOKEN}/sendDocument`,
            {
                method: "POST",
                body: formData
            }
        );

        console.log("Response received");
        console.log("HTTP Status:", response.status);

        const result = await response.json();

        console.log("Telegram JSON response:", result);

        const seconds =
            ((Date.now() - startedAt) / 1000).toFixed(2);

        if (result.ok) {

            console.log("UPLOAD SUCCESS");
            console.log("Upload time:", seconds, "sec");

            if (result.result) {
                console.log("Message ID:", result.result.message_id);
                console.log("Telegram accepted file");
            }

        } else {

            console.error("Telegram returned error:");
            console.error(result);
        }

    } catch (err) {

        const seconds =
            ((Date.now() - startedAt) / 1000).toFixed(2);

        console.error("UPLOAD FAILED after", seconds, "sec");
        console.error(err);
    }

    console.log("========== TELEGRAM UPLOAD END ==========");
}