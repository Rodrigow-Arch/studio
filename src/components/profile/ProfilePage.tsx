
"use client";

import * as React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  MapPin, Award, ThumbsUp, LogOut, MessageCircle, ArrowLeft, Save, 
  Sparkles, User as UserIcon, CalendarDays,
  Send, MessageSquareQuote, ChevronDown, ChevronUp,
  Settings, Trash, AlertTriangle, FileText, Instagram, Youtube, Facebook, Twitter, Globe, Link as LinkIcon, Plus, Trash2, ShieldCheck, X,
  BadgeCheck, LayoutGrid
} from "lucide-react";
import RatingStats from './RatingStats';
import BadgeGrid from './BadgeGrid';
import PostCard from '../feed/PostCard';
import { useUser, useDoc, useFirestore, useMemoFirebase, useAuth, useCollection } from '@/firebase';
import { doc, collection, query, where, getDocs, updateDoc, addDoc, orderBy, limit, writeBatch } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useToast } from "@/hooks/use-toast";
import { DISTRITOS_PORTUGAL } from '@/lib/geo';
import { generateBioDescription } from '@/ai/flows/bio-description-generation-flow';
import { checkAndAwardBadges } from '@/lib/badge-logic';
import { getTrustLevel } from '@/lib/trust-levels';
import { differenceInDays, format, formatDistanceToNow } from 'date-fns';
import { pt } from 'date-fns/locale';
import ImageCropper from '@/components/profile/ImageCropper';
import LegalModal from '@/components/legal/LegalModals';
import { filterProfanity } from '@/lib/utils';
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

interface SocialLink {
  platform: string;
  url: string;
}

interface ProfilePageProps {
  userId?: string;
  onBack?: void;
  onProfileClick?: (uid: string) => void;
}

export default function ProfilePage({ userId, onBack, onProfileClick }: ProfilePageProps) {
  const { user: currentUser } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  const { toast } = useToast();
  
  const [showSettings, setShowSettings] = React.useState(false);
  const [showPointsGuide, setShowPointsGuide] = React.useState(false);
  const [showAllMural, setShowAllMural] = React.useState(false);
  const [postCount, setPostCount] = React.useState(0);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isGeneratingBio, setIsGeneratingBio] = React.useState(false);
  
  const [imageToCrop, setImageToCrop] = React.useState<string | null>(null);
  const [cropAspect, setCropAspect] = React.useState(1);
  const [cropTarget, setCropTarget] = React.useState<'photo' | 'banner'>('photo');

  const [newProfileComment, setNewProfileComment] = React.useState('');
  const [isSubmittingComment, setIsSubmittingComment] = React.useState(false);
  
  const [deleteConfirmStep, setDeleteConfirmStep] = React.useState(0);
  const [deleteConfirmText, setDeleteConfirmText] = React.useState('');
  const [isDeleting, setIsDeleting] = React.useState(false);

  const [legalModal, setLegalModal] = React.useState<{ isOpen: boolean; type: 'terms' | 'privacy' }>({
    isOpen: false,
    type: 'terms'
  });

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const bannerInputRef = React.useRef<HTMLInputElement>(null);

  const targetUid = userId || currentUser?.uid;
  const isOwnProfile = targetUid === currentUser?.uid;

  const userDocRef = useMemoFirebase(() => {
    return targetUid ? doc(db, 'users', targetUid) : null;
  }, [db, targetUid]);

  const { data: userProfile, isLoading } = useDoc(userDocRef);

  const [editData, setEditData] = React.useState({
    fullName: '',
    description: '',
    district: '',
    zone: '',
    phoneNumber: '',
    photoUrl: '',
    bannerUrl: '',
    socialLinks: [] as SocialLink[]
  });

  const profileCommentsQuery = useMemoFirebase(() => {
    if (!targetUid) return null;
    return query(
      collection(db, 'users', targetUid, 'profileComments'),
      orderBy('timestamp', 'desc'),
      limit(20)
    );
  }, [db, targetUid]);

  const { data: rawProfileComments, isLoading: commentsLoading } = useCollection(profileCommentsQuery);

  const profileComments = React.useMemo(() => {
    if (!rawProfileComments) return [];
    return showAllMural ? rawProfileComments : rawProfileComments.slice(0, 3);
  }, [rawProfileComments, showAllMural]);

  // Query para buscar posts do utilizador (removido orderBy para evitar erro de index)
  const userPostsQuery = useMemoFirebase(() => {
    if (!targetUid) return null;
    return query(
      collection(db, 'posts'),
      where('authorId', '==', targetUid)
    );
  }, [db, targetUid]);

  const { data: allUserPosts, isLoading: postsLoading } = useCollection(userPostsQuery);

  const activeUserPosts = React.useMemo(() => {
    if (!allUserPosts) return [];
    // Apenas mostrar posts públicos e que não estão resolvidos, e ordenar por data decrescente manualmente
    return allUserPosts
      .filter(p => p.status !== 'resolvido' && (!p.groupId || p.isPublic))
      .sort((a, b) => {
        const dateA = new Date(a.timestamp || 0).getTime();
        const dateB = new Date(b.timestamp || 0).getTime();
        return dateB - dateA;
      });
  }, [allUserPosts]);

  React.useEffect(() => {
    if (userProfile) {
      setEditData({
        fullName: userProfile.fullName || '',
        description: userProfile.description || '',
        district: userProfile.district || '',
        zone: userProfile.zone || '',
        phoneNumber: userProfile.phoneNumber || '',
        photoUrl: userProfile.photoUrl || '',
        bannerUrl: userProfile.bannerUrl || '',
        socialLinks: userProfile.socialLinks || []
      });
    }
  }, [userProfile]);

  React.useEffect(() => {
    if (allUserPosts) {
      setPostCount(allUserPosts.length);
    }
  }, [allUserPosts]);

  if (isLoading || !userProfile) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-10 space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="text-xs text-muted-foreground">A carregar perfil...</p>
      </div>
    );
  }

  const handleLogout = () => {
    signOut(auth);
  };

  const handleDeleteAccount = async () => {
    if (!currentUser || deleteConfirmText !== 'ELIMINAR') return;
    setIsDeleting(true);
    
    try {
      const batch = writeBatch(db);
      const uid = currentUser.uid;

      batch.delete(doc(db, 'users', uid));

      const postsSnap = await getDocs(query(collection(db, 'posts'), where('authorId', '==', uid)));
      postsSnap.forEach(d => batch.delete(d.ref));

      const muralSnap = await getDocs(collection(db, 'users', uid, 'profileComments'));
      muralSnap.forEach(d => batch.delete(d.ref));

      await batch.commit();

      toast({
        title: "Conta eliminada",
        description: "Todos os teus dados foram removidos conforme o RGPD.",
      });

      await signOut(auth);
    } catch (e: any) {
      console.error(e);
      toast({
        variant: "destructive",
        title: "Erro ao eliminar",
        description: "Ocorreu um erro técnico. Tenta novamente.",
      });
    } finally {
      setIsDeleting(false);
      setDeleteConfirmStep(0);
    }
  };

  const handleSaveSettings = async () => {
    if (!currentUser) return;
    
    const hasEmptyLinks = editData.socialLinks.some(link => !link.url.trim());
    if (hasEmptyLinks) {
      toast({
        variant: "destructive",
        title: "Link obrigatório",
        description: "Por favor, insere um link para todas as redes sociais ou remove as vazias.",
      });
      return;
    }

    setIsSaving(true);
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        fullName: editData.fullName,
        description: editData.description,
        district: editData.district,
        zone: editData.zone,
        phoneNumber: editData.phoneNumber,
        photoUrl: editData.photoUrl,
        bannerUrl: editData.bannerUrl,
        socialLinks: editData.socialLinks
      });
      
      await checkAndAwardBadges(db, currentUser.uid);

      toast({
        title: "Definições guardadas!",
        description: "O teu perfil foi atualizado com sucesso.",
      });
      setShowSettings(false);
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Erro ao guardar",
        description: "Não foi possível atualizar o teu perfil.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddProfileComment = async () => {
    if (!newProfileComment.trim() || !currentUser || !userProfile || isSubmittingComment) return;

    setIsSubmittingComment(true);
    try {
      const cleanComment = filterProfanity(newProfileComment);
      const currentUserDoc = await getDocs(query(collection(db, 'users'), where('id', '==', currentUser.uid)));
      const currentUserData = currentUserDoc.docs[0].data();

      await addDoc(collection(db, 'users', targetUid, 'profileComments'), {
        text: cleanComment,
        authorId: currentUser.uid,
        authorUsername: currentUserData.username,
        authorAvatarLetter: currentUserData.avatarLetter,
        authorAvatarColor: currentUserData.avatarColor,
        timestamp: new Date().toISOString()
      });

      setNewProfileComment('');
      toast({
        title: "Mensagem enviada!",
        description: "O teu comentário foi publicado no mural.",
      });
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Erro ao comentar",
        description: "Não foi possível publicar a tua mensagem.",
      });
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, target: 'photo' | 'banner') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCropTarget(target);
        setCropAspect(target === 'photo' ? 1 : 16 / 9);
        setImageToCrop(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = (croppedImage: string) => {
    if (cropTarget === 'photo') {
      setEditData(prev => ({ ...prev, photoUrl: croppedImage }));
    } else {
      setEditData(prev => ({ ...prev, bannerUrl: croppedImage }));
    }
    setImageToCrop(null);
  };

  const handleGenerateBio = async () => {
    setIsGeneratingBio(true);
    try {
      const res = await generateBioDescription({
        name: editData.fullName,
        district: editData.district,
        zone: editData.zone
      });
      if (res.suggestions && res.suggestions.length > 0) {
        setEditData(prev => ({ ...prev, description: res.suggestions[0] }));
        toast({
          title: "Bio sugerida!",
          description: "A IA criou uma nova biografia para ti.",
        });
      }
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Erro na IA",
        description: "Não foi possível gerar a sugestão agora.",
      });
    } finally {
      setIsGeneratingBio(false);
    }
  };

  const addSocialLink = () => {
    setEditData(prev => ({
      ...prev,
      socialLinks: [...prev.socialLinks, { platform: 'Instagram', url: '' }]
    }));
  };

  const updateSocialLink = (index: number, field: keyof SocialLink, value: string) => {
    const newLinks = [...editData.socialLinks];
    newLinks[index][field] = value;
    setEditData(prev => ({ ...prev, socialLinks: newLinks }));
  };

  const removeSocialLink = (index: number) => {
    const newLinks = editData.socialLinks.filter((_, i) => i !== index);
    setEditData(prev => ({ ...prev, socialLinks: newLinks }));
  };

  const getSocialIcon = (platform: string) => {
    const iconClass = "w-5 h-5";
    switch (platform.toLowerCase()) {
      case 'instagram': return <Instagram className={iconClass} />;
      case 'youtube': return <Youtube className={iconClass} />;
      case 'facebook': return <Facebook className={iconClass} />;
      case 'x': return <Twitter className={iconClass} />;
      case 'tiktok': return (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.86-.6-4.12-1.31a6.417 6.417 0 01-1.87-1.56v7.14c0 2.64-.49 5.24-2.11 7.34-1.61 2.09-4.14 3.42-6.72 3.41-2.01.02-3.95-.53-5.63-1.63-1.69-1.11-3.03-2.76-3.83-4.66-.82-1.92-1-4.06-.54-6.11.45-2.07 1.59-3.98 3.23-5.32 1.63-1.34 3.69-2.08 5.81-2.1v4.2c-1.43-.02-2.88.36-4.04 1.21-1.16.85-2 2.13-2.31 3.53-.3 1.41-.04 2.89.74 4.11.77 1.23 2.02 2.14 3.44 2.5 1.43.36 2.95.16 4.25-.56 1.3-.72 2.3-1.95 2.76-3.37.26-.82.38-1.67.36-2.53V.02z"/>
        </svg>
      );
      default: return <Globe className={iconClass} />;
    }
  };

  const trustLevel = getTrustLevel(userProfile.points || 0);
  
  const joinDateFormatted = userProfile.joinedTimestamp 
    ? format(new Date(userProfile.joinedTimestamp), "'Membro desde' MMMM 'de' yyyy", { locale: pt })
    : '';

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 min-h-full bg-background">
      <div className="h-40 relative overflow-hidden bg-primary shrink-0">
         {userProfile.bannerUrl ? (
           <Image 
             src={userProfile.bannerUrl} 
             alt="Banner" 
             fill 
             className="object-cover" 
             priority
           />
         ) : (
           <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-transparent" />
         )}
         <div className="absolute inset-0 bg-black/20" />
         
         <div className="absolute top-4 left-4 flex gap-2 z-10">
            {onBack && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="bg-white/20 text-white hover:bg-primary hover:text-white rounded-full active:scale-90 transition-all border border-white/10" 
                onClick={onBack}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
            )}
         </div>
         <div className="absolute top-4 right-4 flex gap-2 z-10">
            {isOwnProfile && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="bg-white/20 text-white hover:bg-primary hover:text-white rounded-full active:scale-90 transition-all border border-white/10" 
                onClick={() => setShowSettings(true)}
              >
                <Settings className="w-5 h-5" />
              </Button>
            )}
         </div>
      </div>

      <div className="px-6 -mt-16 space-y-6 pb-32 relative z-10">
        <div className="flex flex-col items-center text-center space-y-3">
          <Avatar className="w-28 h-28 border-4 border-white shadow-xl hover:scale-105 transition-transform duration-300">
            {userProfile.photoUrl && <AvatarImage src={userProfile.photoUrl} className="object-cover" />}
            <AvatarFallback className="text-white text-4xl font-headline" style={{ backgroundColor: userProfile.avatarColor }}>
              {userProfile.avatarLetter}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-1 animate-in slide-in-from-top-2 duration-500">
            <div className="flex items-center justify-center gap-1.5">
              <h2 className="font-headline text-2xl text-primary">{userProfile.fullName}</h2>
              {userProfile.username === '@faroltech' && (
                <BadgeCheck className="w-6 h-6 text-[#0095f6] fill-[#0095f6]/10 shrink-0" />
              )}
              {trustLevel && (
                <span title={trustLevel.label} className="text-2xl">{trustLevel.icon}</span>
              )}
            </div>
            <p className="text-muted-foreground text-sm font-medium">{userProfile.username}</p>
            
            {userProfile.socialLinks && userProfile.socialLinks.length > 0 && (
              <div className="flex items-center justify-center gap-3 pt-2">
                {userProfile.socialLinks.map((link: SocialLink, idx: number) => (
                  <a 
                    key={idx} 
                    href={link.url.startsWith('http') ? link.url : `https://${link.url}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-2 bg-white rounded-full shadow-sm hover:scale-110 hover:text-primary transition-all border border-secondary"
                  >
                    {getSocialIcon(link.platform)}
                  </a>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary px-4 py-1.5 rounded-full shadow-sm">
              <MapPin className="w-3 h-3 text-primary" /> {userProfile.zone}, {userProfile.district}
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/70 uppercase font-black tracking-widest pt-1">
              <CalendarDays className="w-3 h-3" /> {joinDateFormatted}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Ajudas', value: userProfile.helpsGiven, icon: ThumbsUp },
            { label: 'Posts', value: postCount, icon: MessageCircle },
            { 
              label: 'Pontos', 
              value: userProfile.points, 
              icon: Award, 
              onClick: () => isOwnProfile && setShowPointsGuide(true)
            },
          ].map((stat) => (
            <Card 
              key={stat.label} 
              className={`border-none bg-white shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 ${stat.onClick ? 'cursor-help ring-1 ring-primary/5' : ''}`}
              onClick={stat.onClick}
            >
              <CardContent className="p-4 flex flex-col items-center justify-center">
                <span className="text-lg font-black text-primary">{stat.value}</span>
                <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest">{stat.label}</span>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="space-y-4">
          <h3 className="font-headline text-lg">Sobre {isOwnProfile ? 'mim' : userProfile.fullName.split(' ')[0]}</h3>
          <div className="text-sm text-muted-foreground bg-white p-5 rounded-3xl italic shadow-sm border border-secondary">
            {userProfile.description || (isOwnProfile ? "Conta algo sobre ti à comunidade..." : "Este utilizador ainda não adicionou uma descrição.")}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-headline text-lg flex items-center gap-2">
            <LayoutGrid className="w-5 h-5 text-primary" /> Publicações Ativas
          </h3>
          {postsLoading ? (
            <div className="space-y-3">
              <div className="h-32 bg-secondary/20 animate-pulse rounded-3xl" />
            </div>
          ) : activeUserPosts.length > 0 ? (
            <div className="space-y-4">
              {activeUserPosts.map(post => (
                <PostCard key={post.id} post={post} onProfileClick={onProfileClick || (() => {})} />
              ))}
            </div>
          ) : (
            <div className="py-8 text-center bg-secondary/5 rounded-3xl border border-dashed text-muted-foreground text-[10px] font-bold uppercase tracking-widest">
              Nenhuma publicação ativa no momento
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h3 className="font-headline text-lg">Avaliações e Testemunhos</h3>
          <RatingStats profile={userProfile} onProfileClick={onProfileClick} />
        </div>

        <div className="space-y-4 pt-6 border-t">
          <div className="flex items-center justify-between">
            <h3 className="font-headline text-lg flex items-center gap-2">
              <MessageSquareQuote className="w-5 h-5 text-primary" /> Mural da Comunidade
            </h3>
          </div>

          {!isOwnProfile && (
            <div className="bg-white p-4 rounded-3xl border shadow-sm space-y-3">
              <Textarea 
                placeholder={`Deixa uma mensagem para ${userProfile.fullName.split(' ')[0]}...`}
                value={newProfileComment}
                onChange={(e) => setNewProfileComment(e.target.value)}
                className="text-xs min-h-[80px] rounded-2xl resize-none border-secondary focus:border-primary"
              />
              <div className="flex justify-end">
                <Button 
                  size="sm" 
                  className="h-8 text-[10px] font-black uppercase tracking-widest gap-2 rounded-xl"
                  disabled={!newProfileComment.trim() || isSubmittingComment}
                  onClick={handleAddProfileComment}
                >
                  {isSubmittingComment ? "A enviar..." : "Publicar no Mural"} <Send className="w-3 h-3" />
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {profileComments && profileComments.length > 0 ? (
              <div className="space-y-3">
                {profileComments.map((pc: any) => (
                  <MuralCommentItem 
                    key={pc.id} 
                    comment={pc} 
                    onProfileClick={onProfileClick} 
                  />
                ))}
              </div>
            ) : (
              <div className="py-8 text-center bg-secondary/5 rounded-3xl border border-dashed text-muted-foreground text-[10px] font-bold uppercase tracking-widest">
                Ainda sem mensagens no mural
              </div>
            )}
          </div>
        </div>

        <div className="pt-4 border-t space-y-4">
          <BadgeGrid userProfile={userProfile} />
        </div>

        {isOwnProfile && (
          <div className="pt-6 border-t flex flex-col gap-2">
            <div className="flex items-center justify-center gap-4 text-[10px] text-muted-foreground font-black uppercase tracking-widest mb-4">
              <button onClick={() => setLegalModal({ isOpen: true, type: 'terms' })} className="hover:text-primary">Termos</button>
              <span>•</span>
              <button onClick={() => setLegalModal({ isOpen: true, type: 'privacy' })} className="hover:text-primary">Privacidade</button>
            </div>
            <Button 
              variant="outline" 
              className="w-full text-destructive border-destructive/20 hover:bg-primary hover:text-white active:bg-accent active:scale-95 transition-all rounded-2xl h-12 font-bold" 
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" /> Sair da Conta
            </Button>
          </div>
        )}
      </div>

      <LegalModal 
        isOpen={legalModal.isOpen} 
        type={legalModal.type} 
        onClose={() => setLegalModal({ ...legalModal, isOpen: false })} 
      />

      <Dialog open={showPointsGuide} onOpenChange={setShowPointsGuide}>
        <DialogContent className="max-w-[360px] rounded-3xl z-[200]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" /> Mérito Comunitário
            </DialogTitle>
            <DialogDescription className="text-xs pt-2">
              Os teus pontos refletem a tua contribuição para a comunidade. Ganha pontos ajudando os teus vizinhos.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 py-4">
            {[
              { label: "Ser aceite para ajudar", value: "+10 pts" },
              { label: "Resolver uma Ajuda", value: "+20 pts" },
              { label: "Resolver um SOS Urgente", value: "+50 pts" },
              { label: "Comentar num Post", value: "+5 pts" },
              { label: "Avaliação 5 Estrelas", value: "+15 pts" },
              { label: "Grupo atingir 5 membros", value: "+25 pts" },
            ].map((item, i) => (
              <div key={i} className="flex justify-between items-center p-2.5 bg-secondary/20 rounded-xl border border-transparent hover:border-primary/10 transition-all">
                <span className="text-[11px] font-bold">{item.label}</span>
                <span className="text-[11px] font-black text-primary">{item.value}</span>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button className="w-full rounded-xl font-bold" onClick={() => setShowPointsGuide(false)}>
              Entendi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {showSettings && (
        <div className="fixed inset-0 z-[110] bg-white animate-in slide-in-from-right duration-300 flex flex-col">
           <header className="p-4 border-b flex items-center justify-between shrink-0 bg-white">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => setShowSettings(false)}>
                  <X className="w-6 h-6" />
                </Button>
                <h2 className="font-headline text-xl">Definições</h2>
              </div>
              <Button 
                size="sm" 
                className="rounded-full bg-primary text-white font-bold h-9 px-4" 
                onClick={handleSaveSettings}
                disabled={isSaving}
              >
                <Save className="w-4 h-4 mr-1.5" /> Guardar
              </Button>
           </header>

           <ScrollArea className="flex-1">
             <div className="p-6 space-y-8 pb-24">
                <div className="space-y-6">
                  <h3 className="text-xs font-black uppercase text-primary tracking-widest border-b pb-2 flex items-center justify-between">
                    Banner e Foto de Perfil <UserIcon className="w-4 h-4" />
                  </h3>
                  
                  <div className="flex flex-col gap-6">
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase text-muted-foreground">Banner do Perfil</Label>
                      <div className="h-32 rounded-2xl bg-secondary relative overflow-hidden group cursor-pointer border-2 border-dashed border-muted-foreground/20" onClick={() => bannerInputRef.current?.click()}>
                        {editData.bannerUrl && <Image src={editData.bannerUrl} alt="Banner" fill className="object-cover" />}
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Settings className="text-white w-6 h-6" />
                        </div>
                      </div>
                      <input type="file" ref={bannerInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'banner')} />
                    </div>

                    <div className="flex flex-col items-center gap-3">
                      <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                        <Avatar className="w-24 h-24 border-2 border-primary/20 shadow-md">
                          {editData.photoUrl && <AvatarImage src={editData.photoUrl} className="object-cover" />}
                          <AvatarFallback className="text-2xl font-bold" style={{ backgroundColor: userProfile.avatarColor }}>
                            {userProfile.avatarLetter}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Settings className="text-white w-6 h-6" />
                        </div>
                      </div>
                      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'photo')} />
                      <p className="text-[10px] text-muted-foreground uppercase font-black">Foto de Perfil</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-xs font-black uppercase text-primary tracking-widest border-b pb-2">Informação Pessoal</h3>
                  
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase text-muted-foreground">Nome Completo <span className="text-destructive">*</span></Label>
                    <input className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary" value={editData.fullName} onChange={e => setEditData({...editData, fullName: e.target.value})} />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-black uppercase text-muted-foreground">Biografia</Label>
                      <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-1 px-2 text-primary" onClick={handleGenerateBio} disabled={isGeneratingBio}>
                        <Sparkles className={`w-3 h-3 ${isGeneratingBio ? 'animate-spin' : ''}`} /> Sugerir com IA
                      </Button>
                    </div>
                    <Textarea value={editData.description} onChange={e => setEditData({...editData, description: e.target.value})} className="min-h-[100px] rounded-xl" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase text-muted-foreground">Distrito <span className="text-destructive">*</span></Label>
                      <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary" value={editData.district} onChange={e => setEditData({...editData, district: e.target.value})}>
                        {DISTRITOS_PORTUGAL.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase text-muted-foreground">Zona/Bairro <span className="text-destructive">*</span></Label>
                      <input className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary" value={editData.zone} onChange={e => setEditData({...editData, zone: e.target.value})} />
                    </div>
                  </div>
                </div>

                <div className="space-y-6 pt-6 border-t">
                  <h3 className="text-xs font-black uppercase text-primary tracking-widest border-b pb-2 flex items-center justify-between">
                    Redes Sociais <LinkIcon className="w-4 h-4" />
                  </h3>
                  
                  <div className="space-y-4">
                    {editData.socialLinks.map((link, index) => (
                      <div key={index} className="flex gap-2 items-end animate-in fade-in slide-in-from-top-2">
                        <div className="w-32 space-y-1.5">
                          <Label className="text-[10px] font-black uppercase text-muted-foreground">Plataforma</Label>
                          <select 
                            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs focus:ring-2 focus:ring-primary"
                            value={link.platform}
                            onChange={(e) => updateSocialLink(index, 'platform', e.target.value)}
                          >
                            <option value="Instagram">Instagram</option>
                            <option value="YouTube">YouTube</option>
                            <option value="TikTok">TikTok</option>
                            <option value="Facebook">Facebook</option>
                            <option value="X">X (Twitter)</option>
                            <option value="Website">Website</option>
                            <option value="Outro">Outro</option>
                          </select>
                        </div>
                        <div className="flex-1 space-y-1.5">
                          <Label className="text-[10px] font-black uppercase text-muted-foreground">Link / URL <span className="text-destructive">*</span></Label>
                          <Input 
                            placeholder="ex: instagram.com/teu_user" 
                            value={link.url} 
                            onChange={(e) => updateSocialLink(index, 'url', e.target.value)}
                            className="h-9 text-xs rounded-lg"
                          />
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-9 w-9 text-destructive hover:bg-destructive/10 rounded-lg shrink-0"
                          onClick={() => removeSocialLink(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    
                    <Button 
                      variant="outline" 
                      className="w-full border-dashed border-2 h-10 text-xs font-bold gap-2 rounded-xl text-primary"
                      onClick={addSocialLink}
                    >
                      <Plus className="w-4 h-4" /> Adicionar Rede Social
                    </Button>
                  </div>
                </div>

                <div className="space-y-6 pt-6 border-t">
                  <h3 className="text-xs font-black uppercase text-primary tracking-widest border-b pb-2">Documentação Legal</h3>
                  <div className="flex flex-col gap-2">
                    <Button variant="outline" className="justify-between text-xs font-bold" onClick={() => setLegalModal({ isOpen: true, type: 'terms' })}>
                      Termos e Condições <FileText className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" className="justify-between text-xs font-bold" onClick={() => setLegalModal({ isOpen: true, type: 'privacy' })}>
                      Política de Privacidade <ShieldCheck className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-6 pt-6 border-t">
                   <h3 className="text-xs font-black uppercase text-destructive tracking-widest border-b pb-2 flex items-center justify-between">
                    Área de Perigo (RGPD) <AlertTriangle className="w-4 h-4" />
                  </h3>
                  <p className="text-[10px] text-muted-foreground italic leading-tight">
                    Conforme o Direito ao Esquecimento, podes apagar todos os teus dados definitivamente da plataforma.
                  </p>
                  <Button 
                    variant="destructive" 
                    className="w-full h-12 rounded-2xl font-black uppercase tracking-widest text-[10px] gap-2"
                    onClick={() => setDeleteConfirmStep(1)}
                  >
                    <Trash className="w-4 h-4" /> Eliminar Conta e Dados
                  </Button>
                </div>
             </div>
           </ScrollArea>
        </div>
      )}

      <Dialog open={deleteConfirmStep > 0} onOpenChange={(open) => !open && setDeleteConfirmStep(0)}>
        <DialogContent className="max-w-[340px] rounded-3xl z-[300]">
          {deleteConfirmStep === 1 ? (
            <>
              <DialogHeader>
                <DialogTitle className="text-destructive flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" /> Tens a certeza?
                </DialogTitle>
                <DialogDescription className="text-xs pt-2">
                  Esta ação irá apagar o teu perfil, posts, comentários e mensagens permanentemente. Não há volta atrás.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="flex flex-col gap-2 pt-4">
                <Button className="w-full bg-destructive font-bold h-11" onClick={() => setDeleteConfirmStep(2)}>
                  Sim, Continuar
                </Button>
                <Button variant="ghost" className="w-full h-11" onClick={() => setDeleteConfirmStep(0)}>
                  Cancelar
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="text-destructive">Confirmação Final</DialogTitle>
                <DialogDescription className="text-xs pt-2">
                  Esta ação é irreversível. Escreve <span className="font-black text-foreground">ELIMINAR</span> para confirmar a remoção total dos teus dados.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Input 
                  placeholder="Escreve aqui..." 
                  value={deleteConfirmText} 
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className="text-center font-black uppercase tracking-widest border-destructive/20 focus:border-destructive"
                />
              </div>
              <DialogFooter className="flex flex-col gap-2">
                <Button 
                  className="w-full bg-destructive font-black h-12 uppercase tracking-widest" 
                  disabled={deleteConfirmText !== 'ELIMINAR' || isDeleting}
                  onClick={handleDeleteAccount}
                >
                  {isDeleting ? "A eliminar tudo..." : "Eliminar Definitivamente"}
                </Button>
                <Button variant="ghost" className="w-full h-11" onClick={() => setDeleteConfirmStep(0)}>
                  Mudar de Ideia
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <ImageCropper 
        image={imageToCrop} 
        aspect={cropAspect}
        onCropComplete={handleCropComplete} 
        onCancel={() => setImageToCrop(null)} 
      />
    </div>
  );
}

function MuralCommentItem({ comment, onProfileClick }: { comment: any, onProfileClick?: (uid: string) => void }) {
  const db = useFirestore();
  const authorRef = useMemoFirebase(() => doc(db, 'users', comment.authorId), [db, comment.authorId]);
  const { data: authorProfile } = useDoc(authorRef);
  const trustLevel = authorProfile ? getTrustLevel(authorProfile.points || 0) : null;

  return (
    <div className="flex gap-3 animate-in fade-in slide-in-from-left-2 duration-300">
      <Avatar 
        className="w-8 h-8 shrink-0 border cursor-pointer hover:scale-110 transition-transform shadow-sm"
        onClick={() => onProfileClick?.(comment.authorId)}
      >
        {authorProfile?.photoUrl && <AvatarImage src={authorProfile.photoUrl} className="object-cover" />}
        <AvatarFallback className="text-[10px] font-bold text-white" style={{ backgroundColor: comment.authorAvatarColor }}>
          {comment.authorAvatarLetter}
        </AvatarFallback>
      </Avatar>
      <div className="bg-white p-3 rounded-2xl flex-1 shadow-sm border border-secondary/50">
        <div className="flex items-center justify-between mb-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-black text-primary cursor-pointer hover:underline" onClick={() => onProfileClick?.(comment.authorId)}>
                {comment.authorUsername}
              </span>
              {comment.authorUsername === '@faroltech' && <BadgeCheck className="w-3 h-3 text-[#0095f6]" />}
            </div>
            {trustLevel && (
              <div className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full ${trustLevel.bg} border border-current/10 ${trustLevel.color} text-[7px] font-black uppercase`}>
                {trustLevel.icon} {trustLevel.label}
              </div>
            )}
          </div>
          <span className="text-[8px] text-muted-foreground shrink-0">
            {formatDistanceToNow(new Date(comment.timestamp), { addSuffix: true, locale: pt })}
          </span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">{comment.text}</p>
      </div>
    </div>
  );
}
