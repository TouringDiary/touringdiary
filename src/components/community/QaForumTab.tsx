
import React, { useState, useEffect } from 'react';
import { ArrowLeft, ChevronDown, MapPin, Send, Loader2, MessageCircleQuestion, Filter, User, ChevronRight, Heart, MessageSquare } from 'lucide-react';
import { User as UserType, CommunityPost, CommunityReply, CitySummary } from '../../types/index';
import { getCommunityPostsAsync, addCommunityPostAsync, togglePostLike, getUserPostLikes } from '../../services/communityService';
import { getFullManifestAsync } from '../../services/cityService';
import { addNotification } from '../../services/notificationService';

interface QaForumTabProps {
    user: UserType;
    initialSelectedPostId?: string;
}

export const QaForumTab = ({ user, initialSelectedPostId }: QaForumTabProps) => {
    const [qaPosts, setQaPosts] = useState<CommunityPost[]>([]);
    const [likedPostIds, setLikedPostIds] = useState<string[]>([]);
    const [cityManifest, setCityManifest] = useState<CitySummary[]>([]);
    
    const [questionText, setQuestionText] = useState('');
    const [questionCity, setQuestionCity] = useState('');
    const [isPostingQa, setIsPostingQa] = useState(false);
    const [selectedPost, setSelectedPost] = useState<CommunityPost | null>(null);
    const [replyText, setReplyText] = useState('');
    const [showMyPostsOnly, setShowMyPostsOnly] = useState(false);
    
    const loadPosts = async () => {
        const posts = await getCommunityPostsAsync();
        setQaPosts(posts);
        
        if (initialSelectedPostId) {
            const post = posts.find(p => p.id === initialSelectedPostId);
            if (post) setSelectedPost(post);
        }
    };

    useEffect(() => {
        loadPosts();
        getFullManifestAsync().then(setCityManifest);
        if (user && user.id) {
            getUserPostLikes(user.id).then(setLikedPostIds);
        }
    }, [user, initialSelectedPostId]);

    const handlePostQuestion = async () => {
        if (!questionText.trim()) { alert("Scrivi una domanda!"); return; }
        if (!questionCity) { alert("Seleziona una città!"); return; }
        
        setIsPostingQa(true);
        const selectedCityName = cityManifest.find(c => c.id === questionCity)?.name || "Campania";
        
        const newPost: CommunityPost = {
            id: `post_${Date.now()}`,
            authorId: user.id,
            authorName: user.name,
            authorRole: user.role === 'business' ? 'business' : user.role === 'admin_all' ? 'admin' : 'user',
            authorAvatar: user.avatar,
            text: questionText,
            cityId: questionCity,
            cityName: selectedCityName,
            timestamp: new Date().toISOString(),
            likes: 0,
            repliesCount: 0,
            replies: []
        };

        const savedPost = await addCommunityPostAsync(newPost);
        
        if (savedPost) {
            setQaPosts(prev => [savedPost, ...prev]);
            if (user.role !== 'guest') {
                 setShowMyPostsOnly(true);
            }
            setQuestionText('');
        } else {
            alert("Errore invio domanda.");
        }
        setIsPostingQa(false);
    };

    const handleLikePost = async (postId: string) => {
        if (user.role === 'guest') {
            alert("Accedi per supportare!");
            return;
        }
        const result = await togglePostLike(postId, user.id);
        
        // Aggiorniamo lo stato locale dei like
        if (result.liked) {
            setLikedPostIds(prev => [...prev, postId]);
        } else {
            setLikedPostIds(prev => prev.filter(id => id !== postId));
        }
        
        // Optimistic update
        setQaPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: result.count } : p));
        
        if (selectedPost && selectedPost.id === postId) {
             setSelectedPost({ ...selectedPost, likes: result.count });
        }
    };
    
    const handlePostReply = async () => {
        if (!replyText.trim() || !selectedPost) return;
        
        if (user.role === 'guest') {
            alert("Accedi per rispondere!");
            return;
        }
        
        // NOTA: Le risposte sono ancora salvate dentro il JSON del post per semplicità in questa fase
        // In una versione futura, andrebbero in una tabella `community_replies` separata.
        // Per ora simuliamo l'aggiornamento locale, ma non persisterà se non aggiorniamo l'intero post su DB.
        // Dato che non ho implementato `updateCommunityPostAsync` completo, questo è un limite accettabile per ora.
        
        const newReply: CommunityReply = {
            id: `rep_${Date.now()}`,
            authorName: user.name,
            authorRole: user.role === 'business' ? 'business' : user.role === 'admin_all' ? 'admin' : 'user',
            text: replyText,
            timestamp: new Date().toISOString(),
            likes: 0
        };

        const updatedReplies = [...(selectedPost.replies || []), newReply];
        const updatedPost = { 
            ...selectedPost, 
            repliesCount: updatedReplies.length,
            replies: updatedReplies
        };
        
        // Mock Notification to author
        if (selectedPost.authorId !== user.id) {
             addNotification(
                 selectedPost.authorId,
                 'reply_qa',
                 'Nuova risposta!',
                 `${user.name} ha risposto alla tua domanda su ${selectedPost.cityName}`,
                 { section: 'community', tab: 'qa', targetId: selectedPost.id }
             );
        }
        
        setQaPosts(prev => prev.map(p => p.id === selectedPost.id ? updatedPost : p));
        setSelectedPost(updatedPost); 
        setReplyText('');
        
        // TODO: Implementare `updateCommunityPostAsync` per salvare le risposte su DB
        alert("Risposta inviata! (Nota: in questa demo la persistenza delle risposte è limitata)");
    };

    if (selectedPost) {
        const isLiked = likedPostIds.includes(selectedPost.id);
        const replies = selectedPost.replies || [];
        
        return (
            <div className="flex flex-col h-full animate-in slide-in-from-right-4">
                <div className="flex items-center gap-4 mb-4 border-b border-slate-800 pb-3">
                    <button onClick={() => setSelectedPost(null)} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"><ArrowLeft className="w-5 h-5"/></button>
                    <h3 className="text-lg font-bold text-white">Discussione</h3>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 shadow-lg">
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-indigo-600 border border-indigo-500 flex items-center justify-center font-bold text-white shadow-md">{selectedPost.authorName.charAt(0)}</div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-white text-base">{selectedPost.authorName}</span>
                                        {selectedPost.authorRole === 'guide' && <span className="bg-indigo-900/50 text-indigo-300 text-[9px] px-1.5 py-0.5 rounded uppercase font-bold border border-indigo-500/30">Guida</span>}
                                    </div>
                                    <div className="text-[10px] text-slate-500 flex items-center gap-2"><span>{new Date(selectedPost.timestamp).toLocaleString()}</span><span>•</span><span className="flex items-center gap-1 text-indigo-400 font-bold uppercase"><MapPin className="w-3 h-3"/> {selectedPost.cityName}</span></div>
                                </div>
                            </div>
                        </div>
                        <p className="text-slate-200 text-lg font-medium leading-relaxed mb-4">{selectedPost.text}</p>
                        <div className="flex items-center gap-4 border-t border-slate-800 pt-3">
                            <button onClick={() => handleLikePost(selectedPost.id)} className={`flex items-center gap-1.5 text-xs font-bold uppercase transition-colors px-2 py-1 rounded hover:bg-slate-800 ${isLiked ? 'text-rose-500' : 'text-slate-500 hover:text-rose-400'}`}><Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`}/> {selectedPost.likes || 0}</button>
                            <div className="flex items-center gap-1.5 text-xs font-bold uppercase text-slate-500"><MessageSquare className="w-4 h-4"/> {replies.length}</div>
                        </div>
                    </div>
                    <div className="space-y-3 pl-4 border-l-2 border-slate-800 ml-4">
                        {replies.map(reply => (
                            <div key={reply.id} className="bg-slate-900/50 border border-slate-800 rounded-lg p-4 hover:border-slate-700 transition-colors">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-400">{reply.authorName.charAt(0)}</div>
                                        <span className="font-bold text-slate-300 text-sm">{reply.authorName}</span>
                                        {reply.authorRole === 'guide' && <span className="text-[9px] bg-indigo-900/30 text-indigo-400 px-1.5 rounded uppercase font-bold">Guida</span>}
                                    </div>
                                    <span className="text-[10px] text-slate-600">{new Date(reply.timestamp).toLocaleDateString()}</span>
                                </div>
                                <p className="text-slate-400 text-sm leading-relaxed">{reply.text}</p>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-800">
                    <div className="flex gap-2">
                        <input value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Scrivi una risposta..." className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-sm text-white focus:border-indigo-500 outline-none" onKeyDown={(e) => e.key === 'Enter' && handlePostReply()}/>
                        <button onClick={handlePostReply} disabled={!replyText.trim()} className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"><Send className="w-5 h-5"/></button>
                    </div>
                </div>
            </div>
        );
    }

    const filteredPosts = showMyPostsOnly ? qaPosts.filter(p => p.authorId === user.id) : qaPosts;

    return (
        <div className="flex flex-col h-full gap-6 pb-10">
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl shrink-0 animate-in fade-in slide-in-from-top-4">
                <div className="flex gap-4 items-start">
                    <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shrink-0">{user.name.charAt(0)}</div>
                    <div className="flex-1 space-y-3">
                        <textarea value={questionText} onChange={e => setQuestionText(e.target.value)} placeholder="Dubbi su trasporti, cibo o luoghi? Chiedi ai local..." className="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 text-white text-sm focus:border-indigo-500 outline-none resize-none h-24 placeholder:text-slate-500 transition-all focus:ring-1 focus:ring-indigo-500/50"/>
                        <div className="flex items-center justify-between gap-3">
                            <div className="relative group flex-1 max-w-[200px]">
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-500"/>
                                <select value={questionCity} onChange={e => setQuestionCity(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-xs font-bold text-white uppercase tracking-wide focus:border-indigo-500 outline-none cursor-pointer appearance-none hover:bg-slate-900 transition-colors">
                                    <option value="">Seleziona Città...</option>
                                    {cityManifest.sort((a,b) => a.name.localeCompare(b.name)).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    <option value="general">Generale / Campania</option>
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500 pointer-events-none"/>
                            </div>
                            <button onClick={handlePostQuestion} disabled={!questionText.trim() || !questionCity || isPostingQa} className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg font-bold text-xs uppercase flex items-center gap-2 shadow-lg transition-all active:scale-95">
                                {isPostingQa ? <Loader2 className="w-4 h-4 animate-spin"/> : <Send className="w-4 h-4"/>} Pubblica Domanda
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <div className="flex items-center justify-between bg-slate-900/50 border border-slate-800 rounded-xl p-2">
                <div className="flex items-center gap-2"><Filter className="w-4 h-4 text-slate-500 ml-2"/><span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Filtra Discussioni:</span></div>
                <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
                    <button onClick={() => setShowMyPostsOnly(false)} className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase transition-all ${!showMyPostsOnly ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>Tutte</button>
                    <button onClick={() => setShowMyPostsOnly(true)} className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase transition-all flex items-center gap-1.5 ${showMyPostsOnly ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}><User className="w-3.5 h-3.5"/> Le Mie</button>
                </div>
            </div>
            <div className="flex-1 space-y-4">
                {filteredPosts.length === 0 && (
                    <div className="text-center py-12 bg-slate-900/50 rounded-2xl border border-slate-800 border-dashed">
                        <MessageCircleQuestion className="w-12 h-12 text-slate-600 mx-auto mb-3"/>
                        <p className="text-slate-500 italic">{showMyPostsOnly ? "Non hai ancora fatto domande." : "Nessuna domanda ancora. Sii il primo a chiedere!"}</p>
                    </div>
                )}
                {filteredPosts.map(post => {
                    const isLiked = likedPostIds.includes(post.id);
                    const isMyPost = post.authorId === user.id;
                    return (
                        <div key={post.id} onClick={() => setSelectedPost(post)} className={`bg-slate-900 border rounded-xl p-5 transition-all animate-in fade-in slide-in-from-bottom-2 shadow-md cursor-pointer group relative ${isMyPost ? 'border-indigo-500/50 hover:border-indigo-500' : 'border-slate-800 hover:border-slate-700'}`}>
                            {isMyPost && <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[9px] font-bold px-2 py-1 rounded-bl-lg rounded-tr-xl shadow-lg border-b border-l border-indigo-400">TU</div>}
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full border flex items-center justify-center font-bold text-slate-300 ${isMyPost ? 'bg-indigo-900/30 border-indigo-500/50' : 'bg-slate-800 border-slate-700'}`}>{post.authorName.charAt(0)}</div>
                                    <div>
                                        <div className="flex items-center gap-2"><span className={`font-bold text-sm transition-colors ${isMyPost ? 'text-indigo-300' : 'text-white group-hover:text-indigo-400'}`}>{post.authorName}</span>{post.authorRole === 'guide' && <span className="bg-indigo-900/50 text-indigo-300 text-[9px] px-1.5 py-0.5 rounded uppercase font-bold border border-indigo-500/30">Guida</span>}</div>
                                        <div className="text-[10px] text-slate-500 flex items-center gap-2"><span>{new Date(post.timestamp).toLocaleDateString()}</span><span>•</span><span className="flex items-center gap-1 text-indigo-400 font-bold uppercase"><MapPin className="w-3 h-3"/> {post.cityName}</span></div>
                                    </div>
                                </div>
                                {!isMyPost && <button className="text-slate-500 hover:text-white p-1"><ChevronRight className="w-4 h-4"/></button>}
                            </div>
                            <p className="text-slate-200 text-lg font-medium leading-relaxed mb-4 group-hover:text-white transition-colors">{post.text}</p>
                            <div className="flex items-center gap-4 border-t border-slate-800 pt-3">
                                <button onClick={(e) => { e.stopPropagation(); handleLikePost(post.id); }} className={`flex items-center gap-1.5 text-xs font-bold uppercase transition-colors px-2 py-1 rounded hover:bg-slate-800 ${isLiked ? 'text-rose-500' : 'text-slate-500 hover:text-rose-400'}`}><Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`}/> {post.likes || 0} <span className="hidden sm:inline">Supporti</span></button>
                                <button className={`flex items-center gap-1.5 text-xs font-bold uppercase transition-colors px-2 py-1 rounded hover:bg-slate-800 ${post.repliesCount > 0 ? 'text-indigo-400' : 'text-slate-500 hover:text-indigo-400'}`}><MessageCircleQuestion className="w-4 h-4"/> {post.repliesCount || 0} <span className="hidden sm:inline">Risposte</span></button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
