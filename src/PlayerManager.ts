import { Player, Position, Direction, Item, ItemType } from './types';

export class PlayerManager {
    private player: Player;
    
    constructor() {
        this.player = this.initializePlayer();
    }
    
    private initializePlayer(): Player {
        return {
            position: { x: 0, y: 0 },
            health: 100,
            maxHealth: 100,
            attack: 10,
            defense: 5,
            hunger: 100,
            maxHunger: 100,
            keys: 0,
            treasures: 0,
            kills: 0,
            score: 0,
            inventory: []
        };
    }
    
    public getPlayer(): Player {
        return { ...this.player };
    }
    
    public setPosition(position: Position): void {
        this.player.position = { ...position };
    }
    
    public move(direction: Direction): Position {
        const newPosition = { ...this.player.position };
        
        switch (direction) {
            case Direction.UP:
                newPosition.y -= 1;
                break;
            case Direction.DOWN:
                newPosition.y += 1;
                break;
            case Direction.LEFT:
                newPosition.x -= 1;
                break;
            case Direction.RIGHT:
                newPosition.x += 1;
                break;
        }
        
        return newPosition;
    }
    
    public consumeStep(): void {
        this.player.hunger = Math.max(0, this.player.hunger - 1);
        
        if (this.player.hunger <= 0) {
            this.takeDamage(5);
        }
    }
    
    public takeDamage(amount: number): void {
        this.player.health = Math.max(0, this.player.health - amount);
    }
    
    public heal(amount: number): void {
        this.player.health = Math.min(this.player.maxHealth, this.player.health + amount);
    }
    
    public addKey(): void {
        this.player.keys += 1;
    }
    
    public useKey(): boolean {
        if (this.player.keys > 0) {
            this.player.keys -= 1;
            return true;
        }
        return false;
    }
    
    public addTreasure(value: number = 100): void {
        this.player.treasures += 1;
        this.player.score += value;
    }
    
    public addKill(): void {
        this.player.kills += 1;
        this.player.score += 50;
    }
    
    public addToInventory(item: Item): boolean {
        const maxInventorySize = 3;
        if (this.player.inventory.length < maxInventorySize) {
            this.player.inventory.push({ ...item });
            return true;
        }
        return false;
    }
    
    public useFromInventory(index: number): Item | null {
        if (index >= 0 && index < this.player.inventory.length) {
            const item = this.player.inventory.splice(index, 1)[0];
            return item;
        }
        return null;
    }
    
    public getInventory(): Item[] {
        return [...this.player.inventory];
    }
    
    public isDead(): boolean {
        return this.player.health <= 0;
    }
    
    public getAttack(): number {
        return this.player.attack;
    }
    
    public getDefense(): number {
        return this.player.defense;
    }
    
    public increaseStatsForNewFloor(floorLevel: number): void {
        const attackIncrease = Math.floor(floorLevel / 3);
        const defenseIncrease = Math.floor(floorLevel / 4);
        const healthIncrease = Math.floor(floorLevel / 2) * 10;
        
        this.player.attack += attackIncrease;
        this.player.defense += defenseIncrease;
        this.player.maxHealth += healthIncrease;
        this.player.health = this.player.maxHealth;
        this.player.hunger = this.player.maxHunger;
    }
    
    public resetForNewGame(): void {
        this.player = this.initializePlayer();
    }
}
