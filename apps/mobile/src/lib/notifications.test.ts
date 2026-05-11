// Note: jest.mock factories cannot reference outer variables (hoisting limitation).
// Device.isDevice cannot be mutated after import due to Babel's interop wrapping.
// Per-test module isolation is used for the non-device case.
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  getExpoPushTokenAsync: jest.fn().mockResolvedValue({ data: 'ExponentPushToken[abc]' }),
}));

describe('requestPushPermissionAndGetToken — physical device', () => {
  jest.mock('expo-device', () => ({ isDevice: true }));

  const Notifications = jest.requireMock('expo-notifications') as {
    requestPermissionsAsync: jest.Mock;
    getExpoPushTokenAsync: jest.Mock;
  };

  beforeEach(() => {
    Notifications.requestPermissionsAsync.mockResolvedValue({ status: 'granted' });
    Notifications.getExpoPushTokenAsync.mockResolvedValue({ data: 'ExponentPushToken[abc]' });
  });

  it('returns null when permission is denied', async () => {
    const { requestPushPermissionAndGetToken } = require('./notifications');
    Notifications.requestPermissionsAsync.mockResolvedValueOnce({ status: 'denied' });
    const result = await requestPushPermissionAndGetToken();
    expect(result).toBeNull();
  });

  it('returns token string when permission is granted', async () => {
    const { requestPushPermissionAndGetToken } = require('./notifications');
    const result = await requestPushPermissionAndGetToken();
    expect(result).toBe('ExponentPushToken[abc]');
  });

  it('returns null when getExpoPushTokenAsync throws', async () => {
    const { requestPushPermissionAndGetToken } = require('./notifications');
    Notifications.getExpoPushTokenAsync.mockRejectedValueOnce(new Error('no token'));
    const result = await requestPushPermissionAndGetToken();
    expect(result).toBeNull();
  });
});

describe('requestPushPermissionAndGetToken — simulator', () => {
  beforeAll(() => {
    jest.resetModules();
    jest.mock('expo-device', () => ({ isDevice: false }));
    jest.mock('expo-notifications', () => ({
      setNotificationHandler: jest.fn(),
      requestPermissionsAsync: jest.fn(),
      getExpoPushTokenAsync: jest.fn(),
    }));
  });

  it('returns null when not a physical device', async () => {
    const { requestPushPermissionAndGetToken } = require('./notifications');
    const result = await requestPushPermissionAndGetToken();
    expect(result).toBeNull();
  });
});

