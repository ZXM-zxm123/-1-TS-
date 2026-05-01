import { Item, ItemType, Position, Cell, CellType } from './types';
import { PlayerManager } from './PlayerManager';
import { MonsterManager } from './MonsterManager';

export class ItemManager {
    private readonly GRID_SIZE: number = 10;
    private readonly POTION_HEAL_AMOUNT: number = 30;
    private readonly BOMB_DAMAGE: number = 50;
    
    public useItem(
        item: Item,
        playerManager: PlayerManager,
        monsterManager: MonsterManager,
        grid: Cell[][]
    ): { 
        message: string; 
        teleportPosition?: Position;
        killedMonsters?: number;
    } {
        switch (item.type) {
            case ItemType.POTION:
                return this.usePotion(playerManager);
                
            case ItemType.BOMB:
                return this.useBomb(playerManager, monsterManager);
                
            case ItemType.TELEPORT:
                return this.useTeleport(playerManager, grid);
                
            default:
                return { message: '未知道具' };
        }
    }
    
    private usePotion(playerManager: PlayerManager): { message: string } {
        const player = playerManager.getPlayer();
        const healthBefore = player.health;
        
        playerManager.heal(this.POTION_HEAL_AMOUNT);
        
        const playerAfter = playerManager.getPlayer();
        const healthGained = playerAfter.health - healthBefore;
        
        if (healthGained > 0) {
            return { message: `使用血瓶，回复了 ${healthGained} 点生命值！` };
        } else {
            return { message: '生命值已满，血瓶效果无效。' };
        }
    }
    
    private useBomb(
        playerManager: PlayerManager, 
        monsterManager: MonsterManager
    ): { message: string; killedMonsters: number } {
        const player = playerManager.getPlayer();
        const playerPosition = player.position;
        
        const killedMonsters = monsterManager.dealAreaDamage(
            playerPosition, 
            this.BOMB_DAMAGE
        );
        
        for (let i = 0; i < killedMonsters; i++) {
            playerManager.addKill();
        }
        
        let message = `炸弹爆炸！3×3 范围内造成 ${this.BOMB_DAMAGE} 点伤害。`;
        if (killedMonsters > 0) {
            message += ` 消灭了 ${killedMonsters} 个怪物！`;
        } else {
            message += ' 没有怪物在范围内。';
        }
        
        return { message, killedMonsters };
    }
    
    private useTeleport(
        playerManager: PlayerManager, 
        grid: Cell[][]
    ): { message: string; teleportPosition: Position } {
        const player = playerManager.getPlayer();
        const currentPosition = player.position;
        
        let newPosition: Position;
        let attempts = 0;
        const maxAttempts = 100;
        
        do {
            newPosition = {
                x: Math.floor(Math.random() * this.GRID_SIZE),
                y: Math.floor(Math.random() * this.GRID_SIZE)
            };
            attempts++;
            
            if (attempts > maxAttempts) {
                return { 
                    message: '传送失败！无法找到可用位置。', 
                    teleportPosition: currentPosition 
                };
            }
        } while (
            this.isPositionBlocked(newPosition, grid) ||
            (newPosition.x === currentPosition.x && newPosition.y === currentPosition.y)
        );
        
        playerManager.setPosition(newPosition);
        
        return {
            message: `传送到位置 (${newPosition.x + 1}, ${newPosition.y + 1})！`,
            teleportPosition: newPosition
        };
    }
    
    private isPositionBlocked(position: Position, grid: Cell[][]): boolean {
        if (position.x < 0 || position.x >= this.GRID_SIZE || 
            position.y < 0 || position.y >= this.GRID_SIZE) {
            return true;
        }
        
        const cell = grid[position.y][position.x];
        if (cell.type === CellType.WALL) {
            return true;
        }
        
        return false;
    }
    
    public getItemSymbol(itemType: ItemType): string {
        switch (itemType) {
            case ItemType.POTION:
                return '♥';
            case ItemType.BOMB:
                return '◉';
            case ItemType.TELEPORT:
                return '✦';
            default:
                return '?';
        }
    }
    
    public getItemName(itemType: ItemType): string {
        switch (itemType) {
            case ItemType.POTION:
                return '血瓶';
            case ItemType.BOMB:
                return '炸弹';
            case ItemType.TELEPORT:
                return '传送';
            default:
                return '未知';
        }
    }
}
