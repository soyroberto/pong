# Pong Game

A classic Pong game implementation with modern features, built with React and TypeScript.

## Features

- Classic Pong look with black background and white paddles
- Three ball options: white ball, cloud emoji (⛈️), and cat emoji (😼)
- Two game modes: Player vs AI and AI vs AI
- Adjustable AI difficulty (Easy, Medium, Hard)
- Sound effects:
  - Paddle hit ("blip") with pitch variation based on hit location
  - Wall hit ("bloop")
  - Score point ("buzz")
- Controls:
  - Keyboard: Up/W for up, Down/P for down, Shift for turbo, P for pause/resume
  - Touch controls for mobile devices in horizontal orientation
- Responsive design that works on both desktop and mobile browsers
- Score tracking with large display
- Game to 11 points

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd pong-game
```

2. Install dependencies:
```bash
pnpm install
```

3. Start the development server:
```bash
pnpm run dev
```

4. Build for production:
```bash
pnpm run build
```

## Deployment

After building the project, you can deploy the contents of the `dist` directory to any static web hosting service.

## Technologies Used

- React
- TypeScript
- Vite
- Tailwind CSS
- Web Audio API for sound effects

## Game Controls

### Desktop:
**-Move Up: Arrow Up**
**-Move Down: Arrow Down**

### Mobile:
- Touch and drag the paddle to move it

## License

This project is available for personal and educational use.
