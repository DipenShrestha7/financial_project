import React, { useState, useRef, useEffect } from "react";
import {
  Bell,
  Check,
  ArrowRight,
  AlertTriangle,
  TrendingUp,
  Wallet,
  CheckCircle2,
  X,
} from "lucide-react";
import {
  loadPendingTransferNotifications,
  type NotificationItem,
} from "../types/Notification";

interface NotificationPopoverProps {
  onNavigateToFullPage?: () => void;
  onNotificationNavigate?: (url: string) => void;
}

export const NotificationPopover: React.FC<NotificationPopoverProps> = ({
  onNavigateToFullPage,
  onNotificationNavigate,
}) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [error, setError] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    let active = true;
    void loadPendingTransferNotifications()
      .then((items) => {
        if (active) setNotifications(items);
      })
      .catch((caught) => {
        if (active) {
          setError(
            caught instanceof Error
              ? caught.message
              : "Could not load notifications.",
          );
        }
      });

    return () => {
      active = false;
    };
  }, []);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen]);

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    );
  };

  const getIcon = (type: NotificationItem["type"]) => {
    switch (type) {
      case "TRANSFER_WARNING":
        return (
          <div
            style={{ background: "rgba(245,158,11,0.12)" }}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
          >
            <AlertTriangle className="h-4 w-4" style={{ color: "#f59e0b" }} />
          </div>
        );
      case "DIVIDEND":
        return (
          <div
            style={{ background: "rgba(50,199,170,0.12)" }}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
          >
            <Wallet className="h-4 w-4" style={{ color: "#32c7aa" }} />
          </div>
        );
      case "PRICE_UPDATE":
        return (
          <div
            style={{ background: "rgba(96,165,250,0.1)" }}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
          >
            <TrendingUp className="h-4 w-4" style={{ color: "#60a5fa" }} />
          </div>
        );
      default:
        return (
          <div
            style={{ background: "rgba(138,153,154,0.1)" }}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
          >
            <Bell className="h-4 w-4" style={{ color: "#8a999a" }} />
          </div>
        );
    }
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Bell Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative rounded p-1.5 transition"
        style={{ color: "#8a999a" }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.background = "#111819";
          (e.currentTarget as HTMLElement).style.color = "#ffffff";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.background = "transparent";
          (e.currentTarget as HTMLElement).style.color = "#8a999a";
        }}
        aria-label="Notifications"
        aria-expanded={isOpen}
      >
        <Bell size={17} />
        {unreadCount > 0 && (
          <span
            className="absolute right-0.5 top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full px-0.5 text-[8px] font-bold leading-none text-white"
            style={{ background: "#ed8a60" }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          className="absolute left-0 z-50 mt-2 w-80 overflow-hidden rounded-xl shadow-2xl"
          style={{
            background: "#080a0b",
            border: "1px solid #1d2526",
            boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
            minWidth: "300px",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: "1px solid #171b1c" }}
          >
            <div className="flex items-center gap-2">
              <h3
                className="text-[12px] font-semibold"
                style={{ color: "#e8edf2" }}
              >
                Notifications
              </h3>
              {unreadCount > 0 && (
                <span
                  className="rounded-full px-1.5 py-0.5 text-[9px] font-semibold"
                  style={{
                    background: "rgba(50,199,170,0.12)",
                    color: "#32c7aa",
                  }}
                >
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="flex items-center gap-1 rounded px-2 py-1 text-[10px] font-medium transition"
                  style={{ color: "#778285" }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "#111819";
                    (e.currentTarget as HTMLElement).style.color = "#32c7aa";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "transparent";
                    (e.currentTarget as HTMLElement).style.color = "#778285";
                  }}
                >
                  <Check className="h-3 w-3" />
                  Mark read
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-full bg-linear-to-br from-[#a94f58] to-[#7f303a] p-1 text-white transition hover:from-[#bd626b] hover:to-[#913b46]"
                aria-label="Close notifications"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {error ? (
              <p className="px-4 py-6 text-center text-[10px] text-[#e57b7b]">
                {error}
              </p>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
                <div
                  className="mb-3 flex h-9 w-9 items-center justify-center rounded-full"
                  style={{ background: "#0f1414" }}
                >
                  <CheckCircle2 className="h-4 w-4" style={{ color: "#627071" }} />
                </div>
                <p className="text-[11px] font-medium" style={{ color: "#c4d2d0" }}>
                  No recent notifications
                </p>
                <p className="mt-1 text-[10px]" style={{ color: "#627071" }}>
                  You&apos;re all caught up.
                </p>
              </div>
            ) : (
              notifications.map((item) => (
                <NotificationRow
                  key={item.id}
                  item={item}
                  icon={getIcon(item.type)}
                  onMarkRead={() => markAsRead(item.id)}
                  onNavigate={() => {
                    markAsRead(item.id);
                    if (item.actionUrl) {
                      setIsOpen(false);
                      onNotificationNavigate?.(item.actionUrl);
                    }
                  }}
                />
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div style={{ borderTop: "1px solid #171b1c" }} className="p-2">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onNavigateToFullPage?.();
                }}
                className="flex w-full items-center justify-center gap-1 rounded-lg py-2 text-[10px] font-semibold transition"
                style={{ color: "#32c7aa" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "rgba(50,199,170,0.07)";
                  (e.currentTarget as HTMLElement).style.color = "#57d4bb";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                  (e.currentTarget as HTMLElement).style.color = "#32c7aa";
                }}
              >
                View all notifications
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

function NotificationRow({
  item,
  icon,
  onMarkRead,
  onNavigate,
}: {
  item: NotificationItem;
  icon: React.ReactNode;
  onMarkRead: () => void;
  onNavigate: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className={`group relative px-4 py-3 transition ${item.actionUrl ? "cursor-pointer" : ""}`}
      style={{
        borderBottom: "1px solid #14191a",
        background: hovered
          ? "#0f1414"
          : !item.isRead
            ? "rgba(50,199,170,0.04)"
            : "transparent",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={item.actionUrl ? onNavigate : undefined}
      onKeyDown={
        item.actionUrl
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onNavigate();
              }
            }
          : undefined
      }
      role={item.actionUrl ? "button" : undefined}
      tabIndex={item.actionUrl ? 0 : undefined}
    >
      <div className="pointer-events-none flex gap-3">
        {icon}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h4
              className="text-[11px] font-semibold leading-4"
              style={{ color: item.isRead ? "#9aabaa" : "#e8edf2" }}
            >
              {item.title}
            </h4>
            {!item.isRead && (
              <span
                className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ background: "#32c7aa" }}
              />
            )}
          </div>
          <p
            className="mt-1 text-[10px] leading-4"
            style={{ color: "#778285" }}
          >
            {item.description}
          </p>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-[9px]" style={{ color: "#627071" }}>
              {item.timestamp}
            </span>
            {!item.isRead && (
              <span className="pointer-events-auto">
                <MarkReadBtn
                  onMarkRead={(event) => {
                    event.stopPropagation();
                    onMarkRead();
                  }}
                />
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MarkReadBtn({
  onMarkRead,
}: {
  onMarkRead: (event: React.MouseEvent<HTMLButtonElement>) => void;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      type="button"
      onClick={onMarkRead}
      className="text-[9px] font-medium transition"
      style={{
        color: hovered ? "#32c7aa" : "#627071",
        opacity: 1,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      Mark as read
    </button>
  );
}
