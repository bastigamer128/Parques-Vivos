import React, { useState } from 'react';
import { ForumPost, ForumCategory, ForumComment, UserProfile } from '../types';
import { 
  Heart, MessageCircle, Share2, Sparkles, Send, 
  Lightbulb, Star, Compass, Plus, CheckCircle2, 
  ShieldCheck, CornerDownRight, X, ChevronDown, ChevronUp, MessageSquare
} from 'lucide-react';

interface ForumViewProps {
  posts: ForumPost[];
  currentUser: UserProfile;
  onToggleLike: (postId: string) => void;
  onAddPost: (category: 'Ideas' | 'Reseñas' | 'Panorama', content: string) => void;
  onAddComment: (postId: string, content: string, replyToAuthor?: string) => void;
  onToggleCommentLike: (postId: string, commentId: string) => void;
}

export const ForumView: React.FC<ForumViewProps> = ({
  posts,
  currentUser,
  onToggleLike,
  onAddPost,
  onAddComment,
  onToggleCommentLike,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<ForumCategory>('Todas');
  const [isWritingPost, setIsWritingPost] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostCategory, setNewPostCategory] = useState<'Ideas' | 'Reseñas' | 'Panorama'>('Ideas');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Set of post IDs that have their thread expanded in the feed
  // By default, expand the first post's thread so the user immediately sees how it works!
  const [expandedThreads, setExpandedThreads] = useState<Record<string, boolean>>({
    'post-1': true,
  });

  // State for active reply drafts keyed by postId
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  // If replying to a specific author within the thread
  const [replyingTo, setReplyingTo] = useState<Record<string, string | undefined>>({});

  const categories: ForumCategory[] = ['Todas', 'Ideas', 'Reseñas', 'Panorama'];

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

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;
    onAddPost(newPostCategory, newPostContent.trim());
    setNewPostContent('');
    setIsWritingPost(false);
  };

  const handleShare = (postId: string) => {
    setCopiedId(postId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSendReply = (postId: string, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const content = replyDrafts[postId]?.trim();
    if (!content) return;

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

        {/* Filter Pills as requested: Todas, Ideas, Reseñas, Panorama */}
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

            <textarea
              required
              rows={3}
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              placeholder="¿Qué quieres proponer o compartir con la comunidad de Parque Almagro?"
              className="w-full p-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-stone-900 text-sm"
            />

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsWritingPost(false)}
                className="px-3 py-1.5 rounded-xl text-stone-500 hover:text-stone-800 text-xs font-bold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-md active:scale-95"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Publicar Hilo</span>
              </button>
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
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-extrabold text-stone-900 text-sm sm:text-base leading-tight">
                            {post.authorName}
                          </h3>
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

                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold border ${getCategoryBadgeClass(post.category)}`}>
                      {getCategoryIcon(post.category)}
                      {post.category}
                    </span>
                  </div>

                  {/* Post Content */}
                  <p className="text-stone-800 text-sm sm:text-base leading-relaxed mt-3">
                    {post.content}
                  </p>

                  {post.tag && (
                    <div className="mt-2.5">
                      <span className="inline-block text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                        {post.tag}
                      </span>
                    </div>
                  )}

                  {/* Action Bar (Twitter / X style: Like, Thread Comments, Share) */}
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

                      {/* Thread Comments Button (Functional & Toggleable) */}
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

                {/* TWITTER-STYLE THREAD SECTION */}
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

                    {/* Thread Replies List with Twitter Vertical Connector Line */}
                    <div className="relative space-y-4">
                      {/* Vertical line connecting the thread */}
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
                            {/* Avatar on the connector line */}
                            <div className="relative shrink-0">
                              <img
                                src={comment.authorAvatar}
                                alt={comment.authorName}
                                className="w-9 h-9 rounded-full object-cover border-2 border-white shadow-xs"
                              />
                            </div>

                            {/* Comment Bubble / Card */}
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

                              {/* Replying to indicator */}
                              {comment.replyToAuthor && (
                                <p className="text-[11px] text-stone-500 mb-1 font-medium">
                                  En respuesta a{' '}
                                  <span className="text-emerald-700 font-bold">
                                    @{comment.replyToAuthor}
                                  </span>
                                </p>
                              )}

                              {/* Comment Content */}
                              <p className="text-stone-800 text-xs sm:text-sm leading-relaxed">
                                {comment.content}
                              </p>

                              {/* Comment Footer: Like & Reply button */}
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

                      {/* REPLY COMPOSER (Twitter/X style inline thread response) */}
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
                              onChange={(e) =>
                                setReplyDrafts((prev) => ({
                                  ...prev,
                                  [post.id]: e.target.value,
                                }))
                              }
                              placeholder={
                                replyingToUser
                                  ? `Escribe tu respuesta a ${replyingToUser}...`
                                  : 'Publica tu respuesta en este hilo...'
                              }
                              className="w-full text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 outline-none py-1"
                            />

                            {/* Quick suggested chips to speed up community interaction */}
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
    </div>
  );
};
