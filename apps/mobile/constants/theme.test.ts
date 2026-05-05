import { Colors, NavigationTheme } from './theme';

describe('Colors (OLED Sharp palette)', () => {
  it('bg tokens match spec', () => {
    expect(Colors.bg.primary).toBe('#080808');
    expect(Colors.bg.surface).toBe('#141414');
    expect(Colors.bg.elevated).toBe('#1C1C1C');
  });

  it('text tokens match spec', () => {
    expect(Colors.text.primary).toBe('#FFFFFF');
    expect(Colors.text.secondary).toBe('#7A7A7A');
    expect(Colors.text.muted).toBe('#404040');
  });

  it('border tokens match spec', () => {
    expect(Colors.border.subtle).toBe('#1E1E1E');
    expect(Colors.border.active).toBe('#B4FF32');
  });

  it('semantic colours match spec', () => {
    expect(Colors.accent).toBe('#B4FF32');
    expect(Colors.success).toBe('#B4FF32');
    expect(Colors.jackpot).toBe('#FFD700');
    expect(Colors.captain).toBe('#FFD700');
    expect(Colors.deadline).toBe('#FF6B35');
    expect(Colors.streak).toBe('#A78BFA');
    expect(Colors.miss).toBe('#303030');
  });

  it('has no light theme', () => {
    expect(Colors).not.toHaveProperty('light');
  });
});

describe('NavigationTheme', () => {
  it('is dark mode only', () => {
    expect(NavigationTheme.dark).toBe(true);
  });

  it('uses OLED Sharp colours', () => {
    expect(NavigationTheme.colors.background).toBe('#080808');
    expect(NavigationTheme.colors.primary).toBe('#B4FF32');
    expect(NavigationTheme.colors.card).toBe('#141414');
  });
});

