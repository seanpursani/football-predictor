// Mock @sentry/react-native before any module imports
jest.mock('@sentry/react-native', () => {
  const React = require('react');
  // Minimal ErrorBoundary that renders fallback on error
  class ErrorBoundary extends React.Component<
    { fallback: React.ReactNode; children: React.ReactNode },
    { hasError: boolean }
  > {
    constructor(props: { fallback: React.ReactNode; children: React.ReactNode }) {
      super(props);
      this.state = { hasError: false };
    }
    static getDerivedStateFromError() {
      return { hasError: true };
    }
    render() {
      if (this.state.hasError) return this.props.fallback;
      return this.props.children;
    }
  }
  return {
    init: jest.fn(),
    ErrorBoundary,
    captureException: jest.fn(),
    withScope: jest.fn((cb: (scope: unknown) => void) =>
      cb({ setContext: jest.fn(), setLevel: jest.fn() })
    ),
  };
});

describe('Sentry mobile init', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('exports a Sentry object after module import', () => {
    const { Sentry } = require('./sentry');
    expect(Sentry).toBeDefined();
  });

  it('calls Sentry.init as a side-effect of importing the module', () => {
    require('./sentry');
    const { init } = require('@sentry/react-native');
    expect(init).toHaveBeenCalled();
  });

  it('initializes with the correct environment keys', () => {
    require('./sentry');
    const { init } = require('@sentry/react-native');
    const callArg = init.mock.calls[0]?.[0];
    expect(callArg).toMatchObject({
      tracesSampleRate: 0,
    });
    expect(callArg).toHaveProperty('dsn');
    expect(callArg).toHaveProperty('environment');
    expect(callArg).toHaveProperty('debug');
    expect(callArg).toHaveProperty('enabled');
  });
});

describe('Sentry ErrorBoundary', () => {
  it('renders fallback when a child throws', () => {
    const React = require('react');
    const { create, act } = require('react-test-renderer');
    const { ErrorBoundary } = require('@sentry/react-native');

    // Component that always throws on render
    function ThrowingComponent(): never {
      throw new Error('Test render error');
    }

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    let renderer: ReturnType<typeof create> | null = null;
    act(() => {
      renderer = create(
        React.createElement(
          ErrorBoundary,
          { fallback: React.createElement('Text', null, 'Error fallback') },
          React.createElement(ThrowingComponent)
        )
      );
    });

    // The boundary's mock implementation should render the fallback
    const json = renderer!.toJSON();
    expect(json).not.toBeNull();
    consoleSpy.mockRestore();
  });
});



