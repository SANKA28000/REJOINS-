import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import * as ImagePicker from 'expo-image-picker';
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
  max_participants: number | null;
};

const PHOTO_BY_CATEGORY: Record<string, string> = {
  Football: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1000',
  Sport: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1000',
  Sortie: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1000',
  Culture: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=1000',
  Repas: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1000',
  Autre: 'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=1000',
};

function AppContent() {
  const { session, loading, signIn, signUp, signOut } = useAuth();

  const [tab, setTab] = useState<Tab>('Accueil');
  const [events, setEvents] = useState<EventItem[]>([]);
  const [memberships, setMemberships] = useState<string[]>([]);
  const [participantCounts, setParticipantCounts] = useState<Record<string, number>>({});
  const [participantProfiles, setParticipantProfiles] = useState<Record<string, any[]>>({});
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [profileFirstName, setProfileFirstName] = useState('');
  const [profileLastName, setProfileLastName] = useState('');
  const [profileCity, setProfileCity] = useState('');
  const [profileBio, setProfileBio] = useState('');
  const [profileInterests, setProfileInterests] = useState('');
  const [profileAvatarUrl, setProfileAvatarUrl] = useState('');
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Sortie');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [place, setPlace] = useState('');
  const [accessible, setAccessible] = useState(false);
  const [maxParticipants, setMaxParticipants] = useState('16');

  const userId = session?.user?.id;
  async function loadProfile() {
  if (!userId) return;

  const { data, error } = await supabase
    .from('profiles')
    .select('first_name, last_name, city, bio, interests, avatar_url')
    .eq('id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    setMessage('Impossible de charger le profil.');
    return;
  }

  if (data) {
    setProfileFirstName(data.first_name || '');
    setProfileLastName(data.last_name || '');
    setProfileCity(data.city || '');
    setProfileBio(data.bio || '');
    setProfileInterests(data.interests || '');
    setProfileAvatarUrl(data.avatar_url || '');
  }
}
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
      .select('event_id, user_id');

    if (!joinedError && joined) {
      const counts: Record<string, number> = {};

      joined.forEach((item: any) => {
        counts[item.event_id] = (counts[item.event_id] || 0) + 1;
      });

      setParticipantCounts(counts);
      setMemberships(
        joined
          .filter((item: any) => item.user_id === userId)
          .map((item: any) => item.event_id)
      );
    
     const participantIds = [...new Set(joined.map((item: any) => item.user_id))];

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url')
        .in('id', participantIds);
      setMessage(profilesError ? 'Erreur profils : ' + profilesError.message : 'Profils récupérés : ' + (profiles?.length || 0));
      
        setMessage(profilesError ? 'Erreur profils : ' + profilesError.message : 'Profils récupérés : ' + (profiles?.length || 0));
        const profilesById: Record<string, any> = {};

        profiles.forEach((profile: any) => {
          profilesById[profile.id] = profile;
        });

        const byEvent: Record<string, any[]> = {}; 

        joined.forEach((item: any) => {
          const profile = profilesById[item.user_id];

          if (profile) {
            if (!byEvent[item.event_id]) {
              byEvent[item.event_id] = [];
            }
            byEvent[item.event_id].push(profile);
          }
        });

        setParticipantProfiles(byEvent);
      console.log('PROFILS PAR ACTIVITÉ :', byEvent);
      }
    setBusy(false);
  }

  useEffect(() => {
  loadEvents();
  loadProfile();
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

    const event = events.find((item) => item.id === eventId);
    if (!event) return;

    const currentCount = participantCounts[eventId] || 0;
    const maximum = event.max_participants || 16;
    const alreadyJoined = memberships.includes(eventId);

    if (!alreadyJoined && currentCount >= maximum) {
      setMessage('Cette activité est complète.');
      return;
    }

    setBusy(true);
    setMessage('');

    if (alreadyJoined) {
      const { error } = await supabase
        .from('event_members')
        .delete()
        .eq('event_id', eventId)
        .eq('user_id', userId);

      if (error) {
        setMessage('Impossible de quitter cette activité.');
      } else {
        setMemberships((current) => current.filter((id) => id !== eventId));
        setParticipantCounts((current) => ({
          ...current,
          [eventId]: Math.max(0, (current[eventId] || 0) - 1),
        }));
        setMessage('Tu as quitté cette activité.');
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
        setParticipantCounts((current) => ({
          ...current,
          [eventId]: (current[eventId] || 0) + 1,
        }));
        setMessage('Tu as rejoint cette activité !');
      }
    }

    setBusy(false);
  }
  async function saveProfile() {
  if (!userId) return;

  setProfileLoading(true);
  setMessage('');

  const { error } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      first_name: profileFirstName.trim(),
      last_name: profileLastName.trim(),
      city: profileCity.trim(),
      bio: profileBio.trim(),
      interests: profileInterests.trim(),
      avatar_url: profileAvatarUrl,
    }, { onConflict: 'id' });

  setProfileLoading(false);

  if (error) {
    setMessage('Impossible d’enregistrer le profil.');
    return;
  }

  setEditingProfile(false);
  setMessage('Ton profil a bien été enregistré !');
}
  async function chooseProfilePhoto() {
  if (!userId) return;

  const permission =
    await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    setMessage('Autorise l’accès à tes photos.');
    return;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });

  if (result.canceled || !result.assets[0]) return;

  setProfileLoading(true);
  setMessage('');

  try {
    const asset = result.assets[0];
    const extension = asset.uri.split('.').pop()?.split('?')[0] || 'jpg';
    const response = await fetch(asset.uri);
    const blob = await response.blob();
    const filePath = `${userId}/avatar.${extension}`;

    const { error } = await supabase.storage
      .from('Avatars')
      .upload(filePath, blob, {
        contentType: blob.type || 'image/jpeg',
        upsert: true,
      });

    if (error) throw error;

    const { data } = supabase.storage
      .from('Avatars')
      .getPublicUrl(filePath);

    setProfileAvatarUrl(data.publicUrl);
    setMessage('Photo ajoutée !');
  } catch (error) {
    setMessage('Erreur photo : ' + String(error));
  }

  setProfileLoading(false);
}
  async function createEvent() {
    if (!userId) return;

    if (!title.trim() || !date.trim() || !time.trim()) {
      setMessage('Ajoute un titre, une date et une heure.');
      return;
    }

    const maximum = Number(maxParticipants);

    if (!Number.isInteger(maximum) || maximum < 1) {
      setMessage('Indique un nombre de places valide.');
      return;
    }

    const startDate = new Date(`${date}T${time}`);

    if (Number.isNaN(startDate.getTime()) || startDate <= new Date()) {
      setMessage('Choisis une date et une heure dans le futur.');
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
      max_participants: maximum,
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
    setMaxParticipants('16');

    setMessage('Ton activité a bien été créée !');
    setTab('Découvrir');
    loadEvents();
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#A78BFA" />
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
            Les rencontres commencent ici.
          </Text>

          {isSignup && (
           <TextInput
              style={styles.input}
              placeholder="Ton prénom"
              placeholderTextColor="#85849A"
              value={name}
              onChangeText={setName}
            />
          )}

          <TextInput
            style={styles.input}
            placeholder="Adresse e-mail"
            placeholderTextColor="#85849A"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <View style={{ position: 'relative', marginBottom: 13 }}>
  <TextInput
    style={[styles.input, { marginBottom: 0, paddingRight: 55 }]}
    placeholder="Mot de passe"
    placeholderTextColor="#85849A"
    value={password}
    onChangeText={setPassword}
    secureTextEntry={!showPassword}
  />

  <TouchableOpacity
    onPress={() => setShowPassword(!showPassword)}
    style={{ position: 'absolute', right: 15, top: 15 }}
  >
    <Text style={{ color: '#C4B5FD', fontSize: 18 }}>
      {showPassword ? '◉̸' : '◉'}
    </Text>
  </TouchableOpacity>
</View>

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
    const count = participantCounts[event.id] || 0;
    const maximum = event.max_participants || 16;
    const full = count >= maximum && !joined;
    const photo = PHOTO_BY_CATEGORY[event.category] || PHOTO_BY_CATEGORY.Autre;

    return (
      <View key={event.id} style={styles.eventCard}>
        <ImageBackground
          source={{ uri: photo }}
          style={styles.eventPhoto}
          imageStyle={styles.eventPhotoImage}
        >
          <View style={styles.photoOverlay}>
            <Text style={styles.photoCategory}>{event.category}</Text>
          </View>
        </ImageBackground>

        <View style={styles.eventBody}>
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

          <View style={styles.capacityRow}>
  <Text style={styles.capacityText}>
    {count} / {maximum} participants
  </Text>
  <View style={{ marginTop: 12, marginBottom: 12 }}>
    <Text style={styles.capacityText}>Participants :</Text>

    <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 }}>
      {(participantProfiles[event.id] || []).map((participant: any) => (
        <View
          key={participant.id}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginRight: 12,
            marginBottom: 8,
          }}
        >
          {participant.avatar_url ? (
            <Image
              source={{ uri: participant.avatar_url }}
              style={{ width: 32, height: 32, borderRadius: 16, marginRight: 6 }}
            />
          ) : null}

          <Text style={styles.capacityText}>
            {[participant.first_name, participant.last_name]
              .filter(Boolean)
              .join(' ') || 'Membre'}
          </Text>
        </View>
      ))}
   </View>
 </View>
)}
         <View style={styles.progressBackground}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.min(100, (count / maximum) * 100)}%` },
              ]}
            />
          </View>

          <TouchableOpacity
            style={[
              joined ? styles.secondaryButton : styles.primaryButton,
              full && styles.disabledButton,
            ]}
            onPress={() => joinEvent(event.id)}
            disabled={busy || full}
          >
            <Text
              style={[
                joined
                  ? styles.secondaryButtonText
                  : styles.primaryButtonText,
                full && styles.disabledButtonText,
              ]}
            >
              {joined ? 'Ne plus participer' : full ? 'Activité complète' : 'Rejoindre'}
            </Text>
          </TouchableOpacity>
        </View>
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
            <Text style={styles.primaryButtonText}>Découvrir les activités</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => setTab('Créer')}
          >
            <Text style={styles.secondaryButtonText}>Proposer une activité</Text>
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
            <Text style={styles.secondaryButtonText}>Actualiser les activités</Text>
          </TouchableOpacity>

          {busy ? (
            <ActivityIndicator color="#A78BFA" />
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
            placeholderTextColor="#85849A"
            value={title}
            onChangeText={setTitle}
          />

          <Text style={styles.fieldLabel}>Catégorie</Text>
          <View style={styles.categoryRow}>
            {['Sortie', 'Sport', 'Football', 'Culture', 'Repas', 'Autre'].map((item) => (
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
            placeholderTextColor="#85849A"
            value={description}
            onChangeText={setDescription}
            multiline
          />

          <TextInput
            style={styles.input}
            placeholder="Date (AAAA-MM-JJ)"
            placeholderTextColor="#85849A"
            value={date}
            onChangeText={setDate}
          />

          <TextInput
            style={styles.input}
            placeholder="Heure (ex. 18:30)"
            placeholderTextColor="#85849A"
            value={time}
            onChangeText={setTime}
          />

          <TextInput
            style={styles.input}
            placeholder="Lieu de rendez-vous"
            placeholderTextColor="#85849A"
            value={place}
            onChangeText={setPlace}
          />

          <TextInput
            style={styles.input}
            placeholder="Nombre maximum de participants (ex. 16)"
            placeholderTextColor="#85849A"
            value={maxParticipants}
            onChangeText={setMaxParticipants}
            keyboardType="number-pad"
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
            1. Découvre les activités près de chez toi.
          </Text>
          <Text style={styles.helpText}>
            2. Rejoins une activité qui te plaît.
          </Text>
          <Text style={styles.helpText}>
            3. Crée tes propres activités.
          </Text>
          <Text style={styles.helpText}>
            4. Consulte ton profil pour gérer ton compte.
          </Text>
        </View>
      );
    } 
            
   return (
      <View>
        <Text style={styles.heading}>Mon profil</Text>
        {profileAvatarUrl ? (
          <Image
            source={{ uri: profileAvatarUrl }}
            style={{
              width: 110,
              height: 110,
              borderRadius: 55,
              alignSelf: 'center',
              marginBottom: 15,
            }}
          />
        ) : null}

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={chooseProfilePhoto}
        >
          <Text style={styles.secondaryButtonText}>Choisir ma photo</Text>
        </TouchableOpacity>

        <Text style={styles.subtitle}>
          Connecté avec : {session.user.email}
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Prénom"
          value={profileFirstName}
          onChangeText={setProfileFirstName}
        />

        <TextInput
          style={styles.input}
          placeholder="Nom"
          value={profileLastName}
          onChangeText={setProfileLastName}
        />

        <TextInput
          style={styles.input}
          placeholder="Ville"
          value={profileCity}
          onChangeText={setProfileCity}
        />

        <TextInput
          style={[styles.input, styles.multiline]}
          placeholder="Présente-toi"
          value={profileBio}
          onChangeText={setProfileBio}
          multiline
        />

        <TextInput
          style={styles.input}
          placeholder="Mes centres d'intérêt"
          value={profileInterests}
          onChangeText={setProfileInterests}
        />

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={saveProfile}
        >
          <Text style={styles.primaryButtonText}>
            Enregistrer mon profil
          </Text>
        </TouchableOpacity>

        <Text style={styles.eventInfo}>
          Activités rejointes : {memberships.length}
        </Text>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={signOut}
        >
          <Text style={styles.primaryButtonText}>Me déconnecter</Text>
        </TouchableOpacity>
      </View>
    );
  }
 const tabs: Tab[] = ['Accueil', 'Découvrir', 'Créer', 'Aide', 'Profil'];

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
    backgroundColor: '#101020',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#101020',
  },
  authContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#101020',
  },
  logo: {
    fontSize: 38,
    fontWeight: '900',
    color: '#A78BFA',
    textAlign: 'center',
    marginBottom: 20,
    letterSpacing: 3,
  },
  heading: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    color: '#B5B2C9',
    lineHeight: 23,
    marginBottom: 22,
  },
  muted: {
    color: '#B5B2C9',
    fontSize: 15,
    marginTop: 12,
    marginBottom: 12,
  },
  header: {
    padding: 20,
    backgroundColor: '#19182B',
    borderBottomWidth: 1,
    borderBottomColor: '#302D49',
  },
  headerLogo: {
    fontSize: 26,
    fontWeight: '900',
    color: '#A78BFA',
    letterSpacing: 2,
  },
  headerSubtitle: {
    color: '#B5B2C9',
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  contentInner: {
    padding: 18,
    paddingBottom: 35,
  },
  input: {
    backgroundColor: '#211F35',
    borderWidth: 1,
    borderColor: '#393550',
    borderRadius: 13,
    padding: 15,
    fontSize: 15,
    marginBottom: 13,
    color: '#FFFFFF',
  },
  multiline: {
    minHeight: 95,
    textAlignVertical: 'top',
  },
  primaryButton: {
    backgroundColor: '#7657E8',
    padding: 15,
    borderRadius: 13,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
  secondaryButton: {
    backgroundColor: '#292642',
    padding: 14,
    borderRadius: 13,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#49416F',
  },
  secondaryButtonText: {
    color: '#C4B5FD',
    fontWeight: '700',
    fontSize: 15,
  },
  disabledButton: {
    backgroundColor: '#393747',
    borderColor: '#393747',
  },
  disabledButtonText: {
    color: '#A5A1B4',
  },
  link: {
    textAlign: 'center',
    color: '#C4B5FD',
    fontWeight: '700',
    marginTop: 18,
  },
  message: {
    color: '#DDD6FE',
    backgroundColor: '#292642',
    padding: 12,
    borderRadius: 10,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 22,
    marginBottom: 12,
  },
  eventCard: {
    backgroundColor: '#19182B',
    borderRadius: 18,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#302D49',
    overflow: 'hidden',
  },
  eventPhoto: {
    height: 165,
    justifyContent: 'flex-end',
  },
  eventPhotoImage: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },
  photoOverlay: {
    backgroundColor: 'rgba(10, 10, 25, 0.55)',
    padding: 12,
  },
  photoCategory: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  eventBody: {
    padding: 16,
  },
  eventTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  eventDescription: {
    color: '#C1BED0',
    lineHeight: 21,
    marginBottom: 10,
  },
  eventInfo: {
    color: '#C1BED0',
    fontSize: 14,
    marginTop: 7,
  },
  capacityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    marginTop: 15,
    marginBottom: 8,
  },
  capacityText: {
    color: '#C4B5FD',
    fontSize: 12,
    fontWeight: '800',
  },
  progressBackground: {
    height: 7,
    backgroundColor: '#393550',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressFill: {
    height: 7,
    backgroundColor: '#A78BFA',
    borderRadius: 10,
  },
  fieldLabel: {
    color: '#FFFFFF',
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
    borderColor: '#49445F',
    borderRadius: 20,
    paddingVertical: 9,
    paddingHorizontal: 13,
    marginRight: 7,
    marginBottom: 7,
    backgroundColor: '#211F35',
  },
  categorySelected: {
    backgroundColor: '#7657E8',
    borderColor: '#7657E8',
  },
  categoryButtonText: {
    color: '#D0CDDF',
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
    color: '#C1BED0',
    lineHeight: 24,
    marginBottom: 13,
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#19182B',
    borderTopWidth: 1,
    borderTopColor: '#302D49',
    paddingVertical: 14,
  },
  navItem: {
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  navText: {
    fontSize: 11,
    color: '#85849A',
    fontWeight: '600',
  },
  navTextActive: {
    color: '#C4B5FD',
    fontWeight: '900',
  },
});
