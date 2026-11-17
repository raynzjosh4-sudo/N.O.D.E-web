
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { AppColors } from '@/core/theme/app_theme';
import { useAppTheme } from '@/core/theme/theme_context';

export type ProfileTabKey = 'saved' | 'drafts' | 'pending' | 'sent' | 'pdf' | 'settings';

interface ProfileTabsProps {
  activeTab: ProfileTabKey;
  onTabChange: (tab: ProfileTabKey) => void;
  badgeCounts?: {
    saved?: number;
    drafts?: number;
    pending?: number;
    sent?: number;
    pdf?: number;
  };
}

const TABS: { key: ProfileTabKey; label: string }[] = [
  { key: 'saved', label: 'Saved' },
  { key: 'drafts', label: 'Drafts' },
  { key: 'pending', label: 'Pending' },
  { key: 'sent', label: 'Sent' },
  { key: 'pdf', label: 'PDF' },
  { key: 'settings', label: 'Settings' },
];

export function ProfileTabs({
  activeTab,
  onTabChange,
  badgeCounts = {},
}: ProfileTabsProps) {
  const { colors } = useAppTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderBottomColor: colors.borderLight }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollList}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          const count = badgeCounts[tab.key as keyof typeof badgeCounts];

          return (
            <TouchableOpacity
              key={tab.key}
              activeOpacity={0.75}
              style={[
                styles.tabPill,
                { backgroundColor: isActive ? colors.primary : colors.cardColor, borderColor: colors.borderLight, borderWidth: isActive ? 0 : 1 },
              ]}
              onPress={() => onTabChange(tab.key)}
            >
              <Text
                style={[
                  styles.tabLabel,
                  { color: isActive ? '#FFFFFF' : colors.onSurfaceMuted },
                  isActive && styles.tabLabelActive,
                ]}
              >
                {tab.label}
              </Text>

              {count !== undefined && count > 0 && (
                <View
                  style={[
                    styles.countBadge,
                    { backgroundColor: isActive ? 'rgba(255, 255, 255, 0.25)' : colors.surface },
                  ]}
                >
                  <Text
                    style={[
                      styles.countText,
                      { color: isActive ? '#FFFFFF' : colors.onSurfaceMuted },
                    ]}
                  >
                    {count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    paddingVertical: 10,
  },
  scrollList: {
    paddingHorizontal: 20,
    gap: 8,
  },
  tabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
  },
  tabPillActive: {
    backgroundColor: AppColors.primary,
  },
  tabLabel: {
    fontSize: 12,
    fontFamily: 'Outfit_600SemiBold',
  },
  tabLabelActive: {
    color: '#FFFFFF',
    fontFamily: 'Outfit_700Bold',
  },
  countBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
  },
  countBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  countText: {
    fontSize: 10,
    fontFamily: 'Outfit_700Bold',
  },
  countTextActive: {
    color: '#FFFFFF',
  },
});
