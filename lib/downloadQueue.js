class PerChatQueue {
    constructor() {
        this.chats = new Map();
    }

    async add(sock, chatId, message, url, fn) {
        if (!this.chats.has(chatId)) {
            this.chats.set(chatId, {
                queue: [],
                processing: false
            });
        }

        const chat = this.chats.get(chatId);

        return new Promise((resolve, reject) => {
            const position = chat.queue.length + 1;

            if (position > 1) {
                sock.sendMessage(chatId, {
                    text: `Tuan~ Permintaan download Tuan sedang dalam antrian. Ada ${position} antrian sebelum Tuan di grup ini. Mohon tunggu dengan sabar, ya~`
                }, { quoted: message }).catch(() => {});
            }

            chat.queue.push({ sock, chatId, message, url, fn, resolve, reject });

            if (!chat.processing) {
                this._processNext(chatId);
            }
        });
    }

    async _processNext(chatId) {
        const chat = this.chats.get(chatId);
        if (!chat || chat.queue.length === 0) {
            if (chat) chat.processing = false;
            this.chats.delete(chatId);
            return;
        }

        chat.processing = true;
        const item = chat.queue.shift();
        const remaining = chat.queue.length;

        try {
            if (remaining > 0) {
                await item.sock.sendMessage(item.chatId, {
                    text: `Giliran Tuan~ Masih ada ${remaining} antrian setelah ini di grup ini. Yuuki akan segera melayani Tuan~`
                }, { quoted: item.message });
            }

            const result = await item.fn(item.sock, item.chatId, item.message, item.url);
            item.resolve(result);
        } catch (error) {
            console.error('Download queue error:', error.message);
            item.reject(error);
        } finally {
            this._processNext(chatId);
        }
    }

    get length() {
        let total = 0;
        for (const chat of this.chats.values()) {
            total += chat.queue.length;
        }
        return total;
    }
}

module.exports = new PerChatQueue();
