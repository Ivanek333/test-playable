import { easeInOutCubic, Tween, TweenManager } from '../utils/Tween';

export class GameOverlay {
  private overlay: HTMLDivElement;
  private panel: HTMLDivElement;
  private message: HTMLHeadingElement;
  private button: HTMLButtonElement;
  private tweenManager: TweenManager;
  private visible: boolean = false;

  constructor(tweenManager: TweenManager) {
    this.tweenManager = tweenManager;
    
    this.overlay = document.createElement('div');
    this.overlay.className = 'game-overlay';

    this.panel = document.createElement('div');
    this.panel.className = 'overlay-panel';

    this.message = document.createElement('h1');
    this.message.className = 'overlay-message';

    this.button = document.createElement('button');
    this.button.className = 'overlay-button';
    this.button.addEventListener('click', () => {
      console.log('Overlay button clicked:', this.button.textContent);
    });

    this.panel.appendChild(this.message);
    this.panel.appendChild(this.button);
    this.overlay.appendChild(this.panel);
    document.body.appendChild(this.overlay);

    this.injectStyles();
    this.hide();
  }

  private injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .game-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(5px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.3s ease, visibility 0s linear 0.3s;
      }
      .game-overlay.visible {
        opacity: 1;
        visibility: visible;
        transition: opacity 0.3s ease, visibility 0s linear 0s;
      }
      .overlay-panel {
        background: white;
        padding: 2rem 4rem;
        border-radius: 1rem;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        text-align: center;
        transform: translateY(-100vh);
      }
      .overlay-message {
        font-family: 'Georgia', 'Palatino', serif;
        font-size: 3rem;
        margin-bottom: 1rem;
        text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
      }
      .overlay-button {
        font-family: 'Arial', sans-serif;
        font-size: 1.5rem;
        padding: 0.5rem 2rem;
        background: #4CAF50;
        color: white;
        border: none;
        border-radius: 0.5rem;
        cursor: pointer;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        transition: transform 0.1s;
      }
      .overlay-button:hover {
        transform: scale(1.05);
      }
      .overlay-button:active {
        transform: scale(0.95);
      }
    `;
    document.head.appendChild(style);
  }

  public show(type: 'win' | 'lose') {
    if (this.visible) return;
    this.visible = true;

    if (type === 'win') {
      this.message.textContent = 'YOU WON';
      this.message.style.color = '#2e7d32';
      this.button.textContent = 'NEXT LEVEL';
      this.button.style.background = '#2e7d32';
    } else {
      this.message.textContent = 'YOU LOST';
      this.message.style.color = '#c62828';
      this.button.textContent = 'TRY AGAIN';
      this.button.style.background = '#c62828';
    }

    this.overlay.classList.add('visible');
    this.panel.style.transform = 'translateY(-100vh)';

    const startY = -100;
    const targetY = 0;
    const duration = 500;
    const animState = { y: startY }; 

    const tween = new Tween(
      animState,
      { y: startY },
      { y: targetY },
      duration,
      easeInOutCubic,
      (state) => {
        this.panel.style.transform = `translateY(${state.y}vh)`;
      },
      () => {
        this.panel.style.transform = 'translateY(0vh)';
      }
    );
    this.tweenManager.add(tween);
  }

  public hide() {
    if (!this.visible) return;
    this.visible = false;
    this.overlay.classList.remove('visible');
    this.panel.style.transform = 'translateY(-100vh)';
  }
}