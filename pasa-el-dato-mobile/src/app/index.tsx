import { Redirect } from 'expo-router';

// La raíz redirige a la portada dentro de tabs (con menú inferior).
export default function Index() {
  return <Redirect href="/inicio" />;
}
