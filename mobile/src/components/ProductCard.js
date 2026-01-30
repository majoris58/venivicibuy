import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';

export default function ProductCard({ product, onPress, horizontal = false }) {
  const hasDiscount = product.prices?.some((p) => p.originalPrice && p.originalPrice > p.price);
  const bestOriginalPrice = product.prices?.reduce((max, p) => {
    if (p.originalPrice && p.originalPrice > (max || 0)) return p.originalPrice;
    return max;
  }, null);
  const discountPercent = bestOriginalPrice && product.bestPrice
    ? Math.round(((bestOriginalPrice - product.bestPrice) / bestOriginalPrice) * 100)
    : null;

  if (horizontal) {
    return (
      <TouchableOpacity style={styles.horizontalCard} onPress={onPress} activeOpacity={0.7}>
        <Image source={{ uri: product.thumbnail || 'https://via.placeholder.com/120' }} style={styles.horizontalImage} />
        <View style={styles.horizontalInfo}>
          <Text style={styles.brand} numberOfLines={1}>{product.brand}</Text>
          <Text style={styles.title} numberOfLines={2}>{product.title}</Text>
          <View style={styles.priceRow}>
            <Text style={styles.price}>{product.bestPrice?.toLocaleString('tr-TR')} TL</Text>
            {bestOriginalPrice && (
              <Text style={styles.originalPrice}>{bestOriginalPrice.toLocaleString('tr-TR')} TL</Text>
            )}
          </View>
          <View style={styles.metaRow}>
            <View style={styles.platformCount}>
              <Ionicons name="storefront-outline" size={12} color={COLORS.textSecondary} />
              <Text style={styles.metaText}>{product.prices?.length || 0} platform</Text>
            </View>
            {discountPercent && (
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>%{discountPercent}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      {discountPercent && (
        <View style={styles.discountTag}>
          <Text style={styles.discountTagText}>%{discountPercent}</Text>
        </View>
      )}
      <Image source={{ uri: product.thumbnail || 'https://via.placeholder.com/150' }} style={styles.image} />
      <View style={styles.info}>
        {product.brand && <Text style={styles.brand} numberOfLines={1}>{product.brand}</Text>}
        <Text style={styles.title} numberOfLines={2}>{product.title}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.price}>{product.bestPrice?.toLocaleString('tr-TR')} TL</Text>
        </View>
        {bestOriginalPrice && (
          <Text style={styles.originalPrice}>{bestOriginalPrice.toLocaleString('tr-TR')} TL</Text>
        )}
        <View style={styles.platformCount}>
          <Ionicons name="storefront-outline" size={12} color={COLORS.textSecondary} />
          <Text style={styles.metaText}>{product.prices?.length || 0} platform</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius,
    overflow: 'hidden',
    width: 170,
    marginRight: 12,
    ...SHADOWS.md,
  },
  image: {
    width: '100%',
    height: 150,
    resizeMode: 'cover',
  },
  info: {
    padding: 10,
  },
  brand: {
    fontSize: SIZES.xs,
    color: COLORS.textSecondary,
    fontWeight: '500',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  title: {
    fontSize: SIZES.sm,
    color: COLORS.text,
    fontWeight: '600',
    lineHeight: 18,
    marginBottom: 6,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  price: {
    fontSize: SIZES.base,
    fontWeight: '700',
    color: COLORS.primary,
  },
  originalPrice: {
    fontSize: SIZES.xs,
    color: COLORS.textLight,
    textDecorationLine: 'line-through',
  },
  platformCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  metaText: {
    fontSize: SIZES.xs,
    color: COLORS.textSecondary,
  },
  discountTag: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: COLORS.discount,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    zIndex: 1,
  },
  discountTagText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  discountBadge: {
    backgroundColor: '#fef2f2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountText: {
    color: COLORS.discount,
    fontSize: 11,
    fontWeight: '700',
  },
  // Horizontal
  horizontalCard: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius,
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: 12,
    ...SHADOWS.sm,
  },
  horizontalImage: {
    width: 120,
    height: 120,
    resizeMode: 'cover',
  },
  horizontalInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
});
