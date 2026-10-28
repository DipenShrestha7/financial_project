import { stockApi, type Transfer } from "../services/stocks";

export type NotificationType =
  | "TRANSFER_WARNING"
  | "DIVIDEND"
  | "PRICE_UPDATE"
  | "RECONCILE_ALERT";

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  isRead: boolean;
  type: NotificationType;
  actionUrl?: string;
}

const formatDeadline = (deadline: string) => {
  const parsed = new Date(deadline);
  if (Number.isNaN(parsed.getTime())) return deadline;

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsed);
};

const toPendingTransferNotification = (
  transfer: Transfer,
): NotificationItem => ({
  id: `transfer-${transfer.id}`,
  title: "Pending MeroShare Transfer",
  description: `${Number(transfer.quantity)} ${transfer.symbol} shares need EDIS transfer via MeroShare by ${formatDeadline(transfer.deadline)}. Complete the transfer before the deadline to avoid penalties.`,
  timestamp: `Deadline: ${formatDeadline(transfer.deadline)}`,
  isRead: false,
  type: "TRANSFER_WARNING",
  actionUrl: "/stocks/transfers",
});

export async function loadPendingTransferNotifications(): Promise<
  NotificationItem[]
> {
  const { transfers } = await stockApi.transfers();

  return transfers
    .filter((transfer) => transfer.status === "PENDING")
    .map(toPendingTransferNotification);
}
