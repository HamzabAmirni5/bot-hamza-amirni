const axios = require("axios");
const { sendWithChannelButton } = require("../lib/channelButton");
const settings = require("../settings");
const { t } = require("../lib/language");

function getWeatherEmoji(weather) {
    const map = {
        Thunderstorm: "⛈️",
        Drizzle: "🌦️",
        Rain: "🌧️",
        Snow: "❄️",
        Mist: "🌫️",
        Smoke: "💨",
        Haze: "🌫️",
        Dust: "🌪️",
        Fog: "🌫️",
        Sand: "🏜️",
        Ash: "🌋",
        Squall: "💨",
        Tornado: "🌪️",
        Clear: "☀️",
        Clouds: "☁️"
    };
    return map[weather] || "🌍";
}

module.exports = async function weatherCommand(sock, chatId, msg, args) {
    try {
        const city = args.join(' ').trim();

        if (!city) {
            const helpMsg = t('weather.help', { prefix: settings.prefix }) + `\n\n⚔️ ${settings.botName}`;
            return await sendWithChannelButton(sock, chatId, helpMsg, msg);
        }

        await sendWithChannelButton(sock, chatId, t('weather.fetching', { city }), msg);

        const apiUrl = `https://apis.davidcyriltech.my.id/weather?city=${encodeURIComponent(city)}`;
        const response = await axios.get(apiUrl);
        const w = response.data;

        if (!w.success || !w.data) {
            return await sendWithChannelButton(sock, chatId, t('weather.not_found', { city }), msg);
        }

        const d = w.data;
        const emoji = getWeatherEmoji(d.weather);

        const weatherText = t('weather.result', {
            location: d.location,
            country: d.country,
            temp: d.temperature,
            feels_like: d.feels_like,
            val_emoji: emoji,
            desc: d.description,
            humidity: d.humidity,
            wind: d.wind_speed,
            pressure: d.pressure,
            time: new Date().toLocaleTimeString('ar-MA')
        }) + `\n⚔️ ${settings.botName}`;

        await sock.sendMessage(chatId, { text: weatherText }, { quoted: msg });

    } catch (error) {
        console.error("Error fetching weather:", error);
        await sendWithChannelButton(sock, chatId, t('weather.error'), msg);
    }
};
