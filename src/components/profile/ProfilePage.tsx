
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
  MapPin, Award, ThumbsUp, LogOut, MessageCircle, X, ArrowLeft, Save, 
  Sparkles, Phone, User as UserIcon, Mail, AtSign, Lock, Camera, Flag, 
  ShieldCheck, Info, CheckCircle2, XCircle, HeartHandshake,
  Instagram, Youtube, Globe, Link as LinkIcon, Plus, Trash2, CalendarDays,
  Send, MessageSquareQuote, ChevronDown, ChevronUp, Image as ImageIcon
} from "lucide-react";
import RatingStats from './RatingStats';
import BadgeGrid from './BadgeGrid';
import { useUser, useDoc, useFirestore, useMemoFirebase, useAuth, useCollection } from '@/firebase';
import { doc, collection, query, where, getDocs, updateDoc, addDoc, orderBy, limit } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useToast } from "@/hooks/use-toast";
import { DISTRITOS_PORTUGAL } from '@/lib/geo';
import { generateBioDescription } from '@/ai/flows/bio-description-generation-flow';
import { checkAndAwardBadges } from '@/lib/badge-logic';
import { getTrustLevel } from '@/lib/trust-levels';
import ReportModal from '../security/ReportModal';
import { differenceInDays, format, formatDistanceToNow } from 'date-fns';
import { pt } from 'date-fns/locale';
import ImageCropper from '@/components/profile/ImageCropper';
import { filterProfanity } from '@/lib/utils';
import Image from 'next/image';

interface SocialLink {
  platform: string;
  url: string;
}

interface ProfilePageProps {
  userId?: string;
  onBack?: () => void;
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
  const [isReportOpen, setIsReportOpen] = React.useState(false);
  
  const [imageToCrop, setImageToCrop] = React.useState<string | null>(null);
  const [cropAspect, setCropAspect] = React.useState(1);
  const [cropTarget, setCropTarget] = React.useState<'photo' | 'banner'>('photo');

  const [newProfileComment, setNewProfileComment] = React.useState('');
  const [isSubmittingComment, setIsSubmittingComment] = React.useState(false);
  
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
    if (targetUid) {
      const q = query(collection(db, "posts"), where("authorId", "==", targetUid));
      getDocs(q).then(snapshot => {
        setPostCount(snapshot.size);
      });
    }
  }, [db, targetUid]);

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
    switch (platform.toLowerCase()) {
      case 'instagram': return <Instagram className="w-5 h-5" />;
      case 'youtube': return <Youtube className="w-5 h-5" />;
      case 'discord': return (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037 19.736 19.736 0 0 0-4.885 1.515.069.069 0 0 0-.032.027C.533 9.048-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.419 0 1.334-.947 2.419-2.157 2.419zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.419 0 1.334-.946 2.419-2.157 2.419z"/>
        </svg>
      );
      case 'tiktok': return (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.86-.6-4.12-1.31a6.417 6.417 0 0 1-1.87-1.51c-.02 2.76-.01 5.51-.01 8.26 0 1.45-.27 2.91-.81 4.26-.71 1.89-2.22 3.35-4.09 4.07a8.456 8.456 0 0 1-6.03.08c-1.89-.71-3.41-2.21-4.11-4.1-.76-1.96-.69-4.13.12-6.03.71-1.89 2.22-3.35 4.09-4.07 1.65-.65 3.47-.67 5.14-.21v4.03c-1.17-.4-2.48-.39-3.64.1-.74.31-1.37.85-1.74 1.54-.37.71-.4 1.51-.23 2.28.14.71.55 1.35 1.1 1.81.56.46 1.28.71 2.01.71.74 0 1.45-.25 2.01-.71.56-.46.96-1.1 1.1-1.81.14-.61.12-1.24.12-1.86V.02z"/>
        </svg>
      );
      default: return <Globe className="w-5 h-5" />;
    }
  };

  const trustLevel = getTrustLevel(userProfile.points || 0);
  
  const accountAge = differenceInDays(new Date(), new Date(userProfile.joinedTimestamp));
  const isSOSVerified = accountAge >= 30 && userProfile.points >= 50 && userProfile.helpsGiven >= 2 && (userProfile.reportCount || 0) === 0;

  const joinDateFormatted = userProfile.joinedTimestamp 
    ? format(new Date(userProfile.joinedTimestamp), "'Membro desde' MMMM 'de' yyyy", { locale: pt })
    : '';

  const handleMuralAuthorClick = (uid: string) => {
    if (onProfileClick) {
      onProfileClick(uid);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-full bg-background">
      <div className="h-40 relative overflow-hidden bg-primary">
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
              <Button variant="ghost" size="icon" className="bg-white/20 text-white hover:bg-white/40 rounded-full active:scale-90 transition-all" onClick={onBack}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
            )}
         </div>
         <div className="absolute top-4 right-4 flex gap-2 z-10">
            {!isOwnProfile && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="bg-white/20 text-white hover:bg-white/40 rounded-full active:scale-90 transition-all text-destructive-foreground hover:bg-primary"
                onClick={() => setIsReportOpen(true)}
              >
                <Flag className="w-5 h-5" />
              </Button>
            )}
            {isOwnProfile && (
              <Button variant="ghost" size="icon" className="bg-white/20 text-white hover:bg-white/40 rounded-full active:scale-90 transition-all" onClick={() => setShowSettings(true)}>
                <Save className="w-5 h-5" />
              </Button>
            )}
         </div>
      </div>

      <div className="px-6 -mt-16 space-y-6 pb-24 relative z-10">
        <div className="flex flex-col items-center text-center space-y-3">
          <Avatar className="w-28 h-28 border-4 border-white shadow-xl hover:scale-105 transition-transform duration-300">
            {userProfile.photoUrl && <AvatarImage src={userProfile.photoUrl} className="object-cover" />}
            <AvatarFallback className="text-white text-4xl font-headline" style={{ backgroundColor: userProfile.avatarColor }}>
              {userProfile.avatarLetter}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-1 animate-in slide-in-from-top-2 duration-500">
            <div className="flex items-center justify-center gap-2">
              <h2 className="font-headline text-2xl text-primary">{userProfile.fullName}</h2>
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

            <div className="flex items-center justify-center gap-2 mt-2">
              {trustLevel && (
                <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full ${trustLevel.bg} ${trustLevel.color} text-[10px] font-black uppercase tracking-wider border border-current/20`}>
                  <Award className="w-3 h-3" /> {trustLevel.label}
                </div>
              )}
              {isSOSVerified && (
                <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-wider border border-primary/20">
                  <ShieldCheck className="w-3 h-3" /> SOS Verificado 🛡️
                </div>
              )}
            </div>
          </div>
          
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary px-4 py-1.5 rounded-full shadow-sm">
              <MapPin className="w-3 h-3 text-primary" /> {userProfile.zone}, {userProfile.district}
            </div>
            {joinDateFormatted && (
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/70 uppercase font-black tracking-widest pt-1">
                <CalendarDays className="w-3 h-3" /> {joinDateFormatted}
              </div>
            )}
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
                {stat.onClick && (
                  <span className="text-[8px] text-primary font-bold mt-1.5 uppercase tracking-tighter opacity-80">Saber Mais</span>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="space-y-2">
          <h3 className="font-headline text-lg">Sobre {isOwnProfile ? 'mim' : userProfile.fullName.split(' ')[0]}</h3>
          <div className="text-sm text-muted-foreground bg-white p-5 rounded-3xl italic shadow-sm border border-secondary">
            {userProfile.description || (isOwnProfile ? "Conta algo sobre ti à comunidade..." : "Este utilizador ainda não adicionou uma descrição.")}
          </div>
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
            {rawProfileComments && rawProfileComments.length > 3 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 text-[9px] font-black uppercase text-primary hover:bg-primary/5"
                onClick={() => setShowAllMural(!showAllMural)}
              >
                {showAllMural ? (
                  <><ChevronUp className="w-3 h-3 mr-1" /> Ver Menos</>
                ) : (
                  <><ChevronDown className="w-3 h-3 mr-1" /> Ver Todos ({rawProfileComments.length})</>
                )}
              </Button>
            )}
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
            {commentsLoading ? (
              <div className="space-y-2">
                {[1, 2].map(i => <div key={i} className="h-20 bg-secondary/20 animate-pulse rounded-2xl" />)}
              </div>
            ) : profileComments && profileComments.length > 0 ? (
              <div className="space-y-3 animate-in fade-in duration-500">
                {profileComments.map((pc: any) => (
                  <div key={pc.id} className="flex gap-3 animate-in fade-in slide-in-from-left-2">
                    <Avatar 
                      className="w-8 h-8 shrink-0 border cursor-pointer hover:scale-110 transition-transform shadow-sm"
                      onClick={() => handleMuralAuthorClick(pc.authorId)}
                    >
                      <AvatarFallback className="text-[10px] font-bold text-white" style={{ backgroundColor: pc.authorAvatarColor }}>
                        {pc.authorAvatarLetter}
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-white p-3 rounded-2xl flex-1 shadow-sm border border-secondary/50">
                      <div className="flex items-center justify-between mb-1">
                        <span 
                          className="text-[10px] font-black text-primary cursor-pointer hover:underline"
                          onClick={() => handleMuralAuthorClick(pc.authorId)}
                        >
                          {pc.authorUsername}
                        </span>
                        <span className="text-[8px] text-muted-foreground uppercase font-medium">
                          {formatDistanceToNow(new Date(pc.timestamp), { addSuffix: true, locale: pt })}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{pc.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center bg-secondary/5 rounded-3xl border border-dashed flex flex-col items-center gap-2">
                <MessageCircle className="w-8 h-8 text-muted-foreground/30" />
                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Ainda sem mensagens no mural</p>
              </div>
            )}
          </div>
        </div>

        <div className="pt-4 border-t space-y-4">
          <BadgeGrid userProfile={userProfile} />
        </div>

        {!isOwnProfile && (
          <div className="pt-6 border-t">
            <Button 
              variant="outline" 
              className="w-full text-destructive border-destructive/20 hover:bg-primary hover:text-white active:bg-primary active:text-white active:scale-95 transition-all rounded-2xl h-12 font-bold gap-2" 
              onClick={() => setIsReportOpen(true)}
            >
              <Flag className="w-4 h-4" /> Denunciar {userProfile.fullName.split(' ')[0]}
            </Button>
          </div>
        )}

        {isOwnProfile && (
          <Button 
            variant="outline" 
            className="w-full text-destructive border-destructive/20 hover:bg-primary hover:text-white active:bg-accent active:scale-95 transition-all rounded-2xl h-12 font-bold" 
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" /> Sair da Conta
          </Button>
        )}
      </div>

      <ReportModal 
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        reportedUserId={targetUid}
      />

      {showPointsGuide && (
        <div className="fixed inset-0 z-[120] bg-white animate-in slide-in-from-bottom duration-300 flex flex-col">
          <header className="p-4 border-b flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => setShowPointsGuide(false)}><X className="w-6 h-6" /></Button>
              <h2 className="font-headline text-xl">Guia de Gratidão</h2>
            </div>
          </header>
          <ScrollArea className="flex-1 p-6">
            <div className="space-y-8 pb-20">
              <div className="bg-primary/5 p-6 rounded-3xl border border-primary/10 text-center">
                <HeartHandshake className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="font-headline text-lg text-primary mb-2">Mérito por Ajuda Real</h3>
                <p className="text-sm text-muted-foreground italic">
                  No Portugal Unido, os pontos refletem o teu impacto real. Ganhas pontos apenas quando ajudas alguém.
                </p>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-black uppercase text-primary tracking-widest border-b pb-2">Como Ganhar Pontos</h4>
                <div className="grid gap-3">
                  {[
                    { label: "Ser aceite como ajudante", pts: "+10" },
                    { label: "Tarefa marcada como resolvida", pts: "+20" },
                    { label: "Resolver um SOS urgente", pts: "+30" },
                    { label: "Partilha confirmada por alguém", pts: "+10" },
                    { label: "Avaliação 5 Estrelas", pts: "+15" },
                    { label: "Avaliação 4 Estrelas", pts: "+10" },
                    { label: "Avaliação 3 Estrelas", pts: "+5" },
                    { label: "Grupo atingir 5 membros ativos", pts: "+25" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-secondary/20 rounded-2xl border border-transparent hover:border-primary/20 transition-all">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                        <span className="text-sm font-bold">{item.label}</span>
                      </div>
                      <span className="text-primary font-black text-sm">{item.pts} pts</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-black uppercase text-destructive tracking-widest border-b pb-2">Ações que NÃO dão Pontos</h4>
                <div className="grid gap-2">
                  {[
                    "Criar posts de qualquer tipo",
                    "Comentar em publicações",
                    "Fazer login diário",
                    "Completar o perfil",
                    "Candidatar-se a tarefas",
                    "Enviar mensagens no chat"
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 px-3 bg-destructive/5 rounded-xl text-xs text-muted-foreground italic">
                      <XCircle className="w-3.5 h-3.5 text-destructive/40" />
                      {item}
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-center text-muted-foreground mt-4 leading-relaxed">
                  Trabalhamos para garantir que o selo de confiança seja um reflexo honesto da entreajuda na nossa comunidade.
                </p>
              </div>
            </div>
          </ScrollArea>
        </div>
      )}

      {showSettings && (
        <div className="fixed inset-0 z-[110] bg-white animate-in slide-in-from-right duration-300 flex flex-col">
           <header className="p-4 border-b flex items-center justify-between shrink-0 bg-white">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" className="active:scale-90" onClick={() => setShowSettings(false)}>
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
                <Save className="w-4 h-4 mr-1.5" /> {isSaving ? "A guardar..." : "Guardar"}
              </Button>
           </header>

           <ScrollArea className="flex-1">
             <div className="p-6 space-y-8 pb-24">
                <div className="space-y-6">
                  <h3 className="text-xs font-black uppercase text-primary tracking-widest border-b pb-2 flex items-center justify-between">
                    Banner e Foto de Perfil <Camera className="w-4 h-4" />
                  </h3>
                  
                  <div className="flex flex-col gap-6">
                    {/* Banner Edit Section */}
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase text-muted-foreground">Banner do Perfil</Label>
                      <div 
                        className="h-32 rounded-2xl bg-secondary relative overflow-hidden group cursor-pointer border-2 border-dashed border-muted-foreground/20 hover:border-primary/40 transition-all"
                        onClick={() => bannerInputRef.current?.click()}
                      >
                        {editData.bannerUrl ? (
                          <Image src={editData.bannerUrl} alt="Banner Preview" fill className="object-cover" />
                        ) : (
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground/60">
                            <ImageIcon className="w-8 h-8 mb-1" />
                            <span className="text-[10px] uppercase font-black">Adicionar Banner</span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Camera className="text-white w-6 h-6" />
                        </div>
                      </div>
                      <input 
                        type="file" 
                        ref={bannerInputRef} 
                        className="hidden" 
                        accept="image/*" 
                        onChange={(e) => handleFileChange(e, 'banner')} 
                      />
                    </div>

                    {/* Photo Edit Section */}
                    <div className="flex flex-col items-center gap-3 pt-2">
                      <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                        <Avatar className="w-24 h-24 border-2 border-primary/20 shadow-md">
                          {editData.photoUrl && <AvatarImage src={editData.photoUrl} className="object-cover" />}
                          <AvatarFallback className="text-2xl font-bold" style={{ backgroundColor: userProfile.avatarColor }}>
                            {userProfile.avatarLetter}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Camera className="text-white w-6 h-6" />
                        </div>
                      </div>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/*" 
                        onChange={(e) => handleFileChange(e, 'photo')} 
                      />
                      <p className="text-[10px] text-muted-foreground uppercase font-black">Foto de Perfil</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-xs font-black uppercase text-primary tracking-widest border-b pb-2">Informação Pessoal</h3>
                  
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase text-muted-foreground flex items-center gap-2">
                      <UserIcon className="w-3 h-3" /> Nome Completo
                    </Label>
                    <input 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary"
                      value={editData.fullName} 
                      onChange={e => setEditData({...editData, fullName: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-black uppercase text-muted-foreground">Biografia</Label>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 text-[10px] gap-1 px-2 hover:bg-primary/5 text-primary"
                        onClick={handleGenerateBio}
                        disabled={isGeneratingBio}
                      >
                        <Sparkles className={`w-3 h-3 ${isGeneratingBio ? 'animate-spin' : ''}`} /> 
                        {isGeneratingBio ? 'A gerar...' : 'Sugerir com IA'}
                      </Button>
                    </div>
                    <Textarea 
                      value={editData.description} 
                      onChange={e => setEditData({...editData, description: e.target.value})}
                      placeholder="Conta algo sobre ti..."
                      className="min-h-[100px] rounded-xl resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase text-muted-foreground">Distrito</Label>
                      <select 
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary"
                        value={editData.district} 
                        onChange={e => setEditData({...editData, district: e.target.value})}
                      >
                        {DISTRITOS_PORTUGAL.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase text-muted-foreground">Zona/Bairro</Label>
                      <input 
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary"
                        value={editData.zone} 
                        onChange={e => setEditData({...editData, zone: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase text-muted-foreground flex items-center gap-2">
                      <Phone className="w-3 h-3" /> Telemóvel (+351)
                    </Label>
                    <input 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary"
                      value={editData.phoneNumber} 
                      onChange={e => setEditData({...editData, phoneNumber: e.target.value})}
                      placeholder="912 345 678"
                    />
                  </div>
                </div>

                <div className="space-y-6 pt-4">
                  <h3 className="text-xs font-black uppercase text-primary tracking-widest border-b pb-2 flex items-center justify-between">
                    Redes Sociais <LinkIcon className="w-4 h-4" />
                  </h3>
                  
                  <div className="space-y-4">
                    {editData.socialLinks.map((link, idx) => (
                      <div key={idx} className="flex gap-2 items-end animate-in fade-in slide-in-from-left-2">
                        <div className="flex-1 space-y-2">
                          <Label className="text-[10px] uppercase font-bold text-muted-foreground">Plataforma</Label>
                          <select 
                            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs focus:ring-2 focus:ring-primary"
                            value={link.platform}
                            onChange={(e) => updateSocialLink(idx, 'platform', e.target.value)}
                          >
                            <option value="Instagram">Instagram</option>
                            <option value="TikTok">TikTok</option>
                            <option value="YouTube">YouTube</option>
                            <option value="Discord">Discord</option>
                            <option value="Outro">Website / Outro</option>
                          </select>
                        </div>
                        <div className="flex-[2] space-y-2">
                          <Label className="text-[10px] uppercase font-bold text-muted-foreground">Link / URL</Label>
                          <Input 
                            className="h-9 text-xs" 
                            placeholder="ex: instagram.com/teuuser" 
                            value={link.url}
                            required
                            onChange={(e) => updateSocialLink(idx, 'url', e.target.value)}
                          />
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-9 w-9 text-destructive hover:bg-destructive/10 rounded-xl"
                          onClick={() => removeSocialLink(idx)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full h-10 border-dashed rounded-xl text-primary font-bold gap-2" 
                      onClick={addSocialLink}
                    >
                      <Plus className="w-4 h-4" /> Adicionar Rede Social
                    </Button>
                  </div>
                </div>

                <div className="space-y-6 pt-4">
                  <h3 className="text-xs font-black uppercase text-destructive tracking-widest border-b pb-2 flex items-center justify-between">
                    Segurança e Privacidade <Lock className="w-3 h-3" />
                  </h3>
                  
                  <div className="space-y-2 opacity-70">
                    <Label className="text-xs font-black uppercase text-muted-foreground flex items-center gap-2">
                      <Mail className="w-3 h-3" /> Email de Registo
                    </Label>
                    <div className="relative">
                      <input value={userProfile.email} disabled className="flex h-10 w-full rounded-md border border-input bg-secondary/30 px-3 py-2 text-sm cursor-not-allowed pr-10" />
                      <Lock className="w-3 h-3 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    </div>
                  </div>

                  <div className="space-y-2 opacity-70">
                    <Label className="text-xs font-black uppercase text-muted-foreground flex items-center gap-2">
                      <AtSign className="w-3 h-3" /> Nome de Utilizador
                    </Label>
                    <div className="relative">
                      <input value={userProfile.username} disabled className="flex h-10 w-full rounded-md border border-input bg-secondary/30 px-3 py-2 text-sm cursor-not-allowed pr-10 font-medium" />
                      <Lock className="w-3 h-3 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    </div>
                  </div>
                </div>

                <div className="pt-4 pb-12">
                  <Button 
                    variant="outline" 
                    className="w-full text-destructive border-destructive/20 hover:bg-primary hover:text-white active:bg-primary active:text-white active:scale-95 transition-all rounded-2xl h-12 font-bold" 
                    onClick={handleLogout}
                  >
                    <LogOut className="w-4 h-4 mr-2" /> Terminar Sessão
                  </Button>
                </div>
             </div>
           </ScrollArea>
        </div>
      )}

      <ImageCropper 
        image={imageToCrop} 
        aspect={cropAspect}
        onCropComplete={handleCropComplete} 
        onCancel={() => setImageToCrop(null)} 
      />
    </div>
  );
}
