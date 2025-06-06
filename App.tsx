import { useEffect, useRef, useState } from 'react';
import './App.css';

// Game constants
const PADDLE_HEIGHT = 100;
const PADDLE_WIDTH = 10;
const BALL_SIZE = 20;
const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const WINNING_SCORE = 11;

// Ball types
const BALL_TYPES = {
  WHITE: 'white',
  CLOUD: '⛈️',
  CAT: '😼'
};

// Difficulty levels
const DIFFICULTY_LEVELS = {
  EASY: 'Easy',
  MEDIUM: 'Medium',
  HARD: 'Hard'
};

// Game modes
const GAME_MODES = {
  PLAYER_VS_AI: 'Player vs AI',
  AI_VS_AI: 'AI vs AI'
};

// Sound effect types
// Using direct string references instead of constants

function App() {
  // Game canvas reference
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Game state
  const [gameStarted, setGameStarted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  
  // Game settings
  const [gameMode, setGameMode] = useState(GAME_MODES.PLAYER_VS_AI);
  const [difficulty, setDifficulty] = useState(DIFFICULTY_LEVELS.MEDIUM);
  const [ballType, setBallType] = useState(BALL_TYPES.CLOUD);
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  // Game objects
  const [ball, setBall] = useState({
    x: GAME_WIDTH / 2,
    y: GAME_HEIGHT / 2,
    dx: 5,
    dy: 5,
    size: BALL_SIZE
  });
  
  const [leftPaddle, setLeftPaddle] = useState({
    x: 0,
    y: GAME_HEIGHT / 2 - PADDLE_HEIGHT / 2,
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT,
    dy: 0,
    score: 0
  });
  
  const [rightPaddle, setRightPaddle] = useState({
    x: GAME_WIDTH - PADDLE_WIDTH,
    y: GAME_HEIGHT / 2 - PADDLE_HEIGHT / 2,
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT,
    dy: 0,
    score: 0
  });
  
  // Audio elements - using Web Audio API instead of HTML Audio elements
  
  // Key states for controls
  const [keys, setKeys] = useState({
    up: false,
    down: false,
    w: false,
    p: false,
    shift: false
  });
  
  // Initialize audio elements
  useEffect(() => {
    
    // Create oscillator-based sounds
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Function to create paddle hit sound
    window.createPaddleHitSound = (pitch = 1000) => {
      if (!soundEnabled) return;
      
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.type = 'square';
      oscillator.frequency.value = pitch;
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
      
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.1);
    };
    
    // Function to create wall hit sound
    window.createWallHitSound = () => {
      if (!soundEnabled) return;
      
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.type = 'square';
      oscillator.frequency.value = 800;
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
      
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.15);
    };
    
    // Function to create score sound
    window.createScoreSound = () => {
      if (!soundEnabled) return;
      
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.type = 'sawtooth';
      oscillator.frequency.value = 400;
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);
      
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 1);
    };
    
    return () => {
      // Clean up audio context
      audioContext.close();
    };
  }, [soundEnabled]);
  
  // Set up keyboard event listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'Up') {
        setKeys(prev => ({ ...prev, up: true }));
      } else if (e.key === 'ArrowDown' || e.key === 'Down') {
        setKeys(prev => ({ ...prev, down: true }));
      } else if (e.key.toLowerCase() === 'w') {
        setKeys(prev => ({ ...prev, w: true }));
      } else if (e.key.toLowerCase() === 'p') {
        setKeys(prev => ({ ...prev, p: true }));
        // Toggle pause
        setPaused(prev => !prev);
      } else if (e.key === 'Shift') {
        setKeys(prev => ({ ...prev, shift: true }));
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'Up') {
        setKeys(prev => ({ ...prev, up: false }));
      } else if (e.key === 'ArrowDown' || e.key === 'Down') {
        setKeys(prev => ({ ...prev, down: false }));
      } else if (e.key.toLowerCase() === 'w') {
        setKeys(prev => ({ ...prev, w: false }));
      } else if (e.key.toLowerCase() === 'p') {
        setKeys(prev => ({ ...prev, p: false }));
      } else if (e.key === 'Shift') {
        setKeys(prev => ({ ...prev, shift: false }));
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);
  
  // Touch controls for mobile
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (gameMode === GAME_MODES.PLAYER_VS_AI) {
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        const relativeY = touch.clientY - rect.top;
        
        // Update paddle position based on touch
        setLeftPaddle(prev => ({
          ...prev,
          y: Math.max(0, Math.min(GAME_HEIGHT - PADDLE_HEIGHT, relativeY - PADDLE_HEIGHT / 2))
        }));
      }
    };
    
    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
    };
    
    canvas.addEventListener('touchmove', handleTouchMove);
    canvas.addEventListener('touchstart', handleTouchStart);
    
    return () => {
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchstart', handleTouchStart);
    };
  }, [gameMode]);
  
  // Game loop
  useEffect(() => {
    if (!gameStarted || paused || gameOver) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const context = canvas.getContext('2d');
    if (!context) return;
    
    const gameLoop = setInterval(() => {
      // Clear canvas
      context.fillStyle = 'black';
      context.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      
      // Update paddle positions based on keyboard input
      if (gameMode === GAME_MODES.PLAYER_VS_AI) {
        const speed = keys.shift ? 10 : 5; // Turbo speed when shift is pressed
        
        // Player 1 controls (left paddle)
        if (keys.w) {
          setLeftPaddle(prev => ({
            ...prev,
            y: Math.max(0, prev.y - speed)
          }));
        }
        
        if (keys.down) {
          setLeftPaddle(prev => ({
            ...prev,
            y: Math.min(GAME_HEIGHT - PADDLE_HEIGHT, prev.y + speed)
          }));
        }
      }
      
      // AI movement for right paddle (always active)
      updateAIPaddle();
      
      // AI movement for left paddle in AI vs AI mode
      if (gameMode === GAME_MODES.AI_VS_AI) {
        updateLeftAIPaddle();
      }
      
      // Update ball position
      updateBall();
      
      // Draw game objects
      drawGame();
      
      // Check for win condition
      checkWinCondition();
    }, 1000 / 60); // 60 FPS
    
    return () => {
      clearInterval(gameLoop);
    };
  }, [gameStarted, paused, gameOver, ball, leftPaddle, rightPaddle, keys, gameMode, difficulty, ballType]);
  
  // Update AI paddle position
  const updateAIPaddle = () => {
    // AI difficulty factors
    let reactionSpeed = 0;
    let errorMargin = 0;
    
    switch (difficulty) {
      case DIFFICULTY_LEVELS.EASY:
        reactionSpeed = 0.02;
        errorMargin = 30;
        break;
      case DIFFICULTY_LEVELS.MEDIUM:
        reactionSpeed = 0.04;
        errorMargin = 15;
        break;
      case DIFFICULTY_LEVELS.HARD:
        reactionSpeed = 0.08;
        errorMargin = 5;
        break;
    }
    
    // Calculate ideal position with error margin
    const idealPosition = ball.y - PADDLE_HEIGHT / 2 + Math.random() * errorMargin - errorMargin / 2;
    
    // Move paddle towards ideal position
    setRightPaddle(prev => {
      const targetY = Math.max(0, Math.min(GAME_HEIGHT - PADDLE_HEIGHT, idealPosition));
      const newY = prev.y + (targetY - prev.y) * reactionSpeed;
      return {
        ...prev,
        y: newY
      };
    });
  };
  
  // Update left AI paddle position (for AI vs AI mode)
  const updateLeftAIPaddle = () => {
    // AI difficulty factors (slightly different for left paddle to make it interesting)
    let reactionSpeed = 0;
    let errorMargin = 0;
    
    switch (difficulty) {
      case DIFFICULTY_LEVELS.EASY:
        reactionSpeed = 0.018;
        errorMargin = 35;
        break;
      case DIFFICULTY_LEVELS.MEDIUM:
        reactionSpeed = 0.038;
        errorMargin = 18;
        break;
      case DIFFICULTY_LEVELS.HARD:
        reactionSpeed = 0.075;
        errorMargin = 8;
        break;
    }
    
    // Calculate ideal position with error margin
    const idealPosition = ball.y - PADDLE_HEIGHT / 2 + Math.random() * errorMargin - errorMargin / 2;
    
    // Move paddle towards ideal position
    setLeftPaddle(prev => {
      const targetY = Math.max(0, Math.min(GAME_HEIGHT - PADDLE_HEIGHT, idealPosition));
      const newY = prev.y + (targetY - prev.y) * reactionSpeed;
      return {
        ...prev,
        y: newY
      };
    });
  };
  
  // Update ball position and handle collisions
  const updateBall = () => {
    // Update ball position
    setBall(prev => {
      let newX = prev.x + prev.dx;
      let newY = prev.y + prev.dy;
      let newDx = prev.dx;
      let newDy = prev.dy;
      
      // Wall collision (top and bottom)
      if (newY <= 0 || newY + prev.size >= GAME_HEIGHT) {
        newDy = -newDy;
        newY = newY <= 0 ? 0 : GAME_HEIGHT - prev.size;
        
        // Play wall hit sound
        if (window.createWallHitSound) {
          window.createWallHitSound();
        }
      }
      
      // Paddle collision (left paddle)
      if (
        newX <= leftPaddle.x + leftPaddle.width &&
        newY + prev.size >= leftPaddle.y &&
        newY <= leftPaddle.y + leftPaddle.height &&
        prev.dx < 0
      ) {
        // Calculate hit position on paddle (0 to 1)
        const hitPosition = (newY + prev.size / 2 - leftPaddle.y) / leftPaddle.height;
        
        // Adjust angle based on hit position
        const angle = (hitPosition - 0.5) * Math.PI / 3; // -30 to +30 degrees
        
        // Calculate new velocity
        const speed = Math.sqrt(newDx * newDx + newDy * newDy) * 1.05; // Slight speed increase
        newDx = speed * Math.cos(angle);
        newDy = speed * Math.sin(angle);
        
        // Ensure ball moves right
        if (newDx < 0) newDx = -newDx;
        
        // Adjust position to prevent sticking
        newX = leftPaddle.x + leftPaddle.width;
        
        // Play paddle hit sound with pitch based on hit position
        if (window.createPaddleHitSound) {
          const pitch = 800 + hitPosition * 400; // 800-1200 Hz
          window.createPaddleHitSound(pitch);
        }
      }
      
      // Paddle collision (right paddle)
      if (
        newX + prev.size >= rightPaddle.x &&
        newY + prev.size >= rightPaddle.y &&
        newY <= rightPaddle.y + rightPaddle.height &&
        prev.dx > 0
      ) {
        // Calculate hit position on paddle (0 to 1)
        const hitPosition = (newY + prev.size / 2 - rightPaddle.y) / rightPaddle.height;
        
        // Adjust angle based on hit position
        const angle = (hitPosition - 0.5) * Math.PI / 3; // -30 to +30 degrees
        
        // Calculate new velocity
        const speed = Math.sqrt(newDx * newDx + newDy * newDy) * 1.05; // Slight speed increase
        newDx = -speed * Math.cos(angle);
        newDy = speed * Math.sin(angle);
        
        // Ensure ball moves left
        if (newDx > 0) newDx = -newDx;
        
        // Adjust position to prevent sticking
        newX = rightPaddle.x - prev.size;
        
        // Play paddle hit sound with pitch based on hit position
        if (window.createPaddleHitSound) {
          const pitch = 800 + hitPosition * 400; // 800-1200 Hz
          window.createPaddleHitSound(pitch);
        }
      }
      
      // Score (ball goes past paddles)
      if (newX < 0) {
        // Right player scores
        setRightPaddle(prev => ({
          ...prev,
          score: prev.score + 1
        }));
        
        // Reset ball
        newX = GAME_WIDTH / 2;
        newY = GAME_HEIGHT / 2;
        newDx = 5;
        newDy = (Math.random() * 6) - 3;
        
        // Play score sound
        if (window.createScoreSound) {
          window.createScoreSound();
        }
      } else if (newX + prev.size > GAME_WIDTH) {
        // Left player scores
        setLeftPaddle(prev => ({
          ...prev,
          score: prev.score + 1
        }));
        
        // Reset ball
        newX = GAME_WIDTH / 2;
        newY = GAME_HEIGHT / 2;
        newDx = -5;
        newDy = (Math.random() * 6) - 3;
        
        // Play score sound
        if (window.createScoreSound) {
          window.createScoreSound();
        }
      }
      
      return {
        ...prev,
        x: newX,
        y: newY,
        dx: newDx,
        dy: newDy
      };
    });
  };
  
  // Draw game objects
  const drawGame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const context = canvas.getContext('2d');
    if (!context) return;
    
    // Clear canvas
    context.fillStyle = 'black';
    context.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    
    // Draw center line
    context.strokeStyle = 'white';
    context.setLineDash([10, 15]);
    context.beginPath();
    context.moveTo(GAME_WIDTH / 2, 0);
    context.lineTo(GAME_WIDTH / 2, GAME_HEIGHT);
    context.stroke();
    context.setLineDash([]);
    
    // Draw paddles
    context.fillStyle = 'white';
    context.fillRect(leftPaddle.x, leftPaddle.y, leftPaddle.width, leftPaddle.height);
    context.fillRect(rightPaddle.x, rightPaddle.y, rightPaddle.width, rightPaddle.height);
    
    // Draw ball
    if (ballType === BALL_TYPES.WHITE) {
      context.fillStyle = 'white';
      context.fillRect(ball.x, ball.y, ball.size, ball.size);
    } else {
      // Draw emoji ball
      context.font = `${ball.size}px Arial`;
      context.fillText(ballType, ball.x, ball.y + ball.size);
    }
    
    // Draw score
    context.fillStyle = 'white';
    context.font = '60px Arial';
    context.textAlign = 'center';
    context.fillText(leftPaddle.score.toString(), GAME_WIDTH / 4, 80);
    context.fillText(rightPaddle.score.toString(), (GAME_WIDTH / 4) * 3, 80);
    
    // Draw pause indicator if game is paused
    if (paused) {
      context.fillStyle = 'rgba(0, 0, 0, 0.5)';
      context.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      context.fillStyle = 'white';
      context.
(Content truncated due to size limit. Use line ranges to read in chunks)