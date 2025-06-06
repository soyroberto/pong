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
    j: false,
    k: false
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
      } else if (e.key.toLowerCase() === 'j') {
        setKeys(prev => ({ ...prev, j: true }));
      } else if (e.key.toLowerCase() === 'k') {
        setKeys(prev => ({ ...prev, k: true }));
      } else if (e.key.toLowerCase() === 'p') {
        // Toggle pause (keeping pause functionality with P key)
        setPaused(prev => !prev);
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'Up') {
        setKeys(prev => ({ ...prev, up: false }));
      } else if (e.key === 'ArrowDown' || e.key === 'Down') {
        setKeys(prev => ({ ...prev, down: false }));
      } else if (e.key.toLowerCase() === 'w') {
        setKeys(prev => ({ ...prev, w: false }));
      } else if (e.key.toLowerCase() === 'j') {
        setKeys(prev => ({ ...prev, j: false }));
      } else if (e.key.toLowerCase() === 'k') {
        setKeys(prev => ({ ...prev, k: false }));
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);
  
  // Desktop-only controls - mobile support removed
  
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
        const speed = 5; // Fixed speed (turbo removed)
        
        // Player 1 controls (left paddle)
        // K key or Up arrow for up
        if (keys.k || keys.up) {
          setLeftPaddle(prev => ({
            ...prev,
            y: Math.max(0, prev.y - speed)
          }));
        }
        
        // W or J key or Down arrow for down
        if (keys.w || keys.j || keys.down) {
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
    
    // Clear canvas with black or white (for blinking effect)
    if (blinking) {
      context.fillStyle = 'white';
    } else {
      context.fillStyle = 'black';
    }
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
    
    // Draw right paddle (AI) with robot emoji
    context.fillRect(rightPaddle.x, rightPaddle.y, rightPaddle.width, rightPaddle.height);
    // Add robot emoji to right paddle
    context.font = '20px Arial';
    context.fillText('🤖', rightPaddle.x - 5, rightPaddle.y + PADDLE_HEIGHT / 2 + 5);
    
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
      context.font = '40px Arial';
      context.textAlign = 'center';
      context.fillText('PAUSED', GAME_WIDTH / 2, GAME_HEIGHT / 2);
      context.font = '20px Arial';
      context.fillText('Press P to resume', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 40);
    }
    
    // Draw game over screen
    if (gameOver) {
      context.fillStyle = 'rgba(0, 0, 0, 0.7)';
      context.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      context.fillStyle = 'white';
      context.font = '40px Arial';
      context.textAlign = 'center';
      context.fillText('GAME OVER', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40);
      context.fillText(`${winner} WINS!`, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 20);
      context.font = '20px Arial';
      context.fillText('Click to play again', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 80);
    }
  };
  
  // Blink screen state
  const [blinking, setBlinking] = useState(false);
  const [blinkCount, setBlinkCount] = useState(0);
  
  // Check for win condition
  const checkWinCondition = () => {
    if (leftPaddle.score >= WINNING_SCORE) {
      // Start blinking effect before game over
      if (!blinking && blinkCount === 0) {
        setBlinking(true);
        setBlinkCount(1);
        setTimeout(() => {
          setBlinking(false);
          setTimeout(() => {
            setBlinking(true);
            setBlinkCount(2);
            setTimeout(() => {
              setBlinking(false);
              setTimeout(() => {
                setBlinking(true);
                setBlinkCount(3);
                setTimeout(() => {
                  setBlinking(false);
                  setGameOver(true);
                  setWinner('LEFT PLAYER');
                  setGameStarted(false);
                  setBlinkCount(0);
                }, 200);
              }, 200);
            }, 200);
          }, 200);
        }, 200);
      }
    } else if (rightPaddle.score >= WINNING_SCORE) {
      // Start blinking effect before game over
      if (!blinking && blinkCount === 0) {
        setBlinking(true);
        setBlinkCount(1);
        setTimeout(() => {
          setBlinking(false);
          setTimeout(() => {
            setBlinking(true);
            setBlinkCount(2);
            setTimeout(() => {
              setBlinking(false);
              setTimeout(() => {
                setBlinking(true);
                setBlinkCount(3);
                setTimeout(() => {
                  setBlinking(false);
                  setGameOver(true);
                  setWinner('RIGHT PLAYER');
                  setGameStarted(false);
                  setBlinkCount(0);
                }, 200);
              }, 200);
            }, 200);
          }, 200);
        }, 200);
      }
    }
  };
  
  // Start game
  const startGame = () => {
    // Reset game state
    setBall({
      x: GAME_WIDTH / 2,
      y: GAME_HEIGHT / 2,
      dx: 5 * (Math.random() > 0.5 ? 1 : -1),
      dy: (Math.random() * 6) - 3,
      size: BALL_SIZE
    });
    
    setLeftPaddle({
      x: 0,
      y: GAME_HEIGHT / 2 - PADDLE_HEIGHT / 2,
      width: PADDLE_WIDTH,
      height: PADDLE_HEIGHT,
      dy: 0,
      score: 0
    });
    
    setRightPaddle({
      x: GAME_WIDTH - PADDLE_WIDTH,
      y: GAME_HEIGHT / 2 - PADDLE_HEIGHT / 2,
      width: PADDLE_WIDTH,
      height: PADDLE_HEIGHT,
      dy: 0,
      score: 0
    });
    
    setGameStarted(true);
    setPaused(false);
    setGameOver(false);
    setWinner(null);
  };
  
  // Handle canvas click (for restarting game)
  const handleCanvasClick = () => {
    if (gameOver) {
      startGame();
    }
  };
  
  // Handle game mode change
  const handleGameModeChange = (mode: string) => {
    setGameMode(mode);
    // Reset game when changing mode
    if (gameStarted) {
      startGame();
    }
  };
  
  // Handle difficulty change
  const handleDifficultyChange = (level: string) => {
    setDifficulty(level);
  };
  
  // Handle ball type change
  const handleBallTypeChange = (type: string) => {
    setBallType(type);
  };
  
  // Handle sound toggle
  const handleSoundToggle = () => {
    setSoundEnabled(prev => !prev);
  };
  
  // Render game
  return (
    <div className="pong-game">
      <h1>PONG</h1>
      
      {/* Game settings */}
      <div className="game-settings">
        <div className="setting">
          <label>Game Mode:</label>
          <select 
            value={gameMode} 
            onChange={(e) => handleGameModeChange(e.target.value)}
            disabled={gameStarted && !gameOver}
          >
            <option value={GAME_MODES.PLAYER_VS_AI}>Player vs AI</option>
            <option value={GAME_MODES.AI_VS_AI}>AI vs AI</option>
          </select>
        </div>
        
        <div className="setting">
          <label>Difficulty:</label>
          <select 
            value={difficulty} 
            onChange={(e) => handleDifficultyChange(e.target.value)}
          >
            <option value={DIFFICULTY_LEVELS.EASY}>Easy</option>
            <option value={DIFFICULTY_LEVELS.MEDIUM}>Medium</option>
            <option value={DIFFICULTY_LEVELS.HARD}>Hard</option>
          </select>
        </div>
        
        <div className="setting">
          <label>Ball Type:</label>
          <select 
            value={ballType} 
            onChange={(e) => handleBallTypeChange(e.target.value)}
          >
            <option value={BALL_TYPES.WHITE}>White Ball</option>
            <option value={BALL_TYPES.CLOUD}>Cloud (⛈️)</option>
            <option value={BALL_TYPES.CAT}>Cat (😼)</option>
          </select>
        </div>
        
        <div className="setting">
          <label>Sound:</label>
          <button onClick={handleSoundToggle}>
            {soundEnabled ? 'On' : 'Off'}
          </button>
        </div>
      </div>
      
      {/* Game canvas */}
      <canvas
        ref={canvasRef}
        width={GAME_WIDTH}
        height={GAME_HEIGHT}
        onClick={handleCanvasClick}
        className="game-canvas"
      />
      
      {/* Game controls */}
      {!gameStarted && !gameOver && (
        <div className="game-start">
          <button onClick={startGame}>Start Game</button>
        </div>
      )}
      
      {/* Game instructions */}
      <div className="game-instructions">
        <h2>Controls:</h2>
        <p>Move Up: Arrow Up</p>
        <p>Move Down: Arrow Down</p>
         <p>Hecho por Roberto + Manus </p>
      </div>
    </div>
  );
}

// Add window type declaration
declare global {
  interface Window {
    createPaddleHitSound: (pitch?: number) => void;
    createWallHitSound: () => void;
    createScoreSound: () => void;
  }
}

export default App;
