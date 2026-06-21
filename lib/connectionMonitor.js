const TIME_WINDOW = 30000;
const FAILURE_THRESHOLD = 3;
const COOLDOWN_BETWEEN_WARNINGS = 15000;

class ConnectionMonitor {
    constructor() {
        this.failures = [];
        this.successes = 0;
        this.lastWarningTime = 0;
        this.warningCount = 0;
        this.isSendingWarning = false;
    }

    reportSuccess() {
        this.successes++;
        if (this.successes >= 3) {
            this.failures = [];
            this.successes = 0;
        }
    }

    reportFailure() {
        this.failures.push(Date.now());
        this.successes = 0;
        const cutoff = Date.now() - TIME_WINDOW;
        this.failures = this.failures.filter(t => t > cutoff);
    }

    isUnstable() {
        const cutoff = Date.now() - TIME_WINDOW;
        const recentFailures = this.failures.filter(t => t > cutoff);
        return recentFailures.length >= FAILURE_THRESHOLD;
    }

    canSendWarning() {
        if (this.isSendingWarning) return false;
        return Date.now() - this.lastWarningTime > COOLDOWN_BETWEEN_WARNINGS;
    }

    markWarningSent() {
        this.lastWarningTime = Date.now();
        this.warningCount++;
    }

    getStatusMessage(title) {
        const failureCount = this.failures.filter(t => t > Date.now() - TIME_WINDOW).length;
        return `Mohon maaf, ${title}~ Yuuki sedang mengalami koneksi internet yang kurang stabil akhir-akhir ini. ${failureCount} permintaan terakhir gagal karena jaringan. Yuuki mohon Tuan bersabar dan mencoba lagi dalam beberapa saat. Pelayan ini akan berusaha sebaik mungkin untuk tetap melayani Tuan.`;
    }
}

module.exports = new ConnectionMonitor();
