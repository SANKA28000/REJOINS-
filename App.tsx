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
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

type Tab = 'Accueil' | 'Découvrir' | 'Créer' | 'Membres' | 'Aide' | 'Profil';
type ChatMessage = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  sender_name?: string;
};
type DirectMember = {
  member_id: string;
  first_name: string;
  last_name: string;
  city: string | null;
  bio: string | null;
  avatar_url: string | null;
  interests: string | null;
  is_verified: boolean;
};
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
  Randonnée: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=1000',
  Sortie: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1000',
  Culture: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=1000',
  Musique: 'https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?w=1000',
  Repas: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1000',
  Senegal: 'https://commons.wikimedia.org/wiki/Special:FilePath/Thi%C3%A9bou%20dieune.jpg?width=1000',
  Autre: 'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=1000',
};

function AppContent() {
    useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator
    ) {
      navigator.serviceWorker
        .register('/sw.js')
        .catch((error) => {
          console.error(
            'Erreur service worker REJOINS :',
            error
          );
        });
    }
  }, []);
  const { session, loading, signIn, signUp, signOut } = useAuth();

  const [tab, setTab] = useState<Tab>('Accueil');
  const [events, setEvents] = useState<EventItem[]>([]);
  const [externalEvents, setExternalEvents] = useState<any[]>([]);
  const [memberships, setMemberships] = useState<string[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatDraft, setChatDraft] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [directMembers, setDirectMembers] = useState<DirectMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [selectedChatTitle, setSelectedChatTitle] = useState('');
  const [selectedDirectMember, setSelectedDirectMember] =
  useState<DirectMember | null>(null);
  const [chatConversationId, setChatConversationId] = useState<string | null>(null);
  const [participantCounts, setParticipantCounts] = useState<Record<string, number>>({});
  useEffect(() => {
  if (!chatConversationId) return;

  const channel = supabase
    .channel(`chat-${chatConversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${chatConversationId}`,
      },
      (payload) => {
        const newMessage = payload.new as ChatMessage;

        setChatMessages((current) =>
          current.some((message) => message.id === newMessage.id)
            ? current
            : [...current, newMessage]
        );
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [chatConversationId]);
  
  
  
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
const [date, setDate] = useState(
  new Date(Date.now() + 86400000).toISOString().slice(0, 10)
);
const [time, setTime] = useState('');
const [showPreview, setShowPreview] = useState(false);
const [calendarMonth, setCalendarMonth] = useState(new Date());
const [selectedDay, setSelectedDay] = useState(new Date(date + 'T12:00:00'));

const [place, setPlace] = useState('');
const [accessible, setAccessible] = useState(false);
const [maxParticipants, setMaxParticipants] = useState('16');

const changeCalendarMonth = (amount: number) => {
  setCalendarMonth(
    new Date(
      calendarMonth.getFullYear(),
      calendarMonth.getMonth() + amount,
      1
    )
  );
};

const firstDayOfMonth =
  (new Date(
    calendarMonth.getFullYear(),
    calendarMonth.getMonth(),
    1
  ).getDay() + 6) % 7;

const daysInMonth = new Date(
  calendarMonth.getFullYear(),
  calendarMonth.getMonth() + 1,
  0
).getDate();

const calendarDays = [
  ...Array(firstDayOfMonth).fill(null),
  ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
];

const selectCalendarDay = (day: number) => {
  const selected = new Date(
    calendarMonth.getFullYear(),
    calendarMonth.getMonth(),
    day
  );

  const formattedDate = [
    selected.getFullYear(),
    String(selected.getMonth() + 1).padStart(2, '0'),
    String(selected.getDate()).padStart(2, '0'),
  ].join('-');

  setDate(formattedDate);
  setSelectedDay(selected);
  setShowCalendar(false);
};

const userId = session?.user?.id;
const tabs: Tab[] = ['Accueil', 'Découvrir', 'Créer', 'Membres', 'Aide', 'Profil'];

  async function openChat(eventId: string) {
  if (!userId) return;

  setSelectedChat(eventId);
  setChatLoading(true);
  setChatMessages([]);
  setChatConversationId(null);

  const { data: conversation, error: conversationError } = await supabase
    .from('conversations')
    .select('id')
    .eq('event_id', eventId)
    .single();

  if (conversationError || !conversation) {
    setMessage('Impossible de trouver la conversation.');
    setChatLoading(false);
    return;
  }

  setChatConversationId(conversation.id);

  const { data: messages, error } = await supabase
    .from('messages')
    .select('id, conversation_id, sender_id, body, created_at')
    .eq('conversation_id', conversation.id)
    .order('created_at', { ascending: true });

  if (error) {
    setMessage('Impossible de charger les messages.');
  } else {
    setChatMessages(messages || []);
  }

  setChatLoading(false);
}
  
async function sendChatMessage() {
  if (!userId || !chatConversationId || !chatDraft.trim()) return;

  const body = chatDraft.trim();

  const { data: insertedMessage, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: chatConversationId,
      sender_id: userId,
      body,
    })
    .select('id')
    .single();

  if (error || !insertedMessage) {
    setMessage('Impossible d’envoyer le message.');
    return;
  }

  const { error: pushError } = await supabase.functions.invoke(
    'send-push',
    {
      body: {
        message_id: insertedMessage.id,
      },
    }
  );

  if (pushError) {
    console.error('Erreur notification REJOINS :', pushError);
  }

  setChatDraft('');

  if (selectedDirectMember && chatConversationId) {
    const { data } = await supabase
      .from('messages')
      .select('id, conversation_id, sender_id, body, created_at')
      .eq('conversation_id', chatConversationId)
      .order('created_at', { ascending: true });

    if (data) setChatMessages(data);
  } else if (selectedChat) {
    await openChat(selectedChat);
  }
}

  async function loadDirectMembers() {

  setMembersLoading(true);

  const { data, error } = await supabase.rpc('list_active_members');

  if (error) {

    setMessage('Impossible de charger les membres.');

  } else {

    setDirectMembers(data || []);

  }

  setMembersLoading(false);

}

useEffect(() => {

  if (tab === 'Membres') {

    loadDirectMembers();

  }

}, [tab]);

async function openDirectChat(member: DirectMember) {
  setMembersLoading(true);
  setSelectedDirectMember(member);
  setSelectedChat(`direct:${member.member_id}`);
  setSelectedChatTitle(
    `${member.first_name} ${member.last_name}`
  );
  setChatMessages([]);
  setChatConversationId(null);

  const { data: conversationId, error } = await supabase.rpc(
    'create_direct_conversation',
    { p_other_user: member.member_id }
  );

  if (error || !conversationId) {
    setMessage('Impossible d’ouvrir cette conversation.');
    setMembersLoading(false);
    return;
  }

  setChatConversationId(conversationId);

  const { data, error: messagesError } = await supabase
    .from('messages')
    .select('id, conversation_id, sender_id, body, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (messagesError) {
    setMessage('Impossible de charger les messages.');
  } else {
    setChatMessages(data || []);
  }

  setMembersLoading(false);
}
  
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
   await loadExternalEvents(data?.city || '');
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
        const profilesById: Record<string, any> = {};

        (profiles || []).forEach((profile: any) => {
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
  async function loadExternalEvents(city: string) {
  const { data, error } = await supabase.functions.invoke('get-events', {
  method: 'POST',
  body: { city },
});

  if (error) {
    console.error('Erreur DATAtourisme :', error);
    return;
  }

  setExternalEvents(data?.objects || []);
 
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
        setParticipantProfiles((current) => ({
  ...current,
  [eventId]: (current[eventId] || []).filter(
    (participant) => participant.id !== userId
  ),
}));
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
        await loadEvents();
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

  async function enablePushNotifications() {
    if (!userId) {
      setMessage('Connecte-toi pour activer les notifications.');
      return;
    }

    try {
      if (
        typeof window === 'undefined' ||
        !('serviceWorker' in navigator) ||
        typeof Notification === 'undefined' ||
        typeof PushManager === 'undefined'
      ) {
        setMessage('Les notifications ne sont pas disponibles sur cet appareil.');
        return;
      }

      const vapidPublicKey =
        process.env.EXPO_PUBLIC_VAPID_PUBLIC_KEY;

      if (!vapidPublicKey) {
        setMessage('Configuration des notifications manquante.');
        return;
      }

      let permission = Notification.permission;

      if (permission === 'default') {
        permission = await Notification.requestPermission();
      }

      if (permission !== 'granted') {
        setMessage('Autorise les notifications dans les réglages de ton iPhone.');
        return;
      }

      const registration = await navigator.serviceWorker.ready;

      let subscription =
        await registration.pushManager.getSubscription();

      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey:
            urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
        });
      }

      const subscriptionData = subscription.toJSON();
      const p256dh = subscriptionData.keys?.p256dh;
      const auth = subscriptionData.keys?.auth;

      if (!subscription.endpoint || !p256dh || !auth) {
        setMessage('Impossible de créer l’abonnement aux notifications.');
        return;
      }

      const { data: existing } = await supabase
        .from('push_subscriptions')
        .select('id')
        .eq('endpoint', subscription.endpoint)
        .maybeSingle();

      if (!existing) {
        const { error } = await supabase
          .from('push_subscriptions')
          .insert({
            user_id: userId,
            endpoint: subscription.endpoint,
            p256dh,
            auth,
          });

        if (error) throw error;
      }

      setMessage('Notifications activées sur cet appareil !');
    } catch (error) {
      console.error('Erreur notifications REJOINS :', error);
      setMessage('Impossible d’activer les notifications. Réessaie.');
    }
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

    const [year, month, day] = date.split('-').map(Number);
const [hours, minutes] = time.split(':').map(Number);

const startDate = new Date(year, month - 1, day, hours, minutes);

if (
  !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
  !Number.isInteger(day) ||
  !Number.isInteger(month) ||
  !Number.isInteger(year) ||
  !Number.isInteger(hours) ||
  !Number.isInteger(minutes) ||
  month < 1 ||
  month > 12 ||
  day < 1 ||
  day > 31 ||
  hours < 0 ||
  hours > 23 ||
  minutes < 0 ||
  minutes > 59 ||
  startDate.getDate() !== day ||
  startDate.getMonth() !== month - 1 ||
  startDate.getFullYear() !== year
) {
  setMessage('Vérifie la date et l’heure.');
  return;
}

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
  console.log('ERREUR CRÉATION ACTIVITÉ :', error);
  setMessage(error.message);
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

  const eventText = `${event.title} ${event.description || ''}`.toLowerCase();

  const photo =
  /sénégal|senegal|thiéboudienne|thieboudienne/.test(eventText)
    ? PHOTO_BY_CATEGORY.Senegal
    : /cuisine|repas|restaurant|dîner|déjeuner/.test(eventText)
    ? PHOTO_BY_CATEGORY.Repas
    : /randonnée|randonnee|marche|marche à pied|course|jogging/.test(eventText)
    ? PHOTO_BY_CATEGORY.Randonnée
    : /football|foot|match/.test(eventText)
    ? PHOTO_BY_CATEGORY.Football
    : /musique|concert|danse|soirée musicale|chant|karaoké/.test(eventText)
    ? PHOTO_BY_CATEGORY.Musique
    : /exposition|musée|culture|africaine|africain/.test(eventText)
    ? PHOTO_BY_CATEGORY.Culture
    : PHOTO_BY_CATEGORY[event.category] || PHOTO_BY_CATEGORY.Autre;

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

          <Text style={styles.capacityText}>

            {full ? 'COMPLET' : `${maximum - count} places restantes`}

          </Text>

        </View>

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

        <TouchableOpacity

          style={styles.secondaryButton}

          onPress={() => openChat(event.id)}

        >

          <Text style={styles.secondaryButtonText}>

            💬 Discussion de l’activité

          </Text>

        </TouchableOpacity>

      </View>

    </View>

  );

}
  function renderContent() {
    
if (tab === 'Accueil') {
  const categories = [
    {
      name: 'Sorties',
      photo: 'https://images.unsplash.com/photo-1758272133786-ee98adcc6837?w=700',
    },
    {
      name: 'Sport',
      photo: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=700',
    },
    {
      name: 'Culture',
      photo: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=700',
    },
    {
      name: 'Repas',
      photo: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=700',
    },
  ];

  return (
    <View>
      <ImageBackground
        source={{
          uri: 'https://images.unsplash.com/photo-1758272133786-ee98adcc6837?w=1200',
        }}
        style={{
          height: 260,
          justifyContent: 'flex-end',
          borderRadius: 22,
          overflow: 'hidden',
          marginBottom: 22,
        }}
      >
        <View style={{
          backgroundColor: 'rgba(10,15,30,0.62)',
          padding: 20,
        }}>
          <Text style={{
            color: '#FFFFFF',
            fontSize: 30,
            fontWeight: '900',
          }}>
            Bienvenue sur REJOINS !
          </Text>
          <Text style={{
            color: '#FFFFFF',
            fontSize: 16,
            marginTop: 8,
            marginBottom: 12,
          }}>
            Toutes les rencontres, toutes les générations, toutes les cultures.
          </Text>
          <TouchableOpacity
            style={{
              backgroundColor: '#7657E8',
              padding: 14,
              borderRadius: 12,
              alignItems: 'center',
            }}
            onPress={() => setTab('Découvrir')}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: '800' }}>
              Découvrir les activités →
            </Text>
          </TouchableOpacity>
        </View>
      </ImageBackground>

      <Text style={styles.sectionTitle}>
        Que souhaites-tu faire ?
      </Text>

      <View style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
      }}>
        {categories.map((item) => (
          <TouchableOpacity
            key={item.name}
            onPress={() => setTab('Découvrir')}
            style={{
              width: '48%',
              height: 135,
              marginBottom: 14,
              borderRadius: 16,
              overflow: 'hidden',
            }}
          >
            <ImageBackground
              source={{ uri: item.photo }}
              style={{
                flex: 1,
                justifyContent: 'flex-end',
              }}
            >
              <View style={{
                backgroundColor: 'rgba(10,10,20,0.55)',
                padding: 12,
              }}>
                <Text style={{
                  color: '#FFFFFF',
                  fontSize: 17,
                  fontWeight: '900',
                }}>
                  {item.name}
                </Text>
              </View>
            </ImageBackground>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => setTab('Créer')}
      >
        <Text style={styles.primaryButtonText}>
          + Proposer une activité
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() => setTab('Membres')}
      >
        <Text style={styles.secondaryButtonText}>
          👥 Rencontrer les membres
        </Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>
        Les prochaines activités
      </Text>

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
            onPress={() => {
              loadEvents();
              loadExternalEvents(profileCity);
            }}
          >
            <Text style={styles.secondaryButtonText}>Actualiser les activités</Text>
          </TouchableOpacity>

          {busy ? (
  <ActivityIndicator color="#A78BFA" />
) : null}

{events.length === 0 && externalEvents.length === 0 && !busy ? (
  <Text style={styles.muted}>
    Aucune activité pour le moment. Tu peux en créer une !
  </Text>
) : null}

{events.map(renderEvent)}

          

{Array.isArray(externalEvents) &&
  externalEvents
    .filter((event) => {
      const label =
        typeof event?.label === 'string'
          ? event.label
          : event?.label?.['@fr'] || '';

      const description =
        event?.hasDescription?.[0]?.description?.['@fr'] || '';

      const text = (label + ' ' + description).toLowerCase();

      return !text.includes('reporté') &&
       !text.includes('annulé') &&
       !text.includes('annulation');
    })
    .map((event, index) => {
      const label =
        typeof event?.label === 'string'
          ? event.label
          : event?.label?.['@fr'] || 'Activité à découvrir';

      const address = event?.isLocatedAt?.[0]?.address?.[0];

      const city =
        address?.addressLocality ||
        address?.hasAddressCity?.label?.['@fr'] ||
        '';

      const descriptionData = event?.hasDescription?.[0]?.description;

      const description =
        typeof descriptionData === 'string'
          ? descriptionData
          : descriptionData?.['@fr'] || '';

      return (
        <View key={event?.uuid || index} style={styles.eventCard}>
          <View style={styles.eventBody}>
            <Text style={styles.eventTitle}>{label}</Text>

            {city ? (
              <Text style={styles.eventInfo}>📍 {city}</Text>
            ) : null}

            {description ? (
              <Text style={styles.eventDescription}>
                {description}
              </Text>
            ) : null}

            <Text style={styles.capacityText}>
              Activité proposée par DATAtourisme
            </Text>
          </View>
        </View>
      );
    })}


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

          
<TouchableOpacity
  style={styles.input}
  onPress={() => setShowCalendar(!showCalendar)}
>
  
<Text style={{
  color: '#FFFFFF',
  fontSize: 16,
  fontWeight: '600',
}}>
  {date
    ? new Date(date + 'T12:00:00').toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : 'Choisir une date'}
</Text>
</TouchableOpacity>

{showCalendar && (
  <View style={{
    backgroundColor: '#211F32',
    borderRadius: 18,
    padding: 14,
    marginTop: 12,
    marginBottom: 13,
  }}>
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 20,
    }}>
      <TouchableOpacity
        onPress={() => changeCalendarMonth(-1)}
        style={{
          width: 38,
          height: 38,
          borderRadius: 12,
          backgroundColor: '#353149',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ color: '#FFFFFF', fontSize: 25 }}>‹</Text>
      </TouchableOpacity>

      <Text style={{
        color: '#F3F0FF',
        fontSize: 18,
        fontWeight: '700',
        textTransform: 'capitalize',
      }}>
        {calendarMonth.toLocaleDateString('fr-FR', {
          month: 'long',
          year: 'numeric',
        })}
      </Text>

      <TouchableOpacity
        onPress={() => changeCalendarMonth(1)}
        style={{
          width: 38,
          height: 38,
          borderRadius: 12,
          backgroundColor: '#353149',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ color: '#FFFFFF', fontSize: 25 }}>›</Text>
      </TouchableOpacity>
    </View>

    <View style={{
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginBottom: 10,
    }}>
      {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day, index) => (
        <View key={index} style={{
          width: '14.28%',
          alignItems: 'center',
        }}>
          <Text style={{ color: '#A9A5BD', fontWeight: '600' }}>
            {day}
          </Text>
        </View>
      ))}
    </View>

    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
      {calendarDays.map((day, index) => {
        const isSelected =
          day === selectedDay.getDate() &&
          calendarMonth.getMonth() === selectedDay.getMonth() &&
          calendarMonth.getFullYear() === selectedDay.getFullYear();

        return (
          <TouchableOpacity
            key={index}
            disabled={!day}
            onPress={() => day && selectCalendarDay(day)}
            style={{
              width: '14.28%',
              height: 44,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: isSelected ? '#A78BFA' : 'transparent',
            }}>
              <Text style={{
                color: isSelected ? '#1A1033' : '#D8D4EC',
                fontWeight: isSelected ? '700' : '500',
                fontSize: 14,
              }}>
                {day || ''}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  </View>
)}

<TextInput
  style={styles.input}
  placeholder="Heure (ex. 18:30)"
  placeholderTextColor="#85849A"
  value={time}
  onChangeText={setTime}
  keyboardType="numbers-and-punctuation"
/>



<View style={{
  flexDirection: 'row',
  flexWrap: 'wrap',
  justifyContent: 'space-between',
  marginTop: 12,
}}>
  {Array.from({ length: 61 }, (_, index) => {
    const totalMinutes = 9 * 60 + index * 15;
    const hour = Math.floor(totalMinutes / 60) % 24;
    const minutes = totalMinutes % 60;
    const hourLabel = `${String(hour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

    return (
      <TouchableOpacity
        key={hourLabel}
        onPress={() => setTime(hourLabel)}
        style={{
          width: '23%',
          paddingVertical: 12,
          marginBottom: 9,
          borderRadius: 12,
          alignItems: 'center',
          backgroundColor: time === hourLabel ? '#A78BFA' : '#29283A',
        }}
      >
        <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>
          {hourLabel}
        </Text>
      </TouchableOpacity>
    );
  })}
</View>
  
          <TextInput
            style={styles.input}
            placeholder={profileCity ? `Lieu de rendez-vous (${profileCity})` : 'Lieu de rendez-vous'}
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
  onPress={() => setShowPreview(true)}
  disabled={busy}
>
  <Text style={styles.primaryButtonText}>
    Prévisualiser mon activité
  </Text>
</TouchableOpacity>

        </View>
      );
    }
    if (tab === 'Membres') {
  return (
    <View>
      <Text style={styles.heading}>👥 Membres de REJOINS</Text>

      {membersLoading ? (
        <ActivityIndicator color="#A78BFA" />
      ) : (
        directMembers.map((member) => (
          <TouchableOpacity
            key={member.member_id}
            style={styles.eventCard}
            onPress={() => openDirectChat(member)}
          >
            <Text style={styles.eventTitle}>
              {member.first_name} {member.last_name}
              {member.is_verified ? ' ✓' : ''}
            </Text>

            <Text style={styles.eventInfo}>
              📍 {member.city || 'Ville non renseignée'}
            </Text>

            {member.bio ? (
              <Text style={styles.eventInfo}>{member.bio}</Text>
            ) : null}

            <Text style={styles.secondaryButtonText}>
              💬 Envoyer un message
            </Text>
          </TouchableOpacity>
        ))
      )}
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
          <Text style={styles.secondaryButtonText}>
            Choisir ma photo
          </Text>
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

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={enablePushNotifications}
        >
          <Text style={styles.secondaryButtonText}>
            🔔 Activer les notifications
          </Text>
        </TouchableOpacity>

        <Text style={styles.eventInfo}>
          Activités rejointes : {memberships.length}
        </Text>

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

  if (selectedChat) {

  const currentEvent = events.find(

    (event) => event.id === selectedChat

  );

  return (

    <View>

      <TouchableOpacity

        style={styles.secondaryButton}

        onPress={() => {

          setSelectedChat(null);

          setChatConversationId(null);

          setChatMessages([]);

        }}

      >

        <Text style={styles.secondaryButtonText}>

          ← Retour aux activités

        </Text>

      </TouchableOpacity>

      <Text style={styles.heading}>

        💬 {selectedChatTitle || currentEvent?.title || 'Discussion'}

      </Text>

      {chatLoading ? (

        <ActivityIndicator color="#A78BFA" />

      ) : (

        <View>

          {chatMessages.length === 0 ? (

            <Text style={styles.muted}>

              Aucun message. Lance la conversation !

            </Text>

          ) : (

            chatMessages.map((item) => (

              <View

                key={item.id}

                style={{

                  backgroundColor: '#292642',

                  padding: 12,

                  borderRadius: 12,

                  marginBottom: 10,

                }}

              >

                <Text style={styles.capacityText}>

                  {item.sender_id === userId ? 'Moi' : 'Participant'}

                </Text>

                <Text style={styles.eventInfo}>{item.body}</Text>

                <Text style={styles.muted}>

                  {new Date(item.created_at).toLocaleString('fr-FR')}

                </Text>

              </View>

            ))

          )}

          <TextInput

            style={styles.input}

            placeholder="Écris ton message..."

            placeholderTextColor="#85849A"

            value={chatDraft}

            onChangeText={setChatDraft}

            multiline

          />

          <TouchableOpacity

            style={styles.primaryButton}

            onPress={sendChatMessage}

            disabled={!chatDraft.trim() || chatLoading}

          >

            <Text style={styles.primaryButtonText}>

              Envoyer le message

            </Text>

          </TouchableOpacity>

        </View>

      )}

    </View>

  );

}

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
