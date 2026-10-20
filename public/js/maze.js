/**
 * Endless Maze Exploration Animation
 * A clean, single point continuously navigates an endless labyrinth.
 * - Starts at a random location on each page load/refresh.
 * - No start or end points.
 * - No path or trail drawn behind the point.
 * - No particle or glow effects on the point (pure crisp point).
 * - The maze has no exit; the point explores endlessly and backtracks from dead ends.
 */

(function () {
  'use strict';

  const canvas = document.getElementById('mazeCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let width = 0;
  let height = 0;
  let dpr = 1;

  // Grid Configuration - Large Expansive Labyrinth Map (Dense, intricate corridors)
  let cellSize = 24;
  let cols = 0;
  let rows = 0;
  let grid = [];

  // Point Explorer State
  let currentPos = { x: 0, y: 0 };
  let currentCell = { col: 0, row: 0 };
  let targetCell = { col: 0, row: 0 };
  let moveProgress = 1;
  const MOVE_SPEED = 0.025; // Gentle, slow ambient exploration pace

  // Navigation memory (allows deep exploration across thousands of cells)
  let pathStack = [];
  let recentVisited = [];
  const MAX_RECENT = 260;

  // Styling tailored to Rich Midnight Dark Blue Cyber Palette
  const BG_COLOR = '#0a1945';
  const WALL_COLOR = 'rgba(125, 175, 235, 0.18)';
  const WALL_WIDTH = 1.3;
  const POINT_COLOR = '#f97316';
  const POINT_RADIUS = 3.2;

  /**
   * Cell Factory
   */
  function createCell(c, r) {
    return {
      col: c,
      row: r,
      walls: { top: true, right: true, bottom: true, left: true },
      visitedGen: false,
    };
  }

  /**
   * Generate an Intricate Labyrinth with Organic Loops
   */
  function generateMaze() {
    grid = [];
    for (let r = 0; r < rows; r++) {
      grid[r] = [];
      for (let c = 0; c < cols; c++) {
        grid[r][c] = createCell(c, r);
      }
    }

    const genStack = [];
    const root = grid[0][0];
    root.visitedGen = true;
    genStack.push(root);

    while (genStack.length > 0) {
      const current = genStack[genStack.length - 1];
      const neighbors = getUnvisitedGenNeighbors(current.col, current.row);

      if (neighbors.length > 0) {
        const next = neighbors[Math.floor(Math.random() * neighbors.length)];
        removeWalls(current, next);
        next.visitedGen = true;
        genStack.push(next);
      } else {
        genStack.pop();
      }
    }

    // Add 15% extra interconnected loops so the maze has continuous pathways and no dead locks
    const loopPassages = Math.floor(cols * rows * 0.15);
    for (let i = 0; i < loopPassages; i++) {
      const r = Math.floor(Math.random() * (rows - 2)) + 1;
      const c = Math.floor(Math.random() * (cols - 2)) + 1;
      const cellA = grid[r][c];
      const cellB = Math.random() > 0.5 ? grid[r + 1][c] : grid[r][c + 1];
      if (cellA && cellB) {
        removeWalls(cellA, cellB);
      }
    }

    // Outer boundary walls remain strictly solid
    for (let c = 0; c < cols; c++) {
      grid[0][c].walls.top = true;
      grid[rows - 1][c].walls.bottom = true;
    }
    for (let r = 0; r < rows; r++) {
      grid[r][0].walls.left = true;
      grid[r][cols - 1].walls.right = true;
    }
  }

  function getUnvisitedGenNeighbors(c, r) {
    const list = [];
    if (r > 0 && !grid[r - 1][c].visitedGen) list.push(grid[r - 1][c]);
    if (c < cols - 1 && !grid[r][c + 1].visitedGen) list.push(grid[r][c + 1]);
    if (r < rows - 1 && !grid[r + 1][c].visitedGen) list.push(grid[r + 1][c]);
    if (c > 0 && !grid[r][c - 1].visitedGen) list.push(grid[r][c - 1]);
    return list;
  }

  function removeWalls(a, b) {
    const dc = a.col - b.col;
    const dr = a.row - b.row;

    if (dc === 1) {
      a.walls.left = false;
      b.walls.right = false;
    } else if (dc === -1) {
      a.walls.right = false;
      b.walls.left = false;
    }

    if (dr === 1) {
      a.walls.top = false;
      b.walls.bottom = false;
    } else if (dr === -1) {
      a.walls.bottom = false;
      b.walls.top = false;
    }
  }

  /**
   * Helper: Get open corridor neighbors of a cell
   */
  function getOpenNeighbors(c, r) {
    const cell = grid[r][c];
    const list = [];
    if (!cell.walls.top && r > 0) list.push({ col: c, row: r - 1 });
    if (!cell.walls.right && c < cols - 1) list.push({ col: c + 1, row: r });
    if (!cell.walls.bottom && r < rows - 1) list.push({ col: c, row: r + 1 });
    if (!cell.walls.left && c > 0) list.push({ col: c - 1, row: r });
    return list;
  }

  /**
   * Spawn Point at a Completely Random Place on each refresh/start
   */
  function spawnRandomPoint() {
    const randCol = Math.floor(Math.random() * (cols - 2)) + 1;
    const randRow = Math.floor(Math.random() * (rows - 2)) + 1;

    currentCell = { col: randCol, row: randRow };
    targetCell = { col: randCol, row: randRow };

    currentPos = {
      x: randCol * cellSize + cellSize / 2,
      y: randRow * cellSize + cellSize / 2,
    };

    pathStack = [];
    recentVisited = [`${randCol},${randRow}`];
    moveProgress = 1;

    chooseNextStep();
  }

  /**
   * Choose next corridor: explore new branches or backtrack from dead ends
   */
  function chooseNextStep() {
    const c = currentCell.col;
    const r = currentCell.row;

    recentVisited.push(`${c},${r}`);
    if (recentVisited.length > MAX_RECENT) {
      recentVisited.shift();
    }

    const available = getOpenNeighbors(c, r);
    if (available.length === 0) return;

    // Filter for corridors not visited recently
    const unvisited = available.filter(
      (n) => !recentVisited.includes(`${n.col},${n.row}`)
    );

    if (unvisited.length > 0) {
      // Explore forward into an unvisited branch
      const next = unvisited[Math.floor(Math.random() * unvisited.length)];
      pathStack.push({ col: c, row: r });
      targetCell = next;
      moveProgress = 0;
    } else if (pathStack.length > 0) {
      // Dead End! Smoothly backtrack along previous corridor branch
      targetCell = pathStack.pop();
      moveProgress = 0;
    } else {
      // Random open corridor to keep endless motion flowing
      const next = available[Math.floor(Math.random() * available.length)];
      targetCell = next;
      moveProgress = 0;
    }
  }

  /**
   * Update: Move the point smoothly along the corridor
   */
  function update() {
    moveProgress += MOVE_SPEED;

    const startX = currentCell.col * cellSize + cellSize / 2;
    const startY = currentCell.row * cellSize + cellSize / 2;
    const destX = targetCell.col * cellSize + cellSize / 2;
    const destY = targetCell.row * cellSize + cellSize / 2;

    currentPos.x = startX + (destX - startX) * moveProgress;
    currentPos.y = startY + (destY - startY) * moveProgress;

    if (moveProgress >= 1) {
      currentPos.x = destX;
      currentPos.y = destY;
      currentCell = { ...targetCell };
      moveProgress = 1;
      chooseNextStep();
    }
  }

  /**
   * Draw: Clean maze walls and ONLY the pure, crisp moving point
   * - No start point
   * - No end point
   * - No path trail/line
   * - No glowing aura or particle effects
   */
  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, width, height);

    // 1. Draw Maze Walls
    ctx.strokeStyle = WALL_COLOR;
    ctx.lineWidth = WALL_WIDTH;
    ctx.lineCap = 'round';

    ctx.beginPath();
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cell = grid[r][c];
        const x = c * cellSize;
        const y = r * cellSize;

        if (cell.walls.top) {
          ctx.moveTo(x, y);
          ctx.lineTo(x + cellSize, y);
        }
        if (cell.walls.right) {
          ctx.moveTo(x + cellSize, y);
          ctx.lineTo(x + cellSize, y + cellSize);
        }
        if (cell.walls.bottom) {
          ctx.moveTo(x, y + cellSize);
          ctx.lineTo(x + cellSize, y + cellSize);
        }
        if (cell.walls.left) {
          ctx.moveTo(x, y);
          ctx.lineTo(x, y + cellSize);
        }
      }
    }
    ctx.stroke();

    // 2. Draw Clean Point Only (No aura, no trail line, no particles)
    ctx.beginPath();
    ctx.arc(currentPos.x, currentPos.y, POINT_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = POINT_COLOR;
    ctx.fill();
  }

  /**
   * Viewport Resize & Adaptation
   */
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;

    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';

    if (width < 600) {
      cellSize = 20;
    } else if (width < 1200) {
      cellSize = 22;
    } else {
      cellSize = 24;
    }

    cols = Math.max(8, Math.floor(width / cellSize));
    rows = Math.max(8, Math.floor(height / cellSize));

    generateMaze();
    spawnRandomPoint();
  }

  /**
   * Main 60FPS Animation Loop
   */
  let animationFrameId = null;
  function loop() {
    update();
    draw();
    animationFrameId = requestAnimationFrame(loop);
  }

  // Handle Resize
  let resizeTimeout = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(resize, 150);
  });

  // Conserve resources when tab is hidden
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
    } else {
      if (!animationFrameId) {
        animationFrameId = requestAnimationFrame(loop);
      }
    }
  });

  // Start on load
  resize();
  loop();
})();
