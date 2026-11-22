import React, { useRef, useState } from 'react';
import { ForumCategory, ForumPost } from '../types';
import { formatNeighborShortName } from '../data/mockData';
import { containsProfanity, getProfanityWarning } from '../utils/profanityFilter';
import {
  Heart,
  MessageCircle,
  Send,
  Plus,
  CornerDownRight,
  X,
  ChevronDown,
  ChevronUp,
  Trash2,
  Image as ImageIcon,
  AlertTriangle,
} from 'lucide-react';

interface ForumViewProps {
  posts: ForumPost[];
  currentNeighborName: string;
  onSaveNeighborName: (name: string) => void;
  onToggleLike: (postId: string) => void;
  onAddPost: (
    category: 'Ideas' | 'Reseñas' | 'Panorama',
    content: string,
    authorName: string,
    imageUrl?: string
  ) => void;
  onDeletePost: (postId: string) => void;
  onAddComment: (
    postId: string,
    content: string,
    authorName: string,
    replyToAuthor?: string
  ) => void;
  onToggleCommentLike: (postId: string, commentId: string) => void;
  onNotify?: (msg: string) => void;
}

const FORUM_CATEGORIES: ForumCategory[] = ['Todas', 'Ideas', 'Reseñas', 'Panorama'];

const POST_CATEGORIES: Array<{
  id: 'Ideas' | 'Reseñas' | 'Panorama';
  label: string;
  badgeStyle: string;
}> = [
  {
    id: 'Ideas',
    label: 'Ideas',
    badgeStyle: 'bg-[#e4f2e8] text-[#1f6a42] border-[#b7dac2]',
  },
  {
    id: 'Reseñas',
    label: 'Reseñas',
    badgeStyle: 'bg-[#eef2ed] text-[#283c2e] border-[#cbd6c9]',
  },
  {
    id: 'Panorama',
    label: 'Panorama',
    badgeStyle: 'bg-[#f6efe9] text-[#7d4925] border-[#e4cfc0]',
  },
];

const PRESET_IMAGES = [
  {
    label: 'Sendero y árboles',
    url: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=80',
  },
  {
    label: 'Canil y mascotas',
    url: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=800&q=80',
  },
  {
    label: 'Explanada central',
    url: 'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?auto=format&fit=crop&w=800&q=80',
  },
];

export const ForumView: React.FC<ForumViewProps> = ({
  posts,
  currentNeighborName,
  onSaveNeighborName,
  onToggleLike,
  onAddPost,
  onDeletePost,
  onAddComment,
  onToggleCommentLike,
  onNotify,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<ForumCategory>('Todas');
  const [isWritingPost, setIsWritingPost] = useState<boolean>(false);
  const [authorInput, setAuthorInput] = useState<string>(currentNeighborName || '');
  const [isEditingAuthor, setIsEditingAuthor] = useState<boolean>(!currentNeighborName);
  const [newPostContent, setNewPostContent] = useState<string>('');
  const [newPostCategory, setNewPostCategory] = useState<'Ideas' | 'Reseñas' | 'Panorama'>('Ideas');
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [profanityError, setProfanityError] = useState<string | null>(null);
  const [confirmDeletePostId, setConfirmDeletePostId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const lastCompositionEndRef = useRef<number | null>(null);

  // Expanded comment threads
  const [expandedThreads, setExpandedThreads] = useState<Record<string, boolean>>({
    'post-almagro-1': true,
    'post-almagro-2': true,
  });

  // Reply drafts and target author per postId
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [replyingTo, setReplyingTo] = useState<Record<string, string | undefined>>({});
  const [commentErrors, setCommentErrors] = useState<Record<string, string | null>>({});

  const filteredPosts = posts.filter((post) => {
    if (selectedFilter === 'Todas') return true;
    return post.category === selectedFilter;
  });

  const resolveCurrentAuthor = (): string => {
    const clean = formatNeighborShortName(authorInput || currentNeighborName || 'Vecino A.');
    onSaveNeighborName(clean);
    setAuthorInput(clean);
    setIsEditingAuthor(false);
    return clean;
  };

  const toggleThread = (postId: string) => {
    setExpandedThreads((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setNewPostContent(text);
    if (profanityError && !containsProfanity(text)) {
      setProfanityError(null);
    }
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) {
      onNotify?.('La imagen no debe superar los 4 MB.');
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

  const handlePublishPost = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = newPostContent.trim();
    if (!trimmed) return;

    const warning = getProfanityWarning(trimmed);
    if (warning) {
      setProfanityError(warning);
      return;
    }

    const cleanAuthor = resolveCurrentAuthor();
    onAddPost(newPostCategory, trimmed, cleanAuthor, attachedImage || undefined);
    setNewPostContent('');
    setAttachedImage(null);
    setProfanityError(null);
    setIsWritingPost(false);
  };

  const handleCommentDraftChange = (postId: string, value: string) => {
    setReplyDrafts((prev) => ({ ...prev, [postId]: value }));
    if (commentErrors[postId] && !containsProfanity(value)) {
      setCommentErrors((prev) => ({ ...prev, [postId]: null }));
    }
  };

  const submitCommentForPost = (postId: string) => {
    const draft = (replyDrafts[postId] || '').trim();
    if (!draft) return;

    if (containsProfanity(draft)) {
      setCommentErrors((prev) => ({
        ...prev,
        [postId]: 'Por favor mantén un lenguaje respetuoso con los vecinos.',
      }));
      return;
    }

    const cleanAuthor = resolveCurrentAuthor();
    const targetAuthor = replyingTo[postId];
    onAddComment(postId, draft, cleanAuthor, targetAuthor);

    setReplyDrafts((prev) => ({ ...prev, [postId]: '' }));
    setReplyingTo((prev) => ({ ...prev, [postId]: undefined }));
    setCommentErrors((prev) => ({ ...prev, [postId]: null }));
    setExpandedThreads((prev) => ({ ...prev, [postId]: true }));
  };

  const handleCommentKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    postId: string
  ) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.nativeEvent.isComposing || e.nativeEvent.keyCode === 229) {
        return;
      }
      if (
        lastCompositionEndRef.current !== null &&
        Math.abs(e.nativeEvent.timeStamp - lastCompositionEndRef.current) < 50
      ) {
        return;
      }
      submitCommentForPost(postId);
    }
  };

  const getCategoryStyle = (cat: 'Ideas' | 'Reseñas' | 'Panorama') => {
    return (
      POST_CATEGORIES.find((c) => c.id === cat)?.badgeStyle ||
      'bg-[#e4f2e8] text-[#1f6a42] border-[#b7dac2]'
    );
  };

  return (
    <div className="space-y-4 pb-4">
      {/* Header & CTA to open new post composer */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-[#16241b] tracking-tight leading-snug">
            Foro vecinal
          </h2>
          <p className="text-xs font-medium text-[#596c5f] mt-0.5">
            Ideas, reseñas del parque y conversación entre vecinos
          </p>
        </div>

        <button
          type="button"
          aria-expanded={isWritingPost}
          aria-controls="forum-new-post-panel"
          onClick={() => {
            setIsWritingPost((prev) => !prev);
            setProfanityError(null);
          }}
          className={`inline-flex items-center gap-1.5 min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-extrabold transition-colors cursor-pointer shrink-0 ${
            isWritingPost
              ? 'bg-[#eef4ef] text-[#1c3323] border border-[#cbd6c9]'
              : 'bg-[#1f6a42] text-white hover:bg-[#185434]'
          }`}
        >
          {isWritingPost ? (
            <>
              <X aria-hidden="true" className="w-3.5 h-3.5" />
              <span>Cerrar</span>
            </>
          ) : (
            <>
              <Plus aria-hidden="true" className="w-3.5 h-3.5" />
              <span>Nuevo hilo</span>
            </>
          )}
        </button>
      </div>

      {/* Neighbor Identity Bar (Nombre A.) */}
      <div className="bg-white px-3.5 py-2.5 rounded-2xl border border-[#dfe6dd] flex flex-wrap items-center justify-between gap-2">
        {isEditingAuthor ? (
          <div className="w-full space-y-1.5">
            <label
              htmlFor="forum-neighbor-name"
              className="block text-xs font-bold text-[#2f4335]"
            >
              Tu nombre para participar en el foro
            </label>
            <span id="forum-neighbor-hint" className="block text-xs text-[#596c5f]">
              Se mostrará tu nombre e inicial (ej: Daniela P.).
            </span>
            <div className="flex items-center gap-2">
              <input
                id="forum-neighbor-name"
                name="neighborName"
                type="text"
                autoComplete="given-name"
                aria-describedby="forum-neighbor-hint"
                value={authorInput}
                onChange={(e) => setAuthorInput(e.target.value)}
                placeholder="Ej: Bastián N."
                className="flex-1 min-h-[42px] px-3 py-2 rounded-xl border border-[#cbd6c9] bg-[#fafcfa] text-sm font-semibold text-[#16241b]"
              />
              <button
                type="button"
                onClick={resolveCurrentAuthor}
                className="min-h-[42px] px-3.5 py-2 rounded-xl bg-[#1f6a42] hover:bg-[#185434] text-white text-xs font-extrabold cursor-pointer"
              >
                Guardar
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-xs text-[#4b5e51]">
              Participas como{' '}
              <strong className="font-extrabold text-[#16241b]">
                {currentNeighborName || formatNeighborShortName(authorInput || 'Vecino A.')}
              </strong>
            </p>
            <button
              type="button"
              onClick={() => setIsEditingAuthor(true)}
              className="text-xs font-bold text-[#1f6a42] underline py-1 px-1 cursor-pointer"
            >
              Cambiar nombre
            </button>
          </>
        )}
      </div>

      {/* Category Filter Pills wrapped in <search> */}
      <search aria-label="Filtrar publicaciones del foro por categoría">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-0.5 touch-pan-x">
          {FORUM_CATEGORIES.map((category) => {
            const isActive = selectedFilter === category;
            return (
              <button
                key={category}
                type="button"
                aria-pressed={isActive}
                onClick={() => setSelectedFilter(category)}
                className={`shrink-0 min-h-[36px] px-3.5 py-1.5 rounded-full text-xs font-bold border transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-[#1f6a42] text-white border-[#1f6a42]'
                    : 'bg-white text-[#25372b] border-[#d7e0d5] hover:bg-[#f1f5f0]'
                }`}
              >
                {category}
              </button>
            );
          })}
        </div>
      </search>

      {/* Expandable New Post Form */}
      {isWritingPost ? (
        <section
          id="forum-new-post-panel"
          aria-labelledby="new-post-heading"
          className="bg-white p-4 rounded-2xl border-2 border-[#b7dac2] shadow-xs space-y-3"
        >
          <h3 id="new-post-heading" className="text-sm font-extrabold text-[#16241b]">
            Publicar en el foro del Parque Almagro
          </h3>

          <form aria-labelledby="new-post-heading" onSubmit={handlePublishPost} className="space-y-3">
            <fieldset className="space-y-1.5">
              <legend className="text-xs font-bold text-[#2f4335]">
                Categoría del mensaje
              </legend>
              <div className="grid grid-cols-3 gap-2 pt-0.5">
                {POST_CATEGORIES.map((cat) => {
                  const selected = newPostCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setNewPostCategory(cat.id)}
                      className={`min-h-[38px] py-1.5 px-2.5 rounded-xl text-xs font-extrabold border transition-colors cursor-pointer ${
                        selected
                          ? 'bg-[#1f6a42] text-white border-[#1f6a42]'
                          : 'bg-[#fafcfa] text-[#283c2e] border-[#cbd6c9] hover:bg-[#eef4ef]'
                      }`}
                    >
                      {cat.label}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <div>
              <label
                htmlFor="forum-post-content"
                className="block text-xs font-bold text-[#2f4335] mb-1"
              >
                Tu mensaje para los vecinos
              </label>
              <span id="forum-post-hint" className="block text-xs text-[#596c5f] mb-1.5">
                Comparte una idea de actividad, el estado de un sector o un panorama vecinal.
              </span>
              <textarea
                id="forum-post-content"
                name="postContent"
                rows={3}
                required
                aria-invalid={Boolean(profanityError)}
                aria-describedby={profanityError ? 'forum-post-hint forum-profanity-alert' : 'forum-post-hint'}
                value={newPostContent}
                onChange={handleContentChange}
                placeholder="Escribe aquí tu mensaje…"
                className="w-full p-3 rounded-xl border border-[#cbd6c9] bg-[#fafcfa] text-sm text-[#16241b] leading-relaxed"
              />
            </div>

            {/* Optional photo attachment */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="visually-hidden"
                  id="forum-photo-upload"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 min-h-[36px] px-3 py-1.5 rounded-xl bg-[#eef4ef] hover:bg-[#e1ece3] text-[#1c3323] border border-[#cbd6c9] text-xs font-bold cursor-pointer"
                >
                  <ImageIcon aria-hidden="true" className="w-3.5 h-3.5 text-[#1f6a42]" />
                  <span>{attachedImage ? 'Cambiar foto' : 'Adjuntar foto (opcional)'}</span>
                </button>

                {PRESET_IMAGES.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setAttachedImage(preset.url)}
                    className="min-h-[36px] px-2.5 py-1 rounded-xl bg-[#fafcfa] hover:bg-[#eef4ef] text-[#35483b] border border-[#dfe6dd] text-[11px] font-semibold cursor-pointer"
                  >
                    + {preset.label}
                  </button>
                ))}
              </div>

              {attachedImage ? (
                <div className="relative rounded-xl overflow-hidden border border-[#cbd6c9] bg-[#f4f7f3]">
                  <img
                    src={attachedImage}
                    alt="Vista previa de imagen adjunta"
                    className="w-full h-36 object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setAttachedImage(null)}
                    aria-label="Quitar imagen adjunta"
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/65 hover:bg-black/80 text-white cursor-pointer"
                  >
                    <X aria-hidden="true" className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : null}
            </div>

            {profanityError ? (
              <div
                id="forum-profanity-alert"
                role="alert"
                className="p-3 rounded-xl bg-[#fef2f2] border border-[#f5c2c2] text-[#991b1b] text-xs font-bold flex items-start gap-2"
              >
                <AlertTriangle aria-hidden="true" className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{profanityError}</span>
              </div>
            ) : null}

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setIsWritingPost(false);
                  setProfanityError(null);
                }}
                className="min-h-[42px] px-3.5 py-2 rounded-xl bg-[#eef4ef] hover:bg-[#e1ece3] text-[#283c2e] text-xs font-bold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="min-h-[42px] px-4 py-2 rounded-xl bg-[#1f6a42] hover:bg-[#185434] text-white text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Send aria-hidden="true" className="w-3.5 h-3.5" />
                <span>Publicar hilo</span>
              </button>
            </div>
          </form>
        </section>
      ) : null}

      {/* Forum Posts List */}
      {filteredPosts.length > 0 ? (
        <ul role="list" className="space-y-3 list-none p-0 m-0">
          {filteredPosts.map((post) => {
            const isExpanded = Boolean(expandedThreads[post.id]);
            const comments = post.comments || [];
            const initial = post.authorName.trim().charAt(0).toUpperCase() || 'V';
            const replyTarget = replyingTo[post.id];
            const commentError = commentErrors[post.id];

            return (
              <li
                key={post.id}
                className="bg-white rounded-2xl border border-[#dfe6dd] overflow-hidden"
              >
                <article className="p-4 space-y-3">
                  {/* Author & Category Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        aria-hidden="true"
                        className="w-9 h-9 rounded-full bg-[#e4f2e8] text-[#1f6a42] font-extrabold text-sm flex items-center justify-center shrink-0"
                      >
                        {initial}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="text-sm font-extrabold text-[#16241b] truncate">
                            {post.authorName}
                          </p>
                          <span className="text-xs text-[#596c5f]">· {post.timeAgo}</span>
                        </div>
                        {post.authorBadge ? (
                          <p className="text-xs text-[#526558] truncate">{post.authorBadge}</p>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${getCategoryStyle(
                          post.category
                        )}`}
                      >
                        {post.category}
                      </span>

                      {post.isOwner ? (
                        confirmDeletePostId === post.id ? (
                          <div className="flex items-center gap-1 bg-[#fef2f2] border border-[#f5c2c2] px-2 py-0.5 rounded-full">
                            <button
                              type="button"
                              onClick={() => {
                                onDeletePost(post.id);
                                setConfirmDeletePostId(null);
                              }}
                              className="text-[11px] font-extrabold text-[#b91c1c] cursor-pointer px-1"
                            >
                              Borrar
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeletePostId(null)}
                              className="text-[11px] font-bold text-[#4b5e51] cursor-pointer px-1"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeletePostId(post.id)}
                            aria-label={`Eliminar publicación de ${post.authorName}`}
                            className="p-1.5 rounded-full text-[#596c5f] hover:text-[#b91c1c] hover:bg-[#fef2f2] transition-colors cursor-pointer"
                          >
                            <Trash2 aria-hidden="true" className="w-3.5 h-3.5" />
                          </button>
                        )
                      ) : null}
                    </div>
                  </div>

                  {/* Post Text Content */}
                  <p className="text-sm text-[#1e3023] leading-relaxed whitespace-pre-line">
                    {post.content}
                  </p>

                  {/* Attached Image if present */}
                  {post.imageUrl ? (
                    <div className="rounded-xl overflow-hidden border border-[#dfe6dd] bg-[#f4f7f3]">
                      <img
                        src={post.imageUrl}
                        alt={`Imagen compartida por ${post.authorName} en el foro`}
                        className="w-full max-h-56 object-cover"
                        loading="lazy"
                      />
                    </div>
                  ) : null}

                  {/* Actions Bar: Like & Toggle Comments */}
                  <div className="pt-1 flex items-center justify-between border-t border-[#edf1ec]">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        aria-pressed={Boolean(post.isLiked)}
                        onClick={() => onToggleLike(post.id)}
                        className={`inline-flex items-center gap-1.5 min-h-[36px] px-3 py-1 rounded-full text-xs font-extrabold border transition-colors cursor-pointer ${
                          post.isLiked
                            ? 'bg-[#e4f2e8] text-[#1f6a42] border-[#b7dac2]'
                            : 'bg-[#fafcfa] text-[#35483b] border-[#dfe6dd] hover:bg-[#eef4ef]'
                        }`}
                      >
                        <Heart
                          aria-hidden="true"
                          className={`w-3.5 h-3.5 ${post.isLiked ? 'fill-[#1f6a42] text-[#1f6a42]' : ''}`}
                        />
                        <span>Apoyar ({post.likes})</span>
                      </button>

                      <button
                        type="button"
                        aria-expanded={isExpanded}
                        aria-controls={`comments-panel-${post.id}`}
                        onClick={() => toggleThread(post.id)}
                        className="inline-flex items-center gap-1.5 min-h-[36px] px-3 py-1 rounded-full text-xs font-extrabold bg-[#fafcfa] text-[#35483b] border border-[#dfe6dd] hover:bg-[#eef4ef] transition-colors cursor-pointer"
                      >
                        <MessageCircle aria-hidden="true" className="w-3.5 h-3.5 text-[#1f6a42]" />
                        <span>
                          {comments.length}{' '}
                          {comments.length === 1 ? 'comentario' : 'comentarios'}
                        </span>
                        {isExpanded ? (
                          <ChevronUp aria-hidden="true" className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown aria-hidden="true" className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </article>

                {/* Expandable Comments & Reply Form */}
                {isExpanded ? (
                  <div
                    id={`comments-panel-${post.id}`}
                    className="bg-[#f6f9f5] border-t border-[#dfe6dd] p-3.5 space-y-3"
                  >
                    {comments.length > 0 ? (
                      <ul role="list" className="space-y-2.5 list-none p-0 m-0">
                        {comments.map((comment) => {
                          const cInitial =
                            comment.authorName.trim().charAt(0).toUpperCase() || 'V';
                          return (
                            <li
                              key={comment.id}
                              className="bg-white p-3 rounded-xl border border-[#dfe6dd] space-y-1.5"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span
                                    aria-hidden="true"
                                    className="w-7 h-7 rounded-full bg-[#e4f2e8] text-[#1f6a42] font-extrabold text-xs flex items-center justify-center shrink-0"
                                  >
                                    {cInitial}
                                  </span>
                                  <div className="min-w-0">
                                    <p className="text-xs font-extrabold text-[#16241b] truncate">
                                      {comment.authorName}{' '}
                                      <span className="font-normal text-[#596c5f]">
                                        · {comment.timeAgo}
                                      </span>
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                  <button
                                    type="button"
                                    aria-pressed={Boolean(comment.isLiked)}
                                    onClick={() => onToggleCommentLike(post.id, comment.id)}
                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border cursor-pointer ${
                                      comment.isLiked
                                        ? 'bg-[#e4f2e8] text-[#1f6a42] border-[#b7dac2]'
                                        : 'bg-[#fafcfa] text-[#4b5e51] border-[#dfe6dd]'
                                    }`}
                                  >
                                    <Heart
                                      aria-hidden="true"
                                      className={`w-3 h-3 ${
                                        comment.isLiked ? 'fill-[#1f6a42] text-[#1f6a42]' : ''
                                      }`}
                                    />
                                    <span>{comment.likes}</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      setReplyingTo((prev) => ({
                                        ...prev,
                                        [post.id]: comment.authorName,
                                      }))
                                    }
                                    className="text-[11px] font-bold text-[#1f6a42] hover:underline px-1.5 py-0.5 cursor-pointer"
                                  >
                                    Responder
                                  </button>
                                </div>
                              </div>

                              <p className="text-xs text-[#25372b] leading-relaxed">
                                {comment.replyToAuthor ? (
                                  <span className="inline-flex items-center gap-0.5 font-extrabold text-[#1f6a42] mr-1">
                                    <CornerDownRight aria-hidden="true" className="w-3 h-3" />@
                                    {comment.replyToAuthor}:
                                  </span>
                                ) : null}
                                {comment.content}
                              </p>
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <p className="text-xs text-[#596c5f] text-center py-1">
                        Sé el primero en comentar este hilo vecinal.
                      </p>
                    )}

                    {/* Reply indicator if replying to a specific neighbor */}
                    {replyTarget ? (
                      <div className="flex items-center justify-between px-2.5 py-1 rounded-lg bg-[#e4f2e8] text-[#1f6a42] text-xs font-bold">
                        <span>Respondiendo a {replyTarget}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setReplyingTo((prev) => ({ ...prev, [post.id]: undefined }))
                          }
                          className="underline cursor-pointer ml-2"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : null}

                    {/* Comment form with IME-safe Enter handler */}
                    <form
                      aria-label={`Comentar en la publicación de ${post.authorName}`}
                      onSubmit={(e) => {
                        e.preventDefault();
                        submitCommentForPost(post.id);
                      }}
                      className="space-y-1.5"
                    >
                      <label htmlFor={`comment-input-${post.id}`} className="visually-hidden">
                        Escribe un comentario para {post.authorName}
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          id={`comment-input-${post.id}`}
                          name="commentText"
                          type="text"
                          enterKeyHint="send"
                          value={replyDrafts[post.id] || ''}
                          onChange={(e) => handleCommentDraftChange(post.id, e.target.value)}
                          onCompositionEnd={(e) => {
                            lastCompositionEndRef.current = e.nativeEvent.timeStamp;
                          }}
                          onKeyDown={(e) => handleCommentKeyDown(e, post.id)}
                          placeholder={
                            replyTarget
                              ? `Responder a ${replyTarget}…`
                              : 'Escribe un comentario…'
                          }
                          className="flex-1 min-h-[42px] px-3.5 py-2 rounded-xl border border-[#cbd6c9] bg-white text-xs font-semibold text-[#16241b]"
                        />
                        <button
                          type="submit"
                          aria-label="Enviar comentario"
                          className="min-h-[42px] px-3.5 py-2 rounded-xl bg-[#1f6a42] hover:bg-[#185434] text-white text-xs font-extrabold inline-flex items-center gap-1 cursor-pointer shrink-0"
                        >
                          <Send aria-hidden="true" className="w-3.5 h-3.5" />
                          <span>Enviar</span>
                        </button>
                      </div>

                      {commentError ? (
                        <p role="alert" className="text-xs font-bold text-[#b91c1c] px-1">
                          {commentError}
                        </p>
                      ) : null}
                    </form>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="bg-white p-5 rounded-2xl border border-[#dfe6dd] text-center space-y-2">
          <p className="text-sm font-semibold text-[#495c4f]">
            Aún no hay publicaciones en la categoría «{selectedFilter}».
          </p>
          <button
            type="button"
            onClick={() => setIsWritingPost(true)}
            className="text-sm font-extrabold text-[#1f6a42] underline py-1 px-2 cursor-pointer"
          >
            Crear el primer hilo
          </button>
        </div>
      )}
    </div>
  );
};
