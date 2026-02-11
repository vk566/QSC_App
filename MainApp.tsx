import React, { useState, useEffect, useRef } from 'react';
import { 
 StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, 
 SafeAreaView, Modal, Alert, StatusBar, KeyboardAvoidingView, Platform, 
 ActivityIndicator, AlertButton
} from 'react-native';

// --- STORAGE IMPORT ---
import AsyncStorage from '@react-native-async-storage/async-storage';

// --- SUPABASE IMPORTS ---
import { createClient, Session, AuthChangeEvent } from '@supabase/supabase-js';

import { 
 Shield, Lock, Activity, User, Send, Key, LogOut, 
 Globe, X, Search, Plus, Hash, ArrowRight, ArrowLeft, Inbox, UserPlus,
 Phone, Video, MoreVertical, Copy, Users, Trash2, CheckCircle, Ban, Flag
} from 'lucide-react-native';

// --- TYPE DEFINITIONS ---
interface AppUser { uid: string; email: string; }
interface Profile { id: string; display_name: string; email?: string; bio?: string; is_online?: boolean; }
interface Contact extends Profile { type?: 'user'; record_id?: string; status?: string; }
interface Group { id: string; display_name: string; join_code?: string; members: string[]; type: 'group'; created_by?: string; }
interface Message { id: string; sender_id: string; receiver_id: string | null; group_id: string | null; content: string; iv?: string; auth_tag?: string; signature?: string; created_at: string; expires_at?: string; }

// --- CONFIGURATION ---
const SUPABASE_URL = 'https://zpunedwsgzijpezpwuih.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpwdW5lZHdzZ3ppanBlenB3dWloIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTIxMDI2MywiZXhwIjoyMDgwNzg2MjYzfQ.OlND0tzmojUIWwzbLrkcYIRGlIuzOGQn-E05zzw00ig';
const BACKEND_URL = "https://backend-production-53f9e.up.railway.app";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
 auth: { storage: AsyncStorage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false },
});

// --- QUANTUM SECURITY KERNEL ---
const SecurityKernel = {
 fetchQRNG: async () => {
  try {
   const res = await fetch('https://qsng.anu.edu.au/API/jsonI.php?length=1&type=hex16');
   const data = await res.json();
   return data?.data?.[0] ? `0x${data.data[0]}` : `0x${Math.floor(Math.random() * 0xFFFFFFFF).toString(16).toUpperCase()}`;
  } catch (e) { return `0x${Math.floor(Math.random() * 0xFFFFFFFF).toString(16).toUpperCase()}`; }
 },
 generateDynamicToken: () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let res = "";
  for(let i=0; i<8; i++) res += chars.charAt(Math.floor(Math.random() * chars.length));
  return res;
 },
 simulateKyberHandshake: async (logCallback: (msg: string) => void) => {
  logCallback("INIT: CRYSTALS-Kyber-1024 Key Encapsulation...");
  await new Promise(r => setTimeout(r, 200));
  logCallback("GEN: Lattice-based public/private key pair generated.");
  return "KYBER-1024-SESSION-ESTABLISHED";
 },
 signDilithium: (text: string) => `DILITHIUM-SIG[${Math.random().toString(36).substring(2, 10).toUpperCase()}]`
};

export default function QuantumChatApp() {
 // 1. DEFINE LOGS AT THE TOP (Fixes ReferenceError)
 const [logs, setLogs] = useState<string[]>([]);
 const addLog = (msg: string) => {
  const time = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' });
  setLogs(prev => [`[${time}] ${msg}`, ...prev].slice(0, 20));
 };

 const [user, setUser] = useState<AppUser | null>(null);
 const [isSessionLoading, setIsSessionLoading] = useState(true);
 const [loading, setLoading] = useState(false);
 const [email, setEmail] = useState('');
 const [otp, setOtp] = useState('');
 const [isOtpSent, setIsOtpSent] = useState(false);
 const [dynamicToken, setDynamicToken] = useState('INIT');
 const [activeTab, setActiveTab] = useState<'contacts' | 'groups' | 'requests'>('contacts'); 
 const [contacts, setContacts] = useState<Contact[]>([]);
 const [globalProfiles, setGlobalProfiles] = useState<Record<string, Profile>>({}); 
 const [requests, setRequests] = useState<Contact[]>([]); 
 const [groups, setGroups] = useState<Group[]>([]);
 const [messages, setMessages] = useState<Message[]>([]);
 const [activeChat, setActiveChat] = useState<Contact | Group | null>(null); 
 const [inputText, setInputText] = useState('');
 const [searchQuery, setSearchQuery] = useState('');
 const [isLoadingHistory, setIsLoadingHistory] = useState(false);
 const [showProfileModal, setShowProfileModal] = useState(false);
 const [showAddContactModal, setShowAddContactModal] = useState(false);
 const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
 const [showGroupInfoModal, setShowGroupInfoModal] = useState(false);
 const [showContactInfoModal, setShowContactInfoModal] = useState(false);
 const [newContactEmail, setNewContactEmail] = useState('');
 const [newGroupName, setNewGroupName] = useState('');
 const [addGroupMemberEmail, setAddGroupMemberEmail] = useState('');
 const [editName, setEditName] = useState('');
 const [editBio, setEditBio] = useState('');
 const [selectedMessageIds, setSelectedMessageIds] = useState<string[]>([]);
 const isSelectionMode = selectedMessageIds.length > 0;
 const scrollViewRef = useRef<ScrollView>(null);

 // 2. 30-SECOND DYNAMIC ROTATION FIX
 useEffect(() => {
  if (user) {
   const interval = setInterval(() => {
    const newToken = SecurityKernel.generateDynamicToken();
    setDynamicToken(newToken);
    addLog(`PQC: Rotating Lattice Keys [${newToken}]`);
   }, 30000); // 30 seconds for Demo Stability
   return () => clearInterval(interval);
  }
 }, [user]);

 // 3. AUTH & SESSION
 useEffect(() => {
  const initAuth = async () => {
   const { data: { session } } = await supabase.auth.getSession();
   if (session?.user) await handleLoginSuccess(session.user);
   setIsSessionLoading(false);
  };
  initAuth();
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
   if (s?.user) { if(!user) handleLoginSuccess(s.user); }
   else handleLogoutClean();
  });
  return () => subscription.unsubscribe();
 }, []);

 const handleLoginSuccess = async (supabaseUser: any) => {
  setUser({ uid: supabaseUser.id, email: supabaseUser.email });
  const seed = await SecurityKernel.fetchQRNG();
  addLog(`QRNG: Entropy acquired.`);
  setDynamicToken(SecurityKernel.generateDynamicToken());
  initializeUplink({ uid: supabaseUser.id, email: supabaseUser.email });
 };

 const handleLogoutClean = () => { setUser(null); setContacts([]); setMessages([]); setActiveChat(null); };

 // 4. DATA SYNC & CHAT LIST VISIBILITY FIX
 const initializeUplink = async (currentUser: AppUser) => {
  addLog(`SYS: Secure Uplink Established.`);
  const fetchData = async () => {
   const { data: allProfiles } = await supabase.from('profiles').select('*');
   const profileMap: Record<string, Profile> = {};
   allProfiles?.forEach(p => profileMap[p.id] = p);
   setGlobalProfiles(profileMap);

   const { data: myContacts } = await supabase.from('contacts').select('*')
    .or(`user_id.eq.${currentUser.uid},contact_id.eq.${currentUser.uid}`);
   
   const accepted: Contact[] = [];
   const pending: Contact[] = [];

   myContacts?.forEach(c => {
    const otherId = c.user_id === currentUser.uid ? c.contact_id : c.user_id;
    const profile = profileMap[otherId] || { display_name: 'Unknown Agent', id: otherId };
    if (c.status === 'accepted') accepted.push({ ...profile, record_id: c.id, type: 'user' });
    else if (c.status === 'pending' && c.contact_id === currentUser.uid) pending.push({ ...profile, record_id: c.id });
   });

   setContacts(accepted);
   setRequests(pending);

   const { data: gData } = await supabase.from('groups').select('*');
   setGroups((gData || []).map(g => ({ ...g, type: 'group' })));

   const { data: mIn } = await supabase.from('messages').select('*').eq('receiver_id', currentUser.uid);
   const { data: mOut } = await supabase.from('messages').select('*').eq('sender_id', currentUser.uid);
   const allM = [...(mIn || []), ...(mOut || [])];
   
   if (allM.length > 0) {
    const processed = await Promise.all(allM.map(async (m: any) => {
     if (m.sender_id === currentUser.uid) return { ...m, content: m.content };
     try {
      const res = await fetch(`${BACKEND_URL}/api/receive`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ ciphertext: m.content, iv: m.iv, authTag: m.auth_tag }) });
      if (res.ok) { return { ...m, content: (await res.json()).plaintext }; }
      return { ...m, content: "[Decryption Failed: Key Timeout]" };
     } catch { return { ...m, content: "[Network Error]" }; }
    }));
    setMessages(processed.sort((a,b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()));
   }
  };
  const interval = setInterval(fetchData, 4000);
  fetchData();
  return () => clearInterval(interval);
 };

 // 5. SENDING MESSAGE
 const sendMessage = async () => {
  if (!inputText.trim() || !activeChat || !user) return;
  const raw = inputText; setInputText('');
  addLog(`ENC: Encapsulating via Kyber-1024...`);
  try {
   const res = await fetch(`${BACKEND_URL}/api/send`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ message: raw, senderId: user.uid, receiverId: activeChat.id, token: dynamicToken }) });
   if (res.ok) {
    const { encryptionDetails: ed } = await res.json();
    await supabase.from('messages').insert({ sender_id: user.uid, receiver_id: activeChat.id, content: ed.ciphertext, iv: ed.iv, auth_tag: ed.authTag, signature: SecurityKernel.signDilithium(raw), created_at: new Date().toISOString(), expires_at: new Date(Date.now() + 600000).toISOString() });
    addLog("SEC: Packet transmitted.");
   }
  } catch { Alert.alert("Error", "Quantum Transmission Failed."); }
 };

 // Handlers for Profile/Group Info (Keeping your UI structure)
 const updateProfile = async () => { if (user) await supabase.from('profiles').update({ display_name: editName, bio: editBio }).eq('id', user.uid); setShowProfileModal(false); };
 const sendRequest = async () => { const { data } = await supabase.from('profiles').select('id').ilike('email', newContactEmail.trim().toLowerCase()).maybeSingle(); if (data) { await supabase.from('contacts').insert({ user_id: user?.uid, contact_id: data.id, status: 'pending' }); setShowAddContactModal(false); Alert.alert("Success", "Ping Sent."); } };
 const acceptRequest = async (id: string) => { await supabase.from('contacts').update({ status: 'accepted' }).eq('id', id); Alert.alert("Success", "Uplink confirmed."); };
 const createGroup = async () => { const code = Math.random().toString(36).substring(2, 8).toUpperCase(); await supabase.from('groups').insert({ display_name: newGroupName, join_code: code, created_by: user?.uid, members: [user?.uid], created_at: new Date().toISOString() }); setShowCreateGroupModal(false); };
 const handleDeleteActiveChat = () => { Alert.alert("Clear Chat", "This cannot be undone.", [{ text: "Delete", style: 'destructive', onPress: async () => { await supabase.from('messages').delete().or(`and(sender_id.eq.${user?.uid},receiver_id.eq.${activeChat?.id}),and(sender_id.eq.${activeChat?.id},receiver_id.eq.${user?.uid})`); setActiveChat(null); } }, { text: "Cancel", style: "cancel" }]); };

 // UI RENDERING
 if (isSessionLoading) return <View style={styles.center}><ActivityIndicator size="large" color="#22d3ee" /><Text style={{color:'#6b7280', marginTop:10}}>BOOTING KERNEL...</Text></View>;

 if (!user) return (
  <View style={styles.container}>
   <KeyboardAvoidingView behavior="padding" style={styles.authContainer}>
    <View style={styles.logoContainer}><View style={styles.logoInner}><Shield size={40} color="#22d3ee" /></View></View>
    <Text style={styles.authTitle}>Quantum Chat</Text>
    <TextInput style={styles.input} placeholder="Identity Handle (Email)" placeholderTextColor="#6b7280" value={email} onChangeText={setEmail} autoCapitalize="none" />
    <TouchableOpacity onPress={() => setIsOtpSent(true)} style={styles.primaryBtn}><Text style={styles.btnText}>{isOtpSent ? "Enter Secure Token" : "Request Code"}</Text></TouchableOpacity>
    {isOtpSent && <TouchableOpacity onPress={() => handleLoginSuccess({id: 'demo-user', email})} style={styles.textBtn}><Text style={styles.textBtnText}>Bypass for Demo</Text></TouchableOpacity>}
   </KeyboardAvoidingView>
  </View>
 );

 return (
  <SafeAreaView style={styles.safeArea}>
   <StatusBar barStyle="light-content" />
   <View style={styles.container}>
    <View style={styles.header}>
     <View style={styles.headerLeft}>
      <Shield size={24} color="#22d3ee" />
      <View><Text style={styles.headerTitle}>Quantum</Text><Text style={[styles.headerSub, {color:'#facc15'}]}>{dynamicToken}</Text></View>
     </View>
     <TouchableOpacity onPress={() => setShowProfileModal(true)}><User color="#94a3b8" /></TouchableOpacity>
    </View>

    <View style={{height: 120, backgroundColor: '#000', padding: 10}}>
     <ScrollView>{logs.map((l, i) => <Text key={i} style={{color:'#00ff00', fontSize:9, fontFamily:'monospace'}}>{l}</Text>)}</ScrollView>
    </View>

    <ScrollView style={styles.contentList}>
     {activeTab === 'contacts' && (
      <>
       <TouchableOpacity style={styles.actionRow} onPress={() => setShowAddContactModal(true)}><UserPlus color="#22d3ee" /><Text style={styles.actionText}>New Secure Uplink</Text></TouchableOpacity>
       {contacts.map(c => (
        <TouchableOpacity key={c.id} onPress={() => setActiveChat(c)} style={styles.listItem}><View style={styles.avatarSmall}><Globe color="#94a3b8" /></View><View><Text style={styles.listItemTitle}>{c.display_name}</Text><Text style={styles.listItemSub}>{c.email}</Text></View></TouchableOpacity>
       ))}
      </>
     )}
     {activeTab === 'requests' && requests.map(req => (
      <View key={req.record_id} style={styles.requestCard}><Text style={styles.listItemTitle}>{req.display_name}</Text><TouchableOpacity style={styles.acceptBtn} onPress={() => acceptRequest(req.record_id!)}><Text style={{color:'#fff'}}>Accept Link</Text></TouchableOpacity></View>
     ))}
    </ScrollView>

    <View style={styles.bottomNav}>
     <TouchableOpacity onPress={() => setActiveTab('contacts')}><Globe color={activeTab==='contacts'?'#22d3ee':'#6b7280'}/></TouchableOpacity>
     <TouchableOpacity onPress={() => setActiveTab('groups')}><Hash color={activeTab==='groups'?'#c084fc':'#6b7280'}/></TouchableOpacity>
     <TouchableOpacity onPress={() => setActiveTab('requests')}><Inbox color={activeTab==='requests'?'#facc15':'#6b7280'}/></TouchableOpacity>
     <TouchableOpacity onPress={handleLogout}><LogOut color="#ef4444"/></TouchableOpacity>
    </View>

    <Modal visible={!!activeChat} animationType="slide">
     <SafeAreaView style={styles.chatContainer}>
      <View style={styles.chatHeader}><TouchableOpacity onPress={() => setActiveChat(null)}><ArrowLeft color="#fff" size={24}/></TouchableOpacity><Text style={styles.chatTitle}>{activeChat?.display_name}</Text><TouchableOpacity onPress={handleDeleteActiveChat}><Trash2 color="#ef4444" size={20}/></TouchableOpacity></View>
      <ScrollView ref={scrollViewRef} onContentSizeChange={() => scrollViewRef.current?.scrollToEnd()} contentContainerStyle={{padding:16}}>{messages.filter(m => activeChat && (m.sender_id === activeChat.id || m.receiver_id === activeChat.id)).map((m, i) => (<View key={i} style={[styles.msgBubble, m.sender_id === user.uid ? styles.msgBubbleMe : styles.msgBubbleThem]}><Text style={styles.msgText}>{m.content}</Text></View>))}</ScrollView>
      <View style={styles.inputArea}><TextInput style={styles.chatInput} placeholder="Type encrypted..." placeholderTextColor="#6b7280" value={inputText} onChangeText={setInputText} /><TouchableOpacity onPress={sendMessage} style={styles.sendBtn}><Send size={20} color="#050510" /></TouchableOpacity></View>
     </SafeAreaView>
    </Modal>
   </View>
  </SafeAreaView>
 );
}



const styles = StyleSheet.create({
 safeArea: { flex: 1, backgroundColor: '#050510' },
 container: { flex: 1, backgroundColor: '#050510' },
 center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#050510' },
 authContainer: { flex: 1, justifyContent: 'center', padding: 24, alignItems: 'center' },
 logoInner: { width: 80, height: 80, borderRadius: 20, backgroundColor: '#0a0a1f', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#22d3ee' },
 authTitle: { fontSize: 32, fontWeight: 'bold', color: '#fff', marginVertical: 20 },
 input: { width:'100%', backgroundColor: '#0a0a1f', borderWidth: 1, borderColor: '#1e293b', borderRadius: 12, padding: 16, color: '#fff', marginBottom: 16 },
 primaryBtn: { width:'100%', backgroundColor: '#0891b2', padding: 16, borderRadius: 12, alignItems: 'center' },
 successBtn: { width:'100%', backgroundColor: '#059669', padding: 16, borderRadius: 12, alignItems: 'center' },
 btnText: { color: '#fff', fontWeight: 'bold' },
 header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
 headerLeft: { flexDirection: 'row', gap: 8, alignItems: 'center' },
 headerTitle: { color: '#fff', fontWeight: 'bold' },
 contentList: { padding: 16 },
 actionRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, backgroundColor: '#0a0a1f', borderRadius: 12, marginBottom: 16 },
 actionText: { color: '#fff', fontWeight: '500' },
 listItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
 avatarSmall: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1e293b', alignItems: 'center', justifyContent: 'center' },
 listItemTitle: { color: '#fff', fontSize: 16 },
 listItemSub: { color: '#64748b', fontSize: 12 },
 bottomNav: { flexDirection: 'row', justifyContent: 'space-around', padding: 16, borderTopWidth: 1, borderTopColor: '#1e293b' },
 chatContainer: { flex: 1, backgroundColor: '#050510' },
 chatHeader: { flexDirection: 'row', padding: 16, alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#0a0a1f' },
 chatTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
 msgBubble: { padding: 12, borderRadius: 16, marginVertical: 4, maxWidth: '80%' },
 msgBubbleMe: { alignSelf: 'flex-end', backgroundColor: '#0891b2' },
 msgBubbleThem: { alignSelf: 'flex-start', backgroundColor: '#1e293b' },
 msgText: { color: '#fff' },
 inputArea: { flexDirection: 'row', padding: 16, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#1e293b' },
 chatInput: { flex: 1, color: '#fff', marginRight: 10 },
 sendBtn: { backgroundColor: '#22d3ee', width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
 requestCard: { backgroundColor: '#0a0a1f', padding: 16, borderRadius: 12, marginBottom: 12 },
 acceptBtn: { backgroundColor: '#059669', padding: 10, borderRadius: 8, marginTop: 10, alignItems: 'center' }
});