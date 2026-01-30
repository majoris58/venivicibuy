import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from './src/constants/theme';

import HomeScreen from './src/screens/HomeScreen';
import CategoriesScreen from './src/screens/CategoriesScreen';
import CategoryProductsScreen from './src/screens/CategoryProductsScreen';
import SearchScreen from './src/screens/SearchScreen';
import ProductDetailScreen from './src/screens/ProductDetailScreen';
import CampaignsScreen from './src/screens/CampaignsScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
      <Stack.Screen name="CategoryProducts" component={CategoryProductsScreen} />
    </Stack.Navigator>
  );
}

function CategoriesStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CategoriesMain" component={CategoriesScreen} />
      <Stack.Screen name="CategoryProducts" component={CategoryProductsScreen} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
    </Stack.Navigator>
  );
}

function SearchStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SearchMain" component={SearchScreen} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
    </Stack.Navigator>
  );
}

function CampaignsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CampaignsMain" component={CampaignsScreen} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;
            if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
            else if (route.name === 'Categories') iconName = focused ? 'grid' : 'grid-outline';
            else if (route.name === 'Search') iconName = focused ? 'search' : 'search-outline';
            else if (route.name === 'Campaigns') iconName = focused ? 'megaphone' : 'megaphone-outline';
            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: COLORS.primary,
          tabBarInactiveTintColor: COLORS.textLight,
          tabBarStyle: {
            backgroundColor: COLORS.surface,
            borderTopColor: COLORS.border,
            paddingBottom: 4,
            height: 60,
          },
          tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        })}
      >
        <Tab.Screen name="Home" component={HomeStack} options={{ tabBarLabel: 'Ana Sayfa' }} />
        <Tab.Screen name="Categories" component={CategoriesStack} options={{ tabBarLabel: 'Kategoriler' }} />
        <Tab.Screen name="Search" component={SearchStack} options={{ tabBarLabel: 'Ara' }} />
        <Tab.Screen name="Campaigns" component={CampaignsStack} options={{ tabBarLabel: 'Kampanyalar' }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
