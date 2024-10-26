export type PatchType = "a" | "b" | "i";

type SafeParameters<T> = T extends (...args: infer P) => any ? P : any[];

export type PatchTypeToCallbackMap<F extends Function> = {
  a: (args: SafeParameters<F>, ret: ReturnType<F>) => ReturnType<F> | void | undefined;
  b: (args: SafeParameters<F>) => SafeParameters<F> | void | undefined;
  i: (args: SafeParameters<F>, origFunc: F) => ReturnType<F>;
}

// we use this array multiple times
export const patchTypes: PatchType[] = ["a", "b", "i"];

export type Patch = {
	// cleanups
	c: Function[];
	// after hooks
	a: Map<symbol, Function>;
	// before hooks
	b: Map<symbol, Function>;
	// instead hooks
	i: Map<symbol, Function>;
};

export type KeysWithFunctionValues<T extends AnyObject> = {
	[K in Extract<keyof T, string>]: T[K] extends Function ? K : never;
}[Extract<keyof T, string>];

export type AnyObject = Record<any, any>;

export let patchedFunctions: WeakMap<Function, Patch>;
export let resetPatches = () =>
	(patchedFunctions = new WeakMap<Function, Patch>());

// Manual minification is funny
resetPatches();
