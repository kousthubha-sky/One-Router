import { OneRouter } from '../src/client';

// Mock the HttpClient
jest.mock('../src/http-client', () => ({
  HttpClient: jest.fn().mockImplementation(() => ({
    post: jest.fn(),
    get: jest.fn(),
  })),
}));

describe('OneRouter Client', () => {
  const apiKey = 'test_api_key_12345';
  let client: OneRouter;

  beforeEach(() => {
    client = new OneRouter({ apiKey });
  });

  describe('Client Initialization', () => {
    test('should create client with API key', () => {
      expect(client).toBeDefined();
      expect(client.apiKey).toBe(apiKey);
    });

    test('should throw error without API key', () => {
      expect(() => new OneRouter({ apiKey: '' })).toThrow('API key is required');
    });

    test('should throw error with undefined API key', () => {
      expect(() => new (OneRouter as any)({})).toThrow('API key is required');
    });
  });

  describe('Payment Methods', () => {
    test('should have payment methods', () => {
      expect(client.payments).toBeDefined();
      expect(typeof client.payments.create).toBe('function');
      expect(typeof client.payments.get).toBe('function');
      expect(typeof client.payments.capture).toBe('function');
      expect(typeof client.payments.refund).toBe('function');
    });

    test('should have subscription methods', () => {
      expect(client.subscriptions).toBeDefined();
      expect(typeof client.subscriptions.create).toBe('function');
      expect(typeof client.subscriptions.get).toBe('function');
      expect(typeof client.subscriptions.cancel).toBe('function');
      expect(typeof client.subscriptions.pause).toBe('function');
      expect(typeof client.subscriptions.resume).toBe('function');
      expect(typeof client.subscriptions.changePlan).toBe('function');
    });

    test('should have payment links methods', () => {
      expect(client.paymentLinks).toBeDefined();
      expect(typeof client.paymentLinks.create).toBe('function');
    });

    test('should have payouts methods', () => {
      expect(client.payouts).toBeDefined();
      expect(typeof client.payouts.create).toBe('function');
    });

    test('should have SMS methods', () => {
      expect(client.sms).toBeDefined();
      expect(typeof client.sms.send).toBe('function');
    });

    test('should have email methods', () => {
      expect(client.email).toBeDefined();
      expect(typeof client.email.send).toBe('function');
    });
  });

  describe('Configuration', () => {
    test('should set default base URL', () => {
      expect(client.baseURL).toBe('https://api.onerouter.com');
    });

    test('should allow custom base URL', () => {
      const customClient = new OneRouter({
        apiKey: 'test',
        baseUrl: 'https://custom.api.com'
      });
      expect(customClient.baseURL).toBe('https://custom.api.com');
    });
  });

  describe('Legacy Method Aliases', () => {
    test('should have legacy payment method aliases', () => {
      expect(client.createOrder).toBe(client.payments.create);
      expect(client.getOrder).toBe(client.payments.get);
      expect(client.capturePayment).toBe(client.payments.capture);
      expect(client.refundPayment).toBe(client.payments.refund);
    });

    test('should have legacy subscription method aliases', () => {
      expect(client.createSubscription).toBe(client.subscriptions.create);
      expect(client.getSubscription).toBe(client.subscriptions.get);
      expect(client.cancelSubscription).toBe(client.subscriptions.cancel);
      expect(client.pauseSubscription).toBe(client.subscriptions.pause);
      expect(client.resumeSubscription).toBe(client.subscriptions.resume);
      expect(client.changeSubscriptionPlan).toBe(client.subscriptions.changePlan);
    });

    test('should have legacy other method aliases', () => {
      expect(client.createPaymentLink).toBe(client.paymentLinks.create);
      expect(client.sendSms).toBe(client.sms.send);
      expect(client.sendEmail).toBe(client.email.send);
      expect(client.createPayout).toBe(client.payouts.create);
    });
  });
});