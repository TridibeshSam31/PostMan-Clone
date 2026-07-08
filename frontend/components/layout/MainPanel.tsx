"use client";

import { Plus, LayoutDashboard } from "lucide-react";
import { Group, Panel, Separator } from "react-resizable-panels";
import { useTabStore } from "@/store/tabStore";
import RequestBuilder from "@/components/request/RequestBuilder";
import ResponseViewer from "@/components/response/ResponseViewer";

function NoTabsWelcome() {
  const openTab = useTabStore((s) => s.openTab);
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
      <LayoutDashboard size={52} strokeWidth={1.2} className="text-pm-border" />
      <div>
        <p className="text-pm-text font-medium text-sm mb-1">Open a request</p>
        <p className="text-pm-muted text-xs">
          Select from your collections or start a new request
        </p>
      </div>
      <button
        onClick={() => openTab()}
        className="flex items-center gap-1.5 px-4 h-8 rounded text-xs font-medium
                   bg-pm-orange text-white hover:bg-pm-orange-dim transition-colors"
      >
        <Plus size={12} strokeWidth={2.2} />
        New Request
      </button>
    </div>
  );
}

export default function MainPanel() {
  const { tabs, activeTabId } = useTabStore();
  const hasActiveTab = activeTabId && tabs.some((t) => t.id === activeTabId);

  if (!hasActiveTab) {
    return (
      <div className="flex-1 bg-pm-bg overflow-hidden">
        <NoTabsWelcome />
      </div>
    );
  }

  return (
    <Group
      orientation="vertical"
      className="flex-1 overflow-hidden"
      defaultLayout={{ request: 50, response: 50 }}
    >
      <Panel id="request" minSize="20%" className="flex flex-col overflow-hidden bg-pm-bg">
        <RequestBuilder />
      </Panel>

      <Separator className="h-px bg-pm-border hover:bg-pm-orange transition-colors cursor-row-resize shrink-0" />

      <Panel id="response" minSize="20%" className="flex flex-col overflow-hidden bg-pm-bg">
        <ResponseViewer />
      </Panel>
    </Group>
  );
}
