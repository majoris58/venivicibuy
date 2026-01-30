import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Linking, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { getCampaigns } from '../lib/api';

export default function CampaignsScreen() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCampaigns()
      .then((res) => setCampaigns(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const openCampaign = async (campaign) => {
    const url = campaign.affiliateUrl || campaign.url;
    if (url) await Linking.openURL(url);
  };

  if (loading) {
    return <View style={styles.loader}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Kampanyalar</Text>
        <Text style={styles.headerSub}>Platformlardaki guncel firsatlar</Text>
      </View>

      <FlatList
        data={campaigns}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="megaphone-outline" size={48} color={COLORS.textLight} />
            <Text style={styles.emptyText}>Henuz aktif kampanya yok</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => openCampaign(item)} activeOpacity={0.8}>
            {item.image ? (
              <Image source={{ uri: item.image }} style={styles.cardImage} />
            ) : (
              <View style={[styles.cardImagePlaceholder, { backgroundColor: item.platform?.color || COLORS.primary }]}>
                {item.discountPercentage && (
                  <Text style={styles.bigDiscount}>%{item.discountPercentage}</Text>
                )}
                <Text style={styles.placeholderTitle} numberOfLines={2}>{item.title}</Text>
              </View>
            )}
            <View style={styles.cardBody}>
              <View style={styles.cardTop}>
                {item.platform && (
                  <View style={[styles.platformBadge, { backgroundColor: item.platform.color || '#666' }]}>
                    <Text style={styles.platformBadgeText}>{item.platform.name}</Text>
                  </View>
                )}
                {item.discountPercentage && item.image && (
                  <View style={styles.discountBadge}>
                    <Text style={styles.discountText}>%{item.discountPercentage} indirim</Text>
                  </View>
                )}
              </View>
              <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
              {item.description && (
                <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
              )}
              {item.endDate && (
                <View style={styles.dateRow}>
                  <Ionicons name="time-outline" size={12} color={COLORS.textLight} />
                  <Text style={styles.dateText}>
                    Son: {new Date(item.endDate).toLocaleDateString('tr-TR')}
                  </Text>
                </View>
              )}
              <View style={styles.ctaRow}>
                <Text style={styles.ctaText}>Kampanyaya Git</Text>
                <Ionicons name="arrow-forward" size={14} color={COLORS.primary} />
              </View>
            </View>
          </TouchableOpacity>
        )}
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
  list: { padding: SIZES.padding },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 },
  emptyText: { fontSize: SIZES.md, color: COLORS.textSecondary, marginTop: 12 },
  card: {
    backgroundColor: COLORS.surface, borderRadius: SIZES.radius,
    overflow: 'hidden', marginBottom: 16, ...SHADOWS.md,
  },
  cardImage: { width: '100%', height: 160, resizeMode: 'cover' },
  cardImagePlaceholder: {
    width: '100%', height: 140, justifyContent: 'center', alignItems: 'center', padding: 20,
  },
  bigDiscount: { color: '#fff', fontSize: 36, fontWeight: '900' },
  placeholderTitle: { color: 'rgba(255,255,255,0.9)', fontSize: SIZES.base, fontWeight: '600', textAlign: 'center', marginTop: 4 },
  cardBody: { padding: 14 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  platformBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  platformBadgeText: { color: '#fff', fontSize: SIZES.xs, fontWeight: '600' },
  discountBadge: { backgroundColor: '#fef2f2', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  discountText: { color: COLORS.discount, fontSize: SIZES.xs, fontWeight: '700' },
  cardTitle: { fontSize: SIZES.base, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  cardDesc: { fontSize: SIZES.sm, color: COLORS.textSecondary, lineHeight: 20 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  dateText: { fontSize: SIZES.xs, color: COLORS.textLight },
  ctaRow: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: COLORS.border,
  },
  ctaText: { fontSize: SIZES.md, fontWeight: '600', color: COLORS.primary },
});
