import { deriveBoldnessTier } from './boldness';

describe('deriveBoldnessTier', () => {
  it('0 → bronze', () => expect(deriveBoldnessTier(0)).toBe('bronze'));
  it('999 → bronze', () => expect(deriveBoldnessTier(999)).toBe('bronze'));
  it('1000 → silver', () => expect(deriveBoldnessTier(1000)).toBe('silver'));
  it('2499 → silver', () => expect(deriveBoldnessTier(2499)).toBe('silver'));
  it('2500 → gold', () => expect(deriveBoldnessTier(2500)).toBe('gold'));
  it('4999 → gold', () => expect(deriveBoldnessTier(4999)).toBe('gold'));
  it('5000 → platinum', () => expect(deriveBoldnessTier(5000)).toBe('platinum'));
  it('very large number → platinum', () => expect(deriveBoldnessTier(999999)).toBe('platinum'));
});

