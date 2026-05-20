import { Link } from "@tanstack/react-router";

/**
 * 首页
 * @returns Demo 导航页
 */
export function HomePage() {
  return (
    <section className="home-grid">
      <article className="hero-card">
        <p className="eyebrow">Sandbox</p>
        <h2>快速验证 Konva 的绘制与交互能力</h2>
        <p className="hero-copy">
          当前项目保留了 Cloudflare / Hono 模板结构，并将 Konva 的便签墙试验页面并入到前端应用中。
        </p>
      </article>

      <article className="link-card">
        <h3>便签墙</h3>
        <p>验证便签卡片的随机倾斜、随机配色、层级置顶和新增行为。</p>
        <Link className="page-link" to="/sticky-notes">
          打开页面
        </Link>
      </article>
    </section>
  );
}
