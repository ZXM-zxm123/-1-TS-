import { HighScores, ThemeType } from './types';

export class StorageManager {
    private readonly HIGH_SCORES_KEY: string = 'dungeonCrawlerHighScores';
    private readonly THEME_KEY: string = 'dungeonCrawlerTheme';
    
    public saveHighScores(highScores: HighScores): void {
        try {
            const currentScores = this.loadHighScores();
            const updatedScores: HighScores = {
                maxFloor: Math.max(currentScores.maxFloor, highScores.maxFloor),
                totalScore: Math.max(currentScores.totalScore, highScores.totalScore)
            };
            
            localStorage.setItem(
                this.HIGH_SCORES_KEY, 
                JSON.stringify(updatedScores)
            );
        } catch (error) {
            console.error('无法保存最高分:', error);
        }
    }
    
    public loadHighScores(): HighScores {
        try {
            const data = localStorage.getItem(this.HIGH_SCORES_KEY);
            if (data) {
                return JSON.parse(data) as HighScores;
            }
        } catch (error) {
            console.error('无法加载最高分:', error);
        }
        
        return {
            maxFloor: 0,
            totalScore: 0
        };
    }
    
    public saveTheme(theme: ThemeType): void {
        try {
            localStorage.setItem(this.THEME_KEY, theme);
        } catch (error) {
            console.error('无法保存主题设置:', error);
        }
    }
    
    public loadTheme(): ThemeType {
        try {
            const data = localStorage.getItem(this.THEME_KEY);
            if (data) {
                return data as ThemeType;
            }
        } catch (error) {
            console.error('无法加载主题设置:', error);
        }
        
        return ThemeType.CAVE;
    }
    
    public clearAllData(): void {
        try {
            localStorage.removeItem(this.HIGH_SCORES_KEY);
            localStorage.removeItem(this.THEME_KEY);
        } catch (error) {
            console.error('无法清除数据:', error);
        }
    }
    
    public updateMaxFloor(floor: number): void {
        const currentScores = this.loadHighScores();
        if (floor > currentScores.maxFloor) {
            this.saveHighScores({
                ...currentScores,
                maxFloor: floor
            });
        }
    }
    
    public updateTotalScore(score: number): void {
        const currentScores = this.loadHighScores();
        if (score > currentScores.totalScore) {
            this.saveHighScores({
                ...currentScores,
                totalScore: score
            });
        }
    }
}
