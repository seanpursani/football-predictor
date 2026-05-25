import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import type { Fixture, Prediction } from '@lecolpo/types';
import { Typography } from '@/src/lib/typography';

interface FixtureCardProps {
  fixture: Fixture;
  picks: Prediction[];
  isExpanded: boolean;
  onToggle: () => void;
  onNavigateToCatalog: (fixtureId: number) => void;
  onPickTap: (pick: Prediction) => void;
}

const kickoffFormatter = new Intl.DateTimeFormat('en-GB', {
  weekday: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

export function FixtureCard({
  fixture,
  picks,
  isExpanded,
  onToggle,
  onNavigateToCatalog,
  onPickTap,
}: FixtureCardProps) {
  const hasPicks = picks.length > 0;
  const kickoffLabel = kickoffFormatter.format(fixture.kickoffAt);

  const handleHeaderPress = () => {
    if (!hasPicks) {
      onNavigateToCatalog(fixture.id);
    } else {
      onToggle();
    }
  };

  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.header}
        onPress={handleHeaderPress}
        accessibilityRole="button"
        accessibilityState={{ expanded: isExpanded }}
        accessibilityLabel={`${fixture.homeTeam} vs ${fixture.awayTeam}, ${kickoffLabel}${hasPicks ? `, ${picks.length} picks` : ', tap to add picks'}`}
      >
        <View style={styles.headerLeft}>
          <Text style={styles.matchupText}>
            {fixture.homeTeam} vs {fixture.awayTeam}
          </Text>
          <Text style={styles.kickoffText}>{kickoffLabel}</Text>
        </View>
        <View style={styles.headerRight}>
          {hasPicks && !isExpanded && (
            <View style={styles.picksBadge}>
              <Text style={styles.picksBadgeText}>{picks.length} picks</Text>
            </View>
          )}
          <Text style={styles.chevron}>{isExpanded ? '▾' : '▸'}</Text>
        </View>
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.expandedContent}>
          {picks.map((pick) => (
            <TouchableOpacity
              key={pick.id}
              style={styles.simplePickRow}
              onPress={() => onPickTap(pick)}
              accessibilityRole="button"
              hitSlop={{ top: 4, bottom: 4, left: 0, right: 0 }}
            >
              <Text style={styles.simplePickText}>Pick #{pick.gameWeekMomentId}</Text>
              {pick.isCaptain && <Text>👑</Text>}
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={styles.addPlaceholder}
            onPress={() => onNavigateToCatalog(fixture.id)}
            accessibilityRole="button"
            accessibilityLabel="Tap to add a pick"
          >
            <Text style={styles.addPlaceholderText}>＋ Tap to add a pick</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: '#1E1E1E',
    borderRadius: 8,
    marginHorizontal: 16,
    marginVertical: 6,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 14,
    minHeight: 44,
  },
  headerLeft: {
    flex: 1,
  },
  matchupText: {
    ...Typography.body,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  kickoffText: {
    ...Typography.caption,
    color: '#7A7A7A',
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  picksBadge: {
    backgroundColor: 'rgba(180,255,50,0.12)',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  picksBadgeText: {
    ...Typography.label,
    color: '#B4FF32',
  },
  chevron: {
    ...Typography.body,
    color: '#7A7A7A',
  },
  expandedContent: {
    borderTopWidth: 1,
    borderTopColor: '#1E1E1E',
  },
  simplePickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 44,
    borderBottomWidth: 1,
    borderBottomColor: '#1E1E1E',
  },
  simplePickText: {
    ...Typography.body,
    color: '#FFFFFF',
  },
  addPlaceholder: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 44,
    justifyContent: 'center',
  },
  addPlaceholderText: {
    ...Typography.body,
    color: '#7A7A7A',
  },
});

