import { create } from 'react';

// Using a simple state management pattern since we need to persist to localStorage
// and react to changes globally.

export type PostType = 'Ajuda' | 'SOS' | 'Partilha' | 'Evento';
export type PostStatus = 'aberto' | 'em curso' | 'resolvido';

export interface Post {
  id: string;
  tipo: PostType;
  texto: string;
  autor: string;
  username: string;
  avatarLetra: string;
  avatarCor: string;
  distrito: string;
  zona: string;
  lat: number;
  lng: number;
  candidatosCount: number;
  comentariosCount: number;
  status: PostStatus;
  uid: string;
  ts: number;
  ajudanteUid?: string;
}

export interface User {
  uid: string;
  name: string;
  username: string;
  email: string;
  dataNasc: string;
  distrito: string;
  zona: string;
  lat: number;
  lng: number;
  telefone?: string;
  points: number;
  ajudas: number;
  partilhas: number;
  avaliacaoMedia: number;
  totalAvaliacoes: number;
  descricao: string;
  avatarLetra: string;
  avatarCor: string;
  joined: number;
}

export interface Notification {
  id: string;
  tipo: PostType | 'System';
  mensagem: string;
  postId?: string;
  zona?: string;
  lida: boolean;
  ts: number;
}

export interface Comment {
  id: string;
  texto: string;
  autorNome: string;
  autorUsername: string;
  autorUid: string;
  avatarLetra: string;
  ts: number;
}

export interface Rating {
  id: string;
  estrelas: number;
  comentario: string;
  autorNome: string;
  autorUid: string;
  postId: string;
  ts: number;
}

// Initializing store from localStorage if available
const isClient = typeof window !== 'undefined';

const getInitialData = (key: string, defaultValue: any) => {
  if (!isClient) return defaultValue;
  const saved = localStorage.getItem(key);
  return saved ? JSON.parse(saved) : defaultValue;
};

// This is a simple global state observable
let listeners: Array<() => void> = [];

const notify = () => listeners.forEach(l => l());

export const store = {
  users: getInitialData('pu_users', []) as User[],
  currentUser: getInitialData('pu_current_user', null) as User | null,
  posts: getInitialData('pu_posts', []) as Post[],
  notifications: getInitialData('pu_notifications', []) as Notification[],
  comments: getInitialData('pu_comments', {}) as Record<string, Comment[]>, // postId -> comments
  profileComments: getInitialData('pu_profile_comments', {}) as Record<string, Comment[]>, // userId -> comments
  ratings: getInitialData('pu_ratings', {}) as Record<string, Rating[]>, // userId -> ratings
  groups: getInitialData('pu_groups', []) as any[],
  chats: getInitialData('pu_chats', {}) as Record<string, any[]>,

  subscribe(listener: () => void) {
    listeners.push(listener);
    return () => {
      listeners = listeners.filter(l => l !== listener);
    };
  },

  save() {
    if (!isClient) return;
    localStorage.setItem('pu_users', JSON.stringify(this.users));
    localStorage.setItem('pu_current_user', JSON.stringify(this.currentUser));
    localStorage.setItem('pu_posts', JSON.stringify(this.posts));
    localStorage.setItem('pu_notifications', JSON.stringify(this.notifications));
    localStorage.setItem('pu_comments', JSON.stringify(this.comments));
    localStorage.setItem('pu_profile_comments', JSON.stringify(this.profileComments));
    localStorage.setItem('pu_ratings', JSON.stringify(this.ratings));
    localStorage.setItem('pu_groups', JSON.stringify(this.groups));
    localStorage.setItem('pu_chats', JSON.stringify(this.chats));
    notify();
  },

  login(user: User) {
    this.currentUser = user;
    this.save();
  },

  logout() {
    this.currentUser = null;
    this.save();
  },

  addPost(post: Post) {
    this.posts = [post, ...this.posts];
    // Create notifications for users in the same district
    this.users.forEach(u => {
      if (u.uid !== post.uid && u.distrito === post.distrito) {
        const notif: Notification = {
          id: Math.random().toString(36).substr(2, 9),
          tipo: post.tipo,
          mensagem: `${post.autor} em ${post.zona} postou um novo ${post.tipo}`,
          postId: post.id,
          zona: post.zona,
          lida: false,
          ts: Date.now()
        };
        this.notifications = [notif, ...this.notifications];
      }
    });
    this.save();
  },

  addComment(postId: string, comment: Comment) {
    if (!this.comments[postId]) this.comments[postId] = [];
    this.comments[postId].push(comment);
    
    // Increment post count
    const postIdx = this.posts.findIndex(p => p.id === postId);
    if (postIdx > -1) {
      this.posts[postIdx].comentariosCount += 1;
    }

    // Award points
    if (this.currentUser) {
      this.currentUser.points += 5;
    }
    this.save();
  }
};

export function useStore() {
  const [data, setData] = React.useState({ ...store });
  React.useEffect(() => {
    return store.subscribe(() => {
      setData({ ...store });
    });
  }, []);
  return data;
}

import * as React from 'react';