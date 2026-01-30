import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, Image, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { getProduct, trackClick } from '../lib/api';

export default function ProductDetailScreen({ route, navigation }) {
  const { productId } = route.params;
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProduct(productId)
      .then((res) => setProduct(res.data))
      .catch(() => Alert.alert('Hata', 'Urun yuklenemedi'))
      .finally(() => setLoading(false));
  }, [productId]);

  const handlePlatformClick = async (priceEntry) => {
    try {
      const res = await trackClick(productId, priceEntry.platform._id || priceEntry.platform);
      const url = res.data.url;
      if (url) {
        await Linking.openURL(url);
      }
    } catch {
      const fallbackUrl = priceEntry.affiliateUrl || priceEntry.url;
      if (fallbackUrl) await Linking.openURL(fallbackUrl);
    }
  };

  if (loading) {
    return <View style={styles.loader}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
  }

  if (!product) return null;

  const sortedPrices = [...(product.prices || [])].sort((a, b) => a.price - b.price);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Urun Detay</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Product Image */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: product.thumbnail || 'https://via.placeholder.com/400' }}
            style={styles.image}
          />
          {product.isFeatured && (
            <View style={styles.featuredBadge}>
              <Ionicons name="star" size={12} color="#fff" />
              <Text style={styles.featuredText}>One Cikan</Text>
            </View>
          )}
        </View>

        {/* Product Info */}
        <View style={styles.infoSection}>
          {product.brand && <Text style={styles.brand}>{product.brand}</Text>}
          <Text style={styles.title}>{product.title}</Text>

          {product.category && (
            <View style={styles.categoryTag}>
              <Ionicons name="pricetag-outline" size={12} color={COLORS.primary} />
              <Text style={styles.categoryText}>{product.category.name}</Text>
            </View>
          )}

          {product.bestPrice && (
            <View style={styles.bestPriceRow}>
              <Text style={styles.bestPriceLabel}>En iyi fiyat</Text>
              <Text style={styles.bestPrice}>{product.bestPrice.toLocaleString('tr-TR')} TL</Text>
            </View>
          )}

          {product.description && (
            <Text style={styles.description}>{product.description}</Text>
          )}
        </View>

        {/* Platform Prices */}
        <View style={styles.pricesSection}>
          <Text style={styles.pricesSectionTitle}>Fiyat Karsilastirmasi</Text>
          <Text style={styles.pricesSub}>{sortedPrices.length} platformda mevcut</Text>

          {sortedPrices.map((entry, index) => {
            const isBest = index === 0;
            const discount = entry.originalPrice
              ? Math.round(((entry.originalPrice - entry.price) / entry.originalPrice) * 100)
              : null;

            return (
              <TouchableOpacity
                key={entry._id || index}
                style={[styles.priceCard, isBest && styles.priceCardBest]}
                onPress={() => handlePlatformClick(entry)}
                activeOpacity={0.7}
              >
                {isBest && (
                  <View style={styles.bestTag}>
                    <Text style={styles.bestTagText}>EN UYGUN</Text>
                  </View>
                )}
                <View style={styles.priceCardLeft}>
                  <View
                    style={[styles.platformDot, { backgroundColor: entry.platform?.color || '#666' }]}
                  >
                    <Text style={styles.platformInitial}>
                      {(entry.platform?.name || 'P').charAt(0)}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.platformName}>{entry.platform?.name || 'Platform'}</Text>
                    <View style={styles.stockRow}>
                      <View style={[styles.stockDot, { backgroundColor: entry.inStock ? COLORS.success : COLORS.error }]} />
                      <Text style={[styles.stockText, { color: entry.inStock ? COLORS.success : COLORS.error }]}>
                        {entry.inStock ? 'Stokta' : 'Tukendi'}
                      </Text>
                    </View>
                  </View>
                </View>
                <View style={styles.priceCardRight}>
                  <Text style={[styles.platformPrice, isBest && styles.platformPriceBest]}>
                    {entry.price.toLocaleString('tr-TR')} TL
                  </Text>
                  {entry.originalPrice && (
                    <Text style={styles.platformOriginal}>
                      {entry.originalPrice.toLocaleString('tr-TR')} TL
                    </Text>
                  )}
                  {discount && (
                    <View style={styles.platformDiscount}>
                      <Text style={styles.platformDiscountText}>%{discount}</Text>
                    </View>
                  )}
                </View>
                <Ionicons name="open-outline" size={16} color={COLORS.textLight} style={{ marginLeft: 8 }} />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Tags */}
        {product.tags?.length > 0 && (
          <View style={styles.tagsSection}>
            {product.tags.map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SIZES.padding, paddingVertical: 12,
    backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: SIZES.lg, fontWeight: '700', color: COLORS.text, flex: 1, textAlign: 'center' },
  imageContainer: { backgroundColor: COLORS.surface, alignItems: 'center', paddingVertical: 20 },
  image: { width: '80%', height: 250, resizeMode: 'contain' },
  featuredBadge: {
    position: 'absolute', top: 12, left: 12,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.warning, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
  },
  featuredText: { color: '#fff', fontSize: SIZES.xs, fontWeight: '700' },
  infoSection: { padding: SIZES.padding, backgroundColor: COLORS.surface, marginBottom: 8 },
  brand: { fontSize: SIZES.sm, color: COLORS.textSecondary, fontWeight: '600', textTransform: 'uppercase', marginBottom: 4 },
  title: { fontSize: SIZES.xl, fontWeight: '700', color: COLORS.text, lineHeight: 28 },
  categoryTag: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.primaryLight, alignSelf: 'flex-start',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginTop: 10,
  },
  categoryText: { fontSize: SIZES.xs, color: COLORS.primary, fontWeight: '600' },
  bestPriceRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: COLORS.border,
  },
  bestPriceLabel: { fontSize: SIZES.md, color: COLORS.textSecondary, fontWeight: '500' },
  bestPrice: { fontSize: SIZES.xxl, fontWeight: '800', color: COLORS.primary },
  description: { fontSize: SIZES.md, color: COLORS.textSecondary, lineHeight: 22, marginTop: 12 },
  pricesSection: { padding: SIZES.padding, backgroundColor: COLORS.surface, marginBottom: 8 },
  pricesSectionTitle: { fontSize: SIZES.lg, fontWeight: '700', color: COLORS.text },
  pricesSub: { fontSize: SIZES.sm, color: COLORS.textSecondary, marginTop: 2, marginBottom: 16 },
  priceCard: {
    flexDirection: 'row', alignItems: 'center',
    padding: 14, borderRadius: SIZES.radiusSm, marginBottom: 10,
    backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border,
  },
  priceCardBest: { borderColor: COLORS.primary, backgroundColor: '#eff6ff' },
  bestTag: {
    position: 'absolute', top: -8, left: 12,
    backgroundColor: COLORS.primary, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4,
  },
  bestTagText: { color: '#fff', fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  priceCardLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  platformDot: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
  },
  platformInitial: { color: '#fff', fontSize: SIZES.base, fontWeight: '700' },
  platformName: { fontSize: SIZES.md, fontWeight: '600', color: COLORS.text },
  stockRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  stockDot: { width: 6, height: 6, borderRadius: 3 },
  stockText: { fontSize: SIZES.xs, fontWeight: '500' },
  priceCardRight: { alignItems: 'flex-end' },
  platformPrice: { fontSize: SIZES.lg, fontWeight: '700', color: COLORS.text },
  platformPriceBest: { color: COLORS.primary },
  platformOriginal: { fontSize: SIZES.xs, color: COLORS.textLight, textDecorationLine: 'line-through', marginTop: 2 },
  platformDiscount: { backgroundColor: '#fef2f2', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4, marginTop: 2 },
  platformDiscountText: { color: COLORS.discount, fontSize: 10, fontWeight: '700' },
  tagsSection: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: SIZES.padding },
  tag: { backgroundColor: COLORS.surface, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border },
  tagText: { fontSize: SIZES.sm, color: COLORS.textSecondary },
});
