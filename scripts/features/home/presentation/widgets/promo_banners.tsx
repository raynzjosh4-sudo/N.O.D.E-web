import { Image, StyleSheet, Text, View } from 'react-native';

type PromoBannersProps = {
  isDesktop: boolean;
};

export default function PromoBanners({ isDesktop }: PromoBannersProps) {
  return (
    <View style={[styles.row, { height: isDesktop ? 350 : 140 }]}>
      <View style={styles.mainBanner}>
        <Image
          source={require('../../../../../assets/images/node/fashion-banner.png')}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
        <View style={styles.mainOverlay} />
        <Text style={styles.plusCount}>9+</Text>
      </View>
      <View style={styles.sideBanners}>
        <View style={[styles.sideBanner, styles.topBanner]}>
          <Text style={styles.topBannerText}>PUREWHITE ESSENTIALS</Text>
        </View>
        <View style={[styles.sideBanner, styles.bottomBanner]}>
          <Text style={styles.bottomBannerText}>Win</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  mainBanner: {
    flex: 6,
    overflow: 'hidden',
    borderRadius: 16,
    backgroundColor: '#34343A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.12)',
  },
  plusCount: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
    fontFamily: 'Outfit_900Black',
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowRadius: 8,
  },
  sideBanners: {
    flex: 4,
    gap: 8,
  },
  sideBanner: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: 12,
  },
  topBanner: {
    padding: 8,
    alignItems: 'flex-start',
    backgroundColor: '#34343A',
  },
  topBannerText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '900',
    fontFamily: 'Outfit_900Black',
  },
  bottomBanner: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#37474F',
  },
  bottomBannerText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
});
