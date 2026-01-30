import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, FlatList, Image,
  StyleSheet, ActivityIndicator, RefreshControl, Dimensions, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { getProducts, getCategories, getBanners } from '../lib/api';
import ProductCard from '../components/ProductCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BANNER_WIDTH = SCREEN_WIDTH - 32;

export default function HomeScreen({ navigation }) {
  const [banners, setBanners] = useState([]);
  const [dealOfDay, setDealOfDay] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [latest, setLatest] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeBanner, setActiveBanner] = useState(0);
  const bannerRef = useRef(null);

  const fetchData = async () => {
    try {
      const [bannerRes, dealRes, featuredRes, latestRes, catRes] = await Promise.all([
        getBanners(),
        getProducts({ dealOfDay: 'true', limit: 6 }),
        getProducts({ featured: 'true', limit: 10 }),
        getProducts({ limit: 10 }),
        getCategories({ root: 'true' }),
      ]);
      setBanners(bannerRes.data);
      setDealOfDay(dealRes.data.products);
      setFeatured(featuredRes.data.products);
      setLatest(latestRes.data.products);
      setCategories(catRes.data);
    } catch (err) {
      console.error('Home fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Auto-scroll banners
  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setActiveBanner((prev) => {
        const next = (prev + 1) % banners.length;
        bannerRef.current?.scrollToOffset({ offset: next * (BANNER_WIDTH + 12), animated: true });
        return next;
      });
    }, 4000);
    return () => clearInterval(timer);
  }, [banners.length]);

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  if (loading) {
    return <View style={styles.loader}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
  }

  const categoryIcons = {
    elektronik: 'phone-portrait', moda: 'shirt', 'ev-yasam': 'home',
    'spor-outdoor': 'fitness', kozmetik: 'sparkles', 'kitap-hobi': 'book',
    'anne-bebek': 'heart', supermarket: 'cart', 'oyun-konsol': 'game-controller', otomotiv: 'car',
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>VeniViciBuy</Text>
          <Text style={styles.headerSubtitle}>Avantajli firsatlar seni bekliyor</Text>
        </View>
        <TouchableOpacity style={styles.searchButton} onPress={() => navigation.getParent()?.navigate('Search')}>
          <Ionicons name="search" size={22} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        {/* Banner Slider */}
        {banners.length > 0 && (
          <View style={styles.bannerSection}>
            <FlatList
              ref={bannerRef}
              data={banners}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              snapToInterval={BANNER_WIDTH + 12}
              decelerationRate="fast"
              contentContainerStyle={{ paddingHorizontal: SIZES.padding }}
              onMomentumScrollEnd={(e) => {
                const idx = Math.round(e.nativeEvent.contentOffset.x / (BANNER_WIDTH + 12));
                setActiveBanner(idx);
              }}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.bannerCard}
                  activeOpacity={0.9}
                  onPress={() => {
                    const url = item.affiliateUrl || item.url;
                    if (url) Linking.openURL(url);
                  }}
                >
                  <Image source={{ uri: item.image }} style={styles.bannerImage} />
                  <View style={styles.bannerOverlay}>
                    <Text style={styles.bannerTitle} numberOfLines={1}>{item.title}</Text>
                    {item.subtitle && <Text style={styles.bannerSubtitle} numberOfLines={1}>{item.subtitle}</Text>}
                  </View>
                </TouchableOpacity>
              )}
            />
            {/* Dots */}
            {banners.length > 1 && (
              <View style={styles.dotsRow}>
                {banners.map((_, i) => (
                  <View key={i} style={[styles.dot, activeBanner === i && styles.dotActive]} />
                ))}
              </View>
            )}
          </View>
        )}

        {/* Categories */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Kategoriler</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: SIZES.padding }}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat._id}
                style={styles.categoryChip}
                onPress={() => navigation.navigate('CategoryProducts', { categoryId: cat._id, categoryName: cat.name })}
              >
                <View style={styles.categoryIcon}>
                  <Ionicons name={categoryIcons[cat.slug] || 'pricetag'} size={20} color={COLORS.primary} />
                </View>
                <Text style={styles.categoryName} numberOfLines={1}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Deal of the Day */}
        {dealOfDay.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.dealHeader}>
                <Ionicons name="flame" size={18} color={COLORS.discount} />
                <Text style={styles.sectionTitle}>Gunun Firsati</Text>
              </View>
            </View>
            <FlatList
              data={dealOfDay}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: SIZES.padding }}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <ProductCard
                  product={item}
                  onPress={() => navigation.navigate('ProductDetail', { productId: item._id })}
                />
              )}
            />
          </View>
        )}

        {/* Featured */}
        {featured.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.dealHeader}>
                <Ionicons name="star" size={16} color={COLORS.warning} />
                <Text style={styles.sectionTitle}>One Cikan Firsatlar</Text>
              </View>
            </View>
            <FlatList
              data={featured}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: SIZES.padding }}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <ProductCard
                  product={item}
                  onPress={() => navigation.navigate('ProductDetail', { productId: item._id })}
                />
              )}
            />
          </View>
        )}

        {/* Latest */}
        {latest.length > 0 && (
          <View style={[styles.section, { paddingHorizontal: SIZES.padding }]}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Son Eklenenler</Text>
            </View>
            {latest.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
                horizontal
                onPress={() => navigation.navigate('ProductDetail', { productId: product._id })}
              />
            ))}
          </View>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SIZES.padding, paddingVertical: 12,
    backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  headerTitle: { fontSize: SIZES.xl, fontWeight: '800', color: COLORS.primary },
  headerSubtitle: { fontSize: SIZES.sm, color: COLORS.textSecondary, marginTop: 2 },
  searchButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' },
  // Banner
  bannerSection: { marginTop: 16 },
  bannerCard: { width: BANNER_WIDTH, marginRight: 12, borderRadius: SIZES.radius, overflow: 'hidden' },
  bannerImage: { width: '100%', height: 160, resizeMode: 'cover' },
  bannerOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 14, backgroundColor: 'rgba(0,0,0,0.35)',
  },
  bannerTitle: { color: '#fff', fontSize: SIZES.base, fontWeight: '700' },
  bannerSubtitle: { color: 'rgba(255,255,255,0.85)', fontSize: SIZES.sm, marginTop: 2 },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 10, gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.border },
  dotActive: { width: 18, backgroundColor: COLORS.primary },
  // Sections
  section: { marginTop: 24 },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SIZES.padding, marginBottom: 12,
  },
  sectionTitle: { fontSize: SIZES.lg, fontWeight: '700', color: COLORS.text },
  dealHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  // Categories
  categoryChip: { alignItems: 'center', marginRight: 16, width: 72 },
  categoryIcon: {
    width: 52, height: 52, borderRadius: 16, backgroundColor: COLORS.primaryLight,
    justifyContent: 'center', alignItems: 'center', marginBottom: 6,
  },
  categoryName: { fontSize: SIZES.xs, color: COLORS.text, fontWeight: '500', textAlign: 'center' },
});
