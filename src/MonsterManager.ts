import { Monster, Position, Cell, CellType, Player } from './types';

export class MonsterManager {
    private monsters: Monster[];
    private readonly GRID_SIZE: number = 10;
    
    constructor() {
        this.monsters = [];
    }
    
    public createMonster(position: Position, floorLevel: number): Monster {
        const baseHealth = 30;
        const healthIncrease = floorLevel * 5;
        const baseAttack = 8;
        const attackIncrease = floorLevel * 2;
        const baseDefense = 3;
        const defenseIncrease = floorLevel;
        
        return {
            position: { ...position },
            health: baseHealth + healthIncrease,
            attack: baseAttack + attackIncrease,
            defense: baseDefense + defenseIncrease
        };
    }
    
    public initializeMonsters(positions: Position[], floorLevel: number): void {
        this.monsters = positions.map(pos => this.createMonster(pos, floorLevel));
    }
    
    public getMonsters(): Monster[] {
        return this.monsters.map(m => ({ ...m }));
    }
    
    public getMonsterAtPosition(position: Position): Monster | null {
        const monster = this.monsters.find(
            m => m.position.x === position.x && m.position.y === position.y
        );
        return monster ? { ...monster } : null;
    }
    
    private isPositionValid(
        position: Position, 
        grid: Cell[][], 
        playerPosition: Position
    ): boolean {
        if (position.x < 0 || position.x >= this.GRID_SIZE || 
            position.y < 0 || position.y >= this.GRID_SIZE) {
            return false;
        }
        
        const cell = grid[position.y][position.x];
        if (cell.type === CellType.WALL) {
            return false;
        }
        
        if (position.x === playerPosition.x && position.y === playerPosition.y) {
            return false;
        }
        
        const hasMonster = this.monsters.some(
            m => m.position.x === position.x && m.position.y === position.y
        );
        if (hasMonster) {
            return false;
        }
        
        return true;
    }
    
    private getRandomMove(currentPosition: Position): Position {
        const directions = [
            { x: 0, y: -1 }, // 上
            { x: 0, y: 1 },  // 下
            { x: -1, y: 0 }, // 左
            { x: 1, y: 0 }   // 右
        ];
        
        const randomDirection = directions[Math.floor(Math.random() * directions.length)];
        return {
            x: currentPosition.x + randomDirection.x,
            y: currentPosition.y + randomDirection.y
        };
    }
    
    private getMoveTowardsPlayer(
        currentPosition: Position, 
        playerPosition: Position
    ): Position {
        const dx = playerPosition.x - currentPosition.x;
        const dy = playerPosition.y - currentPosition.y;
        
        let moveX = 0;
        let moveY = 0;
        
        if (Math.abs(dx) > Math.abs(dy)) {
            moveX = dx > 0 ? 1 : -1;
        } else if (Math.abs(dy) > 0) {
            moveY = dy > 0 ? 1 : -1;
        } else if (Math.abs(dx) > 0) {
            moveX = dx > 0 ? 1 : -1;
        }
        
        return {
            x: currentPosition.x + moveX,
            y: currentPosition.y + moveY
        };
    }
    
    private getDistance(pos1: Position, pos2: Position): number {
        return Math.abs(pos1.x - pos2.x) + Math.abs(pos1.y - pos2.y);
    }
    
    public moveMonsters(grid: Cell[][], playerPosition: Position): void {
        for (let i = 0; i < this.monsters.length; i++) {
            const monster = this.monsters[i];
            const distanceToPlayer = this.getDistance(monster.position, playerPosition);
            
            let newPosition: Position;
            const chaseChance = 0.6;
            
            if (distanceToPlayer <= 5 && Math.random() < chaseChance) {
                newPosition = this.getMoveTowardsPlayer(monster.position, playerPosition);
            } else {
                newPosition = this.getRandomMove(monster.position);
            }
            
            if (this.isPositionValid(newPosition, grid, playerPosition)) {
                this.monsters[i].position = { ...newPosition };
            } else {
                let attempts = 0;
                while (attempts < 4) {
                    const randomPosition = this.getRandomMove(monster.position);
                    if (this.isPositionValid(randomPosition, grid, playerPosition)) {
                        this.monsters[i].position = { ...randomPosition };
                        break;
                    }
                    attempts++;
                }
            }
        }
    }
    
    public checkMonsterCollision(position: Position): boolean {
        return this.monsters.some(
            m => m.position.x === position.x && m.position.y === position.y
        );
    }
    
    public combat(
        monster: Monster, 
        playerAttack: number, 
        playerDefense: number
    ): { monsterDamage: number; playerDamage: number; monsterDefeated: boolean } {
        const monsterDamage = Math.max(1, playerAttack - monster.defense);
        const playerDamage = Math.max(1, monster.attack - playerDefense);
        
        const monsterIndex = this.monsters.findIndex(
            m => m.position.x === monster.position.x && m.position.y === monster.position.y
        );
        
        let monsterDefeated = false;
        if (monsterIndex !== -1) {
            this.monsters[monsterIndex].health -= monsterDamage;
            
            if (this.monsters[monsterIndex].health <= 0) {
                this.monsters.splice(monsterIndex, 1);
                monsterDefeated = true;
            }
        }
        
        return {
            monsterDamage,
            playerDamage,
            monsterDefeated
        };
    }
    
    public dealAreaDamage(center: Position, damage: number): number {
        let killedMonsters = 0;
        
        const monstersToRemove: number[] = [];
        
        for (let i = 0; i < this.monsters.length; i++) {
            const monster = this.monsters[i];
            const dx = Math.abs(monster.position.x - center.x);
            const dy = Math.abs(monster.position.y - center.y);
            
            if (dx <= 1 && dy <= 1) {
                this.monsters[i].health -= damage;
                
                if (this.monsters[i].health <= 0) {
                    monstersToRemove.push(i);
                    killedMonsters++;
                }
            }
        }
        
        for (let i = monstersToRemove.length - 1; i >= 0; i--) {
            this.monsters.splice(monstersToRemove[i], 1);
        }
        
        return killedMonsters;
    }
    
    public clearMonsters(): void {
        this.monsters = [];
    }
}
