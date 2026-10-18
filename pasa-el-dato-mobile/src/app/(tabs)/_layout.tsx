import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Redirect, Tabs } from 'expo-router';
import { Pressable, type View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Ref } from 'react';

import { colors } from '@/theme';
import {
  selectEstaAutenticado,
  selectHasHydrated,
  useSesionStore,
} from '@/stores/sesion-store';

// Grupo (tabs): menú inferior JS compacto estilo TikTok.
// AUTH queda fuera y no lo muestra.
export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const hasHydrated = useSesionStore(selectHasHydrated);
  const estaAutenticado = useSesionStore(selectEstaAutenticado);

  // Guarda de rutas: mientras no se lea el almacenamiento seguro no se decide
  // nada, para no expulsar al login a quien sí tiene sesión guardada.
  if (!hasHydrated) return null;
  if (!estaAutenticado) return <Redirect href="/auth/login" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.navy,
        tabBarInactiveTintColor: colors.muted,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          // Franja visual de 58 + área del sistema (no pisa el safe-area).
          height: 58 + insets.bottom,
          paddingTop: 6,
          paddingBottom: Math.max(insets.bottom, 4),
          backgroundColor: colors.card,
          borderTopWidth: 1,
          borderTopColor: colors.border,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          marginTop: 1,
        },
        tabBarIconStyle: {
          marginBottom: -1,
        },
        tabBarItemStyle: {
          paddingVertical: 0,
        },
        // Botón sin animación de presión (sin ripple ni burbuja).
        tabBarButton: (props) => (
          <Pressable
            {...props}
            ref={props.ref as unknown as Ref<View>}
            android_ripple={null}
          />
        ),
      }}>
      <Tabs.Screen
        name="inicio"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="home" size={23} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="buscar"
        options={{
          title: 'Buscar',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="magnify" size={23} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="publicar"
        options={{
          title: 'Publicar',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="plus-box" size={23} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="chats"
        options={{
          title: 'Chats',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="chat" size={23} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="account" size={23} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
