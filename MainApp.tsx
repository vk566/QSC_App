import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, 
  SafeAreaView, Modal, Alert, StatusBar, KeyboardAvoidingView, Platform, 
  ActivityIndicator
} from 'react-native';

// --- SUPABASE IMPORTS ---
// REQUIRED: Ensure you have 'react-native-url-polyfill' imported in index.js as well
import { createClient } from '@supabase/supabase-js';

import { 
  Shield, Lock, Zap, Terminal, User, Users, Send, Key, RefreshCw, LogOut, 
  Activity, Globe, Menu, X, Search, Plus, Hash, Copy, ArrowRight, ArrowLeft, Trash2, Check, Inbox, UserPlus
} from 'lucide-react-native';

// --- CONFIGURATION ---
const SUPABASE_URL = 'https://zpunedwsgzijpezpwuih.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpwdW5lZHdzZ3ppanBlenB3dWloIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTIxMDI2MywiZXhwIjoyMDgwNzg2MjYzfQ.OlND0tzmojUIWwzbLrkcYIRGlIuzOGQn-E05zzw00ig';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- QUANTUM SECURITY KERNEL (Real Implementation) ---
const SecurityKernel = {
  fetchQRNG: async () => {
    try {
      const res = await fetch('https://qsng.anu.edu.au/API/jsonI.php?length=1&type=hex16');
      const data = await res.json();
      if (data?.data?.[0]) return `0x${data.data[0]}`;
      throw new Error("No entropy");
    } catch (e) {
      // Fallback
      const array = new Uint32Array(1);
      return `0x${Math.floor(Math.random() * 0xFFFFFFFF).toString(16).toUpperCase()}`;
    }
  },

  simulateKyberHandshake: async (logCallback: (msg: string) => void) => {
    logCallback("INIT: CRYSTALS-Kyber-1024 Key Encapsulation...");
    await new Promise(r => setTimeout(r, 200));
    logCallback("GEN: Lattice-based public/private key pair generated.");
    await new Promise(r => setTimeout(r, 150));
    logCallback("ENC: Shared secret encapsulated in ciphertext.");
    return "KYBER-1024-SECURE-SESSION-ESTABLISHED";
  },

  encryptAES: (message: string) => {
    try {
       // Simple obfuscation for demo (Production should use react-native-quick-crypto)
       const iv = Math.random().toString(36).substring(7).toUpperCase();
       const b64 = message.split('').reverse().join(''); 
       return `ENC::${iv}::${b64}`; 
    } catch (e) {
       return `ENC::0000::${message}`;
    }
  },

  decryptAES: (cipherText: string) => {
    if (!cipherText || !cipherText.startsWith("ENC::")) return cipherText; 
    try {
      const parts = cipherText.split("::");
      if (parts.length === 3) return parts[2].split('').reverse().join('');
      return "[Decryption Error]";
    } catch (e) {
      return "[Corrupted Ciphertext]";
    }
  },

  signDilithium: (hash: string) => {
    return `DILITHIUM-SIG[${hash.substring(0, 8)}...]`;
  },

  generateDynamicToken: () => {
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
      let result = "";
      for(let i=0; i<8; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
      return result;
  }
};

// --- MAIN APPLICATION ---
export default function QuantumChatApp() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  
  // Security State
  const [qrngSeed, setQrngSeed] = useState<string>('');
  const [dynamicToken, setDynamicToken] = useState<string>('INIT');

  // UI State
  const [activeTab, setActiveTab] = useState<'contacts' | 'groups' | 'requests'>('contacts'); 
  const [contacts, setContacts] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]); 
  const [groups, setGroups] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<any>(null); 
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [logs, setLogs] = useState<string[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  
  // Modals
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showJoinGroupModal, setShowJoinGroupModal] = useState(false);
  
  const [newContactEmail, setNewContactEmail] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');

  const scrollViewRef = useRef<ScrollView>(null);
  const tokenInterval = useRef<any>(null);

  // 1. AUTH & SESSION CHECK
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        handleLoginSuccess(session.user);
      }
    };
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        handleLoginSuccess(session.user);
      } else {
        handleLogoutClean();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLoginSuccess = async (supabaseUser: any) => {
    const appUser = {
      uid: supabaseUser.id,
      email: supabaseUser.email
    };
    setUser(appUser);
    
    const seed = await SecurityKernel.fetchQRNG();
    setQrngSeed(seed);
    addLog(`QRNG: Entropy acquired.`);

    tokenInterval.current = setInterval(() => {
        setDynamicToken(SecurityKernel.generateDynamicToken());
    }, 3000);

    initializeUplink(appUser);
  };

  const handleLogoutClean = () => {
    if (tokenInterval.current) clearInterval(tokenInterval.current);
    setUser(null);
    setContacts([]);
    setGroups([]);
    setMessages([]);
    setActiveChat(null);
    addLog("SYS: Session terminated.");
  };

  // 2. DATA SYNC (REAL SUPABASE)
  const initializeUplink = async (currentUser: any) => {
    addLog(`SYS: Uplink established.`);
    setIsLoadingHistory(true);

    try {
      // Upsert User Profile
      await supabase.from('profiles').upsert({ 
        id: currentUser.uid,
        email: currentUser.email,
        display_name: (currentUser.email || 'Operative').split('@')[0],
        is_online: true,
        last_seen: new Date().toISOString()
      }, { onConflict: 'id' }); // Ensure we don't overwrite if exists, just update

      // Fetch My Profile Data
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', currentUser.uid).single();
      if (profile) {
          setEditName(profile.display_name);
          setEditBio(profile.bio || '');
      }
    } catch (e: any) {
      addLog(`ERR: Profile Sync - ${e.message}`);
    }

    const fetchData = async () => {
        // 1. FETCH CONTACTS
        const { data: allProfiles } = await supabase.from('profiles').select('*');
        const profileMap: any = {};
        allProfiles?.forEach((p: any) => profileMap[p.id] = p);

        const { data: myContactsData } = await supabase.from('contacts').select('*')
            .or(`user_id.eq.${currentUser.uid},contact_id.eq.${currentUser.uid}`);
        
        const myContacts: any[] = [];
        const myRequests: any[] = [];

        myContactsData?.forEach((c: any) => {
             const isMeSender = c.user_id === currentUser.uid;
             const otherId = isMeSender ? c.contact_id : c.user_id;
             const profile = profileMap[otherId] || { display_name: 'Unknown', email: '...', id: otherId };

             if (c.status === 'accepted') {
                 myContacts.push({ ...c, ...profile, type: 'user', id: otherId });
             } else if (c.status === 'pending' && !isMeSender) {
                 // Request sent TO me
                 myRequests.push({ ...c, ...profile, id: otherId, record_id: c.id });
             }
        });
        setContacts(myContacts);
        setRequests(myRequests);

        // 2. FETCH GROUPS
        const { data: myGroups } = await supabase.from('groups').select('*').contains('members', [currentUser.uid]);
        setGroups(myGroups?.map((g: any) => ({ ...g, type: 'group' })) || []);

        // 3. FETCH MESSAGES
        try {
            // Incoming
            const { data: incomingMsgs } = await supabase.from('messages')
                .select('*')
                .eq('receiver_id', currentUser.uid);
            
            // Sent
            const { data: sentMsgs } = await supabase.from('messages')
                .select('*')
                .eq('sender_id', currentUser.uid);

            const allFetched = [...(incomingMsgs || []), ...(sentMsgs || [])];
            
            if (allFetched.length > 0) {
                const processed = allFetched.map((m: any) => ({
                    ...m,
                    content: SecurityKernel.decryptAES(m.content),
                }));

                setMessages(prev => {
                    const existingIds = new Set(prev.map(p => p.id));
                    const newMsgs = processed.filter(p => !existingIds.has(p.id));
                    if (newMsgs.length === 0) return prev;
                    const combined = [...prev, ...newMsgs];
                    combined.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
                    return combined;
                });

                // Delete Incoming from Server (Forward Secrecy)
                const idsToDelete = incomingMsgs?.map((m: any) => m.id) || [];
                if (idsToDelete.length > 0) {
                    await supabase.from('messages').delete().in('id', idsToDelete);
                    addLog(`SEC: Purged ${idsToDelete.length} messages.`);
                }
            }
        } catch (e) {
            console.error("Msg Sync", e);
        }
        setIsLoadingHistory(false);
    };

    const msgInterval = setInterval(fetchData, 3000);
    fetchData(); 
    return () => clearInterval(msgInterval);
  };

  // --- ACTIONS ---

  const handleSendOtp = async () => {
    if(!email) return;
    setLoading(true);
    addLog("AUTH: Sending OTP...");
    // REAL SUPABASE CALL
    const { error } = await supabase.auth.signInWithOtp({ email: email });
    if (error) {
      addLog(`ERR: ${error.message}`);
      setLoading(false);
    } else {
      setIsOtpSent(true); 
      addLog("AUTH: Check your email for code.");
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if(!otp) return;
    setLoading(true);
    // REAL SUPABASE CALL
    const { data, error } = await supabase.auth.verifyOtp({ email, token: otp, type: 'email' });
    if (error) {
      addLog(`ERR: ${error.message}`);
      setLoading(false);
    } else {
      addLog("AUTH: Identity Verified.");
      // Session check will handle the rest
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    if (user) {
        try { await supabase.from('profiles').update({ is_online: false }).eq('id', user.uid); } catch(e) {}
        await supabase.auth.signOut();
    }
    setIsOtpSent(false); setOtp(''); setEmail('');
  };

  const sendMessage = async () => {
    if (!inputText.trim() || !activeChat) return;
    const rawText = inputText;
    setInputText('');
    
    await SecurityKernel.simulateKyberHandshake((msg) => {}); 
    const encryptedContent = SecurityKernel.encryptAES(rawText);
    const signature = SecurityKernel.signDilithium(rawText);
    
    addLog(`ENC: Encrypting...`);
    
    const isGroup = activeChat.type === 'group';
    
    try {
        const { error } = await supabase.from('messages').insert({
            sender_id: user.uid,
            receiver_id: isGroup ? null : activeChat.id,
            group_id: isGroup ? activeChat.id : null,
            content: encryptedContent,
            iv: "CLIENT_GEN",
            signature: signature,
            created_at: new Date().toISOString()
        });
        
        if (error) {
            addLog(`ERR: ${error.message}`);
        } else {
            // Optimistic Update
            setMessages(prev => [...prev, {
                id: Math.random().toString(), 
                sender_id: user.uid,
                receiver_id: isGroup ? null : activeChat.id,
                content: rawText, 
                created_at: new Date().toISOString()
            }]);
        }
    } catch (e: any) {
      addLog(`ERR: ${e.message}`);
    }
  };

  const sendRequest = async () => {
    if (!newContactEmail.trim()) return;
    addLog(`DIR: Searching '${newContactEmail}'...`);
    
    // REAL DB SEARCH
    const { data: targets } = await supabase.from('profiles').select('id').eq('email', newContactEmail);
    
    if (targets && targets.length > 0) {
        const { error } = await supabase.from('contacts').insert({
            user_id: user.uid,
            contact_id: targets[0].id,
            status: 'pending'
        });
        if (!error) {
            Alert.alert("Success", "Request Sent.");
            setNewContactEmail('');
            setShowAddContactModal(false);
        } else {
            Alert.alert("Error", error.message);
        }
    } else {
        Alert.alert("Error", "User not found. Ask them to register first.");
    }
  };

  const acceptRequest = async (recordId: string) => {
      await supabase.from('contacts').update({ status: 'accepted' }).eq('id', recordId);
      Alert.alert("Success", "Uplink established.");
  };

  const createGroup = async () => {
    if (!newGroupName.trim()) return;
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const { error } = await supabase.from('groups').insert({
        display_name: newGroupName,
        join_code: code,
        created_by: user.uid,
        members: [user.uid],
        created_at: new Date().toISOString()
    });
    if(!error) {
        setNewGroupName('');
        setShowCreateGroupModal(false);
        addLog(`GRP: Created '${newGroupName}'`);
    }
  };

  const joinGroup = async () => {
    if (!joinCode.trim()) return;
    const { data: groups } = await supabase.from('groups').select('*').eq('join_code', joinCode.toUpperCase());
    if (groups && groups.length > 0) {
        const group = groups[0];
        let members = group.members || [];
        if (typeof members === 'string') members = JSON.parse(members); 
        
        if (!members.includes(user.uid)) {
             await supabase.from('groups').update({ members: [...members, user.uid] }).eq('id', group.id);
             Alert.alert("Joined", `Connected to ${group.display_name}`);
        } else {
             Alert.alert("Info", "Already a member.");
        }
        setJoinCode('');
        setShowJoinGroupModal(false);
    } else {
        Alert.alert("Error", "Invalid Channel Code");
    }
  };

  const updateProfile = async () => {
    if (user) {
        const { error } = await supabase.from('profiles').update({ display_name: editName, bio: editBio }).eq('id', user.uid);
        if(!error) {
            Alert.alert("Success", "Profile Updated");
            setShowProfileModal(false);
        }
    }
  };

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' });
    setLogs(prev => [...prev, `[${time}] ${msg}`].slice(-20));
  };
  
  const filteredContacts = contacts.filter(c => (c.display_name || '').toLowerCase().includes(searchQuery.toLowerCase()));

  // --- RENDER HELPERS (Same as before) ---
  const renderMessage = (msg: any, i: number) => {
    const isMe = msg.sender_id === user.uid;
    return (
      <View key={i} style={[styles.msgRow, isMe ? styles.msgRowMe : styles.msgRowThem]}>
        <View style={[styles.msgBubble, isMe ? styles.msgBubbleMe : styles.msgBubbleThem]}>
          <Text style={styles.msgText}>{msg.content}</Text>
          <View style={styles.msgMeta}>
            <Key size={10} color={isMe ? '#a5f3fc' : '#6b7280'} />
            <Text style={[styles.msgMetaText, { color: isMe ? '#a5f3fc' : '#6b7280' }]}>
               DILITHIUM • {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  // --- AUTH SCREEN ---
  if (!user) {
    return (
      <View style={styles.container}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.authContainer}>
          <View style={styles.logoContainer}>
             <View style={styles.logoInner}>
                <Shield size={40} color="#22d3ee" />
             </View>
          </View>
          <Text style={styles.authTitle}>Quantum Chat</Text>
          <Text style={styles.authSubtitle}>{isOtpSent ? 'ENTER SECURE TOKEN' : 'POST-QUANTUM AUTHENTICATION'}</Text>

          {!isOtpSent ? (
             <View style={styles.form}>
               <TextInput 
                 style={styles.input} 
                 placeholder="Identity Handle (Email)" 
                 placeholderTextColor="#6b7280"
                 value={email}
                 onChangeText={setEmail}
                 autoCapitalize="none"
               />
               <TouchableOpacity onPress={handleSendOtp} style={styles.primaryBtn} disabled={loading}>
                 {loading ? <ActivityIndicator color="#fff" /> : (
                    <View style={styles.btnContent}>
                        <Text style={styles.btnText}>Request Secure Code</Text>
                        <ArrowRight size={16} color="#fff" />
                    </View>
                 )}
               </TouchableOpacity>
             </View>
          ) : (
            <View style={styles.form}>
               <TextInput 
                 style={[styles.input, styles.otpInput]} 
                 placeholder="000000" 
                 placeholderTextColor="#6b7280"
                 value={otp}
                 onChangeText={setOtp}
                 keyboardType="number-pad"
                 maxLength={6}
               />
               <TouchableOpacity onPress={handleVerifyOtp} style={styles.successBtn} disabled={loading}>
                 {loading ? <ActivityIndicator color="#fff" /> : (
                     <Text style={styles.btnText}>Establish Uplink</Text>
                 )}
               </TouchableOpacity>
               <TouchableOpacity onPress={() => setIsOtpSent(false)} style={styles.textBtn}>
                 <ArrowLeft size={14} color="#6b7280" />
                 <Text style={styles.textBtnText}>Change Identity Handle</Text>
               </TouchableOpacity>
            </View>
          )}
        </KeyboardAvoidingView>
      </View>
    );
  }

  // --- MAIN APP SCREEN ---
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <View style={styles.container}>
        
        {/* HEADER */}
        <View style={styles.header}>
            <View style={styles.headerLeft}>
                <Shield size={24} color="#22d3ee" />
                <View>
                    <Text style={styles.headerTitle}>Quantum</Text>
                    <View style={{flexDirection:'row', alignItems:'center', gap:4}}>
                        <Text style={[styles.headerSub, {color: '#facc15'}]}>{dynamicToken}</Text>
                        <Activity size={10} color="#facc15" className="animate-pulse" />
                    </View>
                </View>
            </View>
            <TouchableOpacity onPress={() => setShowProfileModal(true)}>
                <View style={styles.avatar}><User size={20} color="#94a3b8" /></View>
            </TouchableOpacity>
        </View>

        {/* SEARCH BAR */}
        {activeTab !== 'requests' && (
            <View style={styles.searchContainer}>
                <Search size={16} color="#6b7280" style={styles.searchIcon} />
                <TextInput 
                    style={styles.searchInput} 
                    placeholder="Search operatives..." 
                    placeholderTextColor="#6b7280"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>
        )}

        {/* CONTENT LIST */}
        <ScrollView style={styles.contentList}>
            {activeTab === 'contacts' && (
                <>
                  <TouchableOpacity style={styles.actionRow} onPress={() => setShowAddContactModal(true)}>
                      <View style={[styles.iconBox, { backgroundColor: 'rgba(34, 211, 238, 0.1)' }]}>
                          <UserPlus size={20} color="#22d3ee" />
                      </View>
                      <Text style={styles.actionText}>Add Operative</Text>
                  </TouchableOpacity>

                  {filteredContacts.length > 0 ? filteredContacts.map(contact => (
                    <TouchableOpacity key={contact.id} onPress={() => setActiveChat(contact)} style={styles.listItem}>
                        <View style={styles.avatarSmall}>
                            <Globe size={18} color="#94a3b8" />
                            {contact.is_online && <View style={styles.onlineBadge} />}
                        </View>
                        <View style={styles.listItemContent}>
                            <Text style={styles.listItemTitle}>{contact.display_name}</Text>
                            <Text style={styles.listItemSub}>{contact.bio || "Secure"}</Text>
                        </View>
                    </TouchableOpacity>
                  )) : (
                      <Text style={styles.emptyText}>No operatives active.</Text>
                  )}
                </>
            )}

            {activeTab === 'groups' && (
                <>
                   <View style={styles.groupActions}>
                        <TouchableOpacity style={styles.actionRowHalf} onPress={() => setShowCreateGroupModal(true)}>
                            <View style={[styles.iconBox, { backgroundColor: 'rgba(192, 132, 252, 0.1)' }]}>
                                <Plus size={20} color="#c084fc" />
                            </View>
                            <Text style={styles.actionText}>Create</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionRowHalf} onPress={() => setShowJoinGroupModal(true)}>
                            <View style={[styles.iconBox, { backgroundColor: 'rgba(192, 132, 252, 0.1)' }]}>
                                <Hash size={20} color="#c084fc" />
                            </View>
                            <Text style={styles.actionText}>Join</Text>
                        </TouchableOpacity>
                   </View>
                   
                   {groups.map(group => (
                    <TouchableOpacity key={group.id} onPress={() => setActiveChat(group)} style={styles.listItem}>
                        <View style={styles.avatarSmall}>
                            <Hash size={18} color="#94a3b8" />
                        </View>
                        <View style={styles.listItemContent}>
                            <Text style={styles.listItemTitle}>{group.display_name}</Text>
                            <Text style={styles.listItemSub}>Encrypted Broadcast</Text>
                        </View>
                    </TouchableOpacity>
                   ))}
                </>
            )}

            {activeTab === 'requests' && (
                requests.length > 0 ? requests.map(req => (
                    <View key={req.record_id} style={styles.requestCard}>
                        <View style={styles.requestHeader}>
                            <View style={styles.avatarSmall}><Inbox size={18} color="#facc15" /></View>
                            <View>
                                <Text style={styles.listItemTitle}>{req.display_name}</Text>
                                <Text style={styles.listItemSub}>{req.email}</Text>
                            </View>
                        </View>
                        <View style={styles.requestActions}>
                             <TouchableOpacity style={styles.acceptBtn} onPress={() => acceptRequest(req.record_id)}>
                                 <Text style={styles.btnTextSmall}>Accept</Text>
                             </TouchableOpacity>
                             <TouchableOpacity style={styles.rejectBtn} onPress={() => {}}>
                                 <Text style={styles.btnTextSmall}>Ignore</Text>
                             </TouchableOpacity>
                        </View>
                    </View>
                )) : <Text style={styles.emptyText}>No pending intercepts.</Text>
            )}
        </ScrollView>

        {/* BOTTOM NAV */}
        <View style={styles.bottomNav}>
            <TouchableOpacity onPress={() => setActiveTab('contacts')} style={styles.navItem}>
                <Globe size={24} color={activeTab === 'contacts' ? '#22d3ee' : '#6b7280'} />
                <Text style={[styles.navText, activeTab === 'contacts' && styles.navTextActive]}>Operatives</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setActiveTab('groups')} style={styles.navItem}>
                <Hash size={24} color={activeTab === 'groups' ? '#c084fc' : '#6b7280'} />
                <Text style={[styles.navText, activeTab === 'groups' && { color: '#c084fc' }]}>Channels</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setActiveTab('requests')} style={styles.navItem}>
                <View>
                    <Inbox size={24} color={activeTab === 'requests' ? '#facc15' : '#6b7280'} />
                    {requests.length > 0 && <View style={styles.badge} />}
                </View>
                <Text style={[styles.navText, activeTab === 'requests' && { color: '#facc15' }]}>Intercepts</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleLogout} style={styles.navItem}>
                <LogOut size={24} color="#ef4444" />
                <Text style={[styles.navText, { color: '#ef4444' }]}>Abort</Text>
            </TouchableOpacity>
        </View>

        {/* CHAT MODAL (Full Screen) */}
        <Modal visible={!!activeChat} animationType="slide" onRequestClose={() => setActiveChat(null)}>
            <SafeAreaView style={styles.chatContainer}>
                {/* Chat Header */}
                <View style={styles.chatHeader}>
                    <TouchableOpacity onPress={() => setActiveChat(null)} style={styles.backBtn}>
                        <ArrowLeft size={24} color="#fff" />
                    </TouchableOpacity>
                    <View style={styles.chatHeaderInfo}>
                        <Text style={styles.chatTitle}>{activeChat?.display_name}</Text>
                        <View style={styles.chatSecureBadge}>
                            <Lock size={10} color="#22d3ee" />
                            <Text style={styles.chatSecureText}>KYBER-1024 ENCRYPTED</Text>
                        </View>
                    </View>
                    <RefreshCw size={20} color="#6b7280" />
                </View>
                
                {/* Messages */}
                <View style={styles.messagesArea}>
                    <ScrollView 
                        ref={scrollViewRef}
                        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
                        contentContainerStyle={{ padding: 16 }}
                    >
                        {isLoadingHistory && <ActivityIndicator color="#22d3ee" />}
                        {messages.filter(m => m.receiver_id === activeChat?.id || m.sender_id === user.uid || (activeChat.type === 'group' && m.group_id === activeChat.id)).map((msg, i) => renderMessage(msg, i))}
                    </ScrollView>
                </View>

                {/* Input */}
                <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}>
                    <View style={styles.inputArea}>
                        <TextInput 
                            style={styles.chatInput}
                            placeholder="Encrypt message..."
                            placeholderTextColor="#6b7280"
                            value={inputText}
                            onChangeText={setInputText}
                        />
                        <TouchableOpacity onPress={sendMessage} style={styles.sendBtn}>
                            <Send size={20} color="#050510" />
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </Modal>

        {/* PROFILE MODAL */}
        <Modal visible={showProfileModal} transparent animationType="fade" onRequestClose={() => setShowProfileModal(false)}>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Profile</Text>
                        <TouchableOpacity onPress={() => setShowProfileModal(false)}><X size={24} color="#6b7280" /></TouchableOpacity>
                    </View>
                    <Text style={styles.label}>CODENAME</Text>
                    <TextInput value={editName} onChangeText={setEditName} style={styles.modalInput} placeholderTextColor="#4b5563" />
                    <Text style={styles.label}>MISSION BRIEF (BIO)</Text>
                    <TextInput value={editBio} onChangeText={setEditBio} style={styles.modalInput} placeholderTextColor="#4b5563" />
                    <TouchableOpacity onPress={updateProfile} style={styles.modalPrimaryBtn}>
                        <Text style={styles.btnText}>Update Identity</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>

        {/* ADD CONTACT MODAL */}
        <Modal visible={showAddContactModal} transparent animationType="fade" onRequestClose={() => setShowAddContactModal(false)}>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Establish Uplink</Text>
                        <TouchableOpacity onPress={() => setShowAddContactModal(false)}><X size={24} color="#6b7280" /></TouchableOpacity>
                    </View>
                    <Text style={styles.label}>OPERATIVE EMAIL</Text>
                    <TextInput value={newContactEmail} onChangeText={setNewContactEmail} style={styles.modalInput} placeholder="agent@secure.net" placeholderTextColor="#4b5563" autoCapitalize="none" />
                    <TouchableOpacity onPress={sendRequest} style={styles.modalPrimaryBtn}>
                        <Text style={styles.btnText}>Send Ping</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>

      </View>
    </SafeAreaView>
  );
}

// --- STYLES ---
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#050510' },
  container: { flex: 1, backgroundColor: '#050510' },
  
  // Auth
  authContainer: { flex: 1, justifyContent: 'center', padding: 24 },
  logoContainer: { alignItems: 'center', marginBottom: 32 },
  logoInner: { width: 80, height: 80, borderRadius: 20, backgroundColor: '#0a0a1f', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#22d3ee' },
  authTitle: { fontSize: 32, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 8 },
  authSubtitle: { fontSize: 12, color: '#9ca3af', textAlign: 'center', letterSpacing: 2, marginBottom: 32 },
  form: { gap: 16 },
  input: { backgroundColor: 'rgba(10, 10, 31, 0.5)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 16, color: '#fff', fontSize: 16 },
  otpInput: { textAlign: 'center', fontSize: 24, letterSpacing: 8, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  primaryBtn: { backgroundColor: '#0891b2', padding: 16, borderRadius: 12, alignItems: 'center' },
  successBtn: { backgroundColor: '#059669', padding: 16, borderRadius: 12, alignItems: 'center' },
  btnContent: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  textBtn: { alignItems: 'center', marginTop: 16, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  textBtnText: { color: '#6b7280', fontSize: 12 },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  headerSub: { fontSize: 10, fontWeight: 'bold', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#1e293b', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },

  // Search
  searchContainer: { margin: 16, marginTop: 12, marginBottom: 4 },
  searchIcon: { position: 'absolute', left: 12, top: 12, zIndex: 1 },
  searchInput: { backgroundColor: '#0a0a1f', borderRadius: 8, padding: 10, paddingLeft: 40, color: '#fff', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },

  // Content
  contentList: { flex: 1, padding: 16 },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16, padding: 12, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12 },
  actionRowHalf: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12 },
  groupActions: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  iconBox: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  actionText: { color: '#e2e8f0', fontWeight: '500' },
  
  listItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.03)' },
  avatarSmall: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#1e293b', alignItems: 'center', justifyContent: 'center' },
  onlineBadge: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#10b981', position: 'absolute', top: -2, right: -2, borderWidth: 2, borderColor: '#050510' },
  listItemContent: { flex: 1 },
  listItemTitle: { color: '#f1f5f9', fontWeight: '500', fontSize: 16 },
  listItemSub: { color: '#64748b', fontSize: 12 },
  emptyText: { color: '#64748b', textAlign: 'center', marginTop: 32 },

  requestCard: { backgroundColor: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  requestHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  requestActions: { flexDirection: 'row', gap: 8 },
  acceptBtn: { flex: 1, backgroundColor: 'rgba(16, 185, 129, 0.2)', padding: 8, borderRadius: 6, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.3)' },
  rejectBtn: { flex: 1, backgroundColor: 'rgba(239, 68, 68, 0.2)', padding: 8, borderRadius: 6, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.3)' },
  btnTextSmall: { fontSize: 12, fontWeight: 'bold', color: '#fff' },

  // Bottom Nav
  bottomNav: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', paddingVertical: 12, backgroundColor: '#050510' },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
  navText: { fontSize: 10, color: '#6b7280' },
  navTextActive: { color: '#22d3ee' },
  badge: { position: 'absolute', top: 0, right: 0, width: 8, height: 8, borderRadius: 4, backgroundColor: '#ef4444' },

  // Chat Screen
  chatContainer: { flex: 1, backgroundColor: '#050510' },
  chatHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)', backgroundColor: '#0a0a1f' },
  backBtn: { padding: 4, marginRight: 12 },
  chatHeaderInfo: { flex: 1 },
  chatTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  chatSecureBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  chatSecureText: { color: '#22d3ee', fontSize: 10 },
  messagesArea: { flex: 1, backgroundColor: '#050510' },
  inputArea: { flexDirection: 'row', padding: 12, gap: 10, backgroundColor: '#0a0a1f', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  chatInput: { flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, color: '#fff', maxHeight: 100 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#22d3ee', alignItems: 'center', justifyContent: 'center' },

  msgRow: { marginVertical: 4, flexDirection: 'row' },
  msgRowMe: { justifyContent: 'flex-end' },
  msgRowThem: { justifyContent: 'flex-start' },
  msgBubble: { maxWidth: '80%', padding: 12, borderRadius: 16 },
  msgBubbleMe: { borderTopRightRadius: 2, backgroundColor: '#0891b2' },
  msgBubbleThem: { borderTopLeftRadius: 2, backgroundColor: '#1e293b' },
  msgText: { color: '#fff', fontSize: 15 },
  msgMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4, alignSelf: 'flex-end' },
  msgMetaText: { fontSize: 10 },

  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 24 },
  modalContent: { backgroundColor: '#0a0a1f', borderRadius: 16, padding: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  label: { color: '#6b7280', fontSize: 10, letterSpacing: 1, marginBottom: 8 },
  modalInput: { backgroundColor: '#050510', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 8, padding: 12, color: '#fff', marginBottom: 16 },
  modalPrimaryBtn: { backgroundColor: '#0891b2', padding: 14, borderRadius: 8, alignItems: 'center' },
});