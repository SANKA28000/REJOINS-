import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from './src/context/AuthProvider';
import { supabaseConfigured } from './src/lib/supabaseClient';

function MainScreen() {
  const { session, loading, signIn, signUp, signOut } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit() {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Informations manquantes', 'Indique ton e-mail et ton mot de passe.');
      return;
    }

    if (isRegistering && !name.trim()) {
      Alert.alert('Prénom manquant', 'Indique ton prénom.');
      return;
    }    if (!supabaseConfigured) {
      Alert.alert(
        'Configuration nécessaire',
        'La connexion à Supabase doit être configurée avant de créer un compte.'
      );
      return;
    }

    
      Alert.alert('Configuration nécessaire', 'La connexion à Supabase devra être configurée avant de créer un compte.');
      return;
    }

    setBusy(true);

    try {
      const result = isRegistering
        ? await signUp(email.trim(), password, name.trim())
        : await signIn(email.trim(), password);

      if (result.error) {
        Alert.alert('Erreur', result.error);
      } else if (result.message) {
        Alert.alert('Inscription', result.message);
      } else {
        Alert.alert('REJOINS', isRegistering ? 'Inscription effectuée.' : 'Connexion réussie.');
      }
    } catch {
      Alert.alert('Erreur', 'Une erreur est survenue. Réessaie.');
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#176B55" />
      </View>
    );
  }

  if (session) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.content}>
          <Text style={styles.logo}>REJOINS</Text>
          <Text style={styles.slogan}>Il y a du monde dehors.</Text>
          <Text style={styles.heading}>Bienvenue !</Text>
          <Text style={styles.description}>
            Tu es connecté. Les activités et les rencontres de proximité arrivent bientôt.
          </Text>
          <TouchableOpacity style={styles.button} onPress={signOut}>
            <Text style={styles.buttonText}>Me déconnecter</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.content}>
        <Text style={styles.logo}>REJOINS</Text>
        <Text style={styles.slogan}>Il y a du monde dehors.</Text>

        <Text style={styles.heading}>
          {isRegistering ? 'Créer mon compte' : 'Retrouvons-nous dehors'}
        </Text>

        <Text style={styles.description}>
          {isRegistering
            ? 'Rejoins les personnes près de chez toi.'
            : 'Des rencontres simples, des activités et de l’entraide près de chez toi.'}
        </Text>

        {!supabaseConfigured && (
          <Text style={styles.warning}>
            La connexion à la base de données reste à configurer.
          </Text>
        )}

        {isRegistering && (
          <TextInput
            style={styles.input}
            placeholder="Ton prénom"
            value={name}
            onChangeText={setName}
          />
        )}

        <TextInput
          style={styles.input}
          placeholder="Adresse e-mail"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder="Mot de passe"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={styles.button}
          onPress={handleSubmit}
          disabled={busy}
        >
          {busy ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>
              {isRegistering ? 'Créer mon compte' : 'Se connecter'}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setIsRegistering(!isRegistering)}
          style={styles.switchButton}
        >
          <Text style={styles.switchText}>
            {isRegistering
              ? 'J’ai déjà un compte'
              : 'Je veux créer un compte'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainScreen />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F7F2',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F7F2',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  logo: {
    fontSize: 38,
    fontWeight: '800',
    color: '#176B55',
    letterSpacing: 2,
    textAlign: 'center',
  },
  slogan: {
    fontSize: 16,
    color: '#65736D',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 45,
  },
  heading: {
    fontSize: 26,
    fontWeight: '700',
    color: '#202A27',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#65736D',
    marginBottom: 24,
  },
  warning: {
    color: '#9A5B16',
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCE3DE',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 14,
  },
  button: {
    backgroundColor: '#176B55',
    borderRadius: 12,
    padding: 17,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  switchButton: {
    padding: 18,
    alignItems: 'center',
  },
  switchText: {
    color: '#176B55',
    fontSize: 15,
    fontWeight: '600',
  },
});
