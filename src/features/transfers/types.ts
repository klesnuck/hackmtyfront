export type OwnAccount = {
  id: string;
  label: string;
  maskedNumber: string;
  balance: number;
};

export type Recipient = {
  id: string;
  nickname: string;
  accountNumber: string;
};

export type TransferDestination =
  | { kind: 'own'; account: OwnAccount }
  | { kind: 'third-party'; recipient: Recipient };

export type TransferResult = {
  status: 'success' | 'failure';
  reason?: string;
  amount: number;
  destinationLabel: string;
  completedAt: number;
};
