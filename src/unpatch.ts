import { patchedFunctions } from "./shared";
import type { PatchType, AnyFunction } from "./shared";

export function unpatch(
	patchedFunction: AnyFunction,
	hookId: symbol,
	type: PatchType,
) {
	const patch = patchedFunctions.get(patchedFunction);
	if (!patch || !patch[type].delete(hookId)) return false;

	return true;
}
