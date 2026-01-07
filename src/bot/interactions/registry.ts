export type ButtonHandler = (i: any) => Promise<any>;
export type ModalHandler = (i: any) => Promise<any>;
export type SelectHandler = (i: any) => Promise<any>;

export const buttons = new Map<string, ButtonHandler>();
export const modals = new Map<string, ModalHandler>();
export const selects = new Map<string, SelectHandler>();

export const buttonPrefixes: Array<{ prefix: string; fn: ButtonHandler }> = [];
export const modalPrefixes: Array<{ prefix: string; fn: ModalHandler }> = [];

export function registerButton(id: string, fn: ButtonHandler) {
  buttons.set(id, fn);
}

export function registerModal(id: string, fn: ModalHandler) {
  modals.set(id, fn);
}

export function registerSelect(id: string, fn: SelectHandler) {
  selects.set(id, fn);
}

export function registerButtonPrefix(prefix: string, fn: ButtonHandler) {
  buttonPrefixes.push({ prefix, fn });
}

export function registerModalPrefix(prefix: string, fn: ModalHandler) {
  modalPrefixes.push({ prefix, fn });
}
