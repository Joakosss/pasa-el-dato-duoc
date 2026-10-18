import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import type { StateStorage } from 'zustand/middleware';

// expo-secure-store cifra en Android (Keystore) e iOS (Keychain).
// No existe para web: ahí se usa localStorage, que no cifra y solo aplica al
// navegador. La app móvil es el objetivo; la web Expo es un extra de dev.
const esWeb = Platform.OS === 'web';

// El prerender estático de Expo web ejecuta en Node, donde localStorage no
// existe: se accede siempre dentro de las funciones, nunca al importar.
const sinLocalStorage = (): boolean => typeof localStorage === 'undefined';

export const almacenamientoSeguro: StateStorage = {
  async getItem(nombre) {
    if (esWeb) {
      return sinLocalStorage() ? null : localStorage.getItem(nombre);
    }
    // getItemAsync resuelve null si no hay entrada para la clave.
    return SecureStore.getItemAsync(nombre);
  },

  async setItem(nombre, valor) {
    if (esWeb) {
      if (!sinLocalStorage()) localStorage.setItem(nombre, valor);
      return;
    }
    // Las claves de SecureStore solo admiten alfanuméricos, ".", "-" y "_".
    await SecureStore.setItemAsync(nombre, valor);
  },

  async removeItem(nombre) {
    if (esWeb) {
      if (!sinLocalStorage()) localStorage.removeItem(nombre);
      return;
    }
    await SecureStore.deleteItemAsync(nombre);
  },
};
