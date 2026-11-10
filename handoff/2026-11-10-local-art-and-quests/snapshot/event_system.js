const customStyles = `
  .event-player-overlay {
    position: fixed; inset: 0;
    background-color: rgba(0, 0, 0, 0.6);
    z-index: 10000; user-select: none;
    overflow: hidden;
  }
  .event-player-header {
    position: absolute; top: 0; left: 0; right: 0; padding: 16px;
    display: flex; justify-content: space-between; align-items: center;
    background: linear-gradient(to bottom, rgba(0,0,0,0.8), transparent);
    z-index: 10002;
  }
  .event-player-title { color: white; font-weight: bold; font-size: 14px; display: flex; align-items: center; gap: 8px; }
  .event-player-title-badge { background-color: #2563eb; padding: 2px 8px; border-radius: 4px; font-size: 12px; }
  .event-player-skip { background: rgba(255,255,255,0.1); color: white; border: none; border-radius: 50%; width: 40px; height: 40px; font-size: 20px; cursor: pointer; }
  .event-player-skip:hover { background: rgba(255,255,255,0.2); }
  
  .event-player-screen {
    position: absolute; inset: 0; width: 100%; height: 100%;
  }
  .event-player-bg { display: none; }
  
  .event-player-chars { position: absolute; inset: 0; pointer-events: none; z-index: 10000; }
  
  .event-player-char-container {
    position: absolute; bottom: -5vh; /* 少し下にはみ出させることで胸から上を出す */
    width: 60%; height: 95vh;
    display: flex; align-items: flex-end; justify-content: center;
  }
  @media (min-width: 768px) {
    .event-player-char-container { width: 40%; max-width: 700px; height: 90vh; bottom: -5vh; }
  }
  .event-player-char-container.left { left: 5%; }
  @media (min-width: 768px) { .event-player-char-container.left { left: 10%; } }
  .event-player-char-container.right { right: 5%; }
  @media (min-width: 768px) { .event-player-char-container.right { right: 10%; } }
  
  .event-player-char-img { max-width: 100%; max-height: 100%; object-fit: contain; filter: drop-shadow(0 25px 25px rgba(0,0,0,0.5)); }
  
  .event-player-dialog {
    position: absolute; bottom: 24px; left: 50%; transform: translateX(-50%);
    width: 92%; max-width: 800px; min-height: 120px;
    background: rgba(0,0,0,0.85); backdrop-filter: blur(12px);
    border: 1px solid rgba(255,255,255,0.2); border-radius: 12px;
    padding: 20px 24px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5);
    z-index: 10001;
  }
  @media (min-width: 768px) {
    .event-player-dialog { bottom: 40px; height: 160px; padding: 24px 32px; }
  }
  .event-player-name {
    position: absolute; top: -18px; left: 24px;
    background-color: #2563eb; color: white; padding: 6px 20px;
    border-radius: 6px; font-weight: bold; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.3);
    border: 1px solid rgba(255,255,255,0.2);
    font-size: 16px;
  }
  
  .event-player-text { color: white; font-size: 18px; line-height: 1.6; white-space: pre-wrap; margin-top: 4px; }
  @media (min-width: 768px) { .event-player-text { font-size: 22px; } }
  
  .event-player-next-icon {
    position: absolute; bottom: 12px; right: 16px;
    color: rgba(255,255,255,0.6); font-size: 24px; animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
  @media (min-width: 768px) { .event-player-next-icon { bottom: 16px; right: 24px; } }
  
  .event-player-hint { position: absolute; bottom: 4px; left: 50%; transform: translateX(-50%); color: rgba(255,255,255,0.4); font-size: 12px; z-index: 10002; pointer-events: none; }

  /* アニメーション */
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes slideInLeft { from { transform: translateX(-30px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
  @keyframes slideInRight { from { transform: translateX(30px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
  @keyframes popIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
  
  .anim-fade { animation: fadeIn 0.4s ease-out forwards; }
  .anim-slideL { animation: slideInLeft 0.4s ease-out forwards; }
  .anim-slideR { animation: slideInRight 0.4s ease-out forwards; }
  .anim-pop { animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
  .anim-none { opacity: 1; }

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
`;

export function initEventSystem() {
  const style = document.createElement('style');
  style.textContent = customStyles;
  document.head.appendChild(style);
}

export function playEventScene(groupData, onComplete) {
  if (!groupData || !groupData.events || groupData.events.length === 0) {
    if (onComplete) onComplete();
    return;
  }

  let currentIndex = 0;
  const overlay = document.createElement('div');
  overlay.className = 'event-player-overlay';

  const render = () => {
    const currentEv = groupData.events[currentIndex];
    
    let charHtml = '';
    if (currentEv.image) {
      const posClass = currentEv.position === 'left' ? 'left' : 'right';
      const animClass = 'anim-' + (currentEv.animation || 'fade');
      const emotionClass = 'emotion-' + (currentEv.emotion || 'none');
      
      charHtml = `
        <div class="event-player-char-container ${posClass} ${animClass}">
          <div style="width:100%; height:100%; display:flex; align-items:flex-end; justify-content:center;" class="${emotionClass}">
            <img src="${currentEv.image}" class="event-player-char-img" />
          </div>
        </div>
      `;
    }

    const nameHtml = currentEv.name ? `<div class="event-player-name">${currentEv.name}</div>` : '';

    overlay.innerHTML = `
      <div class="event-player-header">
        <div class="event-player-title">
          <span class="event-player-title-badge">EVENT</span>
          <span>${groupData.title || ''} (${currentIndex + 1}/${groupData.events.length})</span>
        </div>
        <button class="event-player-skip" id="event-skip-btn">×</button>
      </div>
      
      <div class="event-player-screen" id="event-screen">
        <div class="event-player-bg"></div>
        <div class="event-player-chars">${charHtml}</div>
        
        <div class="event-player-dialog">
          ${nameHtml}
          <div class="event-player-text anim-fade">${currentEv.text}</div>
          <div class="event-player-next-icon">▶</div>
        </div>
      </div>
      
      <div class="event-player-hint">画面をタップして次へ</div>
    `;

    overlay.querySelector('#event-screen').addEventListener('click', (e) => {
      // If there's an input field or button, don't advance on click
      if (e.target.tagName.toLowerCase() === 'input' || e.target.tagName.toLowerCase() === 'button') {
        return;
      }
      
      if (currentIndex < groupData.events.length - 1) {
        currentIndex++;
        render();
        if (currentIndex === groupData.events.length - 1 && groupData.onLastEvent) {
          groupData.onLastEvent(overlay);
        }
      } else {
        if (!groupData.preventClose) {
          close();
        }
      }
    });

    overlay.querySelector('#event-skip-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      close();
    });
  };

  const close = () => {
    overlay.remove();
    if (onComplete) onComplete();
  };

  document.body.appendChild(overlay);
  render();
  
  // If it's a 1-event scene, trigger onLastEvent immediately
  if (groupData.events.length === 1 && groupData.onLastEvent) {
    groupData.onLastEvent(overlay);
  }
}
