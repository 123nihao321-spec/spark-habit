import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Trash2, Trophy, Flame, CheckCircle2, Zap, X, 
  Sun, Moon, LayoutGrid, Infinity as InfinityIcon, 
  Smile, Frown, Meh, Heart, Star, MessageSquare,
  ShoppingBag, Settings, Lock, Gift, Coins, User, History, Receipt, RefreshCw,
  Camera, Edit3, Upload, Palette, Image as ImageIcon, LogOut, RotateCcw, Ticket
} from 'lucide-react';
import confetti from 'canvas-confetti';

// --- 预设数据 ---
const MOODS = [
  { id: 'happy', icon: <Smile size={24} />, color: 'text-green-500', bg: 'bg-green-500', label: '开心' },
  { id: 'neutral', icon: <Meh size={24} />, color: 'text-yellow-500', bg: 'bg-yellow-500', label: '平淡' },
  { id: 'sad', icon: <Frown size={24} />, color: 'text-blue-500', bg: 'bg-blue-500', label: '低落' },
];

const THEMES = [
  { id: 0, bg: 'from-orange-400 to-rose-400', border: 'border-orange-200', dot: 'bg-orange-400' },
  { id: 1, bg: 'from-blue-400 to-cyan-300', border: 'border-blue-200', dot: 'bg-blue-400' },
  { id: 2, bg: 'from-emerald-400 to-green-300', border: 'border-emerald-200', dot: 'bg-emerald-400' },
  { id: 3, bg: 'from-purple-500 to-indigo-400', border: 'border-purple-200', dot: 'bg-purple-500' },
  { id: 4, bg: 'from-pink-500 to-rose-500', border: 'border-pink-200', dot: 'bg-pink-500' },
  { id: 5, bg: 'from-indigo-500 to-blue-500', border: 'border-indigo-200', dot: 'bg-indigo-500' },
];

const AVATAR_PRESETS = ['🤠', '🐱', '🦊', '🦄', '🐸', '🤖', '👽', '👻', '🦸', '🧚', '🐼', '🐯'];

export default function App() {
  const [isDark, setIsDark] = useState(true);
  
  const [userId] = useState(() => {
    try {
      let uid = localStorage.getItem('spark-user-id');
      if (!uid) {
        uid = 'user_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('spark-user-id', uid);
      }
      return uid;
    } catch (e) {
      return 'user_guest';
    }
  });
  
  const [nickname, setNickname] = useState(() => localStorage.getItem('spark-nickname') || '神秘打卡人');
  const [avatar, setAvatar] = useState(() => localStorage.getItem('spark-avatar') || '🤠');
  const [bgImage, setBgImage] = useState(() => localStorage.getItem('spark-bg-image') || '');

  const [points, setPoints] = useState(() => parseInt(localStorage.getItem('spark-points') || '0'));
  const [lastPointDate, setLastPointDate] = useState(() => localStorage.getItem('spark-last-point-date') || '');

  const [habits, setHabits] = useState(() => {
    try { return JSON.parse(localStorage.getItem('spark-habits') || '[]'); } catch { return []; }
  });

  const [storeItems, setStoreItems] = useState([]); 
  const [transactions, setTransactions] = useState([]);
  const [isLoadingCloud, setIsLoadingCloud] = useState(false);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCheckInModal, setShowCheckInModal] = useState(null); 
  const [showStoreModal, setShowStoreModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [toast, setToast] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false); 

  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitType, setNewHabitType] = useState('streak'); 
  const [targetDays, setTargetDays] = useState(21); 
  const [checkInMood, setCheckInMood] = useState('happy');
  const [checkInComment, setCheckInComment] = useState('');

  const [editName, setEditName] = useState('');
  const [editAvatar, setEditAvatar] = useState('');

  const [adminItemName, setAdminItemName] = useState('');
  const [adminItemCost, setAdminItemCost] = useState(100);
  const [adminItemIcon, setAdminItemIcon] = useState('🎁');

  // 计算拥有的补签卡数量
  const myCardsCount = React.useMemo(() => {
    if (!transactions) return 0;
    const bought = transactions.filter(t => t.user_id === userId && t.item_name === '补签卡').length;
    const used = transactions.filter(t => t.user_id === userId && t.item_name === 'used_card').length;
    return Math.max(0, bought - used);
  }, [transactions, userId]);

  useEffect(() => {
    try {
      localStorage.setItem('spark-habits', JSON.stringify(habits));
      localStorage.setItem('spark-points', points.toString());
      localStorage.setItem('spark-nickname', nickname);
      localStorage.setItem('spark-avatar', avatar);
      localStorage.setItem('spark-last-point-date', lastPointDate);
      localStorage.setItem('spark-bg-image', bgImage); 
    } catch (e) {
      console.warn("Storage warning", e);
    }
  }, [habits, points, nickname, avatar, lastPointDate, bgImage]);

  const fetchCloudData = async () => {
    setIsLoadingCloud(true);
    try {
      const storeRes = await fetch('/api/store');
      if (storeRes.ok) {
        const items = await storeRes.json();
        setStoreItems(items);
      }
      const transRes = await fetch('/api/transact');
      if (transRes.ok) {
        const trans = await transRes.json();
        setTransactions(trans);
      }
    } catch (e) {
      // 忽略本地错误
    } finally {
      setIsLoadingCloud(false);
    }
  };

  useEffect(() => {
    if (showStoreModal || showAdminPanel) {
      fetchCloudData();
    }
  }, [showStoreModal, showAdminPanel]);

  const sortedHabits = [...habits].sort((a, b) => {
    if (a.type === 'streak' && b.type !== 'streak') return -1;
    if (a.type !== 'streak' && b.type === 'streak') return 1;
    if (a.type === 'grid' && b.type === 'grid') {
      return a.targetDays - b.targetDays;
    }
    return 0;
  });

  const tryAddDailyPoint = () => {
    const today = new Date().toLocaleDateString();
    if (lastPointDate !== today) {
      setPoints(p => p + 1);
      setLastPointDate(today);
      return true;
    }
    return false;
  };

  const createHabit = () => {
    if (!newHabitName.trim()) return;
    const newHabit = {
      id: Date.now(),
      name: newHabitName,
      theme: Math.floor(Math.random() * THEMES.length),
      type: newHabitType, 
      streak: 0, completedToday: false, targetDays: newHabitType === 'grid' ? targetDays : 0, logs: [], 
    };
    setHabits([...habits, newHabit]);
    setNewHabitName('');
    setShowAddModal(false);
    showToast('新挑战已开启！🚀');
  };

  const requestDeleteHabit = (id) => {
    setDeleteConfirmId(id);
  };

  const confirmDeleteHabit = () => {
    if (deleteConfirmId) {
      setHabits(habits.filter(h => h.id !== deleteConfirmId));
      setDeleteConfirmId(null);
      showToast('目标已删除 👋');
    }
  };

  const toggleStreakHabit = (id) => {
    setHabits(habits.map(h => {
      if (h.id === id) {
        if (h.completedToday) {
          showToast('落子无悔，打卡后不能取消哦！🚫');
          return h; 
        }
        triggerConfetti();
        const earned = tryAddDailyPoint();
        showToast(earned ? '打卡成功！积分 +1' : '打卡成功！今日积分已拿 ✨');
        return { ...h, completedToday: true, streak: h.streak + 1 };
      }
      return h;
    }));
  };

  const useRetroactiveCard = async (habitId) => {
    if (myCardsCount <= 0) {
      showToast('补签卡不足，请去商店兑换！');
      return;
    }

    if (window.confirm('确定使用一张补签卡进行补签吗？🎫')) {
      try {
        await fetch('/api/transact', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            userId, userName: nickname, userAvatar: avatar, 
            itemName: 'used_card', itemIcon: '🎫', cost: 0, 
            date: new Date().toLocaleString()
          })
        });
        fetchCloudData(); 
      } catch(e) { console.error("API Error"); }

      setHabits(habits.map(h => {
        if (h.id === habitId) {
          const newLog = { 
            date: `补签 ${new Date().toLocaleDateString()}`, 
            timestamp: Date.now(), 
            mood: 'neutral', 
            comment: '使用补签卡' 
          };
          if (h.type === 'streak') {
             return { ...h, streak: h.streak + 1 };
          } else {
             return { ...h, logs: [...h.logs, newLog] };
          }
        }
        return h;
      }));

      showToast('补签成功！✨');
      triggerConfetti();
    }
  };

  const openGridCheckIn = (id) => {
    const habit = habits.find(h => h.id === id);
    const today = new Date().toLocaleDateString();
    if (habit.logs.some(log => log.date.includes(today))) {
      showToast('今天已经记录过心情啦 ✨');
      return;
    }
    setShowCheckInModal(id);
    setCheckInMood('happy');
    setCheckInComment('');
  };

  const submitGridCheckIn = () => {
    if (!showCheckInModal) return;
    setHabits(habits.map(h => {
      if (h.id === showCheckInModal) {
        const newLog = { 
          date: new Date().toLocaleString(), 
          timestamp: Date.now(), 
          mood: checkInMood, 
          comment: checkInComment 
        };
        return { ...h, logs: [...h.logs, newLog] };
      }
      return h;
    }));
    triggerConfetti();
    const earned = tryAddDailyPoint();
    showToast(earned ? '记录成功！积分 +1' : '记录成功！今日积分已拿 ✨');
    setShowCheckInModal(null);
  };

  const buyItem = async (item) => {
    if (points >= item.cost) {
      if (window.confirm(`确认消耗 ${item.cost} 积分兑换 ${item.name} 吗？`)) {
        setPoints(p => p - item.cost);
        try {
          await fetch('/api/transact', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
              userId, userName: nickname, userAvatar: avatar, 
              itemName: item.name, itemIcon: item.icon, cost: item.cost, 
              date: new Date().toLocaleString()
            })
          });
          fetchCloudData();
        } catch(e) { console.error("API Error"); }
        showToast(`兑换成功！管理员已收到您的请求 🎉`);
        triggerConfetti();
      }
    } else {
      showToast('积分不足，快去打卡赚积分吧！🥺');
    }
  };

  const openProfileModal = () => {
    setEditName(nickname);
    setEditAvatar(avatar);
    setShowProfileModal(true);
  }

  const saveProfile = () => {
    if (editName.trim()) setNickname(editName);
    setAvatar(editAvatar);
    setShowProfileModal(false);
    showToast('个人资料已更新 ✨');
  }

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showToast('图片太大啦，请选择 2MB 以内的图片 🖼️');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setEditAvatar(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleBgUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        showToast('壁纸太大啦，请选择 3MB 以内的图片 🖼️');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        try {
          setBgImage(reader.result);
          showToast('自定义壁纸设置成功！✨');
        } catch(e) {
          showToast('设置失败，图片可能过大');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // 🔥 核心修改：移除本地 888 密码，只依赖 API
  const handleAdminLogin = async () => {
    setIsVerifying(true);
    try {
      const res = await fetch('/api/verify', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ password: passwordInput })
      });
      
      // 不管是 200 还是 401，我们先解析 JSON
      const data = await res.json();
      
      if (res.ok && data.success) {
        setIsAdmin(true);
        setShowAdminLogin(false);
        setShowAdminPanel(true);
        showToast("验证成功！🔐");
      } else {
        showToast("密码错误 🚫");
        setPasswordInput("");
      }
    } catch (e) {
       // 如果 fetch 失败（例如断网或后端未部署），提示用户
       showToast("无法连接服务器，请检查网络或部署状态");
    } finally {
      setIsVerifying(false);
    }
  };

  const addStoreItem = async () => {
    if (!adminItemName) return;
    try {
      const res = await fetch('/api/store', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ name: adminItemName, cost: adminItemCost, icon: adminItemIcon, desc: '管理员添加' })
      });
      if (!res.ok) throw new Error("API Failed");
      setAdminItemName('');
      fetchCloudData();
      showToast('商品已上架，全网同步！');
    } catch (e) {
      showToast('上架失败：数据库未连接');
    }
  };

  const removeStoreItem = async (id) => {
    if (window.confirm('确定要下架该商品吗？')) {
      try {
        await fetch(`/api/store?id=${id}`, { method: 'DELETE' });
        fetchCloudData();
      } catch(e) {}
    }
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const triggerConfetti = () => {
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#F472B6', '#A78BFA', '#34D399'] });
  };

  const isImage = (str) => {
    try { return str.startsWith('http') || str.startsWith('data:image'); } catch { return false; }
  };

  const AvatarDisplay = ({ src, size = 'md', className = '' }) => {
    const sizeClass = size === 'lg' ? 'w-16 h-16 text-4xl' : size === 'sm' ? 'w-6 h-6 text-xs' : 'w-8 h-8 text-lg';
    return (
      <div className={`${sizeClass} rounded-full bg-gray-200/20 flex items-center justify-center overflow-hidden border border-white/20 ${className}`}>
        {isImage(src) ? <img src={src} alt="avatar" className="w-full h-full object-cover" /> : <span>{src}</span>}
      </div>
    );
  };

  const bgClass = isDark ? 'bg-slate-900' : 'bg-gray-50';
  const textClass = isDark ? 'text-white' : 'text-slate-800';
  const cardBgClass = isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-white border-gray-200 shadow-sm';
  const subTextClass = isDark ? 'text-slate-400' : 'text-gray-500';

  return (
    <div 
      className={`min-h-screen ${bgClass} ${textClass} font-sans transition-colors duration-500 overflow-x-hidden relative selection:bg-pink-500 selection:text-white`}
      style={bgImage ? { backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' } : {}}
    >
      
      {bgImage && (
        <div className={`fixed inset-0 pointer-events-none transition-colors duration-500 ${isDark ? 'bg-black/60' : 'bg-white/60'} backdrop-blur-sm z-0`} />
      )}

      {/* 顶部栏 */}
      <header className="fixed top-0 left-0 right-0 z-20 backdrop-blur-md bg-opacity-80 px-4 py-4 flex justify-between items-center border-b border-white/5">
        <div>
          <h1 className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-400">
            元气打卡
          </h1>
          <div className="flex items-center gap-2 mt-1 cursor-pointer opacity-80 hover:opacity-100 transition-opacity" onClick={openProfileModal}>
             <AvatarDisplay src={avatar} size="sm" />
             <p className="text-[10px] font-bold underline">{nickname}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full border cursor-pointer hover:scale-105 transition-transform ${isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-white/80 border-gray-200 shadow-sm'}`} onClick={() => setShowStoreModal(true)}>
            <Trophy className="w-4 h-4 text-yellow-400" />
            <span className="font-bold text-sm">{points}</span>
          </div>
          
          {/* 🔥 修复：背景图片设置区域 */}
          <div className="flex items-center gap-1">
            {/* 重置按钮：仅在有背景图时显示 */}
            {bgImage && (
              <button 
                onClick={() => { setBgImage(''); showToast('背景已恢复默认 ✨'); }} 
                className={`p-2 rounded-full transition-colors ${isDark ? 'bg-slate-800/80 hover:bg-slate-700' : 'bg-white/80 hover:bg-gray-100 shadow-sm'}`}
              >
                <RotateCcw size={18} className="text-gray-400 hover:text-white" />
              </button>
            )}
            {/* 上传按钮 */}
            <div className="relative">
              <input type="file" accept="image/*" onChange={handleBgUpload} className="hidden" id="bg-upload" />
              <label htmlFor="bg-upload" className={`flex p-2 rounded-full cursor-pointer transition-colors ${isDark ? 'bg-slate-800/80 hover:bg-slate-700' : 'bg-white/80 hover:bg-gray-100 shadow-sm'}`}>
                <ImageIcon size={18} className="text-purple-400" />
              </label>
            </div>
          </div>

          <button onClick={() => setShowStoreModal(true)} className={`p-2 rounded-full transition-colors ${isDark ? 'bg-slate-800/80 hover:bg-slate-700' : 'bg-white/80 hover:bg-gray-100 shadow-sm'}`}><ShoppingBag size={18} className="text-pink-400" /></button>
          <button onClick={() => isAdmin ? setShowAdminPanel(true) : setShowAdminLogin(true)} className={`p-2 rounded-full transition-colors ${isAdmin ? 'bg-blue-500/20 text-blue-400' : isDark ? 'bg-slate-800/80 hover:bg-slate-700 text-slate-400' : 'bg-white/80 hover:bg-gray-100 text-gray-400 shadow-sm'}`}>{isAdmin ? <Settings size={18} /> : <Lock size={18} />}</button>
          <button onClick={() => setIsDark(!isDark)} className={`p-2 rounded-full transition-colors ${isDark ? 'bg-slate-800/80 hover:bg-slate-700' : 'bg-white/80 hover:bg-gray-100 shadow-sm'}`}>{isDark ? <Moon size={18} /> : <Sun size={18} className="text-orange-500" />}</button>
        </div>
      </header>

      {/* 列表区域 */}
      <div className="relative z-10 pt-24 pb-32 px-4 max-w-md mx-auto space-y-5">
        <AnimatePresence>
          {sortedHabits.map((habit) => {
            const theme = THEMES[habit.theme % THEMES.length] || THEMES[0];
            const isGridTodayDone = habit.type === 'grid' && habit.logs.some(log => log.date.includes(new Date().toLocaleDateString()));

            return (
              <motion.div
                key={habit.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`relative rounded-3xl p-5 border backdrop-blur-xl transition-all ${cardBgClass}`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {habit.type === 'streak' ? <div className="bg-orange-100/10 p-1 rounded text-orange-400"><InfinityIcon size={14} /></div> : <div className="bg-purple-100/10 p-1 rounded text-purple-400"><LayoutGrid size={14} /></div>}
                      <h3 className={`text-xl font-bold ${habit.completedToday ? 'line-through opacity-50' : ''}`}>{habit.name}</h3>
                    </div>
                    <p className={`text-xs ${subTextClass}`}>{habit.type === 'streak' ? `已坚持 ${habit.streak} 天` : `挑战进度: ${habit.logs.length} / ${habit.targetDays}`}</p>
                  </div>
                  <div className="flex gap-2">
                    {myCardsCount > 0 && !isGridTodayDone && !habit.completedToday && (
                      <button 
                        onClick={() => useRetroactiveCard(habit.id)}
                        className="flex items-center justify-center p-2 rounded-xl bg-orange-100 text-orange-500 hover:bg-orange-200 transition-colors"
                        title="使用补签卡"
                      >
                        <Ticket size={18} />
                      </button>
                    )}

                    <button onClick={() => requestDeleteHabit(habit.id)} className={`p-2 rounded-xl transition-colors ${isDark ? 'hover:bg-slate-700 text-slate-500' : 'hover:bg-gray-100 text-gray-400'}`}><Trash2 size={18} /></button>
                    
                    {habit.type === 'streak' ? (
                      <button onClick={() => toggleStreakHabit(habit.id)} className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all active:scale-95 ${habit.completedToday ? 'bg-green-500 text-white shadow-lg cursor-not-allowed' : `bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg`}`}>
                        {habit.completedToday ? <CheckCircle2 size={24} /> : <Zap size={24} />}
                      </button>
                    ) : (
                      <button 
                        onClick={() => openGridCheckIn(habit.id)} 
                        disabled={habit.logs.length >= habit.targetDays} 
                        className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all active:scale-95 ${
                          isGridTodayDone
                            ? 'bg-green-500 text-white shadow-lg' 
                            : habit.logs.length >= habit.targetDays 
                              ? 'bg-gray-400 cursor-not-allowed' 
                              : `bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg`
                        }`}
                      >
                        {isGridTodayDone ? <CheckCircle2 size={24} /> : <Plus size={24} />}
                      </button>
                    )}
                  </div>
                </div>
                {/* --- Grid 进度条 --- */}
                {habit.type === 'grid' && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {Array.from({ length: habit.targetDays }).map((_, index) => {
                      const log = habit.logs[index]; const isDone = !!log;
                      const moodColorClass = isDone ? (MOODS.find(m => m.id === log.mood)?.bg || 'bg-green-500') : '';

                      return (
                        <div key={index} className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold border relative group transition-colors hover:z-50 ${isDone ? `${moodColorClass} border-transparent text-white` : isDark ? 'bg-slate-900 border-slate-700 text-slate-600' : 'bg-gray-100 border-gray-200 text-gray-400'}`}>
                          {isDone ? <span>{MOODS.find(m => m.id === log.mood)?.icon || '✨'}</span> : index + 1}
                          
                          {/* 悬停显示日期和评论 */}
                          {isDone && (
                            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-max max-w-[12rem] p-2 bg-slate-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-lg border border-white/10 z-50">
                              {log.comment ? (
                                <>
                                  <div className="mb-1">{log.comment}</div>
                                  <div className="text-[10px] opacity-50 border-t border-white/10 pt-1 mt-1">{log.date}</div>
                                </>
                              ) : (
                                <div className="text-[10px]">{log.date}</div>
                              )}
                              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <div className="fixed bottom-6 left-0 right-0 flex justify-center z-20 pointer-events-none">
        <button onClick={() => setShowAddModal(true)} className="pointer-events-auto bg-gradient-to-r from-pink-500 to-violet-600 text-white px-6 py-3 rounded-full font-bold shadow-lg shadow-purple-500/40 flex items-center gap-2 transform transition hover:scale-105 active:scale-95"><Plus size={20} /> 新建目标</button>
      </div>

      {/* 删除确认弹窗 */}
      <AnimatePresence>
        {deleteConfirmId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
             <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteConfirmId(null)} />
             <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9, opacity: 0 }} className={`relative w-full max-w-xs ${isDark ? 'bg-slate-800' : 'bg-white'} rounded-2xl p-6 shadow-2xl text-center`}>
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                  <Trash2 size={32} />
                </div>
                <h3 className="text-lg font-bold mb-2">确认删除?</h3>
                <p className={`text-sm mb-6 ${subTextClass}`}>删除后，所有打卡记录将无法恢复。</p>
                <div className="flex gap-3">
                  <button onClick={() => setDeleteConfirmId(null)} className={`flex-1 py-3 rounded-xl font-bold ${isDark ? 'bg-slate-700 hover:bg-slate-600' : 'bg-gray-100 hover:bg-gray-200'}`}>取消</button>
                  <button onClick={confirmDeleteHabit} className="flex-1 py-3 rounded-xl font-bold bg-red-500 text-white hover:bg-red-600">删除</button>
                </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 新建目标弹窗 */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-0">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: "spring", damping: 25, stiffness: 300 }} className={`relative w-full max-w-md ${isDark ? 'bg-slate-800' : 'bg-white'} rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl`}>
              <h2 className="text-xl font-bold mb-4">创建新目标</h2>
              <div className="space-y-4">
                <input value={newHabitName} onChange={(e) => setNewHabitName(e.target.value)} className={`w-full p-3 rounded-xl outline-none border ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-gray-50 border-gray-200'}`} placeholder="例如：夜跑 5 公里" />
                
                <div className="flex gap-2">
                  <button onClick={() => setNewHabitType('streak')} className={`flex-1 p-3 rounded-xl border flex flex-col items-center gap-2 ${newHabitType === 'streak' ? 'border-purple-500 bg-purple-500/10 text-purple-500' : isDark ? 'border-slate-700' : 'border-gray-200'}`}><InfinityIcon /><span className="text-sm font-bold">无限坚持</span></button>
                  <button onClick={() => setNewHabitType('grid')} className={`flex-1 p-3 rounded-xl border flex flex-col items-center gap-2 ${newHabitType === 'grid' ? 'border-purple-500 bg-purple-500/10 text-purple-500' : isDark ? 'border-slate-700' : 'border-gray-200'}`}><LayoutGrid /><span className="text-sm font-bold">格子挑战</span></button>
                </div>
                
                {newHabitType === 'grid' && (
                  <div className="space-y-2 pt-2">
                    <div className="flex justify-between items-center text-xs font-medium">
                       <span className={subTextClass}>挑战时长</span>
                       <span className="text-purple-500 font-bold text-base">{targetDays} 天</span>
                    </div>
                    <input type="range" min="7" max="100" value={targetDays} onChange={(e) => setTargetDays(Number(e.target.value))} className="w-full accent-purple-500 cursor-pointer" />
                    <div className="flex justify-between text-[10px] opacity-40">
                       <span>7天</span>
                       <span>100天</span>
                    </div>
                  </div>
                )}

                <button onClick={createHabit} className="w-full bg-purple-500 text-white p-4 rounded-xl font-bold mt-4">确认创建</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 个人资料弹窗 */}
      <AnimatePresence>
        {showProfileModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
             <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowProfileModal(false)} />
             <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9, y: 20 }} className={`relative w-full max-w-sm ${isDark ? 'bg-slate-800' : 'bg-white'} rounded-3xl p-6 shadow-2xl overflow-hidden`}>
                <h3 className="text-xl font-bold mb-6 text-center">个人资料</h3>
                <div className="flex flex-col items-center mb-6">
                   <AvatarDisplay src={editAvatar} size="lg" className="mb-3 ring-4 ring-purple-500/30" />
                   <div className="w-full">
                     <label className={`text-xs ${subTextClass} ml-1 mb-1 block`}>昵称</label>
                     <div className={`flex items-center gap-2 p-2 rounded-xl border ${isDark ? 'border-slate-700 bg-slate-900' : 'border-gray-200 bg-gray-50'}`}>
                        <Edit3 size={16} className="text-gray-400" />
                        <input value={editName} onChange={e => setEditName(e.target.value)} className="flex-1 bg-transparent outline-none text-sm font-bold" />
                     </div>
                   </div>
                </div>
                <div className="mb-6">
                   <label className={`text-xs ${subTextClass} ml-1 mb-2 block`}>选择头像 (支持 Emoji 或 本地图片)</label>
                   <div className="flex flex-wrap gap-2 mb-3 justify-center">
                      {AVATAR_PRESETS.map(emoji => (
                         <button key={emoji} onClick={() => setEditAvatar(emoji)} className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all ${editAvatar === emoji ? 'bg-purple-500 text-white scale-110 shadow-lg' : isDark ? 'bg-slate-700 hover:bg-slate-600' : 'bg-gray-100 hover:bg-gray-200'}`}>{emoji}</button>
                      ))}
                   </div>
                   <div className="relative">
                     <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" id="avatar-upload" />
                     <label htmlFor="avatar-upload" className={`flex items-center justify-center gap-2 p-3 rounded-xl border cursor-pointer transition-colors ${isDark ? 'border-slate-700 bg-slate-900 hover:bg-slate-800' : 'border-gray-200 bg-gray-50 hover:bg-gray-100'}`}>
                       <Camera size={18} className="text-gray-400" />
                       <span className={`text-xs ${subTextClass}`}>点击上传本地图片</span>
                     </label>
                   </div>
                </div>
                <button onClick={saveProfile} className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white p-3 rounded-xl font-bold shadow-lg shadow-purple-500/30">保存修改</button>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 管理员验证弹窗 */}
      <AnimatePresence>
        {showAdminLogin && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
             <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAdminLogin(false)} />
             <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9, y: 50 }} className={`relative w-full max-w-xs ${isDark ? 'bg-slate-800' : 'bg-white'} rounded-2xl p-6 shadow-2xl`}>
                <div className="text-center mb-4">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-2 text-blue-500"><Lock size={24} /></div>
                  <h3 className="text-lg font-bold">管理员验证</h3>
                </div>
                <input type="password" autoFocus value={passwordInput} onChange={e => setPasswordInput(e.target.value)} className={`w-full p-3 rounded-xl mb-4 text-center text-lg tracking-widest outline-none border ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-gray-50 border-gray-200'}`} placeholder="●●●●" />
                <button onClick={handleAdminLogin} className="w-full bg-blue-500 text-white py-3 rounded-xl font-bold">验证身份</button>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 积分商店弹窗 */}
      <AnimatePresence>
        {showStoreModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-0">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowStoreModal(false)} />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: "spring", damping: 25, stiffness: 300 }} className={`relative w-full max-w-md ${isDark ? 'bg-slate-800' : 'bg-white'} rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]`}>
              <div className="flex justify-between items-center mb-6">
                <div>
                   <h2 className="text-xl font-bold flex items-center gap-2"><ShoppingBag className="text-pink-400" /> 积分商店</h2>
                   <div className="flex gap-2 items-center">
                     <p className={`text-xs ${subTextClass} mt-1`}>您的积分: <span className="text-yellow-400 font-bold">{points}</span></p>
                     <p className={`text-xs ${subTextClass} mt-1 border-l pl-2 ml-2 border-gray-600`}>补签卡: <span className="text-orange-400 font-bold">{myCardsCount}</span></p>
                   </div>
                </div>
                <div className="flex gap-2">
                   <button onClick={fetchCloudData} className={`p-2 rounded-full ${isDark ? 'bg-slate-700' : 'bg-gray-100'}`}><RefreshCw size={18} className={isLoadingCloud ? "animate-spin" : ""} /></button>
                   <button onClick={() => setShowStoreModal(false)} className={`p-2 rounded-full ${isDark ? 'bg-slate-700' : 'bg-gray-100'}`}><X size={18} /></button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto pb-4 space-y-6">
                <div className="grid grid-cols-2 gap-3">
                  {storeItems.map(item => (
                    <div key={item.id} className={`p-4 rounded-2xl border flex flex-col items-center text-center gap-2 transition-all ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="text-4xl mb-1">{item.icon}</div>
                      <div className="font-bold">{item.name}</div>
                      <div className={`text-[10px] ${subTextClass}`}>{item.desc}</div>
                      <button onClick={() => buyItem(item)} disabled={points < item.cost} className={`mt-2 w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all ${points >= item.cost ? 'bg-yellow-400 text-yellow-900 hover:bg-yellow-300' : 'bg-gray-500/20 text-gray-500 cursor-not-allowed'}`}><Coins size={12} /> {item.cost}</button>
                    </div>
                  ))}
                  {storeItems.length === 0 && <div className="col-span-2 text-center text-xs opacity-50 py-8">商店暂无商品 (或 D1 未连接)</div>}
                </div>
                <div className={`p-4 rounded-xl ${isDark ? 'bg-slate-900/50' : 'bg-gray-50'}`}>
                  <h3 className="text-sm font-bold mb-3 flex items-center gap-2"><Receipt size={14}/> 我的兑换记录</h3>
                  <div className="space-y-2">
                    {transactions.filter(t => t.user_id === userId).map(t => (
                      <div key={t.id} className="flex justify-between items-center text-xs opacity-80">
                         <span>{t.date_str || '刚刚'} 兑换了 {t.item_icon} {t.item_name}</span>
                         <span className="text-red-400 font-mono">-{t.cost}</span>
                      </div>
                    ))}
                    {transactions.filter(t => t.user_id === userId).length === 0 && <p className="text-[10px] text-center opacity-50">暂无记录</p>}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 管理员后台 */}
      <AnimatePresence>
        {showAdminPanel && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
             <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAdminPanel(false)} />
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95, y: 50 }} transition={{ type: "spring", damping: 25, stiffness: 300 }} className={`relative w-full max-w-md ${isDark ? 'bg-slate-800' : 'bg-white'} rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-hidden flex flex-col`}>
              <div className="flex justify-between items-center mb-6 flex-shrink-0">
                <h2 className="text-xl font-bold flex items-center gap-2"><Settings className="text-blue-400" /> D1 后台管理</h2>
                <div className="flex gap-2">
                   <button onClick={fetchCloudData} className={`p-2 rounded-full ${isDark ? 'bg-slate-700' : 'bg-gray-100'}`}><RefreshCw size={18} className={isLoadingCloud ? "animate-spin" : ""} /></button>
                   <button onClick={() => setShowAdminPanel(false)} className={`p-2 rounded-full ${isDark ? 'bg-slate-700' : 'bg-gray-100'}`}><X size={18} /></button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto space-y-6 pr-2">
                <section>
                   <h3 className="text-sm font-bold mb-3 flex items-center gap-2 text-purple-400"><Gift size={14} /> 商品管理</h3>
                   <div className="flex gap-2 mb-2">
                      <input placeholder="名称" value={adminItemName} onChange={e => setAdminItemName(e.target.value)} className={`flex-1 p-2 rounded-lg text-xs outline-none border ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'}`} />
                      <input placeholder="价格" type="number" value={adminItemCost} onChange={e => setAdminItemCost(Number(e.target.value))} className={`w-16 p-2 rounded-lg text-xs outline-none border ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'}`} />
                      <input placeholder="图标" value={adminItemIcon} onChange={e => setAdminItemIcon(e.target.value)} className={`w-12 p-2 rounded-lg text-xs outline-none border ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'}`} />
                      <button onClick={addStoreItem} className="px-3 bg-blue-500 text-white rounded-lg text-xs font-bold">上架</button>
                   </div>
                   <div className="space-y-2">
                     {storeItems.map(item => (
                       <div key={item.id} className={`flex items-center justify-between p-2 rounded-lg border text-xs ${isDark ? 'border-slate-700 bg-slate-900/50' : 'border-gray-100 bg-gray-50'}`}>
                         <div className="flex items-center gap-2"><span>{item.icon}</span><span>{item.name}</span></div>
                         <button onClick={() => removeStoreItem(item.id)} className="text-red-400 hover:text-red-300"><Trash2 size={14} /></button>
                       </div>
                     ))}
                   </div>
                </section>
                <section>
                   <h3 className="text-sm font-bold mb-3 flex items-center gap-2 text-yellow-400"><History size={14} /> 全员消费流水</h3>
                   <div className={`rounded-xl p-3 max-h-40 overflow-y-auto ${isDark ? 'bg-slate-900/50' : 'bg-gray-50'}`}>
                      {transactions.length === 0 ? <p className="text-[10px] opacity-50 text-center">暂无消费记录</p> : 
                        transactions.map(t => (
                          <div key={t.id} className="flex justify-between items-center text-[10px] py-1 border-b border-white/5 last:border-0">
                             <div className="flex items-center gap-2">
                                <AvatarDisplay src={t.userAvatar || '🤠'} size="sm" />
                                <div className="flex flex-col">
                                   <span className="font-bold text-blue-300">{t.user_name}</span>
                                   <span className="opacity-60 text-[9px]">{t.date_str}</span>
                                </div>
                             </div>
                             <div className="flex items-center gap-2">
                                <span>{t.item_icon} {t.item_name}</span>
                                <span className="font-bold text-red-400">-{t.cost}</span>
                             </div>
                          </div>
                        ))
                      }
                   </div>
                </section>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid打卡 & Toast */}
      <AnimatePresence>
        {showCheckInModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCheckInModal(null)} />
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9, y: 50 }} className={`relative w-full max-w-sm ${isDark ? 'bg-slate-800' : 'bg-white'} rounded-3xl p-6 shadow-2xl`}>
              <h3 className="text-xl font-bold mb-6 text-center">打卡记录</h3>
              <div className="flex justify-between mb-6 px-2">{MOODS.map((m) => (<button key={m.id} onClick={() => setCheckInMood(m.id)} className={`flex flex-col items-center gap-1 transition-all ${checkInMood === m.id ? 'scale-125' : 'opacity-50'}`}><div className={`${checkInMood === m.id ? m.color : 'text-gray-400'}`}>{m.icon}</div><span className="text-xs font-bold mt-1 text-gray-500">{m.label}</span></button>))}</div>
              <textarea value={checkInComment} onChange={(e) => setCheckInComment(e.target.value)} placeholder="写点什么..." className={`w-full p-3 rounded-xl mb-6 outline-none ${isDark ? 'bg-slate-900' : 'bg-gray-100'}`} />
              <button onClick={submitGridCheckIn} className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white p-3 rounded-xl font-bold">完成打卡 (+1 积分)</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>{toast && <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="fixed top-20 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur text-slate-900 px-6 py-3 rounded-full shadow-2xl font-bold z-[60] text-sm whitespace-nowrap">{toast}</motion.div>}</AnimatePresence>
    </div>
  );
}
