import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, FlatList, Image,
  StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { getProducts, getCategories, getCampaigns } from '../lib/api';
import ProductCard from '../components/ProductCard';

export default function HomeScreen({ navigation }) {
  const [featured, setFeatured] = useState([]);
  const [latest, setLatest] = useState([]);
  const [categories, setCategories] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const [featuredRes, latestRes, catRes, campRes] = await Promise.all([
        getProducts({ featured: 'true', limit: 10 }),
        getProducts({ sort: 'price_asc', limit: 10 }),
        getCategories({ root: 'true' }),
        getCampaigns(),
      ]);
      setFeatured(featuredRes.data.products);
      setLatest(latestRes.data.products);
      setCategories(catRes.data);
      setCampaigns(campRes.data);
    } catch (err) {
      console.error('Home fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const categoryIcons = {
    elektronik: 'phone-portrait',
    moda: 'shirt',
    'ev-yasam': 'home',
    'spor-outdoor': 'fitness',
    kozmetik: 'sparkles',
    'kitap-hobi': 'book',
    'anne-bebek': 'heart',
    supermarket: 'cart',
    'oyun-konsol': 'game-controller',
    otomotiv: 'car',
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>VeniViciBuy</Text>
          <Text style={styles.headerSubtitle}>En avantajli fiyatlari kesfet</Text>
        </View>
        <TouchableOpacity
          style={styles.searchButton}
          onPress={() => navigation.navigate('Search')}
        >
          <Ionicons name="search" size={22} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        {/* Campaigns Banner */}
        {campaigns.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.section} contentContainerStyle={{ paddingHorizontal: SIZES.padding }}>
            {campaigns.map((c) => (
              <TouchableOpacity key={c._id} style={styles.campaignCard} activeOpacity={0.8}>
                <View style={[styles.campaignBg, { backgroundColor: c.platform?.color || COLORS.primary }]}>
                  <View style={styles.campaignContent}>
                    {c.discountPercentage && (
                      <View style={styles.campaignBadge}>
                        <Text style={styles.campaignBadgeText}>%{c.discountPercentage}</Text>
                      </View>
                    )}
                    <Text style={styles.campaignTitle} numberOfLines={2}>{c.title}</Text>
                    {c.platform && <Text style={styles.campaignPlatform}>{c.platform.name}</Text>}
                    <View style={styles.campaignCta}>
                      <Text style={styles.campaignCtaText}>Kampanyaya Git</Text>
                      <Ionicons name="arrow-forward" size={14} color="#fff" />
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Categories */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Kategoriler</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Categories')}>
              <Text style={styles.seeAll}>Tumu</Text>
            </TouchableOpacity>
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

        {/* Featured Products */}
        {featured.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>One Cikan Firsatlar</Text>
              <Ionicons name="star" size={16} color={COLORS.warning} />
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

        {/* Latest / Best Price */}
        {latest.length > 0 && (
          <View style={[styles.section, { paddingHorizontal: SIZES.padding }]}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>En Uygun Fiyatlar</Text>
              <Ionicons name="trending-down" size={16} color={COLORS.success} />
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
  section: { marginTop: 20 },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SIZES.padding, marginBottom: 12,
  },
  sectionTitle: { fontSize: SIZES.lg, fontWeight: '700', color: COLORS.text },
  seeAll: { fontSize: SIZES.sm, color: COLORS.primary, fontWeight: '600' },
  // Categories
  categoryChip: { alignItems: 'center', marginRight: 16, width: 72 },
  categoryIcon: {
    width: 56, height: 56, borderRadius: 16, backgroundColor: COLORS.primaryLight,
    justifyContent: 'center', alignItems: 'center', marginBottom: 6,
  },
  categoryName: { fontSize: SIZES.xs, color: COLORS.text, fontWeight: '500', textAlign: 'center' },
  // Campaigns
  campaignCard: { width: 280, marginRight: 12, borderRadius: SIZES.radius, overflow: 'hidden' },
  campaignBg: { padding: 20, minHeight: 130, justifyContent: 'center' },
  campaignContent: {},
  campaignBadge: { backgroundColor: 'rgba(255,255,255,0.25)', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginBottom: 8 },
  campaignBadgeText: { color: '#fff', fontWeight: '800', fontSize: SIZES.lg },
  campaignTitle: { color: '#fff', fontSize: SIZES.base, fontWeight: '700', marginBottom: 4 },
  campaignPlatform: { color: 'rgba(255,255,255,0.8)', fontSize: SIZES.sm },
  campaignCta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 10 },
  campaignCtaText: { color: '#fff', fontSize: SIZES.sm, fontWeight: '600' },
});
