import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';

export default function ProductCard({ product, onPress, horizontal = false }) {
  const discountPercent = product.originalPrice && product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : null;

  if (horizontal) {
    return (
      <TouchableOpacity style={styles.horizontalCard} onPress={onPress} activeOpacity={0.7}>
        <Image source={{ uri: product.thumbnail || 'https://via.placeholder.com/120' }} style={styles.horizontalImage} />
        <View style={styles.horizontalInfo}>
          {product.brand && <Text style={styles.brand} numberOfLines={1}>{product.brand}</Text>}
          <Text style={styles.title} numberOfLines={2}>{product.title}</Text>
          <View style={styles.priceRow}>
            <Text style={styles.price}>{product.price?.toLocaleString('tr-TR')} TL</Text>
            {product.originalPrice && (
              <Text style={styles.originalPrice}>{product.originalPrice.toLocaleString('tr-TR')} TL</Text>
            )}
          </View>
          <View style={styles.bottomRow}>
            {product.platform && (
              <View style={[styles.platformBadge, { backgroundColor: product.platform.color || '#666' }]}>
                <Text style={styles.platformText}>{product.platform.name}</Text>
              </View>
            )}
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
      {/* Platform logo badge */}
      {product.platform && (
        <View style={[styles.platformCorner, { backgroundColor: product.platform.color || '#666' }]}>
          <Text style={styles.platformInitial}>{product.platform.name?.charAt(0)}</Text>
        </View>
      )}
      <View style={styles.info}>
        {product.brand && <Text style={styles.brand} numberOfLines={1}>{product.brand}</Text>}
        <Text style={styles.title} numberOfLines={2}>{product.title}</Text>
        <Text style={styles.price}>{product.price?.toLocaleString('tr-TR')} TL</Text>
        {product.originalPrice && (
          <Text style={styles.originalPrice}>{product.originalPrice.toLocaleString('tr-TR')} TL</Text>
        )}
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
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  platformBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  platformText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  platformCorner: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  platformInitial: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
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
});
