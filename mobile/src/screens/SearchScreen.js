import React, { useState } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../constants/theme';
import { getProducts } from '../lib/api';
import ProductCard from '../components/ProductCard';

export default function SearchScreen({ navigation }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    Keyboard.dismiss();
    setLoading(true);
    setSearched(true);
    try {
      const res = await getProducts({ search: query.trim(), limit: 50 });
      setResults(res.data.products);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Urun Ara</Text>
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchInputWrap}>
          <Ionicons name="search" size={18} color={COLORS.textLight} />
          <TextInput
            style={styles.searchInput}
            placeholder="Urun, marka veya kategori ara..."
            placeholderTextColor={COLORS.textLight}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => { setQuery(''); setResults([]); setSearched(false); }}>
              <Ionicons name="close-circle" size={18} color={COLORS.textLight} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
          <Text style={styles.searchBtnText}>Ara</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>
      ) : !searched ? (
        <View style={styles.center}>
          <Ionicons name="search-outline" size={64} color={COLORS.border} />
          <Text style={styles.hintText}>Aradiginiz urunu yukaridaki alana yazin</Text>
        </View>
      ) : results.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="sad-outline" size={48} color={COLORS.textLight} />
          <Text style={styles.emptyText}>"{query}" icin sonuc bulunamadi</Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              horizontal
              onPress={() => navigation.navigate('ProductDetail', { productId: item._id })}
            />
          )}
          ListHeaderComponent={
            <Text style={styles.resultCount}>{results.length} sonuc bulundu</Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    paddingHorizontal: SIZES.padding, paddingVertical: 12,
    backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  headerTitle: { fontSize: SIZES.xxl, fontWeight: '800', color: COLORS.text },
  searchRow: {
    flexDirection: 'row', paddingHorizontal: SIZES.padding, paddingVertical: 12,
    backgroundColor: COLORS.surface, gap: 8,
  },
  searchInputWrap: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.background, borderRadius: SIZES.radiusSm,
    paddingHorizontal: 12, gap: 8, borderWidth: 1, borderColor: COLORS.border,
  },
  searchInput: { flex: 1, fontSize: SIZES.md, color: COLORS.text, paddingVertical: 10 },
  searchBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 16, borderRadius: SIZES.radiusSm, justifyContent: 'center' },
  searchBtnText: { color: '#fff', fontWeight: '600', fontSize: SIZES.md },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  hintText: { fontSize: SIZES.md, color: COLORS.textSecondary, marginTop: 16, textAlign: 'center' },
  emptyText: { fontSize: SIZES.md, color: COLORS.textSecondary, marginTop: 12, textAlign: 'center' },
  list: { padding: SIZES.padding },
  resultCount: { fontSize: SIZES.sm, color: COLORS.textSecondary, marginBottom: 12, fontWeight: '500' },
});
