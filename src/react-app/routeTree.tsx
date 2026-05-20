import { Link, Outlet, createRootRoute, createRoute } from "@tanstack/react-router";
import { HomePage } from "./routes/home";
import { StickyNotesDemoPage } from "./routes/sticky-notes-demo";

/**
 * 布局导航项
 */
type NavItem = {
  /** 导航标题 */
  label: string;
  /** 路由跳转地址 */
  to: string;
};

/**
 * 顶层布局导航配置
 */
const navItems: NavItem[] = [
  { label: "首页", to: "/" },
  { label: "便签墙", to: "/sticky-notes" },
];

/**
 * 根布局组件
 * @returns 页面整体骨架
 */
function AppLayout() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">Konva.js Playground</p>
          <h1>Canvas Demo Lab</h1>
        </div>
        <nav className="app-nav">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="nav-link"
              activeProps={{ className: "nav-link nav-link-active" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}

const rootRoute = createRootRoute({
  component: AppLayout,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
});

const stickyNotesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/sticky-notes",
  component: StickyNotesDemoPage,
});

export const routeTree = rootRoute.addChildren([indexRoute, stickyNotesRoute]);
