import { StyleSheet, View } from 'react-native';

type ProductGridSectionProps = {
  isTablet: boolean;
  isDesktop: boolean;
};

export default function ProductGridSection({
  isTablet,
  isDesktop,
}: ProductGridSectionProps) {
  const columns = isDesktop ? 5 : isTablet ? 3 : 2;
  const cardWidth = isDesktop ? '18.5%' : isTablet ? '31%' : '48%';
  const gap = 8;

  return (
    <View style={[styles.grid, { rowGap: gap }]}>
      {Array.from({ length: columns * 2 }, (_, index) => (
        <View
          key={index}
          style={[styles.card, { width: cardWidth }]}>
          <View style={styles.image} />
          <View style={styles.details}>
            <View style={[styles.line, styles.price]} />
            <View style={[styles.line, styles.retail]} />
            <View style={[styles.line, styles.name]} />
            <View style={[styles.line, styles.location]} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    aspectRatio: 0.7,
    borderRadius: 12,
    backgroundColor: '#E8EAED',
  },
  details: {
    paddingHorizontal: 4,
    paddingVertical: 8,
    gap: 5,
  },
  line: {
    height: 10,
    borderRadius: 4,
    backgroundColor: '#E8EAED',
  },
  price: {
    width: '65%',
    height: 14,
    backgroundColor: '#DDF5FC',
  },
  retail: {
    width: '52%',
    height: 8,
    backgroundColor: '#E9F7FA',
  },
  name: {
    width: '82%',
    height: 12,
    marginTop: 4,
  },
  location: {
    width: '72%',
    height: 8,
  },
});
