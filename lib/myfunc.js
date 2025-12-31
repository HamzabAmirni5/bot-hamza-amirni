const axios = require('axios');
const crypto = require('crypto');
const path = require('path');
const { tmpdir } = require('os');
const fs = require('fs');
const ff = require('fluent-ffmpeg');
const webp = require('node-webpmux');

/**
 * Fetch buffer from URL with optimized headers
 * @param {string} url 
 * @param {object} options 
 */
async function fetchBuffer(url, options = {}) {
    try {
        const res = await axios({
            method: "GET",
            url,
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.70 Safari/537.36",
                'DNT': 1,
                'Upgrade-Insecure-Requests': 1
            },
            ...options,
            responseType: 'arraybuffer'
        });
        return res.data;
    } catch (err) {
        throw err;
    }
}

/**
 * Fetch JSON from URL
 * @param {string} url 
 * @param {object} options 
 */
async function fetchJson(url, options = {}) {
    try {
        const res = await axios({
            method: 'GET',
            url: url,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.69 Safari/537.36'
            },
            ...options
        });
        return res.data;
    } catch (err) {
        throw err;
    }
}

/**
 * Optimized sleep function
 * @param {number} ms 
 */
const sleep = async (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Get random item from array
 * @param {array} list 
 */
function getRandom(list) {
    return list[Math.floor(Math.random() * list.length)];
}

/**
 * Format bytes to readable size
 * @param {number} bytes 
 * @param {boolean} si 
 */
function formatSize(bytes, si = true) {
    const thresh = si ? 1000 : 1024;
    if (Math.abs(bytes) < thresh) return bytes + ' B';
    const units = si
        ? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
        : ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
    let u = -1;
    const r = 10 ** 2;
    do {
        bytes /= thresh;
        ++u;
    } while (Math.round(Math.abs(bytes) * r) / r >= thresh && u < units.length - 1);
    return bytes.toFixed(2) + ' ' + units[u];
}

module.exports = {
    fetchJson,
    fetchBuffer,
    sleep,
    getRandom,
    formatSize
};
