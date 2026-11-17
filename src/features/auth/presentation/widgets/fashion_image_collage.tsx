import React from 'react';
import { View, StyleSheet, Image, Dimensions } from 'react-native';

const FASHION_IMAGES = [
  require('@/../assets/welcomeimages/1.jpg'),
  require('@/../assets/welcomeimages/1 (1).jpg'),
  require('@/../assets/welcomeimages/1 (2).jpg'),
  require('@/../assets/welcomeimages/1 (3).jpg'),
  require('@/../assets/welcomeimages/1 (4).jpg'),
  require('@/../assets/welcomeimages/1 (5).jpg'),
  require('@/../assets/welcomeimages/26ABTest_Computing_THUMBNAILS_300x300.png'),
  require('@/../assets/welcomeimages/26ABTest_Fashion_THUMBNAILS_300x300.png'),
  require('@/../assets/welcomeimages/26ABTest_Jumia-Picks_THUMBNAILS_300x300.png'),
  require('@/../assets/welcomeimages/26ABTest_Mens-Shoes_THUMBNAILS_300x300.png'),
];

export function FashionImageCollage() {
  const col1: any[] = [];
  const col2: any[] = [];
  const col3: any[] = [];

  for (let i = 0; i < FASHION_IMAGES.length * 2; i++) {
    const img = FASHION_IMAGES[i % FASHION_IMAGES.length];
    if (i % 3 === 0) col1.push(img);
    else if (i % 3 === 1) col2.push(img);
    else col3.push(img);
  }

  return (
    <View style={styles.container}>
      <View style={styles.columnsRow}>
        {/* Column 1 */}
        <View style={[styles.column, { paddingTop: 0 }]}>
          {col1.map((source, index) => (
            <View key={`c1-${index}`} style={styles.imageCard}>
              <Image source={source} style={styles.image} resizeMode="cover" />
            </View>
          ))}
        </View>

        {/* Column 2 */}
        <View style={[styles.column, { paddingTop: 60 }]}>
          {col2.map((source, index) => (
            <View key={`c2-${index}`} style={styles.imageCard}>
              <Image source={source} style={styles.image} resizeMode="cover" />
            </View>
          ))}
        </View>

        {/* Column 3 */}
        <View style={[styles.column, { paddingTop: 20 }]}>
          {col3.map((source, index) => (
            <View key={`c3-${index}`} style={styles.imageCard}>
              <Image source={source} style={styles.image} resizeMode="cover" />
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    overflow: 'hidden',
    backgroundColor: '#000000',
  },
  columnsRow: {
    flexDirection: 'row',
    position: 'absolute',
    left: '-15%',
    right: '-15%',
    top: 0,
    bottom: 0,
    justifyContent: 'space-between',
  },
  column: {
    flex: 1,
    paddingHorizontal: 6,
  },
  imageCard: {
    width: '100%',
    aspectRatio: 0.62,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
    backgroundColor: '#1E1E24',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
