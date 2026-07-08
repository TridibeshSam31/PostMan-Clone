"use client";

import { Group, Panel, Separator } from "react-resizable-panels";
import TopBar from "@/components/layout/TopBar";
import Sidebar from "@/components/layout/Sidebar";
import TabBar from "@/components/layout/TabBar";
import MainPanel from "@/components/layout/MainPanel";

export default function WorkspacePage() {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-pm-bg">
      {/* ── Top navigation bar ───────────────────────────── */}
      <TopBar />

      {/* ── Workspace body ───────────────────────────────── */}
      <Group
        orientation="horizontal"
        className="flex flex-1 overflow-hidden"
      >
        {/* Sidebar */}
        <Panel
          id="sidebar"
          defaultSize="260px"
          minSize="200px"
          maxSize="420px"
          className="flex flex-col overflow-hidden"
        >
          <Sidebar />
        </Panel>

        {/* Resize handle */}
        <Separator className="w-px bg-pm-border hover:bg-pm-orange transition-colors cursor-col-resize flex-shrink-0" />

        {/* Main area: tab bar + content */}
        <Panel id="main" className="flex flex-col overflow-hidden min-w-0">
          <TabBar />
          <MainPanel />
        </Panel>
      </Group>
    </div>
  );
}
