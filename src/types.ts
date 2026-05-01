export interface Position {
    x: number;
    y: number;
}

export interface Player {
    position: Position;
    health: number;
    maxHealth: number;
    attack: number;
    defense: number;
    hunger: number;
    maxHunger: number;
    keys: number;
    treasures: number;
    kills: number;
    score: number;
    inventory: Item[];
}

export interface Monster {
    position: Position;
    health: number;
    attack: number;
    defense: number;
}

export enum ItemType {
    POTION = 'potion',
    BOMB = 'bomb',
    TELEPORT = 'teleport'
}

export interface Item {
    type: ItemType;
    name: string;
}

export enum CellType {
    EMPTY = 'empty',
    WALL = 'wall',
    TRAP = 'trap',
    KEY = 'key',
    STAIRS = 'stairs',
    TREASURE = 'treasure'
}

export interface Cell {
    type: CellType;
    item?: Item;
    isPlayerHere: boolean;
    isMonsterHere: boolean;
    trapDamage: number;
}

export interface Floor {
    level: number;
    grid: Cell[][];
    monsters: Monster[];
    player: Player;
    theme: ThemeType;
}

export enum ThemeType {
    CAVE = 'cave',
    GRAVEYARD = 'graveyard',
    TEMPLE = 'temple'
}

export interface GameState {
    currentFloor: Floor;
    maxFloorReached: number;
    totalScore: number;
    isGameOver: boolean;
    theme: ThemeType;
}

export interface HighScores {
    maxFloor: number;
    totalScore: number;
}

export enum Direction {
    UP = 'up',
    DOWN = 'down',
    LEFT = 'left',
    RIGHT = 'right'
}
