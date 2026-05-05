import { Typography } from './typography';

describe('Typography', () => {
  it('defines all 7 type scale variants', () => {
    expect(Object.keys(Typography)).toHaveLength(7);
    expect(Typography).toHaveProperty('display');
    expect(Typography).toHaveProperty('heading1');
    expect(Typography).toHaveProperty('heading2');
    expect(Typography).toHaveProperty('body');
    expect(Typography).toHaveProperty('label');
    expect(Typography).toHaveProperty('caption');
    expect(Typography).toHaveProperty('monoNumber');
  });

  it('display: Inter_700Bold 32/38', () => {
    expect(Typography.display.fontFamily).toBe('Inter_700Bold');
    expect(Typography.display.fontSize).toBe(32);
    expect(Typography.display.lineHeight).toBe(38);
  });

  it('heading1: Inter_700Bold 24/30', () => {
    expect(Typography.heading1.fontFamily).toBe('Inter_700Bold');
    expect(Typography.heading1.fontSize).toBe(24);
    expect(Typography.heading1.lineHeight).toBe(30);
  });

  it('heading2: Inter_600SemiBold 18/24', () => {
    expect(Typography.heading2.fontFamily).toBe('Inter_600SemiBold');
    expect(Typography.heading2.fontSize).toBe(18);
    expect(Typography.heading2.lineHeight).toBe(24);
  });

  it('body: Inter_400Regular 15/22', () => {
    expect(Typography.body.fontFamily).toBe('Inter_400Regular');
    expect(Typography.body.fontSize).toBe(15);
    expect(Typography.body.lineHeight).toBe(22);
  });

  it('label: Inter_500Medium 13/18', () => {
    expect(Typography.label.fontFamily).toBe('Inter_500Medium');
    expect(Typography.label.fontSize).toBe(13);
    expect(Typography.label.lineHeight).toBe(18);
  });

  it('caption: Inter_400Regular 11/16', () => {
    expect(Typography.caption.fontFamily).toBe('Inter_400Regular');
    expect(Typography.caption.fontSize).toBe(11);
    expect(Typography.caption.lineHeight).toBe(16);
  });

  it('monoNumber: tabular-nums fontVariant', () => {
    expect(Typography.monoNumber.fontFamily).toBe('Inter_700Bold');
    expect(Typography.monoNumber.fontSize).toBe(20);
    expect(Typography.monoNumber.lineHeight).toBe(24);
    expect(Typography.monoNumber.fontVariant).toEqual(['tabular-nums']);
  });
});

