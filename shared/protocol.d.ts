export type AppName = 'react' | 'vue' | 'svelte' | 'qwik';
export type DomainCommand =
  | { type: 'add' | 'remove' | 'favorite' | 'compare' | 'view' | 'reorder'; id: string }
  | { type: 'shipping'; amount: 0 | 500 }
  | { type: 'theme'; value: 'forest' | 'ocean' | 'plum' }
  | { type: 'density'; value: 'comfortable' | 'compact' }
  | { type: 'coupon'; code: string }
  | { type: 'clear' | 'checkout' };
export type LifecycleEvent =
  | { type: 'ready' | 'render' | 'heartbeat' | 'request-state' }
  | { type: 'resize'; height: number }
  | { type: 'error'; message: string }
  | { type: 'snapshot-applied' | 'snapshot-ignored'; revision: number };
export type AppMessage = (DomainCommand | LifecycleEvent) & {
  channel: 'fieldnotes-v2'; version: 2; source: AppName; messageId: string;
};
export const CHANNEL: 'fieldnotes-v2';
export const APPS: AppName[];
export const capabilities: Record<AppName, DomainCommand['type'][]>;
export const subscriptions: Record<AppName, string[]>;
export function envelope(source: AppName, type: AppMessage['type'], payload?: Record<string, unknown>, id?: string): AppMessage;
export function validPayload(type: string, data: unknown): boolean;
export function validEnvelope(data: unknown): data is AppMessage;
export function authorized(source: string, type: string): boolean;
export function createDeduper(limit?: number): { accept(id: string): boolean; clear(): void };
export function trustedSender(event: MessageEvent, frame: Window | null, origin: string, name: AppName): boolean;
export function projectState(state: Record<string, unknown>, name: AppName): Record<string, unknown>;
export function commandKey(message: AppMessage): string;
