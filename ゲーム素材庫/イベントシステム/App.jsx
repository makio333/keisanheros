import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Play, Copy, X, Image as ImageIcon, ChevronRight, MessageSquare, Settings2, Menu, PanelLeftClose, Download, Upload, Smile } from 'lucide-react';

// --- スタイル定義 ---
const customStyles = `
  /* 登場アニメーション */
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes slideInLeft { from { transform: translateX(-30px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
  @keyframes slideInRight { from { transform: translateX(30px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
  @keyframes popIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
  
  .anim-fade { animation: fadeIn 0.4s ease-out forwards; }
  .anim-slideL { animation: slideInLeft 0.4s ease-out forwards; }
  .anim-slideR { animation: slideInRight 0.4s ease-out forwards; }
  .anim-pop { animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
  .anim-none { opacity: 1; }

  /* 感情表現(アクション)アニメーション */
  @keyframes animJump { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-30px); } }
  @keyframes animShake { 0%, 100% { transform: rotate(0deg); } 25% { transform: rotate(-8deg); } 75% { transform: rotate(8deg); } }
  @keyframes animBounce { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.1, 0.9); } }
  @keyframes animNod { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(15px); } }
  @keyframes animTremble { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-3px); } 75% { transform: translateX(3px); } }

  .emotion-jump { animation: animJump 0.3s ease-in-out 2; transform-origin: bottom center; }
  .emotion-shake { animation: animShake 0.15s ease-in-out 4; transform-origin: bottom center; }
  .emotion-bounce { animation: animBounce 0.3s ease-in-out 2; transform-origin: bottom center; }
  .emotion-nod { animation: animNod 0.3s ease-in-out 2; transform-origin: bottom center; }
  .emotion-tremble { animation: animTremble 0.1s linear 6; }
  .emotion-none { }
  
  /* スクロールバー装飾 */
  .custom-scrollbar::-webkit-scrollbar { width: 8px; }
  .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
  .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
`;

// --- ユーティリティ ---
const generateId = () => Math.random().toString(36).substr(2, 9);

// --- 初期データ ---
const initialData = [
  {
    id: generateId(),
    title: 'オープニング',
    events: [
      { id: generateId(), name: '勇者', text: 'ここは...どこだ？\n頭が痛い...', image: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Hero', position: 'left', animation: 'fade', emotion: 'shake' },
      { id: generateId(), name: '妖精', text: 'ここだよー！下、下！', image: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Fairy', position: 'right', animation: 'pop', emotion: 'jump' },
      { id: generateId(), name: '勇者', text: 'うわっ！びっくりした！', image: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Hero', position: 'left', animation: 'none', emotion: 'bounce' },
    ]
  },
  {
    id: generateId(),
    title: '町への到着',
    events: [
      { id: generateId(), name: '村人', text: 'おや、見ない顔だね。', image: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Villager', position: 'left', animation: 'slideL', emotion: 'nod' }
    ]
  }
];

export default function App() {
  const [groups, setGroups] = useState(initialData);
  const [activeGroupId, setActiveGroupId] = useState(initialData[0].id);
  const [previewMode, setPreviewMode] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const textareaRefs = useRef({});
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (window.innerWidth >= 768) setIsSidebarOpen(true);
  }, []);

  const activeGroup = groups.find(g => g.id === activeGroupId) || groups[0];

  // --- グループ・イベント操作 ---
  const addGroup = () => {
    const newGroup = { id: generateId(), title: '新しいイベント', events: [] };
    setGroups([...groups, newGroup]);
    setActiveGroupId(newGroup.id);
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  const updateGroupTitle = (id, newTitle) => {
    setGroups(groups.map(g => g.id === id ? { ...g, title: newTitle } : g));
  };

  const deleteGroup = (id) => {
    if (groups.length === 1) return;
    const newGroups = groups.filter(g => g.id !== id);
    setGroups(newGroups);
    if (activeGroupId === id) setActiveGroupId(newGroups[0].id);
  };

  const addEvent = (index = activeGroup.events.length, templateEvent = null) => {
    // テンプレートがない場合の初期値に emotion: 'none' を追加
    const newEvent = templateEvent ? { ...templateEvent, id: generateId(), text: '' } : {
      id: generateId(), name: '', text: '', image: '', position: 'left', animation: 'fade', emotion: 'none'
    };
    const newEvents = [...activeGroup.events];
    newEvents.splice(index, 0, newEvent);
    setGroups(groups.map(g => g.id === activeGroupId ? { ...g, events: newEvents } : g));
    
    setTimeout(() => {
      if (textareaRefs.current[newEvent.id]) textareaRefs.current[newEvent.id].focus();
    }, 50);
  };

  const updateEvent = (eventId, field, value) => {
    setGroups(groups.map(g => {
      if (g.id !== activeGroupId) return g;
      return { ...g, events: g.events.map(e => e.id === eventId ? { ...e, [field]: value } : e) };
    }));
  };

  const deleteEvent = (eventId) => {
    setGroups(groups.map(g => {
      if (g.id !== activeGroupId) return g;
      return { ...g, events: g.events.filter(e => e.id !== eventId) };
    }));
  };

  const cloneEvent = (index) => addEvent(index + 1, activeGroup.events[index]);

  const handleTextareaKeyDown = (e, eventId, index) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      const text = activeGroup.events[index].text;
      if (text.endsWith('\n')) {
        e.preventDefault();
        updateEvent(eventId, 'text', text.slice(0, -1));
        addEvent(index + 1, activeGroup.events[index]);
      }
    }
  };

  const startPreview = () => {
    if (activeGroup.events.length === 0) return alert("プレビューするイベントがありません");
    setPreviewIndex(0);
    setPreviewMode(true);
  };

  const nextPreview = () => {
    if (previewIndex < activeGroup.events.length - 1) {
      setPreviewIndex(prev => prev + 1);
    } else {
      setPreviewMode(false);
    }
  };

  // --- エクスポート / インポート操作 ---
  const exportData = () => {
    const dataStr = JSON.stringify(groups, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'event_data.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedData = JSON.parse(event.target.result);
        if (Array.isArray(importedData) && importedData.length > 0 && importedData[0].id) {
          // 古いデータ形式の互換性維持のため、emotionプロパティがない場合は'none'を追加
          const processedData = importedData.map(group => ({
            ...group,
            events: group.events.map(ev => ({ ...ev, emotion: ev.emotion || 'none' }))
          }));
          setGroups(processedData);
          setActiveGroupId(processedData[0].id);
        } else {
          alert('無効なデータ形式です。');
        }
      } catch (error) {
        alert('ファイルの読み込みに失敗しました。正しいJSONファイルを選択してください。');
      }
      e.target.value = null;
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 font-sans overflow-hidden relative">
      <style>{customStyles}</style>
      <input type="file" accept=".json" ref={fileInputRef} onChange={handleFileChange} className="hidden" />

      {/* サイドバー背景オーバーレイ */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-30 md:hidden backdrop-blur-sm transition-opacity" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* 左サイドバー */}
      <div className={`fixed inset-y-0 left-0 z-40 bg-white border-r border-slate-200 flex flex-col shadow-2xl md:shadow-none transform transition-all duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0 w-64 opacity-100' : '-translate-x-full w-64 md:translate-x-0 md:w-0 md:opacity-0 md:overflow-hidden md:border-none'}`}>
        <div className="p-4 border-b border-slate-200 bg-slate-100 flex items-center justify-between shrink-0">
          <h1 className="font-bold text-slate-700 flex items-center gap-2 whitespace-nowrap">
            <MessageSquare size={18} /> イベントリスト
          </h1>
          <div className="flex items-center gap-1">
            <button onClick={addGroup} className="p-1 hover:bg-slate-200 rounded text-slate-600 transition" title="新しいグループ"><Plus size={18} /></button>
            <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-1 hover:bg-slate-200 rounded text-slate-600 transition"><X size={18} /></button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
          {groups.map((group) => (
            <div key={group.id} className={`group flex items-center justify-between p-3 mb-1 rounded-md cursor-pointer transition-colors ${activeGroupId === group.id ? 'bg-blue-50 border border-blue-200 text-blue-700' : 'hover:bg-slate-100 border border-transparent'}`} onClick={() => { setActiveGroupId(group.id); if (window.innerWidth < 768) setIsSidebarOpen(false); }}>
              <div className="truncate flex-1 font-medium text-sm">{group.title || '無題のイベント'}</div>
              <button onClick={(e) => { e.stopPropagation(); deleteGroup(group.id); }} className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 transition"><Trash2 size={16} /></button>
            </div>
          ))}
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="flex-1 flex flex-col bg-slate-50 relative min-w-0">
        <div className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-3 md:px-6 shadow-sm z-10 shrink-0">
          <div className="flex items-center gap-2 overflow-hidden flex-1">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-100 rounded-md text-slate-600 transition shrink-0">
              {isSidebarOpen ? <PanelLeftClose size={20} /> : <Menu size={20} />}
            </button>
            <input type="text" value={activeGroup.title} onChange={(e) => updateGroupTitle(activeGroupId, e.target.value)} className="text-lg md:text-xl font-bold bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 outline-none px-1 py-0.5 transition w-full min-w-0" placeholder="タイトル" />
          </div>

          <div className="flex items-center gap-1 md:gap-2 shrink-0 ml-2">
            <button onClick={exportData} className="flex items-center gap-1.5 p-2 md:px-3 md:py-2 text-slate-600 hover:bg-slate-100 hover:text-blue-600 rounded-md font-medium transition" title="データを保存 (JSON)">
              <Download size={18} /><span className="hidden lg:inline text-sm">エクスポート</span>
            </button>
            <button onClick={handleImportClick} className="flex items-center gap-1.5 p-2 md:px-3 md:py-2 text-slate-600 hover:bg-slate-100 hover:text-blue-600 rounded-md font-medium transition" title="データを読み込み (JSON)">
              <Upload size={18} /><span className="hidden lg:inline text-sm">インポート</span>
            </button>
            <button onClick={startPreview} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 md:px-4 py-2 rounded-md font-medium transition shadow-sm ml-1">
              <Play size={18} fill="currentColor" /><span className="hidden md:inline">プレビュー開始</span>
            </button>
          </div>
        </div>

        {/* イベントリスト編集エリア */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 md:p-6 space-y-4">
          {activeGroup.events.map((event, index) => (
            <div key={event.id} className="bg-white border border-slate-200 rounded-xl shadow-sm p-3 md:p-4 relative group hover:border-slate-300 transition-colors">
              <div className="absolute -left-2 -top-2 md:-left-3 md:top-4 bg-slate-200 text-slate-500 text-xs font-bold px-2 py-1 rounded-full border border-white z-10 shadow-sm">
                #{index + 1}
              </div>
              
              <div className="flex flex-col md:flex-row items-start gap-3 md:gap-4 mt-2 md:mt-0">
                <div className="flex flex-row md:flex-col items-center gap-3 w-full md:w-20 shrink-0 bg-slate-50 md:bg-transparent p-2 md:p-0 rounded-lg">
                  <div className="w-14 h-14 md:w-16 md:h-16 rounded-lg bg-white md:bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                    {event.image ? <img src={event.image} alt="立ち絵" className="w-full h-full object-contain" /> : <ImageIcon size={20} className="text-slate-400" />}
                  </div>
                  <select value={event.position} onChange={(e) => updateEvent(event.id, 'position', e.target.value)} className="text-xs bg-white md:bg-slate-100 border md:border-none border-slate-200 rounded p-1.5 w-full text-center outline-none focus:ring-2 ring-blue-500 cursor-pointer">
                    <option value="left">左配置</option>
                    <option value="right">右配置</option>
                  </select>
                </div>

                <div className="flex-1 w-full space-y-2 md:space-y-3">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input type="text" value={event.name} onChange={(e) => updateEvent(event.id, 'name', e.target.value)} placeholder="キャラクター名" className="w-full sm:w-1/4 bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-sm font-medium outline-none focus:border-blue-500 focus:bg-white transition" />
                    
                    <div className="flex w-full sm:w-3/4 gap-2">
                      <div className="w-1/2 relative flex items-center">
                        <Settings2 size={16} className="absolute left-3 text-slate-400" />
                        <select value={event.animation} onChange={(e) => updateEvent(event.id, 'animation', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-md pl-9 pr-3 py-1.5 text-sm outline-none focus:border-blue-500 focus:bg-white transition appearance-none cursor-pointer" title="登場時のアニメーション">
                          <option value="none">登場：なし</option>
                          <option value="fade">登場：フェードイン</option>
                          <option value="slideL">登場：左から</option>
                          <option value="slideR">登場：右から</option>
                          <option value="pop">登場：ポップイン</option>
                        </select>
                      </div>
                      
                      <div className="w-1/2 relative flex items-center">
                        <Smile size={16} className="absolute left-3 text-slate-400" />
                        <select value={event.emotion || 'none'} onChange={(e) => updateEvent(event.id, 'emotion', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-md pl-9 pr-3 py-1.5 text-sm outline-none focus:border-blue-500 focus:bg-white transition appearance-none cursor-pointer" title="感情表現アニメーション">
                          <option value="none">感情：なし</option>
                          <option value="jump">感情：跳ねる</option>
                          <option value="shake">感情：揺れる</option>
                          <option value="bounce">感情：弾む</option>
                          <option value="nod">感情：頷く</option>
                          <option value="tremble">感情：震える</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <textarea ref={el => textareaRefs.current[event.id] = el} value={event.text} onChange={(e) => updateEvent(event.id, 'text', e.target.value)} onKeyDown={(e) => handleTextareaKeyDown(e, event.id, index)} placeholder="セリフを入力（改行2回で次の枠を追加）" className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm md:text-base outline-none focus:border-blue-500 focus:bg-white transition resize-none custom-scrollbar" rows={3} />

                  <div className="flex items-center gap-2">
                    <ImageIcon size={14} className="text-slate-400 shrink-0" />
                    <input type="text" value={event.image} onChange={(e) => updateEvent(event.id, 'image', e.target.value)} placeholder="立ち絵の画像URL (任意)" className="flex-1 bg-transparent border-b border-slate-200 px-1 py-0.5 text-xs text-slate-500 outline-none focus:border-blue-500 transition min-w-0" />
                  </div>
                </div>

                <div className="flex flex-row md:flex-col justify-end gap-2 shrink-0 md:opacity-0 group-hover:opacity-100 transition-opacity mt-2 md:mt-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                  <button onClick={() => cloneEvent(index)} className="flex items-center gap-1 p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition text-xs" title="複製して下に追加"><Copy size={16} /><span className="md:hidden">複製</span></button>
                  <button onClick={() => deleteEvent(event.id)} className="flex items-center gap-1 p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded transition text-xs" title="削除"><Trash2 size={16} /><span className="md:hidden">削除</span></button>
                </div>
              </div>
            </div>
          ))}
          <button onClick={() => addEvent()} className="w-full py-4 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:text-blue-600 hover:border-blue-400 hover:bg-blue-50 transition flex items-center justify-center gap-2 font-medium"><Plus size={20} /> 新しいイベントを追加</button>
          <div className="h-12"></div>
        </div>
      </div>

      {/* --- プレビューモード --- */}
      {previewMode && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center select-none">
          <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent z-50">
            <div className="text-white font-medium flex items-center gap-2">
              <span className="bg-blue-600 px-2 py-0.5 rounded text-sm">PREVIEW</span>
              <span className="truncate max-w-[200px]">{activeGroup.title}</span> ({previewIndex + 1}/{activeGroup.events.length})
            </div>
            <button onClick={() => setPreviewMode(false)} className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-sm transition"><X size={24} /></button>
          </div>

          <div className="relative w-full max-w-4xl aspect-[16/9] md:aspect-[21/9] bg-slate-900 overflow-hidden shadow-2xl cursor-pointer border border-slate-800" onClick={nextPreview}>
            <div className="absolute inset-0 bg-gradient-to-b from-slate-800 to-slate-900" />
            
            <div className="absolute inset-0 pb-[20%] md:pb-[100px] pointer-events-none">
              {(() => {
                const currentEv = activeGroup.events[previewIndex];
                if (!currentEv.image) return null;
                
                const posClass = currentEv.position === 'left' ? 'left-4 md:left-10' : 'right-4 md:right-10';
                
                // 登場アニメーション用クラス
                const animClass = \`anim-\${currentEv.animation}\`;
                // 感情アニメーション用クラス
                const emotionClass = \`emotion-\${currentEv.emotion || 'none'}\`;

                return (
                  // 外側のdivで「登場」のアニメーションを担当
                  <div key={\`\${currentEv.id}-\${previewIndex}\`} className={\`absolute bottom-0 w-1/2 md:w-1/3 max-w-[300px] h-4/5 flex items-end justify-center \${posClass} \${animClass}\`}>
                    {/* 内側のdivで「感情」のアニメーションを担当することで、動きが衝突しないようにする */}
                    <div className={\`w-full h-full flex items-end justify-center \${emotionClass}\`}>
                      <img src={currentEv.image} alt={currentEv.name} className="max-w-full max-h-full object-contain drop-shadow-2xl" />
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="absolute bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 w-11/12 max-w-3xl min-h-[100px] md:h-36 bg-black/75 backdrop-blur-md border border-white/20 rounded-xl p-4 md:p-6 shadow-xl">
              {activeGroup.events[previewIndex].name && (
                <div className="absolute -top-4 left-4 md:left-6 bg-blue-600 text-white px-3 md:px-4 py-1 md:py-1.5 rounded-md font-bold shadow-lg border border-white/20 text-sm md:text-base">
                  {activeGroup.events[previewIndex].name}
                </div>
              )}
              <div key={\`text-\${previewIndex}\`} className="text-white text-base md:text-lg leading-relaxed whitespace-pre-wrap anim-fade mt-1">
                {activeGroup.events[previewIndex].text}
              </div>
              <div className="absolute bottom-2 right-3 md:bottom-4 md:right-4 text-white/50 animate-pulse flex items-center">
                <ChevronRight size={24} />
              </div>
            </div>
          </div>
          
          <div className="mt-4 text-white/50 text-sm">画面をタップして次へ</div>
        </div>
      )}
    </div>
  );
}
