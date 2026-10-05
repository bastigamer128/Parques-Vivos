import React, { useState, useRef } from 'react';
import { ForumPost, ForumCategory, ForumComment, UserProfile } from '../types';
import { containsProfanity, getProfanityWarning } from '../utils/profanityFilter';
import { 
  Heart, MessageCircle, Share2, Sparkles, Send, 
  Lightbulb, Star, Compass, Plus, CheckCircle2, 
  ShieldCheck, CornerDownRight, X, ChevronDown, ChevronUp, MessageSquare,
  Trash2, Image as ImageIcon, AlertTriangle, Maximize2, Camera
} from 'lucide-react';

interface ForumViewProps {
  posts: ForumPost[];
  currentUser: UserProfile;
  onToggleLike: (postId: string) => void;
  onAddPost: (category: 'Ideas' | 'Reseñas' | 'Panorama', content: string, imageUrl?: string) => void;
  onDeletePost: (postId: string) => void;
  onAddComment: (postId: string, content: string, replyToAuthor?: string) => void;
  onToggleCommentLike: (postId: string, commentId: string) => void;
}

export const ForumView: React.FC<ForumViewProps> = ({
  posts,
  currentUser,
  onToggleLike,
  onAddPost,
  onDeletePost,
  onAddComment,
  onToggleCommentLike,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<ForumCategory>('Todas');
  const [isWritingPost, setIsWritingPost] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostCategory, setNewPostCategory] = useState<'Ideas' | 'Reseñas' | 'Panorama'>('Ideas');
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [profanityError, setProfanityError] = useState<string | null>(null);
  const [confirmDeletePostId, setConfirmDeletePostId] = useState<string | null>(null);
  const [activeImageModal, setActiveImageModal] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // File input ref for image attachment
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Set of post IDs that have their thread expanded in the feed
  const [expandedThreads, setExpandedThreads] = useState<Record<string, boolean>>({
    'post-0': true,
    'post-1': true,
  });

  // State for active reply drafts keyed by postId
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  // If replying to a specific author within the thread
  const [replyingTo, setReplyingTo] = useState<Record<string, string | undefined>>({});
  // Comment profanity errors
  const [commentErrors, setCommentErrors] = useState<Record<string, string | null>>({});

  const categories: ForumCategory[] = ['Todas', 'Ideas', 'Reseñas', 'Panorama'];

  // Quick preset sample images of Parque Almagro
  const presetImages = [
    { label: '🌿 Atardecer Parque', url: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=80' },
    { label: '🐕 Canil & Mascotas', url: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=800&q=80' },
    { label: '🏛️ Explanada & Plaza', url: 'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?auto=format&fit=crop&w=800&q=80' },
  ];

  const filteredPosts = posts.filter((post) => {
    if (selectedFilter === 'Todas') return true;
    return post.category === selectedFilter;
  });

  const toggleThread = (postId: string) => {
    setExpandedThreads((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setNewPostContent(text);
    if (containsProfanity(text)) {
      setProfanityError('⚠️ Lenguaje inapropiado detectado: No está permitido publicar hilos con malas palabras o insultos.');
    } else {
      setProfanityError(null);
    }
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      alert('La imagen no debe superar los 8MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      if (typeof uploadEvent.target?.result === 'string') {
        setAttachedImage(uploadEvent.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    const content = newPostContent.trim();
    if (!content) return;

    // Strict profanity filter check
    if (containsProfanity(content)) {
      setProfanityError('⚠️ No se puede publicar el hilo: Contiene lenguaje o términos inapropiados. Por favor mantén una convivencia respetuosa entre vecinos.');
      return;
    }

    onAddPost(newPostCategory, content, attachedImage || undefined);

    // Reset form state
    setNewPostContent('');
    setAttachedImage(null);
    setProfanityError(null);
    setIsWritingPost(false);
  };

  const handleDeletePostConfirm = () => {
    if (confirmDeletePostId) {
      onDeletePost(confirmDeletePostId);
      setConfirmDeletePostId(null);
    }
  };

  const handleShare = (postId: string) => {
    setCopiedId(postId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSendReply = (postId: string, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const content = replyDrafts[postId]?.trim();
    if (!content) return;

    if (containsProfanity(content)) {
      setCommentErrors((prev) => ({
        ...prev,
        [postId]: 'Tu respuesta contiene palabras no permitidas. Mantén el respeto.',
      }));
      return;
    }

    // Clear comment error
    setCommentErrors((prev) => ({ ...prev, [postId]: null }));

    const targetAuthor = replyingTo[postId];
    onAddComment(postId, content, targetAuthor);

    // Clear reply draft and target
    setReplyDrafts((prev) => ({ ...prev, [postId]: '' }));
    setReplyingTo((prev) => ({ ...prev, [postId]: undefined }));

    // Ensure thread stays expanded
    setExpandedThreads((prev) => ({ ...prev, [postId]: true }));
  };

  const setQuickReply = (postId: string, text: string) => {
    const current = replyDrafts[postId] || '';
    setReplyDrafts((prev) => ({
      ...prev,
      [postId]: current ? `${current} ${text}` : text,
    }));
  };

  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case 'Ideas':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'Reseñas':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Panorama':
        return 'bg-sky-100 text-sky-800 border-sky-300';
      default:
        return 'bg-stone-100 text-stone-800 border-stone-200';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Ideas':
        return <Lightbulb className="w-3 h-3 text-amber-600 inline mr-1" />;
      case 'Reseñas':
        return <Star className="w-3 h-3 text-emerald-600 inline mr-1" />;
      case 'Panorama':
        return <Compass className="w-3 h-3 text-sky-600 inline mr-1" />;
      default:
        return null;
    }
  };

  return (
    <div className="w-full pb-24 bg-stone-100 min-h-screen">
      {/* Subheader with title and quick CTA */}
      <div className="bg-white border-b border-stone-200 px-4 py-3 sticky top-[57px] z-20 shadow-xs">
        <div className="flex items-center justify-between mb-2.5">
          <div>
            <h2 className="font-extrabold text-stone-900 text-base sm:text-lg">
              Foro Vecinal Almagro
            </h2>
            <p className="text-xs text-stone-500">
              Hilos de conversación, ideas e iniciativas de vecinos
            </p>
          </div>

          <button
            onClick={() => setIsWritingPost(!isWritingPost)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-md shadow-orange-600/20 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Hilo</span>
          </button>
        </div>

        {/* Filter Pills: Todas, Ideas, Reseñas, Panorama */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
          {categories.map((cat) => {
            const isSelected = selectedFilter === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedFilter(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
                  isSelected
                    ? 'bg-emerald-700 text-white shadow-sm ring-2 ring-emerald-400'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200 border border-stone-200'
                }`}
              >
                {cat === 'Todas' ? 'Todas' : (
                  <>
                    {getCategoryIcon(cat)}
                    <span>{cat}</span>
                  </>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-4 max-w-lg mx-auto space-y-4">
        {/* Inline Composer if user opened "Nuevo Hilo" */}
        {isWritingPost && (
          <form
            onSubmit={handleCreatePost}
            className="bg-white p-4 rounded-2xl border-2 border-emerald-500 shadow-lg animate-in slide-in-from-top-2 duration-200 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                Iniciar Nuevo Hilo Vecinal
              </span>
              <div className="flex gap-1.5">
                {(['Ideas', 'Reseñas', 'Panorama'] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setNewPostCategory(cat)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      newPostCategory === cat
                        ? 'bg-emerald-700 text-white'
                        : 'bg-stone-100 text-stone-600'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Hidden file input for photo upload */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleImageFileChange}
            />

            <div className="space-y-1.5">
              <textarea
                required
                rows={3}
                value={newPostContent}
                onChange={handleContentChange}
                placeholder="¿Qué quieres proponer o compartir con la comunidad de Parque Almagro?"
                className={`w-full p-3 rounded-xl border text-stone-900 text-sm focus:outline-none transition-colors ${
                  profanityError
                    ? 'border-rose-400 bg-rose-50/50 focus:ring-2 focus:ring-rose-400'
                    : 'border-stone-200 focus:ring-2 focus:ring-emerald-500'
                }`}
              />

              {/* Real-time Profanity Filter Warning */}
              {profanityError && (
                <div className="flex items-start gap-2 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium animate-in fade-in duration-200">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                  <p>{profanityError}</p>
                </div>
              )}
            </div>

            {/* Attached Image Preview */}
            {attachedImage && (
              <div className="relative rounded-xl overflow-hidden border-2 border-emerald-300 bg-stone-50 p-1">
                <div className="relative max-h-48 rounded-lg overflow-hidden">
                  <img
                    src={attachedImage}
                    alt="Foto adjunta"
                    className="w-full h-40 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => setAttachedImage(null)}
                    aria-label="Quitar imagen"
                    className="absolute top-2 right-2 p-1.5 bg-stone-900/80 hover:bg-rose-600 text-white rounded-full shadow-md transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="mt-1 px-1 flex items-center justify-between text-[11px] text-stone-500 font-medium">
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Imagen adjunta
                  </span>
                  <button
                    type="button"
                    onClick={() => setAttachedImage(null)}
                    className="text-rose-600 hover:underline font-semibold"
                  >
                    Quitar foto
                  </button>
                </div>
              </div>
            )}

            {/* Quick Image Tools: Attach from device or pick presets */}
            <div className="pt-1 flex items-center justify-between flex-wrap gap-2 border-t border-stone-100">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 text-xs font-bold active:scale-95 transition-all"
                >
                  <Camera className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{attachedImage ? 'Cambiar Foto' : 'Adjuntar Foto'}</span>
                </button>

                {/* Preset shortcuts if no image yet */}
                {!attachedImage && (
                  <div className="hidden sm:flex items-center gap-1">
                    <span className="text-[10px] text-stone-400 font-medium">o sugerencias:</span>
                    {presetImages.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => setAttachedImage(preset.url)}
                        className="px-2 py-1 rounded-lg bg-stone-100 hover:bg-emerald-50 hover:text-emerald-700 text-stone-600 text-[10px] font-semibold transition-colors"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={() => {
                    setIsWritingPost(false);
                    setNewPostContent('');
                    setAttachedImage(null);
                    setProfanityError(null);
                  }}
                  className="px-3 py-1.5 rounded-xl text-stone-500 hover:text-stone-800 text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={Boolean(profanityError || !newPostContent.trim())}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-bold shadow-md transition-all active:scale-95 ${
                    profanityError || !newPostContent.trim()
                      ? 'bg-stone-300 cursor-not-allowed opacity-70'
                      : 'bg-emerald-700 hover:bg-emerald-800'
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Publicar Hilo</span>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Posts Feed */}
        {filteredPosts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-stone-200 p-6">
            <p className="text-stone-500 font-medium text-sm">
              No hay publicaciones en la categoría &ldquo;{selectedFilter}&rdquo;.
            </p>
            <button
              onClick={() => setSelectedFilter('Todas')}
              className="mt-3 text-xs font-bold text-emerald-700 underline"
            >
              Ver todas las publicaciones
            </button>
          </div>
        ) : (
          filteredPosts.map((post) => {
            const comments = post.comments || [];
            const isThreadExpanded = !!expandedThreads[post.id];
            const currentReplyText = replyDrafts[post.id] || '';
            const replyingToUser = replyingTo[post.id];
            const isAuthor = post.authorName === currentUser.name || Boolean(post.isOwner);

            return (
              <article
                key={post.id}
                className="bg-white rounded-2xl shadow-sm border border-stone-200/90 hover:border-emerald-300 transition-all overflow-hidden"
              >
                {/* Main Post Header & Body */}
                <div className="p-4 sm:p-5 pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img
                          src={post.authorAvatar}
                          alt={post.authorName}
                          className="w-11 h-11 rounded-full object-cover border-2 border-emerald-400 shadow-xs"
                        />
                        <span className="absolute bottom-0 right-0 bg-white rounded-full p-0.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="font-extrabold text-stone-900 text-sm sm:text-base leading-tight">
                            {post.authorName}
                          </h3>
                          {isAuthor && (
                            <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider">
                              Tú (Autor)
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-stone-500 mt-0.5">
                          {post.authorBadge && (
                            <span className="font-semibold text-emerald-700">
                              {post.authorBadge} •
                            </span>
                          )}
                          <span>{post.timeAgo}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold border ${getCategoryBadgeClass(post.category)}`}>
                        {getCategoryIcon(post.category)}
                        {post.category}
                      </span>

                      {/* Author Only: Delete Own Thread Button */}
                      {isAuthor && (
                        <button
                          type="button"
                          onClick={() => setConfirmDeletePostId(post.id)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 active:scale-95 transition-all ml-1 shadow-2xs"
                          title="Borrar mi propio hilo"
                          aria-label="Borrar mi hilo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span className="hidden xs:inline">Borrar</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Post Content */}
                  <p className="text-stone-800 text-sm sm:text-base leading-relaxed mt-3 whitespace-pre-line">
                    {post.content}
                  </p>

                  {/* Post Attached Image if present */}
                  {post.imageUrl && (
                    <div 
                      className="mt-3 rounded-2xl overflow-hidden border border-stone-200 bg-stone-100 relative group cursor-pointer"
                      onClick={() => setActiveImageModal(post.imageUrl!)}
                    >
                      <img
                        src={post.imageUrl}
                        alt="Imagen del hilo"
                        className="w-full max-h-72 sm:max-h-80 object-cover rounded-2xl group-hover:scale-[1.01] transition-transform duration-300"
                        loading="lazy"
                      />
                      <div className="absolute bottom-2 right-2 px-2.5 py-1 bg-black/60 backdrop-blur-xs text-white text-[11px] font-medium rounded-lg opacity-90 group-hover:opacity-100 transition-opacity flex items-center gap-1 shadow-sm">
                        <Maximize2 className="w-3 h-3" />
                        <span>Ver foto completa</span>
                      </div>
                    </div>
                  )}

                  {post.tag && (
                    <div className="mt-2.5">
                      <span className="inline-block text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                        {post.tag}
                      </span>
                    </div>
                  )}

                  {/* Action Bar (Like, Thread Comments, Share) */}
                  <div className="flex items-center justify-between pt-3 mt-3 border-t border-stone-100 text-xs">
                    <div className="flex items-center gap-2">
                      {/* Like Button */}
                      <button
                        onClick={() => onToggleLike(post.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all active:scale-95 ${
                          post.isLiked
                            ? 'bg-orange-50 text-orange-600 border border-orange-200'
                            : 'bg-stone-50 text-stone-600 hover:bg-stone-100 border border-stone-200'
                        }`}
                      >
                        <Heart
                          className={`w-4 h-4 ${
                            post.isLiked ? 'fill-orange-500 text-orange-500' : 'text-stone-400'
                          }`}
                        />
                        <span>{post.likes}</span>
                      </button>

                      {/* Thread Comments Button */}
                      <button
                        onClick={() => toggleThread(post.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all active:scale-95 ${
                          isThreadExpanded
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                            : 'bg-stone-50 text-stone-600 hover:bg-stone-100 border border-stone-200'
                        }`}
                        title="Ver y responder el hilo"
                      >
                        <MessageSquare className={`w-4 h-4 ${isThreadExpanded ? 'text-emerald-600 fill-emerald-100' : 'text-stone-400'}`} />
                        <span>Hilo ({post.commentsCount})</span>
                        {isThreadExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5 text-stone-400 ml-0.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-stone-400 ml-0.5" />
                        )}
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleShare(post.id)}
                        className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-50 active:scale-95 transition-all"
                        title="Compartir publicación"
                      >
                        {copiedId === post.id ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Share2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* THREAD REPLIES SECTION */}
                {isThreadExpanded && (
                  <div className="bg-stone-50/70 border-t border-stone-200/90 p-4 sm:p-5 pt-3 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between mb-3 text-xs text-stone-500 font-bold uppercase tracking-wider">
                      <span>Respuestas en este Hilo ({comments.length})</span>
                      <button
                        onClick={() => toggleThread(post.id)}
                        className="text-stone-400 hover:text-stone-600 lowercase"
                      >
                        ocultar hilo
                      </button>
                    </div>

                    {/* Thread Replies List */}
                    <div className="relative space-y-4">
                      {comments.length > 0 && (
                        <div className="absolute left-[17px] top-4 bottom-4 w-0.5 bg-emerald-200 -z-0" />
                      )}

                      {comments.length === 0 ? (
                        <p className="text-xs text-stone-500 py-2 italic text-center">
                          Aún no hay respuestas en este hilo. ¡Sé el primer vecino en responder!
                        </p>
                      ) : (
                        comments.map((comment) => (
                          <div key={comment.id} className="relative z-10 flex items-start gap-3 text-sm">
                            <div className="relative shrink-0">
                              <img
                                src={comment.authorAvatar}
                                alt={comment.authorName}
                                className="w-9 h-9 rounded-full object-cover border-2 border-white shadow-xs"
                              />
                            </div>

                            <div className="flex-1 bg-white p-3 rounded-2xl border border-stone-200/90 shadow-2xs hover:border-emerald-200 transition-colors">
                              <div className="flex items-center justify-between gap-1 mb-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-extrabold text-stone-900 text-xs sm:text-sm">
                                    {comment.authorName}
                                  </span>
                                  {comment.authorBadge && (
                                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">
                                      {comment.authorBadge}
                                    </span>
                                  )}
                                  <span className="text-[11px] text-stone-400">
                                    • {comment.timeAgo}
                                  </span>
                                </div>
                              </div>

                              {comment.replyToAuthor && (
                                <p className="text-[11px] text-stone-500 mb-1 font-medium">
                                  En respuesta a{' '}
                                  <span className="text-emerald-700 font-bold">
                                    @{comment.replyToAuthor}
                                  </span>
                                </p>
                              )}

                              <p className="text-stone-800 text-xs sm:text-sm leading-relaxed">
                                {comment.content}
                              </p>

                              <div className="flex items-center gap-4 mt-2 pt-1 border-t border-stone-50 text-xs text-stone-500">
                                <button
                                  onClick={() => onToggleCommentLike(post.id, comment.id)}
                                  className={`flex items-center gap-1 text-[11px] font-bold active:scale-95 transition-all ${
                                    comment.isLiked
                                      ? 'text-orange-600 font-extrabold'
                                      : 'text-stone-500 hover:text-stone-800'
                                  }`}
                                >
                                  <Heart
                                    className={`w-3.5 h-3.5 ${
                                      comment.isLiked
                                        ? 'fill-orange-500 text-orange-500'
                                        : 'text-stone-400'
                                    }`}
                                  />
                                  <span>{comment.likes}</span>
                                </button>

                                <button
                                  onClick={() => {
                                    setReplyingTo((prev) => ({
                                      ...prev,
                                      [post.id]: comment.authorName,
                                    }));
                                  }}
                                  className="flex items-center gap-1 text-[11px] text-stone-500 hover:text-emerald-700 font-semibold active:scale-95 transition-all"
                                >
                                  <CornerDownRight className="w-3 h-3 text-stone-400" />
                                  <span>Responder</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}

                      {/* REPLY COMPOSER */}
                      <div className="pt-2">
                        {replyingToUser && (
                          <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl text-xs text-emerald-800 font-semibold mb-2">
                            <span>Respondiendo a @{replyingToUser}</span>
                            <button
                              onClick={() =>
                                setReplyingTo((prev) => ({ ...prev, [post.id]: undefined }))
                              }
                              className="text-emerald-600 hover:text-emerald-900"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}

                        {commentErrors[post.id] && (
                          <div className="mb-2 p-2 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            <span>{commentErrors[post.id]}</span>
                          </div>
                        )}

                        <form
                          onSubmit={(e) => handleSendReply(post.id, e)}
                          className="flex items-start gap-2.5 bg-white p-2.5 rounded-2xl border border-stone-300 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 shadow-xs transition-all"
                        >
                          <img
                            src={currentUser.avatar}
                            alt={currentUser.name}
                            className="w-8 h-8 rounded-full object-cover shrink-0 mt-0.5 border border-stone-200"
                          />

                          <div className="flex-1 min-w-0">
                            <input
                              type="text"
                              value={currentReplyText}
                              onChange={(e) => {
                                setReplyDrafts((prev) => ({
                                  ...prev,
                                  [post.id]: e.target.value,
                                }));
                                if (commentErrors[post.id]) {
                                  setCommentErrors((prev) => ({ ...prev, [post.id]: null }));
                                }
                              }}
                              placeholder={
                                replyingToUser
                                  ? `Escribe tu respuesta a ${replyingToUser}...`
                                  : 'Publica tu respuesta en este hilo...'
                              }
                              className="w-full text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 outline-none py-1"
                            />

                            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pt-1.5">
                              {['💡 Gran idea', '🤝 Apoyo total', '👏 Cuenten conmigo', '🐕 Vamos'].map(
                                (chip) => (
                                  <button
                                    key={chip}
                                    type="button"
                                    onClick={() => setQuickReply(post.id, chip)}
                                    className="px-2 py-0.5 rounded-md bg-stone-100 hover:bg-stone-200 text-stone-600 text-[10px] font-bold shrink-0 transition-colors"
                                  >
                                    {chip}
                                  </button>
                                )
                              )}
                            </div>
                          </div>

                          <button
                            type="submit"
                            disabled={!currentReplyText.trim()}
                            className={`p-2 rounded-xl text-white font-bold transition-all shrink-0 active:scale-95 ${
                              currentReplyText.trim()
                                ? 'bg-orange-600 hover:bg-orange-700 shadow-sm'
                                : 'bg-stone-300 cursor-not-allowed text-stone-400'
                            }`}
                            title="Enviar respuesta"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        </form>
                      </div>
                    </div>
                  </div>
                )}
              </article>
            );
          })
        )}
      </div>

      {/* CONFIRM DELETE MODAL (Author deletes own thread) */}
      {confirmDeletePostId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border border-stone-200 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-stone-900 text-base">¿Borrar este hilo?</h3>
                <p className="text-xs text-stone-500">Esta acción eliminará tu publicación.</p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              Como autor de este hilo, puedes eliminarlo en cualquier momento. Se borrarán permanentemente tu publicación y todas las respuestas asociadas para toda la comunidad.
            </p>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDeletePostId(null)}
                className="w-1/2 py-2.5 px-3 rounded-xl border border-stone-300 text-stone-700 font-bold text-xs hover:bg-stone-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeletePostConfirm}
                className="w-1/2 py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md shadow-rose-600/30 flex items-center justify-center gap-1.5 active:scale-95 transition-all"
              >
                <Trash2 className="w-4 h-4" />
                <span>Sí, borrar hilo</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LIGHTBOX MODAL FOR EXPANDED ATTACHED IMAGES */}
      {activeImageModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setActiveImageModal(null)}
        >
          <div 
            className="relative max-w-3xl max-h-[90vh] bg-stone-900 rounded-3xl overflow-hidden shadow-2xl border border-stone-700 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-3 right-3 z-10">
              <button
                type="button"
                onClick={() => setActiveImageModal(null)}
                className="p-2 bg-black/70 hover:bg-black text-white rounded-full transition-colors shadow-lg"
                aria-label="Cerrar foto"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <img
              src={activeImageModal}
              alt="Foto ampliada del hilo"
              className="max-h-[82vh] w-auto object-contain rounded-2xl mx-auto"
            />
          </div>
        </div>
      )}
    </div>
  );
};
