import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { getCategories } from '../lib/api';

const iconMap = {
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

const colorMap = {
  elektronik: '#3b82f6',
  moda: '#ec4899',
  'ev-yasam': '#22c55e',
  'spor-outdoor': '#f97316',
  kozmetik: '#a855f7',
  'kitap-hobi': '#06b6d4',
  'anne-bebek': '#f43f5e',
  supermarket: '#eab308',
  'oyun-konsol': '#6366f1',
  otomotiv: '#64748b',
};

export default function CategoriesScreen({ navigation }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCategories({ root: 'true' })
      .then((res) => setCategories(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <View style={styles.loader}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Kategoriler</Text>
        <Text style={styles.headerSub}>Aradaginiz urunu kategorilerde bulun</Text>
      </View>
      <FlatList
        data={categories}
        numColumns={2}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        columnWrapperStyle={styles.row}
        renderItem={({ item }) => {
          const color = colorMap[item.slug] || COLORS.primary;
          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate('CategoryProducts', { categoryId: item._id, categoryName: item.name })}
              activeOpacity={0.7}
            >
              <View style={[styles.iconWrap, { backgroundColor: color + '15' }]}>
                <Ionicons name={iconMap[item.slug] || 'pricetag'} size={28} color={color} />
              </View>
              <Text style={styles.categoryName}>{item.name}</Text>
              <Ionicons name="chevron-forward" size={16} color={COLORS.textLight} style={styles.arrow} />
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  header: {
    paddingHorizontal: SIZES.padding, paddingVertical: 16,
    backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  headerTitle: { fontSize: SIZES.xxl, fontWeight: '800', color: COLORS.text },
  headerSub: { fontSize: SIZES.sm, color: COLORS.textSecondary, marginTop: 4 },
  list: { padding: SIZES.padding / 2 },
  row: { justifyContent: 'space-between' },
  card: {
    backgroundColor: COLORS.surface, borderRadius: SIZES.radius,
    padding: 16, width: '48%', marginBottom: 12,
    alignItems: 'center', ...SHADOWS.sm,
  },
  iconWrap: {
    width: 56, height: 56, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center', marginBottom: 10,
  },
  categoryName: { fontSize: SIZES.md, fontWeight: '600', color: COLORS.text, textAlign: 'center' },
  arrow: { position: 'absolute', top: 12, right: 12 },
});
