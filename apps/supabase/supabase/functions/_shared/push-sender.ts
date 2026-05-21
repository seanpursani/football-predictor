const EXPO_PUSH_API_URL = 'https://exp.host/--/api/v2/push/send';
const BATCH_SIZE = 100;

export interface PushError {
    token: string;
    message: string;
}

export interface PushSendResult {
    sent: number;
    failed: number;
    errors: PushError[];
}

interface ExpoMessage {
    to: string;
    title: string;
    body: string;
    sound: string;
}

interface ExpoTicket {
    status: 'ok' | 'error';
    message?: string;
    details?: { error?: string };
}

/**
 * Sends push notifications via the Expo Push API.
 * Processes tokens in batches of 100 (Expo limit).
 * Best-effort: delivery failures are returned in result, not thrown.
 *
 * @param title - Notification title
 * @param body - Notification body text
 * @param tokens - Array of Expo push tokens
 * @returns PushSendResult with sent/failed counts and any errors
 */
export async function sendPushNotification(
    title: string,
    body: string,
    tokens: string[],
): Promise<PushSendResult> {
    if (tokens.length === 0) {
        return {sent: 0, failed: 0, errors: []};
    }

    let sent = 0;
    let failed = 0;
    const errors: PushError[] = [];

    // Process in batches of BATCH_SIZE
    for (let i = 0; i < tokens.length; i += BATCH_SIZE) {
        const batchTokens = tokens.slice(i, i + BATCH_SIZE);
        const messages: ExpoMessage[] = batchTokens.map((token) => ({
            to: token,
            title,
            body,
            sound: 'default',
        }));

        try {
            const response = await fetch(EXPO_PUSH_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify(messages),
            });

            if (!response.ok) {
                // Entire batch failed
                const errMsg = `Expo Push API returned status ${response.status}`;
                console.error('[push-sender] Batch failed:', errMsg);
                failed += batchTokens.length;
                batchTokens.forEach((token) => errors.push({token, message: errMsg}));
                continue;
            }

            const result = await response.json() as { data: ExpoTicket[] };
            const tickets: ExpoTicket[] = result?.data ?? [];

            // Clamp to batchTokens.length — ignore any extra tickets Expo returns unexpectedly
            tickets.slice(0, batchTokens.length).forEach((ticket, idx) => {
                const token = batchTokens[idx];
                if (ticket.status === 'ok') {
                    sent++;
                } else {
                    failed++;
                    errors.push({token, message: ticket.message ?? 'Unknown error'});
                }
            });

            // If Expo returned fewer tickets than we sent, the remainder are unknown — count as failed
            if (tickets.length < batchTokens.length) {
                const orphaned = batchTokens.slice(tickets.length);
                failed += orphaned.length;
                orphaned.forEach((token) =>
                    errors.push({token, message: 'No ticket returned for token'}),
                );
            }
        } catch (err) {
            // Network or parse error — don't throw, log and record as failed
            const errMsg = String(err);
            console.error('[push-sender] Batch error:', errMsg);
            failed += batchTokens.length;
            batchTokens.forEach((token) => errors.push({token, message: errMsg}));
        }
    }

    return {sent, failed, errors};
}

