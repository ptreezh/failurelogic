// 极简版主应用文件
// 导入模块（在浏览器环境中，我们将它们按顺序引入）

// 应用初始化
document.addEventListener('DOMContentLoaded', () => {
  console.log('Failure Logic 应用已启动');
  
  // 初始化导航事件
  setupNavigation();
  
  // 根据URL哈希或默认值渲染页面
  const initialPage = window.location.hash.replace('#', '') || 'home';
  Router.navigateTo(initialPage);
});

// 设置导航事件
function setupNavigation() {
  // 为所有导航链接添加点击事件
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const page = e.target.getAttribute('data-page');
      if (page) {
        Router.navigateTo(page);
      }
    });
  });
}

// 暴露全局函数供HTML使用
window.navigateTo = (page) => {
  Router.navigateTo(page);
};