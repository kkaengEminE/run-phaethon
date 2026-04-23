export class GameScreens {
  constructor() {
    this.titleScreen = document.getElementById('title-screen');
    this.winScreen = document.getElementById('win-screen');
    this.loseScreen = document.getElementById('lose-screen');
    this.loseTitle = document.getElementById('lose-title');
    this.loseMessage = document.getElementById('lose-message');
    this.winStats = document.getElementById('win-stats');
    this.loseStats = document.getElementById('lose-stats');
  }

  showTitle() {
    this.titleScreen.style.display = 'flex';
    this.winScreen.style.display = 'none';
    this.loseScreen.style.display = 'none';
  }

  showWin(stats) {
    this.titleScreen.style.display = 'none';
    this.winScreen.style.display = 'flex';
    this.loseScreen.style.display = 'none';
    this.winStats.textContent = `Damage dealt: ${Math.floor(stats.damage)} | Time: ${stats.time.toFixed(1)}s`;
  }

  showLose(reason, stats) {
    this.titleScreen.style.display = 'none';
    this.winScreen.style.display = 'none';
    this.loseScreen.style.display = 'flex';

    if (reason === 'crash') {
      this.loseTitle.textContent = 'Crashed!';
      this.loseMessage.textContent = '파에톤이 지면에 추락했습니다!';
    } else if (reason === 'zeus') {
      this.loseTitle.textContent = 'Zeus Strikes!';
      this.loseMessage.textContent = '제우스의 번개에 맞아 파에톤이 추락했습니다!';
    }
    this.loseStats.textContent = `Damage dealt: ${Math.floor(stats.damage)} | Progress: ${Math.floor(stats.progress * 100)}%`;
  }

  hideAll() {
    this.titleScreen.style.display = 'none';
    this.winScreen.style.display = 'none';
    this.loseScreen.style.display = 'none';
  }
}
