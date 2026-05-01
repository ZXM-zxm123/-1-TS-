import { Cell, CellType, Position, Item, ItemType, ThemeType } from './types';

export class MapGenerator {
    private readonly GRID_SIZE: number = 10;
    private readonly WALL_RATIO: number = 0.15;
    private readonly TRAP_RATIO: number = 0.08;
    private readonly ITEM_RATIO: number = 0.05;
    
    private grid: Cell[][];
    private usedPositions: Set<string>;
    private theme: ThemeType;
    
    constructor(theme: ThemeType = ThemeType.CAVE) {
        this.theme = theme;
        this.usedPositions = new Set();
        this.grid = this.initializeGrid();
    }
    
    private initializeGrid(): Cell[][] {
        const grid: Cell[][] = [];
        for (let y = 0; y < this.GRID_SIZE; y++) {
            grid[y] = [];
            for (let x = 0; x < this.GRID_SIZE; x++) {
                grid[y][x] = {
                    type: CellType.EMPTY,
                    isPlayerHere: false,
                    isMonsterHere: false,
                    trapDamage: 0
                };
            }
        }
        return grid;
    }
    
    private getPositionKey(position: Position): string {
        return `${position.x},${position.y}`;
    }
    
    private isPositionAvailable(position: Position): boolean {
        if (position.x < 0 || position.x >= this.GRID_SIZE || 
            position.y < 0 || position.y >= this.GRID_SIZE) {
            return false;
        }
        
        const key = this.getPositionKey(position);
        if (this.usedPositions.has(key)) {
            return false;
        }
        
        if (this.grid[position.y][position.x].type === CellType.WALL) {
            return false;
        }
        
        return true;
    }
    
    private getRandomAvailablePosition(): Position {
        let attempts = 0;
        const maxAttempts = 1000;
        
        while (attempts < maxAttempts) {
            const x = Math.floor(Math.random() * this.GRID_SIZE);
            const y = Math.floor(Math.random() * this.GRID_SIZE);
            const position = { x, y };
            
            if (this.isPositionAvailable(position)) {
                return position;
            }
            attempts++;
        }
        
        throw new Error('无法找到可用位置');
    }
    
    private placeWalls(): void {
        const wallCount = Math.floor(this.GRID_SIZE * this.GRID_SIZE * this.WALL_RATIO);
        
        for (let i = 0; i < wallCount; i++) {
            try {
                const position = this.getRandomAvailablePosition();
                this.grid[position.y][position.x].type = CellType.WALL;
                this.usedPositions.add(this.getPositionKey(position));
            } catch (error) {
                console.warn('无法放置所有墙壁');
                break;
            }
        }
    }
    
    private placeTraps(floorLevel: number): void {
        const trapCount = Math.floor(this.GRID_SIZE * this.GRID_SIZE * this.TRAP_RATIO);
        const baseTrapDamage = 10;
        const trapDamageIncrease = floorLevel * 2;
        const trapDamage = baseTrapDamage + trapDamageIncrease;
        
        for (let i = 0; i < trapCount; i++) {
            try {
                const position = this.getRandomAvailablePosition();
                this.grid[position.y][position.x].type = CellType.TRAP;
                this.grid[position.y][position.x].trapDamage = trapDamage;
                this.usedPositions.add(this.getPositionKey(position));
            } catch (error) {
                console.warn('无法放置所有陷阱');
                break;
            }
        }
    }
    
    private placeItems(): void {
        const itemCount = Math.floor(this.GRID_SIZE * this.GRID_SIZE * this.ITEM_RATIO);
        const itemTypes = [ItemType.POTION, ItemType.BOMB, ItemType.TELEPORT];
        const itemNames = {
            [ItemType.POTION]: '血瓶',
            [ItemType.BOMB]: '炸弹',
            [ItemType.TELEPORT]: '传送'
        };
        
        for (let i = 0; i < itemCount; i++) {
            try {
                const position = this.getRandomAvailablePosition();
                const itemType = itemTypes[Math.floor(Math.random() * itemTypes.length)];
                const item: Item = {
                    type: itemType,
                    name: itemNames[itemType]
                };
                this.grid[position.y][position.x].item = item;
                this.usedPositions.add(this.getPositionKey(position));
            } catch (error) {
                console.warn('无法放置所有道具');
                break;
            }
        }
    }
    
    private placeKey(): Position {
        const position = this.getRandomAvailablePosition();
        this.grid[position.y][position.x].type = CellType.KEY;
        this.usedPositions.add(this.getPositionKey(position));
        return position;
    }
    
    private placeStairs(): Position {
        const position = this.getRandomAvailablePosition();
        this.grid[position.y][position.x].type = CellType.STAIRS;
        this.usedPositions.add(this.getPositionKey(position));
        return position;
    }
    
    private placeTreasure(): Position {
        const position = this.getRandomAvailablePosition();
        this.grid[position.y][position.x].type = CellType.TREASURE;
        this.usedPositions.add(this.getPositionKey(position));
        return position;
    }
    
    public getPlayerStartPosition(): Position {
        let position: Position;
        
        do {
            position = {
                x: Math.floor(Math.random() * this.GRID_SIZE),
                y: Math.floor(Math.random() * this.GRID_SIZE)
            };
        } while (!this.isPositionAvailable(position) || 
                 this.isPositionNearWall(position));
        
        this.usedPositions.add(this.getPositionKey(position));
        return position;
    }
    
    private isPositionNearWall(position: Position): boolean {
        const directions = [
            { x: 0, y: -1 }, { x: 0, y: 1 },
            { x: -1, y: 0 }, { x: 1, y: 0 }
        ];
        
        let wallCount = 0;
        for (const dir of directions) {
            const newX = position.x + dir.x;
            const newY = position.y + dir.y;
            
            if (newX >= 0 && newX < this.GRID_SIZE && 
                newY >= 0 && newY < this.GRID_SIZE) {
                if (this.grid[newY][newX].type === CellType.WALL) {
                    wallCount++;
                }
            }
        }
        
        return wallCount >= 2;
    }
    
    public getMonsterPositions(count: number): Position[] {
        const positions: Position[] = [];
        
        for (let i = 0; i < count; i++) {
            try {
                const position = this.getRandomAvailablePosition();
                positions.push(position);
                this.usedPositions.add(this.getPositionKey(position));
            } catch (error) {
                console.warn('无法放置所有怪物');
                break;
            }
        }
        
        return positions;
    }
    
    public generate(floorLevel: number): { 
        grid: Cell[][], 
        playerStart: Position,
        monsterPositions: Position[]
    } {
        this.grid = this.initializeGrid();
        this.usedPositions = new Set();
        
        this.placeWalls();
        
        const playerStart = this.getPlayerStartPosition();
        
        this.placeTraps(floorLevel);
        this.placeItems();
        this.placeKey();
        this.placeStairs();
        
        if (Math.random() > 0.5) {
            this.placeTreasure();
        }
        
        const baseMonsterCount = 2;
        const monsterCountIncrease = Math.floor(floorLevel / 2);
        const monsterCount = Math.min(baseMonsterCount + monsterCountIncrease, 5);
        const monsterPositions = this.getMonsterPositions(monsterCount);
        
        return {
            grid: this.grid,
            playerStart,
            monsterPositions
        };
    }
    
    public getGridSize(): number {
        return this.GRID_SIZE;
    }
}
