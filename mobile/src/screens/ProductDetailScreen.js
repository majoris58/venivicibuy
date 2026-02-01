import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, Image, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, Linking, PanResponder, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { getProduct, trackClick, getDealRating, submitDealRating } from '../lib/api';

const SLIDER_WIDTH = Dimensions.get('window').width - 32 - 32; // padding * 2 ve iç padding
const THUMB_SIZE = 28;

function getFingerprint() {
  // Basit cihaz parmak izi - üretimde daha gelişmiş bir yöntem kullanılabilir
  const id = `${Dimensions.get('window').width}-${Dimensions.get('window').height}-${require('react-native').Platform.OS}`;
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    const char = id.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return `mobile-${Math.abs(hash)}`;
}

function getRatingColor(rating) {
  if (rating >= 75) return '#22c55e';
  if (rating >= 50) return '#84cc16';
  if (rating >= 25) return '#f59e0b';
  return '#ef4444';
}

function getRatingLabel(rating) {
  if (rating >= 75) return 'Çok Avantajlı';
  if (rating >= 50) return 'Avantajlı';
  if (rating >= 25) return 'Orta';
  return 'Düşük Fırsat';
}

function getRatingEmoji(rating) {
  if (rating >= 75) return '🔥';
  if (rating >= 50) return '👍';
  if (rating >= 25) return '🤔';
  return '👎';
}

function DealRatingSlider({ productId }) {
  const [averageRating, setAverageRating] = useState(0);
  const [totalVotes, setTotalVotes] = useState(0);
  const [userRating, setUserRating] = useState(null);
  const [sliderValue, setSliderValue] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const sliderRef = useRef(null);
  const fingerprint = useRef(getFingerprint()).current;

  useEffect(() => {
    getDealRating(productId, fingerprint)
      .then((res) => {
        const data = res.data;
        setAverageRating(data.averageRating || 0);
        setTotalVotes(data.totalVotes || 0);
        if (data.userRating !== null && data.userRating !== undefined) {
          setUserRating(data.userRating);
          setSliderValue(data.userRating);
          setHasVoted(true);
        }
      })
      .catch(() => {});
  }, [productId]);

  const handleSliderMove = useCallback((pageX) => {
    if (sliderRef.current) {
      sliderRef.current.measure((x, y, width, height, px) => {
        const touchX = pageX - px;
        const pct = Math.max(0, Math.min(100, (touchX / width) * 100));
        setSliderValue(Math.round(pct));
      });
    }
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        setIsDragging(true);
        handleSliderMove(evt.nativeEvent.pageX);
      },
      onPanResponderMove: (evt) => {
        handleSliderMove(evt.nativeEvent.pageX);
      },
      onPanResponderRelease: () => {
        setIsDragging(false);
        handleSubmit();
      },
    })
  ).current;

  const handleSubmit = () => {
    submitDealRating(productId, sliderValue, fingerprint)
      .then((res) => {
        const data = res.data;
        setAverageRating(data.averageRating);
        setTotalVotes(data.totalVotes);
        setUserRating(data.userRating);
        setHasVoted(true);
      })
      .catch(() => {});
  };

  const barColor = getRatingColor(averageRating);
  const thumbColor = getRatingColor(sliderValue);

  return (
    <View style={rStyles.container}>
      <View style={rStyles.headerRow}>
        <View style={rStyles.headerLeft}>
          <Ionicons name="speedometer-outline" size={18} color={COLORS.textSecondary} />
          <Text style={rStyles.headerTitle}>Bu Fırsat Ne Kadar İyi?</Text>
        </View>
        <Text style={rStyles.votesText}>{totalVotes} oy</Text>
      </View>

      {/* Ortalama göstergesi */}
      {totalVotes > 0 && (
        <View style={rStyles.avgRow}>
          <View style={rStyles.avgBarBg}>
            <View style={[rStyles.avgBarFill, { width: `${averageRating}%`, backgroundColor: barColor }]} />
          </View>
          <View style={rStyles.avgLabelRow}>
            <Text style={[rStyles.avgScore, { color: barColor }]}>
              {getRatingEmoji(averageRating)} {averageRating}/100
            </Text>
            <Text style={[rStyles.avgLabel, { color: barColor }]}>
              {getRatingLabel(averageRating)}
            </Text>
          </View>
        </View>
      )}

      {/* Slider */}
      <View style={rStyles.sliderSection}>
        <Text style={rStyles.sliderLabel}>
          {hasVoted ? 'Oyunuzu güncelleyin:' : 'Değerlendirin:'}
        </Text>
        <View
          ref={sliderRef}
          style={rStyles.sliderTrack}
          {...panResponder.panHandlers}
        >
          {/* Gradient arka plan */}
          <View style={rStyles.gradientTrack}>
            <View style={[rStyles.gradientSegment, { flex: 1, backgroundColor: '#fee2e2' }]} />
            <View style={[rStyles.gradientSegment, { flex: 1, backgroundColor: '#fef3c7' }]} />
            <View style={[rStyles.gradientSegment, { flex: 1, backgroundColor: '#ecfccb' }]} />
            <View style={[rStyles.gradientSegment, { flex: 1, backgroundColor: '#dcfce7' }]} />
          </View>
          {/* Aktif dolgu */}
          <View style={[rStyles.sliderFill, {
            width: `${sliderValue}%`,
            backgroundColor: thumbColor,
          }]} />
          {/* Thumb */}
          <View style={[rStyles.thumb, {
            left: `${sliderValue}%`,
            backgroundColor: thumbColor,
            transform: [{ translateX: -(THUMB_SIZE / 2) }, { scale: isDragging ? 1.3 : 1 }],
          }]}>
            <Text style={rStyles.thumbText}>{sliderValue}</Text>
          </View>
        </View>
        <View style={rStyles.sliderLabels}>
          <Text style={[rStyles.sliderEndLabel, { color: '#ef4444' }]}>Düşük</Text>
          <Text style={[rStyles.sliderEndLabel, { color: '#f59e0b' }]}>Orta</Text>
          <Text style={[rStyles.sliderEndLabel, { color: '#84cc16' }]}>İyi</Text>
          <Text style={[rStyles.sliderEndLabel, { color: '#22c55e' }]}>Süper</Text>
        </View>
      </View>

      {hasVoted && (
        <Text style={rStyles.votedText}>
          ✓ Oyunuz kaydedildi ({userRating}/100)
        </Text>
      )}
    </View>
  );
}

const rStyles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    marginTop: 8,
    padding: SIZES.padding,
  },
  headerRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: SIZES.md, fontWeight: '700', color: COLORS.text },
  votesText: { fontSize: SIZES.xs, color: COLORS.textLight },
  avgRow: { marginBottom: 16 },
  avgBarBg: {
    height: 8, backgroundColor: '#f1f5f9', borderRadius: 4, overflow: 'hidden',
  },
  avgBarFill: {
    height: '100%', borderRadius: 4,
  },
  avgLabelRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6,
  },
  avgScore: { fontSize: SIZES.sm, fontWeight: '700' },
  avgLabel: { fontSize: SIZES.sm, fontWeight: '600' },
  sliderSection: { marginTop: 4 },
  sliderLabel: { fontSize: SIZES.xs, color: COLORS.textSecondary, marginBottom: 10, fontWeight: '500' },
  sliderTrack: {
    height: 32, justifyContent: 'center', position: 'relative',
  },
  gradientTrack: {
    position: 'absolute', left: 0, right: 0, height: 12, borderRadius: 6,
    flexDirection: 'row', overflow: 'hidden', top: 10,
  },
  gradientSegment: {},
  sliderFill: {
    position: 'absolute', left: 0, height: 12, borderRadius: 6, top: 10, opacity: 0.6,
  },
  thumb: {
    position: 'absolute', top: 2,
    width: THUMB_SIZE, height: THUMB_SIZE, borderRadius: THUMB_SIZE / 2,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 3, borderColor: '#fff',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2, shadowRadius: 4, elevation: 4,
  },
  thumbText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  sliderLabels: {
    flexDirection: 'row', justifyContent: 'space-between', marginTop: 6,
  },
  sliderEndLabel: { fontSize: 10, fontWeight: '600' },
  votedText: {
    fontSize: SIZES.xs, color: COLORS.success, fontWeight: '600',
    marginTop: 10, textAlign: 'center',
  },
});

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

  const handleBuy = async () => {
    try {
      const res = await trackClick(productId);
      const url = res.data.url;
      if (url) await Linking.openURL(url);
    } catch {
      const fallbackUrl = product.affiliateUrl || product.url;
      if (fallbackUrl) await Linking.openURL(fallbackUrl);
    }
  };

  if (loading) {
    return <View style={styles.loader}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
  }

  if (!product) return null;

  const discountPercent = product.originalPrice && product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : null;

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
          {discountPercent && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>%{discountPercent} indirim</Text>
            </View>
          )}
        </View>

        {/* Product Info */}
        <View style={styles.infoSection}>
          {product.brand && <Text style={styles.brand}>{product.brand}</Text>}
          <Text style={styles.title}>{product.title}</Text>

          <View style={styles.metaRow}>
            {product.category && (
              <View style={styles.categoryTag}>
                <Ionicons name="pricetag-outline" size={12} color={COLORS.primary} />
                <Text style={styles.categoryText}>{product.category.name}</Text>
              </View>
            )}
            {product.platform && (
              <View style={[styles.platformTag, { backgroundColor: product.platform.color || '#666' }]}>
                <Text style={styles.platformTagText}>{product.platform.name}</Text>
              </View>
            )}
          </View>

          {/* Price */}
          <View style={styles.priceSection}>
            <View>
              <Text style={styles.priceLabel}>Fiyat</Text>
              <Text style={styles.price}>{product.price?.toLocaleString('tr-TR')} TL</Text>
            </View>
            {product.originalPrice && (
              <View>
                <Text style={styles.originalLabel}>Eski Fiyat</Text>
                <Text style={styles.originalPrice}>{product.originalPrice.toLocaleString('tr-TR')} TL</Text>
              </View>
            )}
          </View>

          {product.description && (
            <Text style={styles.description}>{product.description}</Text>
          )}
        </View>

        {/* Deal Rating Slider */}
        <DealRatingSlider productId={productId} />

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

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Sticky Buy Button */}
      <View style={styles.buyBar}>
        <View style={styles.buyBarLeft}>
          <Text style={styles.buyBarPrice}>{product.price?.toLocaleString('tr-TR')} TL</Text>
          {product.platform && (
            <View style={styles.buyBarPlatformRow}>
              <View style={[styles.buyBarDot, { backgroundColor: product.platform.color || '#666' }]} />
              <Text style={styles.buyBarPlatform}>{product.platform.name}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity style={styles.buyButton} onPress={handleBuy} activeOpacity={0.8}>
          <Ionicons name="open-outline" size={18} color="#fff" />
          <Text style={styles.buyButtonText}>Incele</Text>
        </TouchableOpacity>
      </View>
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
  discountBadge: {
    position: 'absolute', top: 12, right: 12,
    backgroundColor: COLORS.discount, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
  },
  discountText: { color: '#fff', fontSize: SIZES.sm, fontWeight: '700' },
  infoSection: { padding: SIZES.padding, backgroundColor: COLORS.surface, marginBottom: 8 },
  brand: { fontSize: SIZES.sm, color: COLORS.textSecondary, fontWeight: '600', textTransform: 'uppercase', marginBottom: 4 },
  title: { fontSize: SIZES.xl, fontWeight: '700', color: COLORS.text, lineHeight: 28 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  categoryTag: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.primaryLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
  },
  categoryText: { fontSize: SIZES.xs, color: COLORS.primary, fontWeight: '600' },
  platformTag: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
  },
  platformTagText: { color: '#fff', fontSize: SIZES.xs, fontWeight: '600' },
  priceSection: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 20,
    marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: COLORS.border,
  },
  priceLabel: { fontSize: SIZES.xs, color: COLORS.textSecondary, marginBottom: 2 },
  price: { fontSize: SIZES.xxxl, fontWeight: '800', color: COLORS.primary },
  originalLabel: { fontSize: SIZES.xs, color: COLORS.textLight, marginBottom: 2 },
  originalPrice: { fontSize: SIZES.lg, color: COLORS.textLight, textDecorationLine: 'line-through' },
  description: { fontSize: SIZES.md, color: COLORS.textSecondary, lineHeight: 22, marginTop: 16 },
  tagsSection: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: SIZES.padding },
  tag: { backgroundColor: COLORS.surface, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border },
  tagText: { fontSize: SIZES.sm, color: COLORS.textSecondary },
  // Buy bar
  buyBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, paddingBottom: 24,
    backgroundColor: COLORS.surface, borderTopWidth: 1, borderTopColor: COLORS.border,
    ...SHADOWS.lg,
  },
  buyBarLeft: {},
  buyBarPrice: { fontSize: SIZES.xl, fontWeight: '800', color: COLORS.text },
  buyBarPlatformRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  buyBarDot: { width: 8, height: 8, borderRadius: 4 },
  buyBarPlatform: { fontSize: SIZES.xs, color: COLORS.textSecondary, fontWeight: '500' },
  buyButton: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.primary, paddingHorizontal: 28, paddingVertical: 14,
    borderRadius: SIZES.radius,
  },
  buyButtonText: { color: '#fff', fontSize: SIZES.base, fontWeight: '700' },
});
