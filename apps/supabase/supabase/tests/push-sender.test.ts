/**
 * push-sender.test.ts
 * Tests for the sendPushNotification utility
 */

import { sendPushNotification } from '../functions/_shared/push-sender';

function makeFetchResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as unknown as Response;
}

describe('sendPushNotification', () => {
  let fetchSpy: jest.SpyInstance;

  beforeEach(() => {
    fetchSpy = jest.spyOn(global, 'fetch');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns { sent: 0, failed: 0, errors: [] } for empty token list', async () => {
    const result = await sendPushNotification('Title', 'Body', []);
    expect(result).toEqual({ sent: 0, failed: 0, errors: [] });
  });

  it('batches tokens in groups of ≤100 and counts all sent correctly', async () => {
    const tokens = Array.from({ length: 250 }, (_, i) => `ExponentPushToken[token${i}]`);
    // Dynamic mock: return exactly as many ok tickets as messages in each batch
    fetchSpy.mockImplementation((_url: string, options: RequestInit) => {
      const messages = JSON.parse(options.body as string) as unknown[];
      return Promise.resolve(
        makeFetchResponse(200, {
          data: messages.map(() => ({ status: 'ok' })),
        }),
      );
    });

    const result = await sendPushNotification('Title', 'Body', tokens);

    // 250 tokens / 100 per batch = 3 calls
    expect(fetchSpy).toHaveBeenCalledTimes(3);

    // Verify each batch has ≤100 messages
    fetchSpy.mock.calls.forEach((call: unknown[]) => {
      const body = JSON.parse((call[1] as { body: string }).body);
      expect(body.length).toBeLessThanOrEqual(100);
    });

    // All 250 tokens should be counted as sent
    expect(result.sent).toBe(250);
    expect(result.failed).toBe(0);
    expect(result.errors).toHaveLength(0);
  });

  it('delivery failure does NOT throw — returns error in result object', async () => {
    const tokens = ['ExponentPushToken[valid]'];
    fetchSpy.mockResolvedValue(
      makeFetchResponse(200, {
        data: [{ status: 'error', message: 'DeviceNotRegistered' }],
      }),
    );

    // Should not throw — best-effort semantics
    const result = await sendPushNotification('Title', 'Body', tokens);

    expect(result.failed).toBe(1);
    expect(result.errors.length).toBe(1);
    expect(result.errors[0].message).toBe('DeviceNotRegistered');
  });

  it('network error does NOT throw — returns failed count', async () => {
    const tokens = ['ExponentPushToken[valid]'];
    fetchSpy.mockRejectedValue(new Error('Network error'));

    const result = await sendPushNotification('Title', 'Body', tokens);

    expect(result.failed).toBe(1);
    expect(result.sent).toBe(0);
    expect(result.errors[0].message).toContain('Network error');
  });

  it('HTTP non-200 response — entire batch counted as failed', async () => {
    const tokens = ['tok1', 'tok2', 'tok3'];
    fetchSpy.mockResolvedValue(
      makeFetchResponse(500, { error: 'Internal Server Error' }),
    );

    const result = await sendPushNotification('Title', 'Body', tokens);

    expect(result.failed).toBe(3);
    expect(result.sent).toBe(0);
  });

  it('counts sent for successful ok tickets', async () => {
    const tokens = ['tok1', 'tok2'];
    fetchSpy.mockResolvedValue(
      makeFetchResponse(200, {
        data: [{ status: 'ok' }, { status: 'ok' }],
      }),
    );

    const result = await sendPushNotification('Title', 'Body', tokens);

    expect(result.sent).toBe(2);
    expect(result.failed).toBe(0);
    expect(result.errors).toHaveLength(0);
  });

  it('orphaned tokens (fewer tickets than tokens) counted as failed', async () => {
    const tokens = ['tok1', 'tok2', 'tok3'];
    // Expo returns only 2 tickets for 3 tokens
    fetchSpy.mockResolvedValue(
      makeFetchResponse(200, {
        data: [{ status: 'ok' }, { status: 'ok' }],
      }),
    );

    const result = await sendPushNotification('Title', 'Body', tokens);

    expect(result.sent).toBe(2);
    expect(result.failed).toBe(1);
    expect(result.errors[0].message).toBe('No ticket returned for token');
    expect(result.errors[0].token).toBe('tok3');
  });
});

