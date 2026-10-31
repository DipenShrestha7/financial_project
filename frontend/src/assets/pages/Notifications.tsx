import React, { useEffect, useState } from "react";
import {
  Bell,
  CheckCheck,
  Trash2,
  AlertTriangle,
  TrendingUp,
  Wallet,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import {
  loadPendingTransferNotifications,
  type NotificationItem,
} from "../types/Notification";
import Sidebar from "../components/Sidebar";
import { useNavigate } from "react-router";

const Notifications: React.FC = () => {
  const [list, setList] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"ALL" | "UNREAD" | "TRANSFERS">(
    "ALL",
  );
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    void loadPendingTransferNotifications()
      .then((items) => {
        if (active) setList(items);
      })
      .catch((caught) => {
        if (active) {
          setError(
            caught instanceof Error
              ? caught.message
              : "Could not load notifications.",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const filteredList = list.filter((item) => {
    if (activeTab === "UNREAD") return !item.isRead;
    if (activeTab === "TRANSFERS") return item.type === "TRANSFER_WARNING";
    return true;
  });

  const markAllRead = () => {
    setList((prev) => prev.map((item) => ({ ...item, isRead: true })));
  };

  const deleteNotification = (id: string) => {
    setList((prev) => prev.filter((item) => item.id !== id));
  };

  const toggleReadStatus = (id: string) => {
    setList((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isRead: !item.isRead } : item,
      ),
    );
  };

  const getBadgeStyle = (type: NotificationItem["type"]) => {
    switch (type) {
      case "TRANSFER_WARNING":
        return { bg: "rgba(245,158,11,0.12)", color: "#f59e0b" };
      case "DIVIDEND":
        return { bg: "rgba(50,199,170,0.12)", color: "#32c7aa" };
      case "PRICE_UPDATE":
        return { bg: "rgba(96,165,250,0.1)", color: "#60a5fa" };
      case "RECONCILE_ALERT":
        return { bg: "rgba(167,139,250,0.1)", color: "#a78bfa" };
      default:
        return { bg: "rgba(138,153,154,0.1)", color: "#8a999a" };
    }
  };

  const getBadgeIcon = (type: NotificationItem["type"]) => {
    const style = getBadgeStyle(type);
    const iconProps = { size: 18, style: { color: style.color } };
    switch (type) {
      case "TRANSFER_WARNING":
        return <AlertTriangle {...iconProps} />;
      case "DIVIDEND":
        return <Wallet {...iconProps} />;
      case "PRICE_UPDATE":
        return <TrendingUp {...iconProps} />;
      case "RECONCILE_ALERT":
        return <CheckCircle2 {...iconProps} />;
      default:
        return <Bell {...iconProps} />;
    }
  };

  const tabs: Array<"ALL" | "UNREAD" | "TRANSFERS"> = ["ALL", "UNREAD", "TRANSFERS"];
  const tabLabel = (t: typeof tabs[number]) => {
    if (t === "ALL") return "All Activity";
    if (t === "UNREAD") return `Unread (${list.filter((n) => !n.isRead).length})`;
    return "Share Transfers";
  };

  return (
    <Sidebar activePage="dashboard">
      <div
        className="min-h-screen"
        style={{ background: "#050606", color: "#e8edf2" }}
      >
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
          {/* Page Heading */}
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-3">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-xl"
                  style={{ background: "rgba(50,199,170,0.12)" }}
                >
                  <Bell size={17} style={{ color: "#32c7aa" }} />
                </div>
                <h1
                  className="text-[24px] font-bold tracking-[-0.6px]"
                  style={{ color: "#f1f4f3" }}
                >
                  Notifications
                </h1>
              </div>
              <p className="text-[12px]" style={{ color: "#758183" }}>
                System alerts, compliance deadlines, dividend declarations, and
                portfolio reminders.
              </p>
            </div>

            <button
              type="button"
              onClick={markAllRead}
              disabled={!list.some((item) => !item.isRead)}
              className="inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-[11px] font-semibold transition"
              style={{
                border: "1px solid #273334",
                background: "#0c1010",
                color: "#bdc7c8",
              }}
              onMouseEnter={(e) => {
                if (!e.currentTarget.disabled) {
                  (e.currentTarget as HTMLElement).style.background = "#111819";
                  (e.currentTarget as HTMLElement).style.color = "#e8edf2";
                }
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "#0c1010";
                (e.currentTarget as HTMLElement).style.color = "#bdc7c8";
              }}
            >
              <CheckCheck size={14} />
              Mark all as read
            </button>
          </div>

          {/* Tabs */}
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className="rounded-lg px-3 py-1.5 text-[11px] font-semibold transition"
                  style={
                    activeTab === tab
                      ? {
                          background: "rgba(50,199,170,0.1)",
                          color: "#32c7aa",
                          border: "1px solid rgba(50,199,170,0.2)",
                        }
                      : {
                          background: "transparent",
                          color: "#778285",
                          border: "1px solid transparent",
                        }
                  }
                >
                  {tabLabel(tab)}
                </button>
              ))}
            </div>
            <span className="text-[10px]" style={{ color: "#627071" }}>
              Showing {filteredList.length}{" "}
              {filteredList.length === 1 ? "item" : "items"}
            </span>
          </div>

          {/* Feed */}
          <div
            className="overflow-hidden rounded-2xl"
            style={{
              border: "1px solid #1d2526",
              background: "rgba(11,16,18,0.8)",
            }}
          >
            {error ? (
              <div className="flex min-h-60 items-center justify-center px-6 text-center">
                <p className="text-[11px] text-[#e57b7b]">{error}</p>
              </div>
            ) : loading ? (
              <div className="flex min-h-60 items-center justify-center px-6 text-center">
                <p className="text-[11px]" style={{ color: "#627071" }}>
                  Loading notifications...
                </p>
              </div>
            ) : filteredList.length === 0 ? (
              <div className="flex min-h-60 flex-col items-center justify-center px-6 text-center">
                <div
                  className="mb-4 flex h-11 w-11 items-center justify-center rounded-full"
                  style={{ background: "#0f1414" }}
                >
                  <Bell size={18} style={{ color: "#627071" }} />
                </div>
                <p
                  className="text-[12px] font-semibold"
                  style={{ color: "#c4d2d0" }}
                >
                  No notifications
                </p>
                <p className="mt-1 text-[10px]" style={{ color: "#627071" }}>
                  No notifications match your current filter.
                </p>
              </div>
            ) : (
              <div style={{ borderTop: "1px solid #1d2526" }}>
                {filteredList.map((item) => (
                  <NotificationCard
                    key={item.id}
                    item={item}
                    badgeStyle={getBadgeStyle(item.type)}
                    badgeIcon={getBadgeIcon(item.type)}
                    onToggleRead={() => toggleReadStatus(item.id)}
                    onDelete={() => deleteNotification(item.id)}
                    onActionClick={() => {
                      if (item.actionUrl) navigate(item.actionUrl);
                    }}
                    onNotificationClick={() => {
                      toggleReadStatus(item.id);
                      if (item.actionUrl) navigate(item.actionUrl);
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Sidebar>
  );
};

function NotificationCard({
  item,
  badgeStyle,
  badgeIcon,
  onToggleRead,
  onDelete,
  onActionClick,
  onNotificationClick,
}: {
  item: NotificationItem;
  badgeStyle: { bg: string; color: string };
  badgeIcon: React.ReactNode;
  onToggleRead: () => void;
  onDelete: () => void;
  onActionClick: () => void;
  onNotificationClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className={`relative p-5 transition ${item.actionUrl ? "cursor-pointer" : ""}`}
      style={{
        borderBottom: "1px solid #171b1c",
        background: hovered
          ? "#0b1010"
          : !item.isRead
            ? "rgba(50,199,170,0.03)"
            : "transparent",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={item.actionUrl ? onNotificationClick : undefined}
      onKeyDown={
        item.actionUrl
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onNotificationClick();
              }
            }
          : undefined
      }
      role={item.actionUrl ? "button" : undefined}
      tabIndex={item.actionUrl ? 0 : undefined}
    >
      <div className="flex gap-4">
        {/* Icon */}
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
          style={{ background: badgeStyle.bg }}
        >
          {badgeIcon}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-2">
              <h3
                className="text-[12px] font-semibold"
                style={{ color: item.isRead ? "#9aabaa" : "#e8edf2" }}
              >
                {item.title}
              </h3>
              {!item.isRead && (
                <span
                  className="h-1.75 w-1.75 rounded-full"
                  style={{ background: "#32c7aa" }}
                />
              )}
            </div>
            <span
              className="shrink-0 text-[10px]"
              style={{ color: "#627071" }}
            >
              {item.timestamp}
            </span>
          </div>

          <p
            className="mt-1.5 max-w-3xl text-[11px] leading-5"
            style={{ color: "#778285" }}
          >
            {item.description}
          </p>

          {item.actionUrl && (
            <button
              type="button"
              className="mt-2.5 inline-flex items-center gap-1 text-[10px] font-semibold transition"
              style={{ color: "#32c7aa" }}
              onClick={(event) => {
                event.stopPropagation();
                onActionClick();
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLElement).style.color = "#57d4bb")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLElement).style.color = "#32c7aa")
              }
            >
              Resolve Action
              <ChevronRight size={12} />
            </button>
          )}
        </div>

        {/* Action Buttons */}
        <div
          className="flex shrink-0 items-start gap-1"
          onClick={(event) => event.stopPropagation()}
        >
          <ActionBtn
            onClick={onToggleRead}
            title={item.isRead ? "Mark as unread" : "Mark as read"}
            hoverColor="#bdc7c8"
          >
            <CheckCheck size={14} />
          </ActionBtn>
          <ActionBtn
            onClick={onDelete}
            title="Remove notification"
            hoverColor="#e58a82"
            hoverBg="rgba(229,138,130,0.08)"
            danger
          >
            <Trash2 size={14} />
          </ActionBtn>
        </div>
      </div>
    </div>
  );
}

function ActionBtn({
  onClick,
  title,
  children,
  hoverColor,
  hoverBg,
  danger = false,
}: {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
  hoverColor: string;
  hoverBg?: string;
  danger?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`rounded-lg p-1.5 transition ${
        danger
          ? "bg-linear-to-br from-[#a94f58] to-[#7f303a] text-white hover:from-[#bd626b] hover:to-[#913b46]"
          : ""
      }`}
      style={{
        color: hovered ? hoverColor : "#627071",
        background: hovered ? (hoverBg ?? "#111819") : "transparent",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children}
    </button>
  );
}

export default Notifications;
