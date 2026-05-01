import { Direction, ThemeType, CellType, Item, ItemType, Cell, Position, Monster } from './types';
import { PlayerManager } from './PlayerManager';
import { MonsterManager } from './MonsterManager';
import { FloorManager } from './FloorManager';
import { ItemManager } from './ItemManager';
import { StorageManager } from './StorageManager';

export class DungeonCrawlerGame {
    private playerManager: PlayerManager;
    private monsterManager: MonsterManager;
    private floorManager: FloorManager;
    private itemManager: ItemManager;
    private storageManager: StorageManager;
    
    private currentFloor: number;
    private isGameOver: boolean;
    private theme: ThemeType;
    
    private gameMapElement: HTMLElement | null;
    private statsElements: {
        floor: HTMLElement | null;
        score: HTMLElement | null;
        health: HTMLElement | null;
        maxHealth: HTMLElement | null;
        attack: HTMLElement | null;
        defense: HTMLElement | null;
        hunger: HTMLElement | null;
        maxHunger: HTMLElement | null;
        keys: HTMLElement | null;
        treasures: HTMLElement | null;
        kills: HTMLElement | null;
    };
    private inventoryElement: HTMLElement | null;
    private highScoresElements: {
        maxFloor: HTMLElement | null;
        totalScore: HTMLElement | null;
    };
    private gameOverElement: HTMLElement | null;
    private finalScoreElement: HTMLElement | null;
    private restartButton: HTMLElement | null;
    private themeSelector: HTMLSelectElement | null;
    
    constructor() {
        this.playerManager = new PlayerManager();
        this.monsterManager = new MonsterManager();
        this.floorManager = new FloorManager(this.playerManager, this.monsterManager);
        this.itemManager = new ItemManager();
        this.storageManager = new StorageManager();
        
        this.currentFloor = 1;
        this.isGameOver = false;
        this.theme = this.storageManager.loadTheme();
        
        this.gameMapElement = document.getElementById('game-map');
        this.inventoryElement = document.getElementById('inventory-items');
        this.gameOverElement = document.getElementById('game-over');
        this.finalScoreElement = document.getElementById('final-score');
        this.restartButton = document.getElementById('restart-button');
        this.themeSelector = document.getElementById('theme') as HTMLSelectElement;
        
        this.statsElements = {
            floor: document.getElementById('floor'),
            score: document.getElementById('score'),
            health: document.getElementById('health'),
            maxHealth: document.getElementById('max-health'),
            attack: document.getElementById('attack'),
            defense: document.getElementById('defense'),
            hunger: document.getElementById('hunger'),
            maxHunger: document.getElementById('max-hunger'),
            keys: document.getElementById('keys'),
            treasures: document.getElementById('treasures'),
            kills: document.getElementById('kills')
        };
        
        this.highScoresElements = {
            maxFloor: document.getElementById('max-floor'),
            totalScore: document.getElementById('total-score')
        };
        
        this.initializeGame();
        this.setupEventListeners();
    }
    
    private initializeGame(): void {
        this.currentFloor = 1;
        this.isGameOver = false;
        this.playerManager.resetForNewGame();
        
        this.floorManager.generateFloor(this.currentFloor, this.theme);
        
        this.updateUI();
        this.renderMap();
        
        if (this.gameOverElement) {
            this.gameOverElement.classList.add('hidden');
        }
    }
    
    private setupEventListeners(): void {
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        
        if (this.restartButton) {
            this.restartButton.addEventListener('click', () => this.restartGame());
        }
        
        if (this.themeSelector) {
            this.themeSelector.value = this.theme;
            this.themeSelector.addEventListener('change', (e) => {
                const target = e.target as HTMLSelectElement;
                this.setTheme(target.value as ThemeType);
            });
        }
    }
    
    private setTheme(theme: ThemeType): void {
        this.theme = theme;
        this.storageManager.saveTheme(theme);
        this.floorManager.setTheme(theme);
        this.renderMap();
    }
    
    private handleKeyPress(e: KeyboardEvent): void {
        if (this.isGameOver) return;
        
        const key = e.key.toLowerCase();
        
        let direction: Direction | null = null;
        
        switch (key) {
            case 'w':
                direction = Direction.UP;
                break;
            case 's':
                direction = Direction.DOWN;
                break;
            case 'a':
                direction = Direction.LEFT;
                break;
            case 'd':
                direction = Direction.RIGHT;
                break;
            case 'r':
                this.restartGame();
                return;
            case '1':
                this.useItem(0);
                return;
            case '2':
                this.useItem(1);
                return;
            case '3':
                this.useItem(2);
                return;
        }
        
        if (direction !== null) {
            e.preventDefault();
            this.handleMove(direction);
        }
    }
    
    private handleMove(direction: Direction): void {
        const player = this.playerManager.getPlayer();
        const newPosition = this.playerManager.move(direction);
        
        if (!this.floorManager.isPositionValid(newPosition)) {
            return;
        }
        
        const monsterAtPosition = this.monsterManager.getMonsterAtPosition(newPosition);
        if (monsterAtPosition) {
            this.handleCombat(monsterAtPosition);
            return;
        }
        
        this.playerManager.setPosition(newPosition);
        this.playerManager.consumeStep();
        
        this.handleCellInteraction(newPosition);
        
        this.monsterManager.moveMonsters(
            this.floorManager.getGrid(),
            this.playerManager.getPlayer().position
        );
        
        this.checkMonsterCollision();
        
        this.floorManager.updateFloor();
        
        if (this.playerManager.isDead()) {
            this.endGame();
        }
        
        this.updateUI();
        this.renderMap();
    }
    
    private handleCombat(monster: Monster): void {
        const player = this.playerManager.getPlayer();
        const result = this.monsterManager.combat(
            monster,
            this.playerManager.getAttack(),
            this.playerManager.getDefense()
        );
        
        this.playerManager.takeDamage(result.playerDamage);
        
        if (result.monsterDefeated) {
            this.playerManager.addKill();
        }
        
        this.playerManager.consumeStep();
        
        this.monsterManager.moveMonsters(
            this.floorManager.getGrid(),
            this.playerManager.getPlayer().position
        );
        
        this.checkMonsterCollision();
        
        this.floorManager.updateFloor();
        
        if (this.playerManager.isDead()) {
            this.endGame();
        }
        
        this.updateUI();
        this.renderMap();
    }
    
    private checkMonsterCollision(): void {
        const player = this.playerManager.getPlayer();
        const monsters = this.monsterManager.getMonsters();
        
        for (const monster of monsters) {
            if (monster.position.x === player.position.x && 
                monster.position.y === player.position.y) {
                const result = this.monsterManager.combat(
                    monster,
                    this.playerManager.getAttack(),
                    this.playerManager.getDefense()
                );
                
                this.playerManager.takeDamage(result.playerDamage);
                
                if (result.monsterDefeated) {
                    this.playerManager.addKill();
                }
                
                if (this.playerManager.isDead()) {
                    this.endGame();
                }
                
                break;
            }
        }
    }
    
    private handleCellInteraction(position: Position): void {
        const cell = this.floorManager.getCellAt(position);
        if (!cell) return;
        
        const trapDamage = this.floorManager.triggerTrapAt(position);
        if (trapDamage > 0) {
            this.playerManager.takeDamage(trapDamage);
            
            this.updateUI();
            
            this.flashCellAtPosition(position);
            this.flashPlayerCell();
            this.showFloatingText(position, `-${trapDamage}`, 'damage');
        }
        
        const item = this.floorManager.collectItemAt(position);
        if (item) {
            const added = this.playerManager.addToInventory(item);
            if (!added) {
            }
        }
        
        if (this.floorManager.collectKeyAt(position)) {
            this.playerManager.addKey();
        }
        
        if (this.floorManager.collectTreasureAt(position)) {
            this.playerManager.addTreasure();
        }
        
        if (this.floorManager.isStairsAt(position)) {
            this.tryGoToNextFloor();
        }
    }
    
    private tryGoToNextFloor(): void {
        const player = this.playerManager.getPlayer();
        
        if (player.keys > 0) {
            this.playerManager.useKey();
            this.goToNextFloor();
        }
    }
    
    private goToNextFloor(): void {
        this.currentFloor++;
        
        this.storageManager.updateMaxFloor(this.currentFloor);
        this.storageManager.updateTotalScore(this.playerManager.getPlayer().score);
        
        this.playerManager.increaseStatsForNewFloor(this.currentFloor);
        
        this.floorManager.generateFloor(this.currentFloor, this.theme);
        
        this.updateUI();
        this.renderMap();
    }
    
    private useItem(index: number): void {
        const inventory = this.playerManager.getInventory();
        if (index < 0 || index >= inventory.length) {
            return;
        }
        
        const item = this.playerManager.useFromInventory(index);
        if (!item) return;
        
        const result = this.itemManager.useItem(
            item,
            this.playerManager,
            this.monsterManager,
            this.floorManager.getGrid()
        );
        
        this.floorManager.updateFloor();
        
        this.updateUI();
        this.renderMap();
    }
    
    private endGame(): void {
        this.isGameOver = true;
        
        const player = this.playerManager.getPlayer();
        this.storageManager.updateMaxFloor(this.currentFloor);
        this.storageManager.updateTotalScore(player.score);
        
        if (this.finalScoreElement) {
            this.finalScoreElement.textContent = `最终分数：${player.score}，到达层数：${this.currentFloor}`;
        }
        
        if (this.gameOverElement) {
            this.gameOverElement.classList.remove('hidden');
        }
        
        this.updateHighScores();
    }
    
    private restartGame(): void {
        this.initializeGame();
    }
    
    private updateUI(): void {
        const player = this.playerManager.getPlayer();
        
        if (this.statsElements.floor) {
            this.statsElements.floor.textContent = this.currentFloor.toString();
        }
        if (this.statsElements.score) {
            this.statsElements.score.textContent = player.score.toString();
        }
        if (this.statsElements.health) {
            this.statsElements.health.textContent = player.health.toString();
            
            const healthPercent = player.health / player.maxHealth;
            const healthStatDiv = this.statsElements.health.closest('.stat');
            if (healthStatDiv) {
                if (healthPercent <= 0.3) {
                    healthStatDiv.classList.add('health-low');
                } else {
                    healthStatDiv.classList.remove('health-low');
                }
            }
        }
        if (this.statsElements.maxHealth) {
            this.statsElements.maxHealth.textContent = player.maxHealth.toString();
        }
        if (this.statsElements.attack) {
            this.statsElements.attack.textContent = player.attack.toString();
        }
        if (this.statsElements.defense) {
            this.statsElements.defense.textContent = player.defense.toString();
        }
        if (this.statsElements.hunger) {
            this.statsElements.hunger.textContent = player.hunger.toString();
        }
        if (this.statsElements.maxHunger) {
            this.statsElements.maxHunger.textContent = player.maxHunger.toString();
        }
        if (this.statsElements.keys) {
            this.statsElements.keys.textContent = player.keys.toString();
        }
        if (this.statsElements.treasures) {
            this.statsElements.treasures.textContent = player.treasures.toString();
        }
        if (this.statsElements.kills) {
            this.statsElements.kills.textContent = player.kills.toString();
        }
        
        this.updateInventory();
        this.updateHighScores();
    }
    
    private updateInventory(): void {
        if (!this.inventoryElement) return;
        
        const inventory = this.playerManager.getInventory();
        this.inventoryElement.innerHTML = '';
        
        for (let i = 0; i < 3; i++) {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'inventory-item';
            
            if (i < inventory.length) {
                const item = inventory[i];
                itemDiv.innerHTML = `<span>${i + 1}. ${this.itemManager.getItemSymbol(item.type)}</span>`;
            } else {
                itemDiv.innerHTML = `<span>${i + 1}. 空</span>`;
                itemDiv.classList.add('empty');
            }
            
            this.inventoryElement.appendChild(itemDiv);
        }
    }
    
    private updateHighScores(): void {
        const highScores = this.storageManager.loadHighScores();
        
        if (this.highScoresElements.maxFloor) {
            this.highScoresElements.maxFloor.textContent = highScores.maxFloor.toString();
        }
        if (this.highScoresElements.totalScore) {
            this.highScoresElements.totalScore.textContent = highScores.totalScore.toString();
        }
    }
    
    private renderMap(): void {
        if (!this.gameMapElement) return;
        
        const grid = this.floorManager.getGrid();
        const theme = this.floorManager.getCurrentTheme();
        
        this.gameMapElement.innerHTML = '';
        this.gameMapElement.className = `theme-${theme}`;
        
        for (let y = 0; y < grid.length; y++) {
            const rowDiv = document.createElement('div');
            rowDiv.className = 'row';
            
            for (let x = 0; x < grid[y].length; x++) {
                const cell = grid[y][x];
                const cellDiv = document.createElement('div');
                cellDiv.className = 'cell';
                
                const symbol = this.getCellSymbol(cell);
                const cellClass = this.getCellClass(cell);
                
                cellDiv.textContent = symbol;
                if (cellClass) {
                    cellDiv.classList.add(cellClass);
                }
                
                rowDiv.appendChild(cellDiv);
            }
            
            this.gameMapElement.appendChild(rowDiv);
        }
    }
    
    private getCellSymbol(cell: Cell): string {
        if (cell.isPlayerHere) {
            return '@';
        }
        
        if (cell.isMonsterHere) {
            return 'G';
        }
        
        if (cell.item) {
            return this.itemManager.getItemSymbol(cell.item.type);
        }
        
        switch (cell.type) {
            case CellType.WALL:
                return '█';
            case CellType.TRAP:
                return '▲';
            case CellType.KEY:
                return '🔑';
            case CellType.STAIRS:
                return '▼';
            case CellType.TREASURE:
                return '◆';
            default:
                return '·';
        }
    }
    
    private getCellClass(cell: Cell): string | null {
        if (cell.isPlayerHere) {
            return 'player';
        }
        
        if (cell.isMonsterHere) {
            return 'monster';
        }
        
        if (cell.item) {
            switch (cell.item.type) {
                case ItemType.POTION:
                    return 'potion';
                case ItemType.BOMB:
                    return 'bomb';
                case ItemType.TELEPORT:
                    return 'teleport';
            }
        }
        
        switch (cell.type) {
            case CellType.WALL:
                return 'wall';
            case CellType.TRAP:
                return 'trap';
            case CellType.KEY:
                return 'key';
            case CellType.STAIRS:
                return 'stairs';
            case CellType.TREASURE:
                return 'treasure';
            default:
                return null;
        }
    }
    
    private showFloatingText(position: Position, text: string, type: 'damage' | 'heal'): void {
        if (!this.gameMapElement) return;
        
        const mapRect = this.gameMapElement.getBoundingClientRect();
        const cellSize = 40;
        
        const floatText = document.createElement('div');
        floatText.className = `floating-text ${type}`;
        floatText.textContent = text;
        
        const x = position.x * cellSize + cellSize / 2;
        const y = position.y * cellSize;
        
        floatText.style.left = `${x}px`;
        floatText.style.top = `${y}px`;
        
        this.gameMapElement.appendChild(floatText);
        
        setTimeout(() => {
            floatText.remove();
        }, 1000);
    }
    
    private flashCellAtPosition(position: Position): void {
        if (!this.gameMapElement) return;
        
        const rows = this.gameMapElement.querySelectorAll('.row');
        if (rows[position.y]) {
            const cells = rows[position.y].querySelectorAll('.cell');
            if (cells[position.x]) {
                const cell = cells[position.x] as HTMLElement;
                cell.classList.add('damage-flash');
                
                setTimeout(() => {
                    cell.classList.remove('damage-flash');
                }, 300);
            }
        }
    }
    
    private flashPlayerCell(): void {
        if (!this.gameMapElement) return;
        
        const playerCells = this.gameMapElement.querySelectorAll('.cell.player');
        playerCells.forEach(cell => {
            cell.classList.add('damage');
            
            setTimeout(() => {
                cell.classList.remove('damage');
            }, 300);
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new DungeonCrawlerGame();
});
