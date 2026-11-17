import {
  Tabs,
  TabList,
  TabTrigger,
  TabSlot,
  TabTriggerSlotProps,
  TabListProps,
} from 'expo-router/ui';
import { Pressable, View, StyleSheet, Text } from 'react-native';

import { MaxContentWidth, Spacing } from '@/constants/theme';

export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={{ height: '100%' }} />
      <TabList asChild>
        <CustomTabList>
          <TabTrigger name="home" href="/" asChild>
            <TabButton>Home</TabButton>
          </TabTrigger>
          <TabTrigger name="explore" href="/explore" asChild>
            <TabButton>Explore</TabButton>
          </TabTrigger>
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

export function TabButton({
  children,
  isFocused,
  ref: _tabRef,
  ...props
}: TabTriggerSlotProps) {
  return (
    <Pressable
      {...props}
      style={({ pressed }) => [
        styles.tabButton,
        isFocused && styles.tabButtonFocused,
        pressed && styles.pressed,
      ]}>
      <Text style={[styles.tabButtonText, isFocused && styles.tabButtonTextFocused]}>
        {children}
      </Text>
    </Pressable>
  );
}

export function CustomTabList(props: TabListProps) {
  return (
    <View {...props} style={[styles.tabListContainer, props.style]}>
      <View style={styles.innerContainer}>
        <Text style={styles.brandText}>
          N.O.D.E.
        </Text>

        {props.children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabListContainer: {
    position: 'absolute',
    width: '100%',
    top: 12,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.three,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    zIndex: 10,
  },
  innerContainer: {
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5E8ED',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    shadowColor: '#102A43',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
  },
  brandText: {
    marginRight: 'auto',
    color: '#172B4D',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1,
  },
  pressed: {
    opacity: 0.7,
  },
  tabButton: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  tabButtonFocused: {
    backgroundColor: '#E8F9FE',
  },
  tabButtonText: {
    color: '#6B778C',
    fontSize: 13,
    fontWeight: '600',
  },
  tabButtonTextFocused: {
    color: '#087DA0',
    fontWeight: '800',
  },
});
