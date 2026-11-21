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

const operacionesPendientes = new Map<string, Promise<void>>();

function encolar(nombre: string, operacion: () => Promise<void>): Promise<void> {
  const anterior = operacionesPendientes.get(nombre) ?? Promise.resolve();
  const actual = anterior.catch(() => undefined).then(operacion);
  operacionesPendientes.set(nombre, actual);
  void actual.finally(() => {
    if (operacionesPendientes.get(nombre) === actual) {
      operacionesPendientes.delete(nombre);
    }
  }).catch(() => undefined);
  return actual;
}

export const almacenamientoSeguro: StateStorage = {
  async getItem(nombre) {
    await operacionesPendientes.get(nombre);
    if (esWeb) {
      return sinLocalStorage() ? null : localStorage.getItem(nombre);
    }
    return SecureStore.getItemAsync(nombre);
  },

  setItem(nombre, valor) {
    return encolar(nombre, async () => {
      if (esWeb) {
        if (!sinLocalStorage()) localStorage.setItem(nombre, valor);
      } else {
        await SecureStore.setItemAsync(nombre, valor);
      }
    });
  },

  removeItem(nombre) {
    return encolar(nombre, async () => {
      if (esWeb) {
        if (!sinLocalStorage()) localStorage.removeItem(nombre);
      } else {
        await SecureStore.deleteItemAsync(nombre);
      }
    });
  },
};
