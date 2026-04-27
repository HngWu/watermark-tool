# Perfected Cryptographic Scanner Synchronization Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate the delay in text illumination by perfectly aligning the CSS mask with the scanning line, and ensure the 8-second positional reshuffling is completely invisible.

**Architecture:** 
1. **Mathematical Alignment:** The `.scan-line` moves from `top: -200px` to `top: 100%`. We will update the `.crypto-mask` to use a `400px` height and the exact same animation range. By using a `to bottom, transparent 0%, black 100%` gradient, the brightest point (black) will be at the bottom edge of the mask, perfectly matching the brightest leading edge of the scanner.
2. **Invisible Reshuffle:** By aligning the mask so it ends its cycle fully off-screen (at `100vh`), the `onAnimationIteration` React event will trigger when no text is visible, making the positional swap 100% seamless.

---

### Task 1: Precision CSS Alignment

**Files:**
- Modify: `packages/frontend/src/index.css`

- [ ] **Step 1: Update .crypto-mask for Instant Leading-Edge Reveal**
Update the CSS mask to match the scanner's leading-edge logic. We'll use 400px for a more satisfying trailing fade.
```css
.crypto-mask {
  -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 100%);
  mask-image: linear-gradient(to bottom, transparent 0%, black 100%);
  -webkit-mask-size: 100% 400px;
  mask-size: 100% 400px;
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
  animation: scan-mask 8s infinite linear;
}

@keyframes scan-mask {
  0% { 
    -webkit-mask-position: 0 -400px; 
    mask-position: 0 -400px;
  }
  100% { 
    -webkit-mask-position: 0 100vh; 
    mask-position: 0 100vh;
  }
}
```

---

### Task 2: Seamless React Synchronization

**Files:**
- Modify: `packages/frontend/src/App.tsx`

- [ ] **Step 1: Ensure Animation Listener Implementation**
The `CryptoBackground` component should use the `onAnimationIteration` event to swap nodes. This ensures that even if the CPU is under load, the swap happens only when the mask is off-screen.
```tsx
const CryptoBackground: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [randomNodes, setRandomNodes] = useState(generateNodes());

  const handleAnimationRestart = () => {
    // This fires exactly when the CSS animation loops
    setRandomNodes(generateNodes());
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (!containerRef.current) return;
      const elements = containerRef.current.querySelectorAll('[data-crypto]');
      const numToScramble = Math.max(1, Math.floor(elements.length * 0.15));
      for (let i = 0; i < numToScramble; i++) {
        const idx = Math.floor(Math.random() * elements.length);
        const el = elements[idx] as HTMLElement;
        const currentLen = el.innerText.length;
        el.innerText = Array.from({ length: currentLen }).map(() => CHARS[Math.floor(Math.random() * CHARS.length)]).join('');
      }
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden pointer-events-none select-none font-mono text-[8px] md:text-[10px] leading-[2.5] whitespace-nowrap z-0 opacity-80">
      <div className="absolute inset-0 opacity-[0.05]">
        {randomNodes.map(node => (
          <span key={`${node.id}-base`} data-crypto className="absolute text-white" style={{ top: node.top, left: node.left }}>
            {node.initial}
          </span>
        ))}
      </div>
      
      {/* Highlight Layer - Leading edge alignment handles the "immediate" illumination */}
      <div 
        className="absolute inset-0 crypto-mask"
        onAnimationIteration={handleAnimationRestart}
      >
        {randomNodes.map(node => (
          <span 
            key={`${node.id}-highlight`} 
            data-crypto 
            className={`absolute ${node.color} font-bold`}
            style={{ 
              top: node.top, 
              left: node.left,
              textShadow: node.color === 'text-white' || node.color === 'text-slate-400' ? '0 0 10px rgba(255,255,255,0.8)' : 'none'
            }}
          >
            {node.initial}
          </span>
        ))}
      </div>
    </div>
  );
};
```

- [ ] **Step 2: Commit**
```bash
git add packages/frontend/src/index.css packages/frontend/src/App.tsx
git commit -m "ui: perfectly align crypto mask leading edge with scanner and ensure invisible reshuffling"
```
