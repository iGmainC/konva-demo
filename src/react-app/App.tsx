import { RouterProvider, createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree";

/**
 * 前端路由实例
 */
const router = createRouter({
  routeTree,
  defaultPreload: "intent",
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

/**
 * 前端根组件
 * @returns 路由提供器
 */
export default function App() {
  return <RouterProvider router={router} />;
}
