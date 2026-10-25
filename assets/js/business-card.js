window.lotus = window.lotus || {};

window.lotus.businessCard = (() => {
    const lighten = (hex, amount) => {
        const n = parseInt(hex.slice(1), 16);
        let r = (n >> 16) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h = 0, s = 0, l = (max + min) / 2;
        if (max !== min) {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
            h /= 6;
        }
        l = Math.min(1, l + amount);
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };
        if (s === 0) {
            r = g = b = l;
        } else {
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1 / 3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1 / 3);
        }
        return '#' + [r, g, b].map(c => Math.round(c * 255).toString(16).padStart(2, '0')).join('');
    };

    const escape = (value) => value
        .replace(/\\/g, '\\\\')
        .replace(/,/g, '\\,')
        .replace(/;/g, '\\;')
        .replace(/\r\n|\n/g, '\\n');

    const buildVCard = ({ fullName, emails = [], phones = [], links = [], note }) => {
        const lines = ['BEGIN:VCARD', 'VERSION:3.0', `N:;${escape(fullName)};;;`, `FN:${escape(fullName)}`];
        emails.filter(Boolean).forEach(e => lines.push(`EMAIL;TYPE=INTERNET:${escape(e)}`));
        phones.filter(Boolean).forEach(p => lines.push(`TEL;TYPE=VOICE:${escape(p)}`));
        links.filter(Boolean).forEach(u => lines.push(`URL:${escape(u)}`));
        if (note) lines.push(`NOTE:${escape(note)}`);
        lines.push('END:VCARD');
        return lines.join('\r\n') + '\r\n';
    };

    const downloadText = (fileName, mimeType, content) => {
        const url = URL.createObjectURL(new Blob([content], { type: `${mimeType};charset=utf-8` }));
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    };

    const shareOrCopy = async (title, text, url) => {
        if (navigator.share) {
            try {
                await navigator.share({ title, text, url });
                return 'shared';
            } catch (err) {
                return 'cancelled';
            }
        }
        try {
            await navigator.clipboard.writeText(url);
            return 'copied';
        } catch (err) {
            return 'copyFailed';
        }
    };

    let toastTimer = null;
    const toast = (message, isError) => {
        const el = document.querySelector('.lotus-bcard-toast');
        if (!el) return;
        el.textContent = message;
        el.classList.toggle('lotus-bcard-toast--error', !!isError);
        el.classList.add('lotus-bcard-toast--show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => el.classList.remove('lotus-bcard-toast--show'), 2500);
    };

    const init = ({ qrContainerId, cardUrl, primaryColor, qrColors = {}, title, description, vcard }) => {
        const qrContainer = document.getElementById(qrContainerId);
        if (qrContainer && window.QRCodeStyling) {
            new QRCodeStyling({
                width: 150,
                height: 150,
                type: 'svg',
                data: cardUrl,
                dotsOptions: { color: qrColors.dots || primaryColor, type: 'extra-rounded' },
                cornersSquareOptions: { color: qrColors.cornersSquare || primaryColor, type: 'extra-rounded' },
                cornersDotOptions: { color: qrColors.cornersDot || lighten(primaryColor, 0.08) },
                backgroundOptions: { color: qrColors.background || 'transparent' },
                qrOptions: { errorCorrectionLevel: 'Q' }
            }).append(qrContainer);
        }

        document.getElementById('lotus-bcard-save')?.addEventListener('click', () => {
            downloadText(`${vcard.fullName.replace(/ /g, '_')}.vcf`, 'text/vcard', buildVCard(vcard));
        });

        document.getElementById('lotus-bcard-share')?.addEventListener('click', async () => {
            const result = await shareOrCopy(title, description, cardUrl);
            if (result === 'copied') toast('Link copied — share it anywhere!');
            else if (result === 'copyFailed') toast("Couldn't copy the link. Please copy it from the address bar instead.", true);
        });

        setupInstall();
    };

    // ── Add to Home Screen ──
    // Android/Chrome hands the page an install prompt that our button can trigger. iPhone/iPad
    // can't be triggered by a website, so there the button reveals Safari's own steps instead.
    const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    let installPrompt = null;

    const showInstall = (show) => {
        const btn = document.getElementById('lotus-bcard-install');
        if (btn) btn.hidden = !show || isStandalone();
    };

    // Can fire before init runs, so listen as soon as this script loads.
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault(); // use our button instead of Chrome's own banner
        installPrompt = e;
        showInstall(true);
    });
    window.addEventListener('appinstalled', () => {
        installPrompt = null;
        showInstall(false);
        toast('Added to your home screen.');
    });

    const setupInstall = () => {
        const btn = document.getElementById('lotus-bcard-install');
        const hint = document.getElementById('lotus-bcard-ios-hint');
        if (!btn) return;
        showInstall(!!installPrompt || isIOS);
        btn.addEventListener('click', async () => {
            if (installPrompt) {
                installPrompt.prompt();
                await installPrompt.userChoice.catch(() => {});
                installPrompt = null;
                showInstall(false);
            } else if (hint) {
                hint.hidden = !hint.hidden;
            }
        });
    };

    return { init };
})();
