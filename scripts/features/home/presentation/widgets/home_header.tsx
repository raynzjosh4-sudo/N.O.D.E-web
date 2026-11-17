import { Image, StyleSheet, Text, View } from 'react-native';

import { NodeColors as colors } from '../../../../core/theme/app_theme';
import MaterialIcon from '../../../../core/widgets/material_icon';

export default function HomeHeader() {
  return (
    <View style={styles.row}>
      <View style={styles.greeting}>
        <View style={styles.avatar}>
          <MaterialIcon name="person_outline" size={20} color="#7A7F87" />
        </View>
        <View style={styles.greetingCopy}>
          <Text style={styles.hello}>Hello,</Text>
          <Text numberOfLines={1} style={styles.name}>
            Guest
          </Text>
        </View>
      </View>

      <View style={styles.brand}>
        <Image
          source={require('../../../../../assets/images/node/nodeicon.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.brandName}>N.O.D.E.</Text>
      </View>

      <View style={styles.notification}>
        <MaterialIcon name="notifications_none" size={18} color={colors.ink} />
        <View style={styles.notificationDot} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  greeting: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 0,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F2F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  greetingCopy: {
    flexShrink: 1,
  },
  hello: {
    color: '#7A7F87',
    fontSize: 11,
    fontWeight: '500',
    fontFamily: 'PlusJakartaSans_500Medium',
  },
  name: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '800',
    fontFamily: 'Outfit_800ExtraBold',
    marginTop: 1,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  logo: {
    width: 22,
    height: 22,
  },
  brandName: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    letterSpacing: 1,
  },
  notification: {
    width: 36,
    height: 36,
    marginLeft: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationDot: {
    position: 'absolute',
    top: 6,
    right: 7,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#DE350B',
  },
});
