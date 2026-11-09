import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { AuthProvider, useAuth } from './src/context/AuthProvider';
import { supabase, supabaseConfigured } from './src/lib/supabaseClient';

type Tab = 'Accueil' | 'Découvrir' | 'Créer' | 'Aide' | 'Profil';

type EventItem = {
  id: string;
  creator_id: string;
  title: string;
  category: string;
  description: string | null;
  starts_at: string;
  place_name: string | null;
  wheelchair_accessible: boolean;
};

function AppContent() {
  const { session, loading, signIn, signUp, signOut } = useAuth();

  const [tab, setTab] = useState<Tab>('Accueil');
  const [events, setEvents] = useState<EventItem[]>([]);
  const [memberships, setMemberships] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSignup, setIsSignup] = useState(false);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Sortie');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [place, setPlace] = useState('');
  const [accessible, setAccessible] = useState(false);

  const userId = session?.user?.id;

  async function loadEvents() {
    if (!userId) return;

    setBusy(true);

    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('starts_at', { ascending: true });

    if (error) {
      setMessage('Impossible de charger les activités.');
      setBusy(false);
      return;
    }

    setEvents((data || []) as EventItem[]);

    const { data: joined, error: joinedError } = await supabase
      .from('event_members')
      .select('event_id')
      .eq('user_id', userId);

    if (!joinedError) {
      setMemberships((joined || []).map((item: any) => item.event_id));
    }

    setBusy(false);
  }

  useEffect(() => {
    loadEvents();
  }, [userId]);

  async function handleAuth() {
    setMessage('');

    if (!email.trim() || !password.trim()) {
      setMessage('Renseigne ton e-mail et ton mot de passe.');
      return;
    }

    setBusy(true);

    const result = isSignup
      ? await signUp(email.trim(), password, name.trim())
      : await signIn(email.trim(), password);

    setBusy(false);

    if (result.error) {
      setMessage(result.error);
    } else {
      setMessage(result.message || 'Connexion réussie.');
    }
  }

  async function joinEvent(eventId: string) {
    if (!userId) return;

    setBusy(true);
    setMessage('');

    if (memberships.includes(eventId)) {
      const { error } = await supabase
        .from('event_members')
        .delete()
        .eq('event_id', eventId)
        .eq('user_id', userId);

      if (error) {
        setMessage('Impossible de quitter cette activité.');
      } else {
        setMemberships((current) =>
          current.filter((id) => id !== eventId)
        );
      }
    } else {
      const { error } = await supabase
        .from('event_members')
        .insert({
          event_id: eventId,
          user_id: userId,
        });

      if (error) {
        setMessage('Impossible de rejoindre cette activité.');
      } else {
        setMemberships((current) => [...current, eventId]);
        setMessage('Tu as rejoint cette activité !');
      }
    }

    setBusy(false);
  }

  async function createEvent() {
    if (!userId) return;

    if (!title.trim() || !date.trim() || !time.trim()) {
      setMessage('Ajoute un titre, une date et une heure.');
      return;
    }

    const startDate = new Date(`${date}T${time}`);

    if (Number.isNaN(startDate.getTime())) {
      setMessage('La date ou l’heure est incorrecte.');
      return;
    }

    setBusy(true);
    setMessage('');

    const { error } = await supabase.from('events').insert({
      creator_id: userId,
      title: title.trim(),
      category,
      description: description.trim(),
      starts_at: startDate.toISOString(),
      place_name: place.trim(),
      wheelchair_accessible: accessible,
    });

    setBusy(false);

    if (error) {
      setMessage('La création a échoué. Réessaie.');
      return;
    }

    setTitle('');
    setDescription('');
    setDate('');
    setTime('');
    setPlace('');
    setAccessible(false);

    setMessage('Ton activité a bien été créée !');
    setTab('Découvrir');
    loadEvents();
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6C63FF" />
        <Text style={styles.muted}>Chargement de REJOINS...</Text>
      </View>
    );
  }

  if (!supabaseConfigured) {
    return (
      <View style={styles.center}>
        <Text style={styles.logo}>REJOINS</Text>
        <Text style={styles.heading}>Configuration nécessaire</Text>
        <Text style={styles.muted}>
          La connexion à la base de données n'est pas configurée.
        </Text>
      </View>
    );
  }

  if (!session) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.authContainer}>
          <Text style={styles.logo}>REJOINS</Text>
          <Text style={styles.heading}>
            {isSignup ? 'Créer un compte' : 'Bienvenue !'}
          </Text>
          <Text style={styles.subtitle}>
            Rencontrons-nous autour d'activités près de chez nous.
          </Text>

          {isSignup && (
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
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <TextInput
            style={styles.input}
            placeholder="Mot de passe"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {message ? <Text style={styles.message}>{message}</Text> : null}

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleAuth}
            disabled={busy}
          >
            <Text style={styles.primaryButtonText}>
              {busy
                ? 'Patiente...'
                : isSignup
                  ? 'Créer mon compte'
                  : 'Me connecter'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setIsSignup(!isSignup);
              setMessage('');
            }}
          >
            <Text style={styles.link}>
              {isSignup
                ? 'J’ai déjà un compte'
                : 'Créer un nouveau compte'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  function renderEvent(event: EventItem) {
    const joined = memberships.includes(event.id);

    return (
      <View key={event.id} style={styles.eventCard}>
        <Text style={styles.category}>{event.category}</Text>
        <Text style={styles.eventTitle}>{event.title}</Text>

        {event.description ? (
          <Text style={styles.eventDescription}>
            {event.description}
          </Text>
        ) : null}

        <Text style={styles.eventInfo}>
          📅 {new Date(event.starts_at).toLocaleString('fr-FR')}
        </Text>

        {event.place_name ? (
          <Text style={styles.eventInfo}>📍 {event.place_name}</Text>
        ) : null}

        {event.wheelchair_accessible ? (
          <Text style={styles.eventInfo}>♿ Accessible en fauteuil</Text>
        ) : null}

        <TouchableOpacity
          style={joined ? styles.secondaryButton : styles.primaryButton}
          onPress={() => joinEvent(event.id)}
          disabled={busy}
        >
          <Text
            style={
              joined
                ? styles.secondaryButtonText
                : styles.primaryButtonText
            }
          >
            {joined ? 'Ne plus participer' : 'Rejoindre'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  function renderContent() {
    if (tab === 'Accueil') {
      return (
        <View>
          <Text style={styles.heading}>Bienvenue sur REJOINS !</Text>
          <Text style={styles.subtitle}>
            Fais de nouvelles rencontres et partage de bons moments.
          </Text>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => setTab('Découvrir')}
          >
            <Text style={styles.primaryButtonText}>
              Découvrir les activités
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => setTab('Créer')}
          >
            <Text style={styles.secondaryButtonText}>
              Proposer une activité
            </Text>
          </TouchableOpacity>

          <Text style={styles.sectionTitle}>Activités à venir</Text>
          {events.slice(0, 3).map(renderEvent)}
        </View>
      );
    }

    if (tab === 'Découvrir') {
      return (
        <View>
          <Text style={styles.heading}>Découvrir</Text>
          <Text style={styles.subtitle}>
            Trouve une activité et rejoins les participants.
          </Text>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={loadEvents}
          >
            <Text style={styles.secondaryButtonText}>
              Actualiser les activités
            </Text>
          </TouchableOpacity>

          {busy ? (
            <ActivityIndicator color="#6C63FF" />
          ) : events.length === 0 ? (
            <Text style={styles.muted}>
              Aucune activité pour le moment. Tu peux en créer une !
            </Text>
          ) : (
            events.map(renderEvent)
          )}
        </View>
      );
    }

    if (tab === 'Créer') {
      return (
        <View>
          <Text style={styles.heading}>Créer une activité</Text>
          <Text style={styles.subtitle}>
            Propose un moment sympa à partager.
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Titre de l'activité"
            value={title}
            onChangeText={setTitle}
          />

          <Text style={styles.fieldLabel}>Catégorie</Text>
          <View style={styles.categoryRow}>
            {['Sortie', 'Sport', 'Culture', 'Repas', 'Autre'].map((item) => (
              <TouchableOpacity
                key={item}
                style={[
                  styles.categoryButton,
                  category === item && styles.categorySelected,
                ]}
                onPress={() => setCategory(item)}
              >
                <Text
                  style={
                    category === item
                      ? styles.categorySelectedText
                      : styles.categoryButtonText
                  }
                >
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            style={[styles.input, styles.multiline]}
            placeholder="Décris ton activité"
            value={description}
            onChangeText={setDescription}
            multiline
          />

          <TextInput
            style={styles.input}
            placeholder="Date (AAAA-MM-JJ)"
            value={date}
            onChangeText={setDate}
          />

          <TextInput
            style={styles.input}
            placeholder="Heure (ex. 18:30)"
            value={time}
            onChangeText={setTime}
          />

          <TextInput
            style={styles.input}
            placeholder="Lieu de rendez-vous"
            value={place}
            onChangeText={setPlace}
          />

          <TouchableOpacity
            style={styles.accessibilityRow}
            onPress={() => setAccessible(!accessible)}
          >
            <Text style={styles.eventInfo}>
              {accessible ? '☑' : '☐'} Accessible en fauteuil roulant
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={createEvent}
            disabled={busy}
          >
            <Text style={styles.primaryButtonText}>
              {busy ? 'Création...' : 'Publier mon activité'}
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (tab === 'Aide') {
      return (
        <View>
          <Text style={styles.heading}>Besoin d'aide ?</Text>
          <Text style={styles.sectionTitle}>Comment fonctionne REJOINS ?</Text>
          <Text style={styles.helpText}>
            1. Découvre les activités proposées près de chez toi.
          </Text>
          <Text style={styles.helpText}>
            2. Rejoins une activité qui te plaît.
          </Text>
          <Text style={styles.helpText}>
            3. Crée tes propres activités et invite d'autres personnes.
          </Text>
          <Text style={styles.helpText}>
            4. Consulte ton profil pour gérer ta connexion.
          </Text>
        </View>
      );
    }

    return (
      <View>
        <Text style={styles.heading}>Mon profil</Text>
        <Text style={styles.subtitle}>
          Connecté avec : {session.user.email}
        </Text>
        <Text style={styles.eventInfo}>
          Activités rejointes : {memberships.length}
        </Text>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={loadEvents}
        >
          <Text style={styles.secondaryButtonText}>
            Actualiser mon profil
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={signOut}
        >
          <Text style={styles.primaryButtonText}>
            Me déconnecter
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const tabs: Tab[] = [
    'Accueil',
    'Découvrir',
    'Créer',
    'Aide',
    'Profil',
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerLogo}>REJOINS</Text>
        <Text style={styles.headerSubtitle}>Les rencontres commencent ici</Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentInner}
      >
        {message ? <Text style={styles.message}>{message}</Text> : null}
        {renderContent()}
      </ScrollView>

      <View style={styles.navigation}>
        {tabs.map((item) => (
          <TouchableOpacity
            key={item}
            style={styles.navItem}
            onPress={() => {
              setTab(item);
              setMessage('');
            }}
          >
            <Text
              style={[
                styles.navText,
                tab === item && styles.navTextActive,
              ]}
            >
              {item}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7FC',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F7F7FC',
  },
  authContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  logo: {
    fontSize: 34,
    fontWeight: '900',
    color: '#6C63FF',
    textAlign: 'center',
    marginBottom: 20,
  },
  heading: {
    fontSize: 26,
    fontWeight: '800',
    color: '#25243A',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    color: '#77768A',
    lineHeight: 23,
    marginBottom: 22,
  },
  muted: {
    color: '#77768A',
    fontSize: 15,
    marginTop: 12,
    marginBottom: 12,
  },
  header: {
    padding: 18,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEF5',
  },
  headerLogo: {
    fontSize: 24,
    fontWeight: '900',
    color: '#6C63FF',
  },
  headerSubtitle: {
    color: '#77768A',
    marginTop: 3,
  },
  content: {
    flex: 1,
  },
  contentInner: {
    padding: 20,
    paddingBottom: 35,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E4EF',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    marginBottom: 13,
    color: '#25243A',
  },
  multiline: {
    minHeight: 95,
    textAlignVertical: 'top',
  },
  primaryButton: {
    backgroundColor: '#6C63FF',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  secondaryButton: {
    backgroundColor: '#EEEEFF',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 12,
  },
  secondaryButtonText: {
    color: '#554CE0',
    fontWeight: '700',
    fontSize: 15,
  },
  link: {
    textAlign: 'center',
    color: '#6C63FF',
    fontWeight: '700',
    marginTop: 18,
  },
  message: {
    color: '#554CE0',
    backgroundColor: '#EEEEFF',
    padding: 12,
    borderRadius: 10,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#25243A',
    marginTop: 22,
    marginBottom: 12,
  },
  eventCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 17,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#EEEEF5',
  },
  category: {
    color: '#6C63FF',
    fontWeight: '700',
    marginBottom: 7,
  },
  eventTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#25243A',
    marginBottom: 8,
  },
  eventDescription: {
    color: '#666579',
    lineHeight: 21,
    marginBottom: 10,
  },
  eventInfo: {
    color: '#666579',
    fontSize: 14,
    marginTop: 7,
  },
  fieldLabel: {
    color: '#25243A',
    fontWeight: '700',
    marginBottom: 10,
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 14,
  },
  categoryButton: {
    borderWidth: 1,
    borderColor: '#DDDCEA',
    borderRadius: 20,
    paddingVertical: 9,
    paddingHorizontal: 13,
    marginRight: 7,
    marginBottom: 7,
    backgroundColor: '#FFFFFF',
  },
  categorySelected: {
    backgroundColor: '#6C63FF',
    borderColor: '#6C63FF',
  },
  categoryButtonText: {
    color: '#55546A',
  },
  categorySelectedText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  accessibilityRow: {
    paddingVertical: 12,
  },
  helpText: {
    fontSize: 15,
    color: '#55546A',
    lineHeight: 24,
    marginBottom: 13,
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EEEEF5',
    paddingVertical: 13,
  },
  navItem: {
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  navText: {
    fontSize: 11,
    color: '#858498',
    fontWeight: '600',
  },
  navTextActive: {
    color: '#6C63FF',
    fontWeight: '900',
  },
});

