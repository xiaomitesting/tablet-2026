/**
 * 主应用模块 v2
 */
const App = (() => {
  let currentTab = 'quiz';

  function init() {
    Favorites.updateBadge();
    switchTab('quiz');
    Compare.updateDrawer();
  }

  function switchTab(tab) {
    currentTab = tab;

    document.querySelectorAll('.nav-tab[data-tab]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tab);
    });

    document.querySelectorAll('.tab-section').forEach(sec => {
      sec.classList.toggle('hidden', sec.id !== `section-${tab}`);
    });

    refreshCurrentView();
  }

  function refreshCurrentView() {
    switch (currentTab) {
      case 'quiz':
        QuizEngine.renderQuiz(document.getElementById('quiz-card'));
        break;
      case 'catalog':
        Catalog.render(document.getElementById('catalog-grid'));
        break;
      case 'competitor':
        Competitors.render(document.getElementById('competitor-section'));
        break;
      case 'guide':
        renderGuide(document.getElementById('guide-section'));
        break;
      case 'calculator':
        Calculator.render(document.getElementById('calculator-section'));
        break;
      case 'favorites':
        Favorites.render(document.getElementById('favorites-section'));
        break;
    }
  }

  function renderGuide(container) {
    container.innerHTML = `
      <div class="products-grid" style="grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));">
        <div class="guide-card">
          <h3>📌 按预算选</h3>
          <ul>
            <li><span>💰</span><div><strong>HK$1,199-1,399</strong><br>REDMI Pad 2 9.7 — 基础够用，入门首选</div></li>
            <li><span>💰💰</span><div><strong>HK$1,899</strong><br>REDMI Pad 2 Pro — 大屏学习娱乐神器</div></li>
            <li><span>💰💰</span><div><strong>HK$2,699</strong><br>REDMI Pad 2 Pro 5G — 需要移动网络的户外场景</div></li>
            <li><span>💰💰💰</span><div><strong>HK$3,199</strong><br>Xiaomi Pad 8 — 全能旗舰，最均衡的选择</div></li>
            <li><span>💰💰💰</span><div><strong>HK$3,799</strong><br>Pad Mini — 小屏旗舰，电竞玩家最爱</div></li>
            <li><span>💰💰💰</span><div><strong>HK$4,199</strong><br>Pad 8 Pro — 极致性能，专业创作者之选</div></li>
          </ul>
        </div>
        <div class="guide-card">
          <h3>📌 按场景选</h3>
          <ul>
            <li><span>💼</span><div><strong>办公学习</strong><br>Pad 8 Pro > Pad 8 > REDMI Pad 2 Pro</div></li>
            <li><span>🎮</span><div><strong>游戏电竞</strong><br>Pad Mini (165Hz) > Pad 8 Pro > Pad 8</div></li>
            <li><span>🎬</span><div><strong>影音娱乐</strong><br>Pad 8 Pro (OLED) > Pad 8 > REDMI Pad 2 Pro</div></li>
            <li><span>🎨</span><div><strong>创意设计</strong><br>Pad 8 Pro (手写笔) > Pad 8 (手写笔)</div></li>
            <li><span>📖</span><div><strong>阅读</strong><br>Pad Mini > REDMI Pad 2 Pro > Pad 2 9.7</div></li>
            <li><span>🏃</span><div><strong>便携出行</strong><br>Pad Mini (290g) > Pad SE 8.7 (280g)</div></li>
          </ul>
        </div>
        <div class="guide-card">
          <h3>📌 购买小贴士</h3>
          <ul>
            <li><span>✅</span><div><strong>手写笔需求</strong><br>仅 Pad 8 Pro 和 Pad 8 支持，购买前确认</div></li>
            <li><span>✅</span><div><strong>5G需求</strong><br>仅 REDMI Pad 2 Pro 5G 支持 SIM 卡</div></li>
            <li><span>✅</span><div><strong>存储选择</strong><br>128GB 日常够用，256GB 更从容</div></li>
            <li><span>✅</span><div><strong>配件预算</strong><br>手写笔+键盘套装约 HK$500-800，提前规划</div></li>
            <li><span>✅</span><div><strong>售后保障</strong><br>香港官网购买享官方保修</div></li>
          </ul>
        </div>
      </div>
    `;
  }

  return { init, switchTab, refreshCurrentView };
})();
