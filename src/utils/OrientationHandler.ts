export class OrientationManager {
    private static instance: OrientationManager;
    private overlay: HTMLElement | null = null;
    
    private constructor() {}
    
    static getInstance(): OrientationManager {
        if (!OrientationManager.instance) {
            OrientationManager.instance = new OrientationManager();
        }
        return OrientationManager.instance;
    }
    
    async enforceLandscape() {
        if (!/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
            return;
        }
        
        try {
            if (document.documentElement.requestFullscreen) {
                await document.documentElement.requestFullscreen();
            }
            if (screen.orientation && (screen.orientation as any).lock) {
                await (screen.orientation as any).lock('landscape');
            }
        } catch (e) {
            this.createOrientationOverlay();
        }
        
        this.setupOrientationListener();
    }
    
    private createOrientationOverlay() {
        if (this.overlay) return;
        
        this.overlay = document.createElement('div');
        this.overlay.id = 'orientation-overlay';
        this.overlay.innerHTML = `
            <div style="text-align: center; color: white; padding: 20px; font-family: Arial, sans-serif;">
                <svg width="100" height="100" viewBox="0 0 24 24" fill="white" style="margin-bottom: 20px;">
                    <path d="M9.5 2v2h5V2h-5zM7 6v10h10V6H7zm2 2h6v6H9V8zm8 8H7v2h10v-2z"/>
                </svg>
                <h2 style="margin-bottom: 10px;">📱 Please Rotate Your Device</h2>
                <p style="opacity: 0.8; max-width: 300px; margin: 0 auto;">
                    This game is designed for landscape mode. 
                    Please rotate your device horizontally.
                </p>
                <button onclick="document.getElementById('orientation-overlay').style.display='none'" 
                        style="margin-top: 20px; padding: 10px 20px; background: #4CAF50; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    Continue Anyway
                </button>
            </div>
        `;
        
        Object.assign(this.overlay.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            background: 'rgba(0,0,0,0.95)',
            display: 'none',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: '9999',
            flexDirection: 'column',
            backdropFilter: 'blur(5px)'
        });
        
        document.body.appendChild(this.overlay);
    }
    
    private setupOrientationListener() {
        const checkOrientation = () => {
            if (!this.overlay) return;
            
            const isPortrait = window.matchMedia("(orientation: portrait)").matches;
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            
            this.overlay.style.display = (isMobile && isPortrait) ? 'flex' : 'none';
        };
        
        window.matchMedia("(orientation: portrait)").addEventListener('change', checkOrientation);
        checkOrientation();
    }
}
    