import { Floor, Cell, Position, ThemeType, CellType, Item, Player, Monster } from './types';
import { MapGenerator } from './MapGenerator';
import { PlayerManager } from './PlayerManager';
import { MonsterManager } from './MonsterManager';

export class FloorManager {
    private currentFloor: Floor | null;
    private mapGenerator: MapGenerator;
    private playerManager: PlayerManager;
    private monsterManager: MonsterManager;
    private readonly GRID_SIZE: number = 10;
    
    constructor(
        playerManager: PlayerManager, 
        monsterManager: MonsterManager,
        theme: ThemeType = ThemeType.CAVE
    ) {
        this.currentFloor = null;
        this.mapGenerator = new MapGenerator(theme);
        this.playerManager = playerManager;
        this.monsterManager = monsterManager;
    }
    
    public generateFloor(floorLevel: number, theme: ThemeType): Floor {
        this.mapGenerator = new MapGenerator(theme);
        
        const { grid, playerStart, monsterPositions } = this.mapGenerator.generate(floorLevel);
        
        this.playerManager.setPosition(playerStart);
        
        this.monsterManager.clearMonsters();
        this.monsterManager.initializeMonsters(monsterPositions, floorLevel);
        
        this.updateGridWithEntities(grid);
        
        this.currentFloor = {
            level: floorLevel,
            grid,
            monsters: this.monsterManager.getMonsters(),
            player: this.playerManager.getPlayer(),
            theme
        };
        
        return this.currentFloor;
    }
    
    private updateGridWithEntities(grid: Cell[][]): void {
        for (let y = 0; y < this.GRID_SIZE; y++) {
            for (let x = 0; x < this.GRID_SIZE; x++) {
                grid[y][x].isPlayerHere = false;
                grid[y][x].isMonsterHere = false;
            }
        }
        
        const player = this.playerManager.getPlayer();
        grid[player.position.y][player.position.x].isPlayerHere = true;
        
        const monsters = this.monsterManager.getMonsters();
        for (const monster of monsters) {
            grid[monster.position.y][monster.position.x].isMonsterHere = true;
        }
    }
    
    public getCurrentFloor(): Floor | null {
        return this.currentFloor ? { ...this.currentFloor } : null;
    }
    
    public getGrid(): Cell[][] {
        if (!this.currentFloor) {
            return [];
        }
        
        this.updateGridWithEntities(this.currentFloor.grid);
        
        return this.currentFloor.grid.map(row => 
            row.map(cell => ({ ...cell }))
        );
    }
    
    public isPositionValid(position: Position): boolean {
        if (!this.currentFloor) return false;
        
        if (position.x < 0 || position.x >= this.GRID_SIZE || 
            position.y < 0 || position.y >= this.GRID_SIZE) {
            return false;
        }
        
        const cell = this.currentFloor.grid[position.y][position.x];
        if (cell.type === CellType.WALL) {
            return false;
        }
        
        return true;
    }
    
    public getCellAt(position: Position): Cell | null {
        if (!this.currentFloor) return null;
        
        if (!this.isPositionValid(position)) return null;
        
        return { ...this.currentFloor.grid[position.y][position.x] };
    }
    
    public collectItemAt(position: Position): Item | null {
        if (!this.currentFloor) return null;
        
        const cell = this.currentFloor.grid[position.y][position.x];
        if (cell.item) {
            const item = { ...cell.item };
            cell.item = undefined;
            return item;
        }
        
        return null;
    }
    
    public collectKeyAt(position: Position): boolean {
        if (!this.currentFloor) return false;
        
        const cell = this.currentFloor.grid[position.y][position.x];
        if (cell.type === CellType.KEY) {
            cell.type = CellType.EMPTY;
            return true;
        }
        
        return false;
    }
    
    public collectTreasureAt(position: Position): boolean {
        if (!this.currentFloor) return false;
        
        const cell = this.currentFloor.grid[position.y][position.x];
        if (cell.type === CellType.TREASURE) {
            cell.type = CellType.EMPTY;
            return true;
        }
        
        return false;
    }
    
    public isStairsAt(position: Position): boolean {
        if (!this.currentFloor) return false;
        
        const cell = this.currentFloor.grid[position.y][position.x];
        return cell.type === CellType.STAIRS;
    }
    
    public getTrapDamageAt(position: Position): number {
        if (!this.currentFloor) return 0;
        
        const cell = this.currentFloor.grid[position.y][position.x];
        if (cell.type === CellType.TRAP) {
            return cell.trapDamage;
        }
        
        return 0;
    }
    
    public triggerTrapAt(position: Position): number {
        if (!this.currentFloor) return 0;
        
        const cell = this.currentFloor.grid[position.y][position.x];
        if (cell.type === CellType.TRAP) {
            const damage = cell.trapDamage;
            cell.type = CellType.EMPTY;
            cell.trapDamage = 0;
            return damage;
        }
        
        return 0;
    }
    
    public updateFloor(): void {
        if (!this.currentFloor) return;
        
        this.currentFloor.player = this.playerManager.getPlayer();
        this.currentFloor.monsters = this.monsterManager.getMonsters();
        this.updateGridWithEntities(this.currentFloor.grid);
    }
    
    public setTheme(theme: ThemeType): void {
        if (this.currentFloor) {
            this.currentFloor.theme = theme;
        }
    }
    
    public getCurrentTheme(): ThemeType {
        return this.currentFloor?.theme || ThemeType.CAVE;
    }
}
