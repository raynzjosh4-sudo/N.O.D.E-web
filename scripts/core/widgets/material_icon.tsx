import { StyleSheet, Text } from 'react-native';

type MaterialIconProps = {
  name: string;
  size: number;
  color: string;
};

export default function MaterialIcon({ name, size, color }: MaterialIconProps) {
  return <Text style={[styles.icon, { fontSize: size, lineHeight: size + 4, color }]}>{name}</Text>;
}

const styles = StyleSheet.create({
  icon: {
    fontFamily: 'MaterialSymbols',
    fontWeight: 'normal',
    textAlign: 'center',
  },
});
