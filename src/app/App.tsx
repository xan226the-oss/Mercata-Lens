import { Routes, Route } from "react-router-dom";
import { ResearchLayout } from "../research/ResearchLayout";
import { researchRoutes } from "./routes";

export default function App() {
  return (
    <ResearchLayout>
      <Routes>
        {researchRoutes.map((route, index) =>
          route.index ? (
            <Route key={index} index element={route.element} />
          ) : (
            <Route key={route.path} path={route.path} element={route.element} />
          ),
        )}
      </Routes>
    </ResearchLayout>
  );
}