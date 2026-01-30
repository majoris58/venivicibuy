import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../constants/theme';
import { getProducts } from '../lib/api';
import ProductCard from '../components/ProductCard';

const SORT_OPTIONS = [
  { key: 'newest', label: 'En Yeni' },
  { key: 'price_asc', label: 'Fiyat (Artan)' },
  { key: 'price_desc', label: 'Fiyat (Azalan)' },
  { key: 'popular', label: 'Populer' },
];

export default function CategoryProductsScreen({ route, navigation }) {
  const { categoryId, categoryName } = route.params;
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchProducts = async (p = 1, reset = false) => {
    try {
      const res = await getProducts({ category: categoryId, sort, page: p, limit: 20 });
      const newProducts = res.data.products;
      setProducts(reset ? newProducts : [...products, ...newProducts]);
      setHasMore(p < res.data.pagination.pages);
      setPage(p);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchProducts(1, true);
  }, [sort]);

  const loadMore = () => {
    if (hasMore && !loading) fetchProducts(page + 1);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{categoryName}</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Sort */}
      <View style={styles.sortRow}>
        {SORT_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.key}
            style={[styles.sortChip, sort === opt.key && styles.sortChipActive]}
            onPress={() => setSort(opt.key)}
          >
            <Text style={[styles.sortText, sort === opt.key && styles.sortTextActive]}>{opt.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading && products.length === 0 ? (
        <View style={styles.loader}><ActivityIndicator size="large" color={COLORS.primary} /></View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              horizontal
              onPress={() => navigation.navigate('ProductDetail', { productId: item._id })}
            />
          )}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={hasMore ? <ActivityIndicator style={{ marginVertical: 20 }} color={COLORS.primary} /> : null}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="bag-outline" size={48} color={COLORS.textLight} />
              <Text style={styles.emptyText}>Bu kategoride urun bulunamadi</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SIZES.padding, paddingVertical: 12,
    backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: SIZES.lg, fontWeight: '700', color: COLORS.text },
  sortRow: {
    flexDirection: 'row', paddingHorizontal: SIZES.padding, paddingVertical: 10,
    backgroundColor: COLORS.surface, gap: 8,
  },
  sortChip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
    backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border,
  },
  sortChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  sortText: { fontSize: SIZES.sm, color: COLORS.textSecondary, fontWeight: '500' },
  sortTextActive: { color: '#fff' },
  list: { padding: SIZES.padding },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: SIZES.md, color: COLORS.textSecondary, marginTop: 12 },
});
